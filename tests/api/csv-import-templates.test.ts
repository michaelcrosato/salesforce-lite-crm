import { describe, expect, it } from "vitest";
import {
  CSV_IMPORT_PREVIEW_ENTITIES,
  getCsvImportPreviewDefinition,
  previewCsvImport
} from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
  exportCsvImportTemplateExampleCsv,
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

  it("exposes deterministic example row metadata for each template", () => {
    const templates = listCsvImportTemplates();

    for (const template of templates) {
      expect(template.exampleRow.rowNumber).toBe(2);
      expect(template.exampleRow.fields.map((field) => field.key)).toEqual(
        template.fields.map((field) => field.key)
      );
      expect(Object.keys(template.exampleRow.values)).toEqual(
        template.fields.map((field) => field.key)
      );
      expect(
        template.exampleRow.fields.every(
          (field) => template.exampleRow.values[field.key] === field.value
        )
      ).toBe(true);
      expect(template.exampleRow.fields.every((field) => field.value.length > 0)).toBe(true);
    }

    expect(getCsvImportTemplate("contacts").exampleRow.values).toMatchObject({
      firstName: "Maya",
      lastName: "Singh",
      status: "active"
    });
    expect(getCsvImportTemplate("leads").exampleRow.values).toMatchObject({
      firstName: "Riley",
      lastName: "Park",
      postalCode: "V5K 0A1",
      status: "new"
    });
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

  it("exports deterministic one-row example CSV without importing rows", () => {
    const contactExample = exportCsvImportTemplateExampleCsv("contacts");
    const leadExample = exportCsvImportTemplateExampleCsv("leads");

    expect(contactExample).toMatchObject({
      entity: "contacts",
      filename: "contacts-import-example.csv",
      templateFilename: "contacts-import-template.csv",
      contentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      rowCount: 1
    });
    expect(contactExample.csv).toBe(
      "First Name,Last Name,Email,Phone,Title,Status,Account ID\n" +
        "Maya,Singh,maya.singh@example.test,604-555-0101,Operations Manager,active,acct-example"
    );
    expect(leadExample.csv).toBe(
      "First Name,Last Name,Phone,Email,Postal Code,Province,Source,Status\n" +
        "Riley,Park,604-555-0188,riley.park@example.test,V5K 0A1,BC,Website,new"
    );
  });

  it("keeps template examples valid under the import preview validators", () => {
    for (const entity of CSV_IMPORT_PREVIEW_ENTITIES) {
      const example = exportCsvImportTemplateExampleCsv(entity);
      const preview = previewCsvImport(entity, example.csv);

      expect(preview.rowCount).toBe(1);
      expect(preview.previewedRows).toBe(1);
      expect(preview.validRows).toBe(1);
      expect(preview.invalidRows).toBe(0);
      expect(preview.issueSummary).toMatchObject({
        errorCount: 0,
        warningCount: 0,
        affectedRows: 0
      });
      expect(preview.rows[0]).toMatchObject({
        rowNumber: example.exampleRow.rowNumber,
        status: "valid",
        values: example.exampleRow.values
      });
    }
  });
});
