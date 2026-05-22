import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
  CSV_IMPORT_PREVIEW_ENTITIES,
  CSV_IMPORT_PREVIEW_MAX_LIMIT
} from "@/lib/server/csvImportPreview";
import {
  getCsvImportDryRunReceipt,
  getCsvImportDryRunReceiptDefinition,
  isCsvImportDryRunReceiptEntity,
  listCsvImportDryRunReceiptDefinitions,
  listCsvImportDryRunReceipts
} from "@/lib/server/csvImportDryRunReceipts";
import {
  CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
  CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT,
  getCsvImportReviewBundleDefinition
} from "@/lib/server/csvImportReviewBundles";
import { CSV_IMPORT_TEMPLATE_CONTENT_TYPE } from "@/lib/server/csvImportTemplates";

describe("server CSV import dry-run receipts", () => {
  beforeEach(async () => {
    await cleanupCsvImportDryRunFixtures();
  });

  afterEach(async () => {
    await cleanupCsvImportDryRunFixtures();
  });

  it("publishes a dry-run receipt definition for every import preview entity", () => {
    const definitions = listCsvImportDryRunReceiptDefinitions();
    const contactDefinition = getCsvImportDryRunReceiptDefinition("contacts");
    const reviewDefinition = getCsvImportReviewBundleDefinition("contacts");

    expect(definitions.map((definition) => definition.entity)).toEqual(
      CSV_IMPORT_PREVIEW_ENTITIES
    );
    expect(definitions.every((definition) => definition.fields.length > 0)).toBe(true);
    expect(contactDefinition).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      defaultPreviewLimit: CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
      maxPreviewLimit: CSV_IMPORT_PREVIEW_MAX_LIMIT,
      defaultSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
      maxSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
    });
    expect(contactDefinition).toEqual(reviewDefinition);
  });

  it("detects supported dry-run receipt entity ids", () => {
    expect(isCsvImportDryRunReceiptEntity("contacts")).toBe(true);
    expect(isCsvImportDryRunReceiptEntity("leads")).toBe(true);
    expect(isCsvImportDryRunReceiptEntity("opportunities")).toBe(false);
  });

  it("combines source metadata, review output, summaries, samples, and no-write flags", async () => {
    await prisma.contact.create({
      data: {
        id: "csv-dry-run-existing-contact",
        firstName: "Alice",
        lastName: "Ng",
        email: "alice.dryrun@example.test",
        phone: "604-555-0100",
        status: "active"
      }
    });
    const contactCountBefore = await prisma.contact.count();
    const csv = [
      "First Name,Last Name,Email,Status,Phone",
      "Clean,Ready,clean.dryrun@example.test,active,604-555-0111",
      "Alice,Ng,ALICE.DRYRUN@example.test,active,604-555-0100",
      ",Broken,broken.dryrun@example.test,active,604-555-0122"
    ].join("\n");

    const receipt = await getCsvImportDryRunReceipt("contacts", csv, {
      limit: 2,
      sampleLimit: 1
    });
    const contactCountAfter = await prisma.contact.count();

    expect(contactCountAfter).toBe(contactCountBefore);
    expect(receipt).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      mode: "dry_run",
      source: {
        inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
        characterCount: csv.length,
        lineCount: 4,
        rowCount: 3,
        previewedRows: 2,
        requestedPreviewLimit: 2,
        appliedPreviewLimit: 2,
        defaultPreviewLimit: CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
        maxPreviewLimit: CSV_IMPORT_PREVIEW_MAX_LIMIT,
        requestedSampleLimit: 1,
        appliedSampleLimit: 1,
        defaultSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
        maxSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
      },
      write: {
        database: false,
        files: false,
        externalServices: false,
        routingAssignments: false,
        importApply: false,
        bulkMutations: false,
        backgroundJobs: false
      }
    });
    expect(receipt.review.preflight).toMatchObject({
      rowCount: 3,
      previewedRows: 2,
      validRows: 2,
      invalidRows: 0,
      warningRows: 1
    });
    expect(receipt.issueSummary).toEqual(receipt.review.issueSummary);
    expect(receipt.readinessSummary).toEqual(receipt.review.readinessSummary);
    expect(receipt.actionSummary).toEqual(receipt.review.actionSummary);
    expect(receipt.diagnostics).toEqual(receipt.review.diagnostics);
    expect(receipt.rowSample).toEqual(receipt.review.rowSample);
    expect(receipt.rowSample).toMatchObject({
      sampleLimit: 1,
      sampledRows: 1,
      hasMoreRows: true
    });
    expect(receipt.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "contact_duplicate_email"
    ]);
  });

  it("does not write lead rows or execute routing while building a dry-run receipt", async () => {
    const email = "csv.dryrun.lead@example.test";
    const before = await countLeadDryRunState(email);
    const csv = [
      "First Name,Last Name,Email,Phone,Postal Code,Source",
      `Csv,Dryrun,${email},604-555-0199,V5K0A1,Website`
    ].join("\n");

    const receipt = await getCsvImportDryRunReceipt("leads", csv);
    const after = await countLeadDryRunState(email);

    expect(after).toEqual(before);
    expect(receipt.source).toMatchObject({
      requestedPreviewLimit: null,
      appliedPreviewLimit: CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
      requestedSampleLimit: null,
      appliedSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT
    });
    expect(receipt.readinessSummary).toMatchObject({
      readyRows: 1,
      importableRows: 1
    });
    expect(receipt.actionSummary).toMatchObject({
      createCandidateRows: 1,
      importableRows: 1
    });
    expect(receipt.rowSample.rows[0].data).toMatchObject({
      firstName: "Csv",
      lastName: "Dryrun",
      email,
      postalCode: "V5K 0A1",
      status: "new"
    });
    expect(receipt.write.routingAssignments).toBe(false);
    expect(receipt.write.importApply).toBe(false);
  });

  it("lists bounded dry-run receipts for all supported import entities", async () => {
    const receipts = await listCsvImportDryRunReceipts(
      {
        contacts: [
          "First Name,Last Name,Status",
          "A,One,active",
          "B,Two,active"
        ].join("\n"),
        leads: [
          "First Name,Last Name,Postal Code,Source",
          "Riley,Park,V5K0A1,Website",
          "Jordan,Lee,V6B1A1,Referral"
        ].join("\n")
      },
      {
        limit: 999_999,
        sampleLimit: 999
      }
    );

    expect(receipts.map((receipt) => receipt.entity)).toEqual(
      CSV_IMPORT_PREVIEW_ENTITIES
    );
    expect(
      receipts.every(
        (receipt) =>
          receipt.source.requestedPreviewLimit === 999_999 &&
          receipt.source.appliedPreviewLimit === CSV_IMPORT_PREVIEW_MAX_LIMIT &&
          receipt.source.requestedSampleLimit === 999 &&
          receipt.source.appliedSampleLimit === CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
      )
    ).toBe(true);
    expect(
      receipts.every(
        (receipt) =>
          receipt.write.database === false &&
          receipt.write.files === false &&
          receipt.write.externalServices === false &&
          receipt.write.routingAssignments === false &&
          receipt.write.importApply === false &&
          receipt.write.bulkMutations === false &&
          receipt.write.backgroundJobs === false
      )
    ).toBe(true);
  });
});

async function cleanupCsvImportDryRunFixtures() {
  await prisma.activity.deleteMany({
    where: {
      lead: {
        email: "csv.dryrun.lead@example.test"
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      email: "csv.dryrun.lead@example.test"
    }
  });
  await prisma.contact.deleteMany({
    where: {
      OR: [
        {
          id: "csv-dry-run-existing-contact"
        },
        {
          email: {
            in: [
              "alice.dryrun@example.test",
              "clean.dryrun@example.test",
              "broken.dryrun@example.test"
            ]
          }
        }
      ]
    }
  });
}

async function countLeadDryRunState(email: string) {
  const [leads, activities] = await Promise.all([
    prisma.lead.count({
      where: {
        email
      }
    }),
    prisma.activity.count({
      where: {
        lead: {
          email
        }
      }
    })
  ]);

  return {
    leads,
    activities
  };
}
