import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  CSV_DEDUPE_CANDIDATE_PACKET_VERSION,
  CSV_DEDUPE_CANDIDATE_REASON_CODES
} from "@/lib/server/csvDedupeCandidatePackets";
import {
  CSV_DEDUPE_REVIEW_BUNDLE_CONTENT_TYPE,
  CSV_DEDUPE_REVIEW_BUNDLE_VERSION,
  getCsvDedupeReviewBundle,
  getCsvDedupeReviewBundleDefinition,
  isCsvDedupeReviewBundleEntity,
  listCsvDedupeReviewBundleDefinitions,
  listCsvDedupeReviewBundles
} from "@/lib/server/csvDedupeReviewBundles";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
  CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
} from "@/lib/server/csvImportReviewBundles";
import { CSV_IMPORT_TEMPLATE_CONTENT_TYPE } from "@/lib/server/csvImportTemplates";

describe("server CSV dedupe review bundles", () => {
  beforeEach(async () => {
    await cleanupDedupeReviewFixtures();
  });

  afterEach(async () => {
    await cleanupDedupeReviewFixtures();
  });

  it("publishes dedupe review definitions for supported import entities", () => {
    const definitions = listCsvDedupeReviewBundleDefinitions();

    expect(definitions.map((definition) => definition.entity)).toEqual(
      CSV_IMPORT_PREVIEW_ENTITIES
    );
    expect(getCsvDedupeReviewBundleDefinition("contacts")).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      contentType: CSV_DEDUPE_REVIEW_BUNDLE_CONTENT_TYPE,
      bundleVersion: CSV_DEDUPE_REVIEW_BUNDLE_VERSION,
      packetVersion: CSV_DEDUPE_CANDIDATE_PACKET_VERSION,
      candidatePacketVersion: CSV_DEDUPE_CANDIDATE_PACKET_VERSION,
      inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      dryRunMode: "dry_run",
      defaultSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
      maxSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT,
      supportedReasonCodes: CSV_DEDUPE_CANDIDATE_REASON_CODES
    });
    expect(isCsvDedupeReviewBundleEntity("leads")).toBe(true);
    expect(isCsvDedupeReviewBundleEntity("accounts")).toBe(false);
  });

  it("combines candidate packets, dry-run review metadata, and safe-watch-block counts", async () => {
    await prisma.contact.create({
      data: {
        id: "csv-dedupe-review-existing-contact",
        firstName: "Alice",
        lastName: "Ng",
        email: "alice.dedupe.review@example.test",
        phone: "604-555-0100",
        status: "active"
      }
    });
    const contactCountBefore = await prisma.contact.count();
    const csv = [
      "First Name,Last Name,Email,Status,Phone",
      "Clean,Ready,clean.dedupe.review@example.test,active,604-555-0111",
      "Alice,Ng,ALICE.DEDUPE.REVIEW@example.test,active,604-555-0100",
      ",Broken,broken.dedupe.review@example.test,active,604-555-0122"
    ].join("\n");

    const bundle = await getCsvDedupeReviewBundle("contacts", csv, {
      sampleLimit: 2
    });
    const contactCountAfter = await prisma.contact.count();

    expect(contactCountAfter).toBe(contactCountBefore);
    expect(bundle).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      contentType: CSV_DEDUPE_REVIEW_BUNDLE_CONTENT_TYPE,
      bundleVersion: CSV_DEDUPE_REVIEW_BUNDLE_VERSION,
      mode: "dedupe_review",
      source: {
        inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
        rowCount: 3,
        previewedRows: 3,
        requestedPreviewLimit: null,
        appliedPreviewLimit: 100,
        requestedSampleLimit: 2,
        appliedSampleLimit: 2
      },
      operatorSummary: {
        status: "block",
        totalRows: 3,
        previewedRows: 3,
        safeRows: 1,
        watchRows: 1,
        blockRows: 1,
        importableRows: 2,
        dedupeCandidateRows: 1,
        dedupeCandidateCount: 1,
        matchedRecordCount: 1,
        diagnosticCount: 1,
        warningCount: 1,
        errorCount: 1
      },
      write: noWrites()
    });
    expect(bundle.review).toEqual(bundle.dryRun.review);
    expect(bundle.issueSummary).toEqual(bundle.dryRun.issueSummary);
    expect(bundle.readinessSummary).toEqual(bundle.dryRun.readinessSummary);
    expect(bundle.actionSummary).toEqual(bundle.dryRun.actionSummary);
    expect(bundle.dedupeSummary).toEqual(bundle.candidatePacket.summary);
    expect(bundle.candidates).toEqual(bundle.candidatePacket.candidates);
    expect(bundle.rowSample).toMatchObject({
      sampleLimit: 2,
      sampledRows: 2,
      hasMoreRows: true
    });
    expect(bundle.rowSample.rows.map((row) => row.action.action)).toEqual([
      "create_candidate",
      "review_candidate"
    ]);
    expect(bundle.candidates[0]).toMatchObject({
      row: {
        rowNumber: 3,
        label: "Alice Ng",
        fieldKey: "email",
        fieldValue: "ALICE.DEDUPE.REVIEW@example.test",
        readinessStatus: "needs_review",
        action: "review_candidate"
      },
      matchedRecord: {
        entity: "contacts",
        id: "csv-dedupe-review-existing-contact",
        route: "/contacts/csv-dedupe-review-existing-contact"
      },
      reasonCode: "contact_duplicate_email",
      severity: "warning"
    });
    expect(bundle.read).toEqual({
      metadata: true,
      csvInput: true,
      database: true,
      preflightDiagnostics: true,
      dryRun: true,
      review: true,
      rowSample: true
    });
  });

  it("does not write lead rows, route leads, or merge duplicates", async () => {
    await prisma.lead.create({
      data: {
        id: "csv-dedupe-review-existing-lead",
        firstName: "Riley",
        lastName: "Park",
        email: "riley.dedupe.review@example.test",
        phone: "604-555-0300",
        status: "new"
      }
    });
    const before = await countLeadDedupeReviewState();
    const csv = [
      "First Name,Last Name,Email,Phone,Postal Code,Source",
      "Riley,Park,RILEY.DEDUPE.REVIEW@example.test,604-555-0300,V5K0A1,Website"
    ].join("\n");

    const bundle = await getCsvDedupeReviewBundle("leads", csv);
    const after = await countLeadDedupeReviewState();

    expect(after).toEqual(before);
    expect(bundle.operatorSummary).toMatchObject({
      status: "watch",
      totalRows: 1,
      previewedRows: 1,
      safeRows: 0,
      watchRows: 1,
      blockRows: 0,
      importableRows: 1,
      dedupeCandidateRows: 1,
      dedupeCandidateCount: 1,
      matchedRecordCount: 1,
      diagnosticCount: 1,
      warningCount: 1,
      errorCount: 0
    });
    expect(bundle.candidates[0]).toMatchObject({
      entity: "leads",
      row: {
        rowNumber: 2,
        readinessStatus: "needs_review",
        action: "review_candidate"
      },
      matchedRecord: {
        entity: "leads",
        id: "csv-dedupe-review-existing-lead",
        route: "/leads/csv-dedupe-review-existing-lead"
      },
      reasonCode: "lead_duplicate_email"
    });
    expect(bundle.write.routingAssignments).toBe(false);
    expect(bundle.write.importApply).toBe(false);
    expect(bundle.write.duplicateMerge).toBe(false);
    expect(bundle.write.bulkMutations).toBe(false);
    expect(bundle.write.headerRemapping).toBe(false);
    expect(bundle.write.userUploadParsing).toBe(false);
  });

  it("lists bounded bundles for all supported import entities with no-write flags", async () => {
    const bundles = await listCsvDedupeReviewBundles(
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
        limit: 1,
        sampleLimit: 1
      }
    );

    expect(bundles.map((bundle) => bundle.entity)).toEqual(
      CSV_IMPORT_PREVIEW_ENTITIES
    );
    expect(
      bundles.every(
        (bundle) =>
          bundle.source.previewedRows === 1 &&
          bundle.rowSample.sampleLimit === 1 &&
          bundle.rowSample.sampledRows === 1 &&
          bundle.operatorSummary.previewedRows === 1
      )
    ).toBe(true);
    expect(bundles.every((bundle) => bundle.write.database === false)).toBe(true);
    expect(bundles.every((bundle) => bundle.write.files === false)).toBe(true);
    expect(
      bundles.every((bundle) => bundle.write.externalServices === false)
    ).toBe(true);
    expect(
      bundles.every((bundle) => bundle.write.routingAssignments === false)
    ).toBe(true);
    expect(bundles.every((bundle) => bundle.write.importApply === false)).toBe(true);
    expect(bundles.every((bundle) => bundle.write.duplicateMerge === false)).toBe(
      true
    );
    expect(bundles.every((bundle) => bundle.write.backgroundJobs === false)).toBe(
      true
    );
    expect(bundles.every((bundle) => bundle.write.persistentHistory === false)).toBe(
      true
    );
  });
});

function noWrites() {
  return {
    database: false,
    files: false,
    externalServices: false,
    routingAssignments: false,
    importApply: false,
    duplicateMerge: false,
    bulkMutations: false,
    backgroundJobs: false,
    headerRemapping: false,
    userUploadParsing: false,
    approvalWorkflow: false,
    persistentHistory: false
  };
}

async function cleanupDedupeReviewFixtures() {
  await prisma.activity.deleteMany({
    where: {
      lead: {
        OR: [
          {
            id: "csv-dedupe-review-existing-lead"
          },
          {
            email: "riley.dedupe.review@example.test"
          }
        ]
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      OR: [
        {
          id: "csv-dedupe-review-existing-lead"
        },
        {
          email: "riley.dedupe.review@example.test"
        }
      ]
    }
  });
  await prisma.contact.deleteMany({
    where: {
      OR: [
        {
          id: "csv-dedupe-review-existing-contact"
        },
        {
          email: {
            in: [
              "alice.dedupe.review@example.test",
              "clean.dedupe.review@example.test",
              "broken.dedupe.review@example.test"
            ]
          }
        }
      ]
    }
  });
}

async function countLeadDedupeReviewState() {
  const [leads, activities] = await Promise.all([
    prisma.lead.count({
      where: {
        OR: [
          {
            id: "csv-dedupe-review-existing-lead"
          },
          {
            email: "riley.dedupe.review@example.test"
          }
        ]
      }
    }),
    prisma.activity.count({
      where: {
        lead: {
          OR: [
            {
              id: "csv-dedupe-review-existing-lead"
            },
            {
              email: "riley.dedupe.review@example.test"
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
