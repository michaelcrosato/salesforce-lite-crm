import { describe, expect, it } from "vitest";
import {
  CSV_EXPORT_CONTENT_TYPE,
  CSV_EXPORT_DEFAULT_LIMIT,
  CSV_EXPORT_ENTITIES,
  CSV_EXPORT_MAX_LIMIT,
  CSV_EXPORT_PREVIEW_DEFAULT_LIMIT,
  CSV_EXPORT_PREVIEW_MAX_LIMIT,
  getCsvExportDefinition
} from "@/lib/server/csvExport";
import {
  CSV_IMPORT_PREVIEW_ENTITIES,
  CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
  CSV_IMPORT_PREVIEW_MAX_LIMIT,
  getCsvImportPreviewDefinition
} from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
  getCsvImportTemplate
} from "@/lib/server/csvImportTemplates";
import {
  CSV_CAPABILITY_OPERATIONS,
  getCsvCapability,
  listCsvCapabilities,
  listCsvCapabilitiesByOperation
} from "@/lib/server/csvCapabilities";

describe("server CSV capability catalog", () => {
  it("publishes deterministic capability groups for each CSV operation", () => {
    const capabilities = listCsvCapabilities();

    expect([...new Set(capabilities.map((capability) => capability.operation))]).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
    expect(listCsvCapabilitiesByOperation("export").map((capability) => capability.entity))
      .toEqual(CSV_EXPORT_ENTITIES);
    expect(
      listCsvCapabilitiesByOperation("import-preview").map((capability) => capability.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(
      listCsvCapabilitiesByOperation("import-template").map((capability) => capability.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(
      listCsvCapabilitiesByOperation("import-preflight").map((capability) => capability.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
  });

  it("mirrors export definitions with CSV output and read-only safety flags", () => {
    const definition = getCsvExportDefinition("opportunities");
    const capability = getCsvCapability("export", "opportunities");

    expect(capability).toMatchObject({
      operation: "export",
      entity: "opportunities",
      route: definition.route,
      filename: definition.filename,
      inputContentType: null,
      outputContentType: CSV_EXPORT_CONTENT_TYPE,
      acceptsCsvInput: false,
      returnsCsv: true,
      limits: {
        exportRows: {
          defaultLimit: CSV_EXPORT_DEFAULT_LIMIT,
          maxLimit: CSV_EXPORT_MAX_LIMIT
        },
        previewRows: {
          defaultLimit: CSV_EXPORT_PREVIEW_DEFAULT_LIMIT,
          maxLimit: CSV_EXPORT_PREVIEW_MAX_LIMIT
        }
      },
      preview: {
        rows: true,
        csvSnippet: true,
        issueSummary: false,
        diagnostics: false,
        readinessSummary: false,
        actionSummary: false
      },
      surface: {
        exportPreflightSummary: true,
        exportPreview: true,
        importPreview: false,
        importTemplate: false,
        importPreflightDiagnostics: false,
        importReadinessSummary: false,
        importActionSummary: false
      },
      read: {
        metadata: true,
        database: true,
        csvInput: false
      },
      write: {
        database: false,
        files: false,
        externalServices: false,
        routingAssignments: false
      }
    });
    expect(capability?.canonicalHeaders).toEqual(
      definition.columns.map((column) => column.label)
    );
    expect(capability?.requiredImportFields).toEqual([]);
    expect(capability?.requiredImportHeaders).toEqual([]);
  });

  it("mirrors import preview and template metadata for later UI wiring", () => {
    const previewDefinition = getCsvImportPreviewDefinition("contacts");
    const previewCapability = getCsvCapability("import-preview", "contacts");
    const template = getCsvImportTemplate("leads");
    const templateCapability = getCsvCapability("import-template", "leads");

    expect(previewCapability).toMatchObject({
      operation: "import-preview",
      entity: "contacts",
      route: previewDefinition.route,
      filename: null,
      inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      outputContentType: null,
      acceptsCsvInput: true,
      returnsCsv: false,
      limits: {
        exportRows: null,
        previewRows: {
          defaultLimit: CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
          maxLimit: CSV_IMPORT_PREVIEW_MAX_LIMIT
        }
      },
      preview: {
        rows: true,
        csvSnippet: false,
        issueSummary: true,
        diagnostics: false,
        readinessSummary: false,
        actionSummary: false
      },
      surface: {
        exportPreflightSummary: false,
        exportPreview: false,
        importPreview: true,
        importTemplate: false,
        importPreflightDiagnostics: false,
        importReadinessSummary: false,
        importActionSummary: false
      }
    });
    expect(previewCapability?.canonicalHeaders).toEqual(
      previewDefinition.fields.map((field) => field.label)
    );
    expect(previewCapability?.requiredImportFields).toEqual([
      "firstName",
      "lastName",
      "status"
    ]);
    expect(previewCapability?.requiredImportHeaders).toEqual([
      "First Name",
      "Last Name",
      "Status"
    ]);

    expect(templateCapability).toMatchObject({
      operation: "import-template",
      entity: "leads",
      route: template.route,
      filename: "leads-import-template.csv",
      inputContentType: null,
      outputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      acceptsCsvInput: false,
      returnsCsv: true,
      limits: {
        exportRows: null,
        previewRows: null
      },
      preview: {
        rows: false,
        csvSnippet: false,
        issueSummary: false,
        diagnostics: false,
        readinessSummary: false,
        actionSummary: false
      },
      surface: {
        exportPreflightSummary: false,
        exportPreview: false,
        importPreview: false,
        importTemplate: true,
        importPreflightDiagnostics: false,
        importReadinessSummary: false,
        importActionSummary: false
      }
    });
    expect(templateCapability?.canonicalHeaders).toEqual(template.headers);
    expect(templateCapability?.requiredImportFields).toEqual(["firstName", "lastName"]);
    expect(templateCapability?.requiredImportHeaders).toEqual(["First Name", "Last Name"]);
  });

  it("marks preflight diagnostics as database-read only with no write capability", () => {
    const preflightCapability = getCsvCapability("import-preflight", "leads");

    expect(preflightCapability).toMatchObject({
      operation: "import-preflight",
      entity: "leads",
      route: "/leads",
      filename: null,
      inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      outputContentType: null,
      acceptsCsvInput: true,
      returnsCsv: false,
      limits: {
        exportRows: null,
        previewRows: {
          defaultLimit: CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
          maxLimit: CSV_IMPORT_PREVIEW_MAX_LIMIT
        }
      },
      preview: {
        rows: true,
        csvSnippet: false,
        issueSummary: true,
        diagnostics: true,
        readinessSummary: true,
        actionSummary: true
      },
      surface: {
        exportPreflightSummary: false,
        exportPreview: false,
        importPreview: true,
        importTemplate: false,
        importPreflightDiagnostics: true,
        importReadinessSummary: true,
        importActionSummary: true
      },
      read: {
        metadata: true,
        database: true,
        csvInput: true
      },
      write: {
        database: false,
        files: false,
        externalServices: false,
        routingAssignments: false
      }
    });
    expect(preflightCapability?.requiredImportFields).toEqual(["firstName", "lastName"]);
    expect(getCsvCapability("import-preflight", "accounts")).toBeNull();
    expect(
      listCsvCapabilities().every(
        (capability) =>
          !capability.write.database &&
          !capability.write.files &&
          !capability.write.externalServices &&
          !capability.write.routingAssignments
      )
    ).toBe(true);
  });
});
