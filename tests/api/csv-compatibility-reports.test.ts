import { describe, expect, it } from "vitest";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_IMPORT_TEMPLATE_CONTENT_TYPE } from "@/lib/server/csvImportTemplates";
import { CSV_TRANSFER_MANIFEST_CONTENT_TYPE } from "@/lib/server/csvTransferManifests";
import {
  CSV_COMPATIBILITY_REPORT_CONTENT_TYPE,
  getCsvCompatibilityReport,
  isCsvCompatibilityReportEntity,
  listCsvBidirectionalCompatibilityReports,
  listCsvCompatibilityReportEntities,
  listCsvCompatibilityReports
} from "@/lib/server/csvCompatibilityReports";

describe("server CSV compatibility reports", () => {
  it("publishes deterministic reports for export entities and bidirectional subsets", () => {
    const reports = listCsvCompatibilityReports();

    expect(listCsvCompatibilityReportEntities()).toEqual(CSV_EXPORT_ENTITIES);
    expect(reports.map((report) => report.entity)).toEqual(CSV_EXPORT_ENTITIES);
    expect(
      listCsvBidirectionalCompatibilityReports().map((report) => report.entity)
    ).toEqual(["contacts", "leads"]);
    expect(
      reports
        .filter((report) => report.direction === "export-only")
        .map((report) => report.entity)
    ).toEqual([
      "accounts",
      "opportunities",
      "activities",
      "dealer-orders",
      "areas",
      "tasks",
      "cases",
      "campaigns"
    ]);
  });

  it("compares contact export columns with import template and example metadata", () => {
    const report = getCsvCompatibilityReport("contacts");

    expect(report).toMatchObject({
      entity: "contacts",
      label: "Contacts",
      direction: "bidirectional",
      contentType: CSV_COMPATIBILITY_REPORT_CONTENT_TYPE,
      export: {
        supported: true,
        filename: "contacts.csv",
        route: "/contacts",
        previewRows: true,
        previewCsvSnippet: true
      },
      import: {
        supported: true,
        inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
        route: "/contacts",
        previewRows: true,
        issueSummary: true,
        preflightDiagnostics: true,
        readinessSummary: true,
        actionSummary: true,
        template: {
          supported: true,
          filename: "contacts-import-template.csv",
          contentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
          headers: [
            "First Name",
            "Last Name",
            "Email",
            "Phone",
            "Title",
            "Status",
            "Account ID"
          ],
          requiredFieldKeys: ["firstName", "lastName", "status"],
          requiredHeaders: ["First Name", "Last Name", "Status"],
          example: {
            filename: "contacts-import-example.csv",
            templateFilename: "contacts-import-template.csv",
            rowCount: 1,
            fieldKeys: [
              "firstName",
              "lastName",
              "email",
              "phone",
              "title",
              "status",
              "accountId"
            ],
            values: {
              firstName: "Maya",
              lastName: "Singh",
              status: "active"
            }
          }
        }
      },
      transferManifests: {
        exportDelivery: {
          supportedDirection: true,
          covered: true,
          manifestFilename: "contacts-export-delivery-manifest.json",
          contentType: CSV_TRANSFER_MANIFEST_CONTENT_TYPE
        },
        importDryRun: {
          supportedDirection: true,
          covered: true,
          manifestFilename: "contacts-import-dry-run-manifest.json",
          contentType: CSV_TRANSFER_MANIFEST_CONTENT_TYPE
        }
      }
    });
    expect(report?.fields.matchingFieldKeys).toEqual([
      "firstName",
      "lastName",
      "email",
      "phone",
      "title",
      "status",
      "accountId"
    ]);
    expect(report?.fields.exportOnlyFields.map((field) => field.key)).toEqual([
      "id",
      "accountName",
      "createdAt",
      "updatedAt"
    ]);
    expect(report?.fields.importOnlyFields).toEqual([]);
    expect(report?.warnings.map((warning) => warning.code)).toEqual([
      "export-field-only"
    ]);
    expect(report?.warnings[0]?.fieldKeys).toEqual([
      "id",
      "accountName",
      "createdAt",
      "updatedAt"
    ]);
  });

  it("flags one-way export fields on lead compatibility reports", () => {
    const report = getCsvCompatibilityReport("leads");

    expect(report?.direction).toBe("bidirectional");
    expect(report?.fields.matchingFieldKeys).toEqual([
      "firstName",
      "lastName",
      "phone",
      "email",
      "postalCode",
      "province",
      "source",
      "status"
    ]);
    expect(report?.fields.exportOnlyFields.map((field) => field.key)).toEqual([
      "id",
      "areaId",
      "areaName",
      "assignedOrderId",
      "assignedOrderName",
      "assignmentReason",
      "createdAt",
      "updatedAt"
    ]);
    expect(report?.import.template.requiredFieldKeys).toEqual([
      "firstName",
      "lastName"
    ]);
    expect(report?.import.template.example?.values).toMatchObject({
      firstName: "Riley",
      lastName: "Park",
      postalCode: "V5K 0A1",
      status: "new"
    });
    expect(report?.warnings).toHaveLength(1);
    expect(report?.warnings[0]).toMatchObject({
      code: "export-field-only",
      severity: "info"
    });
  });

  it("marks export-only entities with unsupported import direction warnings", () => {
    const report = getCsvCompatibilityReport("accounts");

    expect(report).toMatchObject({
      entity: "accounts",
      direction: "export-only",
      export: {
        supported: true,
        filename: "accounts.csv",
        route: "/accounts",
        previewRows: true,
        previewCsvSnippet: true
      },
      import: {
        supported: false,
        inputContentType: null,
        route: null,
        previewRows: false,
        issueSummary: false,
        preflightDiagnostics: false,
        readinessSummary: false,
        actionSummary: false,
        template: {
          supported: false,
          filename: null,
          headers: [],
          requiredFieldKeys: [],
          requiredHeaders: [],
          example: null
        }
      },
      transferManifests: {
        exportDelivery: {
          supportedDirection: true,
          covered: true,
          manifestFilename: "accounts-export-delivery-manifest.json"
        },
        importDryRun: {
          supportedDirection: false,
          covered: false,
          manifestFilename: null,
          contentType: null
        }
      }
    });
    expect(report?.warnings.map((warning) => warning.code)).toEqual([
      "unsupported-import-direction",
      "export-field-only"
    ]);
  });

  it("exposes explicit read-only and no-write safety flags", () => {
    const reports = listCsvCompatibilityReports();

    expect(
      reports.every(
        (report) =>
          report.read.metadata === true &&
          report.read.database === false &&
          report.read.csvInput === false &&
          report.read.csvOutput === false &&
          report.write.database === false &&
          report.write.files === false &&
          report.write.externalServices === false &&
          report.write.exportHistory === false &&
          report.write.scheduledDelivery === false &&
          report.write.backgroundJobs === false &&
          report.write.routingAssignments === false &&
          report.write.importApply === false &&
          report.write.bulkMutations === false &&
          report.write.headerRemapping === false &&
          report.write.salesforceSync === false
      )
    ).toBe(true);
  });

  it("detects compatibility report entities without widening supported scope", () => {
    expect(isCsvCompatibilityReportEntity("contacts")).toBe(true);
    expect(isCsvCompatibilityReportEntity("dealer-orders")).toBe(true);
    expect(isCsvCompatibilityReportEntity("salesforce-objects")).toBe(false);
    expect(getCsvCompatibilityReport("salesforce-objects")).toBeNull();
  });
});
