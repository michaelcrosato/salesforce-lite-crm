import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  BULK_ACTION_SELECTED_EXPORT_PACKET_ENTITIES,
  getBulkActionSelectedExportPacket,
  getBulkActionSelectedExportPacketDefinition,
  listBulkActionSelectedExportPacketDefinitions
} from "@/lib/server/bulkActionSelectedExportPackets";
import { CSV_EXPORT_CONTENT_TYPE } from "@/lib/server/csvExport";

const accountId = "test-selected-export-account";
const contactAId = "test-selected-export-contact-a";
const contactBId = "test-selected-export-contact-b";
const missingId = "test-selected-export-missing";

const noWriteFlags = {
  database: false,
  mutations: false,
  auditEvents: false,
  files: false,
  externalServices: false,
  backgroundJobs: false
};

describe("server bulk action selected export packets", () => {
  beforeEach(async () => {
    await cleanupSelectedExportFixtures();
    await createSelectedExportFixtures();
  });

  afterEach(async () => {
    await cleanupSelectedExportFixtures();
  });

  it("publishes deterministic packet definitions from CSV export contracts", () => {
    const definitions = listBulkActionSelectedExportPacketDefinitions();
    const contactDefinition =
      getBulkActionSelectedExportPacketDefinition("contacts");

    expect(definitions.map((definition) => definition.entityMetadata.entity)).toEqual(
      BULK_ACTION_SELECTED_EXPORT_PACKET_ENTITIES
    );
    expect(contactDefinition).toEqual({
      packetType: "bulk-action-selected-export-packet",
      entityMetadata: {
        entity: "contacts",
        label: "Contacts",
        route: "/contacts",
        filename: "contacts.csv",
        contentType: CSV_EXPORT_CONTENT_TYPE,
        canonicalHeaders: [
          "Contact ID",
          "First Name",
          "Last Name",
          "Email",
          "Phone",
          "Title",
          "Status",
          "Account ID",
          "Account Name",
          "Created At",
          "Updated At"
        ],
        maxSelectedRecords: 200
      },
      actionMetadata: {
        action: "selected_export",
        label: "Selected export",
        source: "bulk_action_dry_run",
        wouldMutate: false,
        requiresApproval: false
      },
      write: noWriteFlags
    });
  });

  it("exports only eligible selected records in stable selected-id order", async () => {
    const auditCountBefore = await prisma.auditEvent.count();
    const taskCountBefore = await prisma.task.count();
    const contactsBefore = await listSelectedExportContacts();
    const packet = await getBulkActionSelectedExportPacket({
      entity: "contacts",
      recordIds: [contactBId, missingId, contactAId, contactBId],
      generatedAt: new Date("2026-05-24T12:00:00Z")
    });
    const lines = packet.csv.split("\n");

    expect(packet).toMatchObject({
      packetType: "bulk-action-selected-export-packet",
      mode: "selected_export_packet",
      entityMetadata: {
        entity: "contacts",
        label: "Contacts",
        route: "/contacts",
        filename: "contacts.csv"
      },
      actionMetadata: {
        action: "selected_export",
        source: "bulk_action_dry_run",
        wouldMutate: false,
        requiresApproval: false
      },
      write: noWriteFlags,
      rowCount: 2,
      selectedRecordIds: [contactBId, contactAId],
      blockedRecordIds: [missingId]
    });
    expect(packet.rollup).toEqual({
      status: "partial",
      requestedCount: 4,
      uniqueRecordCount: 3,
      duplicateCount: 1,
      missingCount: 1,
      eligibleCount: 2,
      blockedCount: 2,
      exportedCount: 2,
      wouldMutate: false,
      requiresApproval: false
    });
    expect(packet.dryRun.records.map((record) => [record.id, record.reason])).toEqual([
      [contactBId, "eligible"],
      [missingId, "not_found"],
      [contactAId, "eligible"]
    ]);
    expect(packet.dryRun.duplicateSelections).toEqual([
      { id: contactBId, occurrences: 2 }
    ]);
    expect(lines[0]).toBe(
      "Contact ID,First Name,Last Name,Email,Phone,Title,Status,Account ID,Account Name,Created At,Updated At"
    );
    expect(lines).toHaveLength(3);
    expect(lines[1]!.startsWith(
      `${contactBId},Beta,Selected,beta.selected@example.test,,,inactive,${accountId},Selected Export Account,`
    )).toBe(true);
    expect(lines[2]!.startsWith(
      `${contactAId},Alpha,Selected,alpha.selected@example.test,,,active,${accountId},Selected Export Account,`
    )).toBe(true);
    expect(packet.auditPlan).toMatchObject({
      source: "bulk_action_dry_run",
      packetSource: "bulk_action_selected_export_packet",
      summary: "selected_export packet for contacts: 2 exported, 2 blocked.",
      wouldMutate: false,
      requiresApproval: false,
      wouldRecordAuditEvent: false,
      write: noWriteFlags,
      metadata: {
        packetSource: "bulk_action_selected_export_packet",
        entity: "contacts",
        action: "selected_export",
        filename: "contacts.csv",
        contentType: CSV_EXPORT_CONTENT_TYPE,
        requestedCount: 4,
        uniqueRecordCount: 3,
        duplicateCount: 1,
        missingCount: 1,
        eligibleCount: 2,
        blockedCount: 2,
        exportedCount: 2,
        selectedRecordIds: [contactBId, contactAId],
        blockedRecordIds: [missingId],
        wouldMutate: false,
        requiresApproval: false
      }
    });
    expect(await prisma.auditEvent.count()).toBe(auditCountBefore);
    expect(await prisma.task.count()).toBe(taskCountBefore);
    expect(await listSelectedExportContacts()).toEqual(contactsBefore);
  });

  it("rejects unknown packet keys without writing records", async () => {
    const auditCountBefore = await prisma.auditEvent.count();

    await expect(
      getBulkActionSelectedExportPacket({
        entity: "contacts",
        recordIds: [contactAId],
        apply: true
      })
    ).rejects.toThrow(/Unrecognized key: .*apply/);
    expect(await prisma.auditEvent.count()).toBe(auditCountBefore);
  });
});

async function createSelectedExportFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "Selected Export Account",
      status: "active",
      healthScore: 90
    }
  });
  await prisma.contact.createMany({
    data: [
      {
        id: contactAId,
        accountId,
        firstName: "Alpha",
        lastName: "Selected",
        email: "alpha.selected@example.test",
        status: "active"
      },
      {
        id: contactBId,
        accountId,
        firstName: "Beta",
        lastName: "Selected",
        email: "beta.selected@example.test",
        status: "inactive"
      }
    ]
  });
}

async function cleanupSelectedExportFixtures() {
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { id: { in: [contactAId, contactBId] } },
        {
          email: {
            in: ["alpha.selected@example.test", "beta.selected@example.test"]
          }
        }
      ]
    }
  });
  await prisma.account.deleteMany({
    where: { id: accountId }
  });
}

async function listSelectedExportContacts() {
  return prisma.contact.findMany({
    where: { id: { in: [contactAId, contactBId] } },
    orderBy: { id: "asc" },
    select: { id: true, status: true, updatedAt: true }
  });
}
