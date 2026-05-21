import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  CSV_EXPORT_CONTENT_TYPE,
  CSV_EXPORT_DEFAULT_LIMIT,
  CSV_EXPORT_ENTITIES,
  CSV_EXPORT_MAX_LIMIT,
  exportCrmListCsv,
  getCsvExportDefinition,
  getCsvExportPreflightSummary,
  isCsvExportEntity,
  listCsvExportDefinitions,
  listCsvExportPreflightSummaries
} from "@/lib/server/csvExport";
import { prisma } from "@/lib/prisma";

const accountId = "test-csv-export-account";
const contactId = "test-csv-export-contact";

describe("server CSV export contracts", () => {
  beforeEach(async () => {
    await cleanupCsvExportFixtures();
    await createCsvExportFixtures();
  });

  afterEach(async () => {
    await cleanupCsvExportFixtures();
  });

  it("publishes a CSV definition for every current CRM list entity", () => {
    const definitions = listCsvExportDefinitions();

    expect(definitions.map((definition) => definition.entity)).toEqual(CSV_EXPORT_ENTITIES);
    expect(definitions.every((definition) => definition.columns.length > 0)).toBe(true);
    expect(definitions.every((definition) => definition.filename.endsWith(".csv"))).toBe(true);
    expect(getCsvExportDefinition("opportunities")).toMatchObject({
      entity: "opportunities",
      route: "/deals",
      filename: "opportunities.csv"
    });
  });

  it("detects supported export entity ids", () => {
    expect(isCsvExportEntity("contacts")).toBe(true);
    expect(isCsvExportEntity("dealer-orders")).toBe(true);
    expect(isCsvExportEntity("global-search")).toBe(false);
  });

  it("exports deterministic RFC4180 CSV for a CRM list", async () => {
    const result = await exportCrmListCsv("contacts", { limit: 1 });

    expect(result.contentType).toBe(CSV_EXPORT_CONTENT_TYPE);
    expect(result.rowCount).toBe(1);
    expect(result.columns.map((column) => column.key).slice(0, 4)).toEqual([
      "id",
      "firstName",
      "lastName",
      "email"
    ]);
    expect(result.csv).toContain(
      "Contact ID,First Name,Last Name,Email,Phone,Title,Status,Account ID,Account Name,Created At,Updated At"
    );
    expect(result.csv).toContain(
      `${contactId},Csv,000 Export,csv.export@example.test,,Buyer,active,${accountId},"CSV, Account"`
    );
  });

  it("can return header-only CSV without reading rows", async () => {
    const result = await exportCrmListCsv("accounts", { limit: 0 });

    expect(result.rowCount).toBe(0);
    expect(result.csv).toBe(
      "Account ID,Name,Domain,Industry,City,Region,Status,Health Score,Owner ID,Owner Name,Owner Email,Created At,Updated At\n"
    );
  });

  it("publishes read-only export preflight summaries for later UI confirmation", async () => {
    const summaries = await listCsvExportPreflightSummaries();
    const contactDefinition = getCsvExportDefinition("contacts");
    const contactSummary = await getCsvExportPreflightSummary("contacts");
    const contactRowCount = await prisma.contact.count();

    expect(summaries.map((summary) => summary.entity)).toEqual(CSV_EXPORT_ENTITIES);
    expect(contactSummary).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      filename: "contacts.csv",
      contentType: CSV_EXPORT_CONTENT_TYPE,
      defaultLimit: CSV_EXPORT_DEFAULT_LIMIT,
      maxLimit: CSV_EXPORT_MAX_LIMIT,
      rowCount: contactRowCount
    });
    expect(contactSummary.canonicalHeaders).toEqual(
      contactDefinition.columns.map((column) => column.label)
    );
    expect(contactSummary.columns).toEqual(contactDefinition.columns);
  });
});

async function createCsvExportFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "CSV, Account",
      status: "active",
      healthScore: 92,
      createdAt: new Date("2026-05-01T10:00:00Z"),
      updatedAt: new Date("2026-05-01T10:00:00Z")
    }
  });
  await prisma.contact.create({
    data: {
      id: contactId,
      accountId,
      firstName: "Csv",
      lastName: "000 Export",
      email: "csv.export@example.test",
      title: "Buyer",
      status: "active",
      createdAt: new Date("2026-05-02T10:00:00Z"),
      updatedAt: new Date("2026-05-02T10:00:00Z")
    }
  });
}

async function cleanupCsvExportFixtures() {
  await prisma.contact.deleteMany({
    where: {
      OR: [{ id: contactId }, { email: "csv.export@example.test" }]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: accountId
    }
  });
}
