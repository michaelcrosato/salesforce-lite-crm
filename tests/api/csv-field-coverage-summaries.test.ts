import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import {
  CSV_COMPATIBILITY_REPORT_CONTENT_TYPE
} from "@/lib/server/csvCompatibilityReports";
import {
  CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE,
  getCsvFieldCoverageEntitySummary,
  getCsvFieldCoverageSummary,
  isCsvFieldCoverageEntity,
  listCsvFieldCoverageEntities,
  listCsvFieldCoverageEntitySummaries,
  listCsvFieldCoverageOperationAggregates,
  listCsvFieldCoverageOperationSummaries
} from "@/lib/server/csvFieldCoverageSummaries";

describe("server CSV field coverage summaries", () => {
  it("publishes deterministic entity and operation coverage indexes", () => {
    const summary = getCsvFieldCoverageSummary();

    expect(listCsvFieldCoverageEntities()).toEqual(CSV_EXPORT_ENTITIES);
    expect(summary).toMatchObject({
      contentType: CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE,
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(summary.entries.map((entry) => entry.entity)).toEqual(CSV_EXPORT_ENTITIES);
    expect(summary.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
  });

  it("summarizes bidirectional contact field coverage", () => {
    const summary = getCsvFieldCoverageEntitySummary("contacts");

    if (summary === null) {
      throw new Error("Expected contacts field coverage summary");
    }

    expect(summary).toMatchObject({
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      contentType: CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE,
      sourceContentType: CSV_COMPATIBILITY_REPORT_CONTENT_TYPE,
      counts: {
        exportOnly: 4,
        importOnly: 0,
        shared: 7,
        required: 3,
        optional: 4,
        unsupported: 0,
        warnings: 1
      },
      warningCodes: ["export-field-only"],
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(summary.fields.shared.map((field) => field.key)).toEqual([
      "firstName",
      "lastName",
      "email",
      "phone",
      "title",
      "status",
      "accountId"
    ]);
    expect(summary.fields.exportOnly.map((field) => field.key)).toEqual([
      "id",
      "accountName",
      "createdAt",
      "updatedAt"
    ]);
    expect(summary.fields.required.map((field) => field.key)).toEqual([
      "firstName",
      "lastName",
      "status"
    ]);
    expect(summary.fields.optional.map((field) => field.key)).toEqual([
      "email",
      "phone",
      "title",
      "accountId"
    ]);

    const importTemplate = summary.operations.find(
      (operation) => operation.operation === "import-template"
    );

    expect(importTemplate).toMatchObject({
      supported: true,
      fieldKeys: [
        "firstName",
        "lastName",
        "email",
        "phone",
        "title",
        "status",
        "accountId"
      ],
      counts: {
        exportOnly: 0,
        importOnly: 0,
        shared: 7,
        required: 3,
        optional: 4,
        unsupported: 0,
        warnings: 0
      },
      warningCodes: []
    });
  });

  it("keeps export-only account import operations explicitly unsupported", () => {
    const summary = getCsvFieldCoverageEntitySummary("accounts");

    if (summary === null) {
      throw new Error("Expected accounts field coverage summary");
    }

    expect(summary.counts).toEqual({
      exportOnly: 13,
      importOnly: 0,
      shared: 0,
      required: 0,
      optional: 0,
      unsupported: 3,
      warnings: 2
    });
    expect(summary.warningCodes).toEqual([
      "unsupported-import-direction",
      "export-field-only"
    ]);

    const operations = Object.fromEntries(
      summary.operations.map((operation) => [operation.operation, operation])
    );

    expect(operations.export).toMatchObject({
      supported: true,
      counts: {
        exportOnly: 13,
        importOnly: 0,
        shared: 0,
        required: 0,
        optional: 0,
        unsupported: 0,
        warnings: 1
      },
      warningCodes: ["export-field-only"]
    });
    expect(operations["import-preview"]).toMatchObject({
      supported: false,
      fieldKeys: [],
      counts: {
        exportOnly: 0,
        importOnly: 0,
        shared: 0,
        required: 0,
        optional: 0,
        unsupported: 1,
        warnings: 1
      },
      warningCodes: ["unsupported-import-direction"]
    });
    expect(operations["import-template"]?.write).toEqual(noWrites());
    expect(operations["import-preflight"]?.read).toEqual(metadataOnlyReads());
  });

  it("aggregates field coverage by operation without widening supported scope", () => {
    const aggregates = listCsvFieldCoverageOperationAggregates();
    const exportAggregate = aggregates.find(
      (aggregate) => aggregate.operation === "export"
    );
    const importTemplateAggregate = aggregates.find(
      (aggregate) => aggregate.operation === "import-template"
    );

    expect(exportAggregate).toMatchObject({
      operation: "export",
      entityCount: 10,
      supportedEntityCount: 10,
      unsupportedEntityCount: 0,
      counts: {
        exportOnly: 119,
        importOnly: 0,
        shared: 15,
        required: 0,
        optional: 0,
        unsupported: 0,
        warnings: 10
      },
      write: noWrites()
    });
    expect(importTemplateAggregate).toMatchObject({
      operation: "import-template",
      entityCount: 10,
      supportedEntityCount: 2,
      unsupportedEntityCount: 8,
      counts: {
        exportOnly: 0,
        importOnly: 0,
        shared: 15,
        required: 5,
        optional: 10,
        unsupported: 8,
        warnings: 8
      },
      read: metadataOnlyReads()
    });
    expect(
      listCsvFieldCoverageOperationSummaries("import-template")
        .filter((operation) => operation.supported)
        .map((operation) => operation.entity)
    ).toEqual(["contacts", "leads"]);
  });

  it("exposes safe null checks and no-write flags across every summary", () => {
    expect(isCsvFieldCoverageEntity("contacts")).toBe(true);
    expect(isCsvFieldCoverageEntity("salesforce-objects")).toBe(false);
    expect(getCsvFieldCoverageEntitySummary("salesforce-objects")).toBeNull();

    for (const summary of listCsvFieldCoverageEntitySummaries()) {
      expect(summary.write).toEqual(noWrites());

      for (const operation of summary.operations) {
        expect(operation.write).toEqual(noWrites());
      }
    }
  });
});

function metadataOnlyReads() {
  return {
    metadata: true,
    database: false,
    csvInput: false,
    csvOutput: false
  };
}

function noWrites() {
  return {
    database: false,
    files: false,
    externalServices: false,
    exportHistory: false,
    scheduledDelivery: false,
    backgroundJobs: false,
    routingAssignments: false,
    importApply: false,
    bulkMutations: false,
    headerRemapping: false,
    salesforceSync: false
  };
}
