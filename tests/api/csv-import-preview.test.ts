import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  CSV_IMPORT_PREVIEW_ENTITIES,
  getCsvImportPreviewDefinition,
  isCsvImportPreviewEntity,
  listCsvImportPreviewDefinitions,
  previewCsvImport
} from "@/lib/server/csvImportPreview";
import { previewCsvImportWithPreflightDiagnostics } from "@/lib/server/csvImportPreflight";

describe("server CSV import preview validation", () => {
  it("publishes import preview definitions for supported entities", () => {
    const definitions = listCsvImportPreviewDefinitions();

    expect(definitions.map((definition) => definition.entity)).toEqual(
      CSV_IMPORT_PREVIEW_ENTITIES
    );
    expect(getCsvImportPreviewDefinition("contacts")).toMatchObject({
      entity: "contacts",
      route: "/contacts"
    });
    expect(isCsvImportPreviewEntity("leads")).toBe(true);
    expect(isCsvImportPreviewEntity("accounts")).toBe(false);
  });

  it("normalizes contact headers and returns row-level validation errors", () => {
    const csv = [
      "First Name,Last Name,Email,Status,Phone",
      "Alice,Ng,alice.ng@example.test,active,604-555-0100",
      ",Broken,not-an-email,unknown,"
    ].join("\n");

    const preview = previewCsvImport("contacts", csv);

    expect(preview.headers.map((header) => header.fieldKey)).toEqual([
      "firstName",
      "lastName",
      "email",
      "status",
      "phone"
    ]);
    expect(preview.rowCount).toBe(2);
    expect(preview.validRows).toBe(1);
    expect(preview.invalidRows).toBe(1);
    expect(preview.rows[0]).toMatchObject({
      rowNumber: 2,
      status: "valid",
      values: {
        firstName: "Alice",
        lastName: "Ng",
        email: "alice.ng@example.test",
        status: "active"
      }
    });
    expect(preview.rows[0].data).toMatchObject({
      firstName: "Alice",
      lastName: "Ng",
      email: "alice.ng@example.test",
      status: "active"
    });
    expect(preview.rows[1].status).toBe("invalid");
    expect(preview.rows[1].errors.join(" ")).toContain("First Name");
    expect(preview.rows[1].errors.join(" ")).toContain("Email");
    expect(preview.rows[1].errors.join(" ")).toContain("Status");
    expect(preview.issueSummary).toMatchObject({
      errorCount: preview.rows[1].errors.length,
      warningCount: 0,
      affectedRows: 1
    });
    expect(preview.issueSummary.categories).toContainEqual({
      category: "row_validation",
      severity: "error",
      issueCount: preview.rows[1].errors.length,
      affectedRows: 1
    });
    expect(preview.issueSummary.categories).toContainEqual({
      category: "diagnostic_warning",
      severity: "warning",
      issueCount: 0,
      affectedRows: 0
    });
  });

  it("validates consumer lead rows through postal helpers and applies schema defaults", () => {
    const csv = [
      "first_name,last_name,postal,source",
      "Maya,Singh,V5K0A1,Website",
      "Bad,Postal,not-postal,Website"
    ].join("\n");

    const preview = previewCsvImport("leads", csv);

    expect(preview.validRows).toBe(1);
    expect(preview.invalidRows).toBe(1);
    expect(preview.rows[0].data).toMatchObject({
      firstName: "Maya",
      lastName: "Singh",
      postalCode: "V5K 0A1",
      source: "Website",
      status: "new"
    });
    expect(preview.rows[1].errors.join(" ")).toContain(
      "Postal code must be in the format A1A 1A1"
    );
  });

  it("reports duplicate and unsupported headers without using ignored columns", () => {
    const csv = [
      "First Name,First,Last Name,Foo,Status",
      "Alice,Duplicate,Ng,ignored,active"
    ].join("\n");

    const preview = previewCsvImport("contacts", csv);

    expect(preview.headerErrors).toContain("Duplicate header for First Name: First.");
    expect(preview.headers[1]).toMatchObject({
      fieldKey: "firstName",
      status: "duplicate"
    });
    expect(preview.headers[3]).toMatchObject({
      fieldKey: null,
      status: "ignored"
    });
    expect(preview.rows[0].values.firstName).toBe("Alice");
    expect(preview.rows[0].status).toBe("valid");
    expect(preview.issueSummary.categories).toContainEqual({
      category: "header",
      severity: "error",
      issueCount: 1,
      affectedRows: 0
    });
  });

  it("propagates malformed CSV parse errors and column-count row errors", () => {
    const preview = previewCsvImport(
      "contacts",
      'First Name,Last Name,Status\n"Bad,no close\nShort,Row'
    );

    expect(preview.parseErrors.length).toBeGreaterThan(0);
    expect(preview.rows[0].errors).toContain("Expected 3 columns but found 2.");
    expect(preview.issueSummary.errorCount).toBe(
      preview.parseErrors.length + preview.rows[0].errors.length
    );
    expect(preview.issueSummary.categories).toContainEqual({
      category: "parse",
      severity: "error",
      issueCount: preview.parseErrors.length,
      affectedRows: 0
    });
    expect(preview.issueSummary.categories).toContainEqual({
      category: "row_validation",
      severity: "error",
      issueCount: preview.rows[0].errors.length,
      affectedRows: 1
    });
  });

  it("bounds preview rows while preserving total row count", () => {
    const csv = [
      "First Name,Last Name,Status",
      "A,One,active",
      "B,Two,active",
      "C,Three,active"
    ].join("\n");

    const preview = previewCsvImport("contacts", csv, { limit: 2 });

    expect(preview.rowCount).toBe(3);
    expect(preview.previewedRows).toBe(2);
    expect(preview.rows.map((row) => row.rowNumber)).toEqual([2, 3]);
  });
});

describe("server CSV import preflight diagnostics", () => {
  beforeEach(async () => {
    await cleanupPreflightFixtures();
  });

  afterEach(async () => {
    await cleanupPreflightFixtures();
  });

  it("adds deterministic contact duplicate, contactability, and relationship warnings", async () => {
    await prisma.contact.create({
      data: {
        id: "csv-preflight-existing-contact",
        firstName: "Alice",
        lastName: "Ng",
        email: "alice.ng@example.test",
        phone: "604-555-0100",
        status: "active"
      }
    });

    const csv = [
      "First Name,Last Name,Email,Status,Phone,Account ID",
      "Alice,Ng,ALICE.NG@example.test,active,604-555-0100,missing-account-id",
      "No,Method,,active,,"
    ].join("\n");

    const preview = await previewCsvImportWithPreflightDiagnostics("contacts", csv);

    expect(preview.validRows).toBe(2);
    expect(preview.warningRows).toBe(2);
    expect(preview.issueSummary).toMatchObject({
      errorCount: 0,
      warningCount: 3,
      affectedRows: 2
    });
    expect(preview.issueSummary.categories).toContainEqual({
      category: "diagnostic_warning",
      severity: "warning",
      issueCount: 3,
      affectedRows: 2
    });
    expect(preview.diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "contact_duplicate_email",
      "contact_account_not_found",
      "contact_missing_contact_method"
    ]);
    expect(preview.rows[0].diagnostics).toMatchObject([
      {
        category: "duplicate",
        fieldKey: "email",
        relatedRecord: {
          entity: "contacts",
          id: "csv-preflight-existing-contact"
        }
      },
      {
        category: "relationship",
        fieldKey: "accountId",
        relatedRecord: null
      }
    ]);
    expect(preview.rows[1].diagnostics).toMatchObject([
      {
        category: "contactability",
        fieldKey: null,
        relatedRecord: null
      }
    ]);
  });

  it("adds lead diagnostics from database context without importing or routing rows", async () => {
    await prisma.lead.create({
      data: {
        id: "csv-preflight-existing-lead",
        firstName: "Riley",
        lastName: "Park",
        email: "riley.park@example.test",
        phone: "555-0123",
        status: "new"
      }
    });

    const before = await countPreflightFixtures();
    const csv = [
      "First Name,Last Name,Email,Phone,Postal Code,Source",
      "Riley,Park,RILEY.PARK@example.test,555-0123,Q9Q9Q9,Website",
      "No,Reach,,,,Website"
    ].join("\n");

    const preview = await previewCsvImportWithPreflightDiagnostics("leads", csv);
    const after = await countPreflightFixtures();

    expect(after).toEqual(before);
    expect(preview.validRows).toBe(2);
    expect(preview.warningRows).toBe(2);
    expect(preview.rows[0].diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "lead_duplicate_email",
      "lead_area_not_found"
    ]);
    expect(preview.rows[1].diagnostics.map((diagnostic) => diagnostic.code)).toEqual([
      "lead_missing_contact_method",
      "lead_postal_missing"
    ]);
    expect(await prisma.lead.count({
      where: {
        firstName: "No",
        lastName: "Reach"
      }
    })).toBe(0);
  });
});

async function cleanupPreflightFixtures() {
  await prisma.activity.deleteMany({
    where: {
      leadId: "csv-preflight-existing-lead"
    }
  });
  await prisma.lead.deleteMany({
    where: {
      OR: [
        {
          id: "csv-preflight-existing-lead"
        },
        {
          email: "riley.park@example.test"
        },
        {
          firstName: "No",
          lastName: "Reach"
        }
      ]
    }
  });
  await prisma.contact.deleteMany({
    where: {
      OR: [
        {
          id: "csv-preflight-existing-contact"
        },
        {
          email: "alice.ng@example.test"
        }
      ]
    }
  });
}

async function countPreflightFixtures() {
  const [leads, contacts, activities] = await Promise.all([
    prisma.lead.count({
      where: {
        OR: [
          {
            id: "csv-preflight-existing-lead"
          },
          {
            firstName: "No",
            lastName: "Reach"
          }
        ]
      }
    }),
    prisma.contact.count({
      where: {
        id: "csv-preflight-existing-contact"
      }
    }),
    prisma.activity.count({
      where: {
        leadId: "csv-preflight-existing-lead"
      }
    })
  ]);

  return {
    leads,
    contacts,
    activities
  };
}
