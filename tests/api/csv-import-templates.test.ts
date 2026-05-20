import { describe, expect, it } from "vitest";
import {
  CSV_IMPORT_PREVIEW_ENTITIES,
  getCsvImportPreviewDefinition
} from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
  exportCsvImportTemplateCsv,
  getCsvImportTemplate,
  isCsvImportTemplateEntity,
  listCsvImportTemplates
} from "@/lib/server/csvImportTemplates";

describe("server CSV import template contracts", () => {
  it("publishes templates for every supported import preview entity", () => {
    const templates = listCsvImportTemplates();

    expect(templates.map((template) => template.entity)).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(templates.every((template) => template.filename.endsWith(".csv"))).toBe(true);
    expect(templates.every((template) => template.contentType === CSV_IMPORT_TEMPLATE_CONTENT_TYPE))
      .toBe(true);
    expect(getCsvImportTemplate("contacts")).toMatchObject({
      entity: "contacts",
      route: "/contacts",
      filename: "contacts-import-template.csv"
    });
    expect(isCsvImportTemplateEntity("leads")).toBe(true);
    expect(isCsvImportTemplateEntity("accounts")).toBe(false);
  });

  it("keeps canonical headers aligned with preview field definitions", () => {
    const previewDefinition = getCsvImportPreviewDefinition("contacts");
    const template = getCsvImportTemplate("contacts");

    expect(template.headers).toEqual(
      previewDefinition.fields.map((field) => field.label)
    );
    expect(template.fields.map((field) => field.key)).toEqual(
      previewDefinition.fields.map((field) => field.key)
    );
    expect(template.requiredHeaders).toEqual(["First Name", "Last Name", "Status"]);
  });

  it("includes required-field and alias metadata for later UI wiring", () => {
    const leadTemplate = getCsvImportTemplate("leads");
    const postalField = leadTemplate.fields.find((field) => field.key === "postalCode");

    expect(leadTemplate.requiredHeaders).toEqual(["First Name", "Last Name"]);
    expect(postalField).toMatchObject({
      label: "Postal Code",
      required: false
    });
    expect(postalField?.aliases).toContain("postal");
    expect(postalField?.aliases).toContain("zip code");
  });

  it("exports deterministic header-only CSV without importing rows", () => {
    const contactTemplate = exportCsvImportTemplateCsv("contacts");
    const leadTemplate = exportCsvImportTemplateCsv("leads");

    expect(contactTemplate).toMatchObject({
      entity: "contacts",
      filename: "contacts-import-template.csv",
      contentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      rowCount: 0
    });
    expect(contactTemplate.csv).toBe(
      "First Name,Last Name,Email,Phone,Title,Status,Account ID\n"
    );
    expect(leadTemplate.csv).toBe(
      "First Name,Last Name,Phone,Email,Postal Code,Province,Source,Status\n"
    );
  });
});
