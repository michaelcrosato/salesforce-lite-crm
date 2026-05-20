import { describe, expect, it } from "vitest";
import {
  CSV_IMPORT_PREVIEW_ENTITIES,
  getCsvImportPreviewDefinition,
  isCsvImportPreviewEntity,
  listCsvImportPreviewDefinitions,
  previewCsvImport
} from "@/lib/server/csvImportPreview";

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
  });

  it("propagates malformed CSV parse errors and column-count row errors", () => {
    const preview = previewCsvImport(
      "contacts",
      'First Name,Last Name,Status\n"Bad,no close\nShort,Row'
    );

    expect(preview.parseErrors.length).toBeGreaterThan(0);
    expect(preview.rows[0].errors).toContain("Expected 3 columns but found 2.");
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
