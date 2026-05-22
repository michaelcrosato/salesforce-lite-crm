import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import { CSV_IMPORT_TEMPLATE_CONTENT_TYPE } from "@/lib/server/csvImportTemplates";
import {
  CSV_DEDUPE_CANDIDATE_PACKET_VERSION,
  CSV_DEDUPE_CANDIDATE_REASON_CODES,
  getCsvDedupeCandidatePacket,
  getCsvDedupeCandidatePacketDefinition,
  isCsvDedupeCandidatePacketEntity,
  listCsvDedupeCandidatePacketDefinitions,
  listCsvDedupeCandidatePackets
} from "@/lib/server/csvDedupeCandidatePackets";

describe("server CSV dedupe candidate packets", () => {
  beforeEach(async () => {
    await cleanupDedupePacketFixtures();
  });

  afterEach(async () => {
    await cleanupDedupePacketFixtures();
  });

  it("publishes dedupe candidate definitions for supported import entities", () => {
    const definitions = listCsvDedupeCandidatePacketDefinitions();

    expect(definitions.map((definition) => definition.entity)).toEqual(
      CSV_IMPORT_PREVIEW_ENTITIES
    );
    expect(getCsvDedupeCandidatePacketDefinition("contacts")).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      packetVersion: CSV_DEDUPE_CANDIDATE_PACKET_VERSION,
      inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      supportedReasonCodes: CSV_DEDUPE_CANDIDATE_REASON_CODES
    });
    expect(isCsvDedupeCandidatePacketEntity("leads")).toBe(true);
    expect(isCsvDedupeCandidatePacketEntity("accounts")).toBe(false);
  });

  it("builds deterministic contact candidate packets from duplicate diagnostics", async () => {
    await prisma.contact.createMany({
      data: [
        {
          id: "csv-dedupe-existing-contact-email",
          firstName: "Alice",
          lastName: "Ng",
          email: "alice.dedupe@example.test",
          phone: "604-555-0100",
          status: "active"
        },
        {
          id: "csv-dedupe-existing-contact-phone",
          firstName: "Maya",
          lastName: "Patel",
          email: "maya.existing@example.test",
          phone: "604-555-0222",
          status: "active"
        }
      ]
    });

    const csv = [
      "First Name,Last Name,Email,Status,Phone",
      "Clean,Ready,clean.dedupe@example.test,active,604-555-0111",
      "Alice,Ng,ALICE.DEDUPE@example.test,active,604-555-0100",
      "Maya,Patel,maya.import@example.test,active,604-555-0222",
      ",Broken,broken.dedupe@example.test,active,604-555-0333"
    ].join("\n");

    const packet = await getCsvDedupeCandidatePacket("contacts", csv);

    expect(packet.preflight).toMatchObject({
      rowCount: 4,
      previewedRows: 4,
      validRows: 3,
      invalidRows: 1,
      warningRows: 2
    });
    expect(packet.summary).toMatchObject({
      totalRows: 4,
      previewedRows: 4,
      candidateCount: 2,
      affectedRows: 2,
      matchedRecordCount: 2,
      severityCounts: {
        warning: 2
      }
    });
    expect(packet.summary.reasonCounts).toEqual([
      {
        reasonCode: "contact_duplicate_email",
        severity: "warning",
        candidateCount: 1,
        affectedRows: 1,
        matchedRecordCount: 1
      },
      {
        reasonCode: "contact_duplicate_name_phone",
        severity: "warning",
        candidateCount: 1,
        affectedRows: 1,
        matchedRecordCount: 1
      },
      {
        reasonCode: "lead_duplicate_email",
        severity: "warning",
        candidateCount: 0,
        affectedRows: 0,
        matchedRecordCount: 0
      },
      {
        reasonCode: "lead_duplicate_name_phone",
        severity: "warning",
        candidateCount: 0,
        affectedRows: 0,
        matchedRecordCount: 0
      }
    ]);
    expect(packet.candidates.map((candidate) => candidate.id)).toEqual([
      "csv-dedupe-candidate:contacts:row-3:contact_duplicate_email:csv-dedupe-existing-contact-email",
      "csv-dedupe-candidate:contacts:row-4:contact_duplicate_name_phone:csv-dedupe-existing-contact-phone"
    ]);
    expect(packet.candidates[0]).toMatchObject({
      row: {
        rowNumber: 3,
        label: "Alice Ng",
        fieldKey: "email",
        fieldLabel: "Email",
        fieldValue: "ALICE.DEDUPE@example.test",
        readinessStatus: "needs_review",
        action: "review_candidate"
      },
      matchedRecord: {
        entity: "contacts",
        id: "csv-dedupe-existing-contact-email",
        label: "Alice Ng",
        route: "/contacts/csv-dedupe-existing-contact-email"
      },
      reasonCode: "contact_duplicate_email",
      severity: "warning"
    });
    expect(packet.candidates[1]).toMatchObject({
      row: {
        rowNumber: 4,
        fieldKey: "phone",
        fieldLabel: "Phone",
        fieldValue: "604-555-0222"
      },
      matchedRecord: {
        entity: "contacts",
        id: "csv-dedupe-existing-contact-phone"
      },
      reasonCode: "contact_duplicate_name_phone"
    });
    expect(packet.write).toEqual({
      database: false,
      files: false,
      externalServices: false,
      routingAssignments: false,
      importApply: false,
      duplicateMerge: false,
      bulkMutations: false,
      backgroundJobs: false
    });
  });

  it("does not write lead rows or execute routing while building candidate packets", async () => {
    await prisma.lead.create({
      data: {
        id: "csv-dedupe-existing-lead",
        firstName: "Riley",
        lastName: "Park",
        email: "riley.dedupe@example.test",
        phone: "604-555-0300",
        status: "new"
      }
    });
    const before = await countLeadDedupeState();
    const csv = [
      "First Name,Last Name,Email,Phone,Postal Code,Source",
      "Riley,Park,RILEY.DEDUPE@example.test,604-555-0300,V5K0A1,Website"
    ].join("\n");

    const packet = await getCsvDedupeCandidatePacket("leads", csv);
    const after = await countLeadDedupeState();

    expect(after).toEqual(before);
    expect(packet.read).toEqual({
      metadata: true,
      csvInput: true,
      database: true,
      preflightDiagnostics: true
    });
    expect(packet.write.routingAssignments).toBe(false);
    expect(packet.write.importApply).toBe(false);
    expect(packet.write.duplicateMerge).toBe(false);
    expect(packet.summary).toMatchObject({
      candidateCount: 1,
      affectedRows: 1,
      matchedRecordCount: 1
    });
    expect(packet.candidates[0]).toMatchObject({
      entity: "leads",
      row: {
        rowNumber: 2,
        readinessStatus: "needs_review",
        action: "review_candidate"
      },
      matchedRecord: {
        entity: "leads",
        id: "csv-dedupe-existing-lead",
        route: "/leads/csv-dedupe-existing-lead"
      },
      reasonCode: "lead_duplicate_email"
    });
  });

  it("lists packets for all supported import entities with the same read-only flags", async () => {
    const packets = await listCsvDedupeCandidatePackets(
      {
        contacts: [
          "First Name,Last Name,Status",
          "Clean,Contact,active",
          "Second,Contact,active"
        ].join("\n"),
        leads: [
          "First Name,Last Name,Postal Code,Source",
          "Clean,Lead,V5K0A1,Website",
          "Second,Lead,V6B1A1,Referral"
        ].join("\n")
      },
      {
        limit: 1
      }
    );

    expect(packets.map((packet) => packet.entity)).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(packets.every((packet) => packet.preflight.previewedRows === 1)).toBe(true);
    expect(packets.every((packet) => packet.summary.previewedRows === 1)).toBe(true);
    expect(
      packets.every(
        (packet) =>
          packet.write.database === false &&
          packet.write.files === false &&
          packet.write.externalServices === false &&
          packet.write.routingAssignments === false &&
          packet.write.importApply === false &&
          packet.write.duplicateMerge === false
      )
    ).toBe(true);
  });
});

async function cleanupDedupePacketFixtures() {
  await prisma.activity.deleteMany({
    where: {
      lead: {
        OR: [
          {
            id: "csv-dedupe-existing-lead"
          },
          {
            email: {
              in: ["riley.dedupe@example.test"]
            }
          }
        ]
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      OR: [
        {
          id: "csv-dedupe-existing-lead"
        },
        {
          email: {
            in: ["riley.dedupe@example.test"]
          }
        }
      ]
    }
  });
  await prisma.contact.deleteMany({
    where: {
      OR: [
        {
          id: {
            in: [
              "csv-dedupe-existing-contact-email",
              "csv-dedupe-existing-contact-phone"
            ]
          }
        },
        {
          email: {
            in: [
              "alice.dedupe@example.test",
              "maya.existing@example.test",
              "clean.dedupe@example.test",
              "maya.import@example.test",
              "broken.dedupe@example.test"
            ]
          }
        }
      ]
    }
  });
}

async function countLeadDedupeState() {
  const [leads, activities] = await Promise.all([
    prisma.lead.count({
      where: {
        OR: [
          {
            id: "csv-dedupe-existing-lead"
          },
          {
            email: "riley.dedupe@example.test"
          }
        ]
      }
    }),
    prisma.activity.count({
      where: {
        lead: {
          OR: [
            {
              id: "csv-dedupe-existing-lead"
            },
            {
              email: "riley.dedupe@example.test"
            }
          ]
        }
      }
    })
  ]);

  return {
    leads,
    activities
  };
}
