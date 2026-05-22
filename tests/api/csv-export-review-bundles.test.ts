import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CSV_EXPORT_CONTENT_TYPE,
  CSV_EXPORT_DEFAULT_LIMIT,
  CSV_EXPORT_ENTITIES,
  CSV_EXPORT_MAX_LIMIT,
  CSV_EXPORT_PREVIEW_MAX_LIMIT,
  getCsvExportDefinition
} from "@/lib/server/csvExport";
import {
  getCsvExportReviewBundle,
  getCsvExportReviewBundleDefinition,
  isCsvExportReviewBundleEntity,
  listCsvExportReviewBundleDefinitions,
  listCsvExportReviewBundles
} from "@/lib/server/csvExportReviewBundles";
import { prisma } from "@/lib/prisma";

const accountId = "test-csv-export-review-account";
const contactId = "test-csv-export-review-contact";
const secondContactId = "test-csv-export-review-contact-2";

describe("server CSV export review bundles", () => {
  beforeEach(async () => {
    await cleanupCsvExportReviewFixtures();
    await createCsvExportReviewFixtures();
  });

  afterEach(async () => {
    await cleanupCsvExportReviewFixtures();
  });

  it("publishes a review bundle definition for every export entity", () => {
    const definitions = listCsvExportReviewBundleDefinitions();
    const contactDefinition = getCsvExportReviewBundleDefinition("contacts");
    const exportDefinition = getCsvExportDefinition("contacts");

    expect(definitions.map((definition) => definition.entity)).toEqual(CSV_EXPORT_ENTITIES);
    expect(definitions.every((definition) => definition.columns.length > 0)).toBe(true);
    expect(contactDefinition).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      filename: "contacts.csv",
      contentType: CSV_EXPORT_CONTENT_TYPE,
      defaultExportLimit: CSV_EXPORT_DEFAULT_LIMIT,
      maxExportLimit: CSV_EXPORT_MAX_LIMIT
    });
    expect(contactDefinition.canonicalHeaders).toEqual(
      exportDefinition.columns.map((column) => column.label)
    );
  });

  it("detects supported export review entity ids", () => {
    expect(isCsvExportReviewBundleEntity("contacts")).toBe(true);
    expect(isCsvExportReviewBundleEntity("dealer-orders")).toBe(true);
    expect(isCsvExportReviewBundleEntity("import-preview")).toBe(false);
  });

  it("combines capability metadata, preflight counts, preview rows, snippets, and no-write flags", async () => {
    const contactRowCountBefore = await prisma.contact.count();
    const bundle = await getCsvExportReviewBundle("contacts", {
      limit: 1,
      includeCsv: true
    });
    const contactRowCountAfter = await prisma.contact.count();

    expect(contactRowCountAfter).toBe(contactRowCountBefore);
    expect(bundle).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      filename: "contacts.csv",
      contentType: CSV_EXPORT_CONTENT_TYPE,
      write: {
        database: false,
        files: false,
        externalServices: false,
        exportHistory: false
      }
    });
    expect(bundle.capability).toMatchObject({
      operation: "export",
      entity: "contacts",
      returnsCsv: true,
      acceptsCsvInput: false,
      write: {
        database: false,
        files: false,
        externalServices: false,
        routingAssignments: false
      }
    });
    expect(bundle.preflight.rowCount).toBe(contactRowCountBefore);
    expect(bundle.preview).toMatchObject({
      totalRowCount: contactRowCountBefore,
      previewLimit: 1,
      previewRowCount: 1,
      hasMoreRows: contactRowCountBefore > 1
    });
    expect(bundle.preview.rows[0]).toMatchObject({
      id: contactId,
      firstName: "Csv",
      lastName: "000 Review",
      email: "csv.export.review@example.test",
      accountId,
      accountName: "CSV Export Review Account"
    });
    expect(bundle.preview.csvSnippet).toContain(
      "Contact ID,First Name,Last Name,Email,Phone,Title,Status,Account ID,Account Name,Created At,Updated At"
    );
    expect(bundle.preview.csvSnippet).toContain(
      `${contactId},Csv,000 Review,csv.export.review@example.test,,Buyer,active,${accountId},CSV Export Review Account`
    );
    expect(bundle.notes.map((note) => note.code)).toContain("preview-truncated");
  });

  it("returns deterministic limit notes when preview rows are disabled", async () => {
    const bundle = await getCsvExportReviewBundle("contacts", { limit: 0 });

    expect(bundle.preview.previewLimit).toBe(0);
    expect(bundle.preview.previewRowCount).toBe(0);
    expect(bundle.preview.rows).toEqual([]);
    expect(bundle.notes).toContainEqual(
      expect.objectContaining({
        code: "preview-disabled",
        severity: "info"
      })
    );
  });

  it("lists bounded bundles for all export entities", async () => {
    const bundles = await listCsvExportReviewBundles({ limit: 999 });

    expect(bundles.map((bundle) => bundle.entity)).toEqual(CSV_EXPORT_ENTITIES);
    expect(bundles.every((bundle) => bundle.preview.previewLimit === CSV_EXPORT_PREVIEW_MAX_LIMIT)).toBe(
      true
    );
    expect(
      bundles.every((bundle) => bundle.preview.previewRowCount <= CSV_EXPORT_PREVIEW_MAX_LIMIT)
    ).toBe(true);
    expect(
      bundles.every(
        (bundle) =>
          bundle.write.database === false &&
          bundle.write.files === false &&
          bundle.write.externalServices === false &&
          bundle.write.exportHistory === false
      )
    ).toBe(true);
  });
});

async function createCsvExportReviewFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "CSV Export Review Account",
      status: "active",
      healthScore: 91,
      createdAt: new Date("2026-05-03T10:00:00Z"),
      updatedAt: new Date("2026-05-03T10:00:00Z")
    }
  });
  await prisma.contact.createMany({
    data: [
      {
        id: contactId,
        accountId,
        firstName: "Csv",
        lastName: "000 Review",
        email: "csv.export.review@example.test",
        title: "Buyer",
        status: "active",
        createdAt: new Date("2026-05-04T10:00:00Z"),
        updatedAt: new Date("2026-05-04T10:00:00Z")
      },
      {
        id: secondContactId,
        accountId,
        firstName: "Csv",
        lastName: "001 Review",
        email: "csv.export.review.2@example.test",
        title: "Buyer",
        status: "active",
        createdAt: new Date("2026-05-04T11:00:00Z"),
        updatedAt: new Date("2026-05-04T11:00:00Z")
      }
    ]
  });
}

async function cleanupCsvExportReviewFixtures() {
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { id: contactId },
        { id: secondContactId },
        { email: "csv.export.review@example.test" },
        { email: "csv.export.review.2@example.test" }
      ]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: accountId
    }
  });
}
