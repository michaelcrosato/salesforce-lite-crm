import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
  getCsvImportTemplate
} from "@/lib/server/csvImportTemplates";
import {
  CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
  CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT,
  getCsvImportReviewBundle,
  getCsvImportReviewBundleDefinition,
  isCsvImportReviewBundleEntity,
  listCsvImportReviewBundleDefinitions,
  listCsvImportReviewBundles
} from "@/lib/server/csvImportReviewBundles";

describe("server CSV import review bundles", () => {
  beforeEach(async () => {
    await cleanupReviewBundleFixtures();
  });

  afterEach(async () => {
    await cleanupReviewBundleFixtures();
  });

  it("publishes review bundle definitions for supported import entities", () => {
    const definitions = listCsvImportReviewBundleDefinitions();

    expect(definitions.map((definition) => definition.entity)).toEqual(
      CSV_IMPORT_PREVIEW_ENTITIES
    );
    expect(getCsvImportReviewBundleDefinition("contacts")).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      defaultSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
      maxSampleLimit: CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
    });
    expect(isCsvImportReviewBundleEntity("leads")).toBe(true);
    expect(isCsvImportReviewBundleEntity("accounts")).toBe(false);
  });

  it("combines template metadata, preflight summaries, and a bounded row sample", async () => {
    await prisma.contact.create({
      data: {
        id: "csv-review-existing-contact",
        firstName: "Alice",
        lastName: "Ng",
        email: "alice.review@example.test",
        phone: "604-555-0100",
        status: "active"
      }
    });

    const csv = [
      "First Name,Last Name,Email,Status,Phone",
      "Clean,Ready,clean.review@example.test,active,604-555-0111",
      "Alice,Ng,ALICE.REVIEW@example.test,active,604-555-0100",
      ",Broken,broken.review@example.test,active,604-555-0122"
    ].join("\n");

    const bundle = await getCsvImportReviewBundle("contacts", csv, {
      sampleLimit: 2
    });

    expect(bundle.template).toEqual(getCsvImportTemplate("contacts"));
    expect("rows" in bundle.preflight).toBe(false);
    expect(bundle.preflight).toMatchObject({
      rowCount: 3,
      previewedRows: 3,
      validRows: 2,
      invalidRows: 1,
      warningRows: 1
    });
    expect(bundle.issueSummary).toEqual(bundle.preflight.issueSummary);
    expect(bundle.readinessSummary).toEqual(bundle.preflight.readinessSummary);
    expect(bundle.actionSummary).toEqual(bundle.preflight.actionSummary);
    expect(bundle.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "contact_duplicate_email"
    ]);
    expect(bundle.rowSample).toMatchObject({
      sampleLimit: 2,
      sampledRows: 2,
      hasMoreRows: true
    });
    expect(bundle.rowSample.rows.map((row) => row.action.action)).toEqual([
      "create_candidate",
      "review_candidate"
    ]);
    expect(bundle.rowSample.rows[1]!.diagnostics[0]).toMatchObject({
      code: "contact_duplicate_email",
      fieldKey: "email",
      relatedRecord: {
        entity: "contacts",
        id: "csv-review-existing-contact"
      }
    });
    expect(bundle.write).toEqual({
      database: false,
      files: false,
      externalServices: false,
      routingAssignments: false
    });
  });

  it("builds review bundles for all supported entities when inputs are provided", async () => {
    const bundles = await listCsvImportReviewBundles(
      {
        contacts: "First Name,Last Name,Status\nMaya,Singh,active",
        leads: "First Name,Last Name,Postal Code,Source\nRiley,Park,V5K0A1,Website"
      },
      {
        sampleLimit: 1
      }
    );

    expect(bundles.map((bundle) => bundle.entity)).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(bundles.every((bundle) => bundle.rowSample.sampleLimit === 1)).toBe(true);
    expect(bundles.every((bundle) => bundle.rowSample.sampledRows === 1)).toBe(true);
  });

  it("does not write imported lead rows while building preflight context", async () => {
    const email = "csv.review.import@example.test";
    const before = await prisma.lead.count({
      where: {
        email
      }
    });
    const csv = [
      "First Name,Last Name,Email,Phone,Postal Code,Source",
      `Csv,Review,${email},604-555-0199,V5K0A1,Website`
    ].join("\n");

    const bundle = await getCsvImportReviewBundle("leads", csv);
    const after = await prisma.lead.count({
      where: {
        email
      }
    });

    expect(after).toBe(before);
    expect(bundle.rowSample.sampleLimit).toBe(CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT);
    expect(bundle.rowSample.rows).toHaveLength(1);
    expect(bundle.rowSample.rows[0]!.data).toMatchObject({
      firstName: "Csv",
      lastName: "Review",
      postalCode: "V5K 0A1",
      status: "new"
    });
  });

  it("clamps row sample limits without changing the underlying preview counts", async () => {
    const csv = [
      "First Name,Last Name,Status",
      "A,One,active",
      "B,Two,active",
      "C,Three,active"
    ].join("\n");

    const zeroRowBundle = await getCsvImportReviewBundle("contacts", csv, {
      sampleLimit: -5
    });
    const highLimitBundle = await getCsvImportReviewBundle("contacts", csv, {
      sampleLimit: 999
    });

    expect(zeroRowBundle.preflight.rowCount).toBe(3);
    expect(zeroRowBundle.rowSample).toMatchObject({
      sampleLimit: 0,
      sampledRows: 0,
      hasMoreRows: true
    });
    expect(zeroRowBundle.rowSample.rows).toEqual([]);
    expect(highLimitBundle.rowSample.sampleLimit).toBe(
      CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
    );
    expect(highLimitBundle.rowSample.sampledRows).toBe(3);
    expect(highLimitBundle.rowSample.hasMoreRows).toBe(false);
  });
});

async function cleanupReviewBundleFixtures() {
  await prisma.contact.deleteMany({
    where: {
      OR: [
        {
          id: "csv-review-existing-contact"
        },
        {
          email: {
            in: [
              "alice.review@example.test",
              "clean.review@example.test",
              "broken.review@example.test"
            ]
          }
        }
      ]
    }
  });
  await prisma.lead.deleteMany({
    where: {
      email: "csv.review.import@example.test"
    }
  });
}
