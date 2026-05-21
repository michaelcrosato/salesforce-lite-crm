import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import {
  CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE
} from "@/lib/server/csvFieldCoverageSummaries";
import {
  CSV_HANDOFF_INDEX_CONTENT_TYPE
} from "@/lib/server/csvHandoffIndex";
import {
  CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE
} from "@/lib/server/csvOperatorReadinessScorecards";
import {
  CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
  getCsvContractQaChecks,
  getCsvContractQaEntityCheck,
  isCsvContractQaEntity,
  listCsvContractQaEntities,
  listCsvContractQaEntityChecks,
  listCsvContractQaOperationChecks
} from "@/lib/server/csvContractQaChecks";

describe("server CSV contract QA checks", () => {
  it("publishes deterministic QA indexes over the current CSV contracts", () => {
    const checks = getCsvContractQaChecks();

    expect(listCsvContractQaEntities()).toEqual(CSV_EXPORT_ENTITIES);
    expect(checks).toMatchObject({
      contentType: CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      checkCount: CSV_EXPORT_ENTITIES.length * CSV_CAPABILITY_OPERATIONS.length,
      issueCount: 48,
      status: "warn",
      statusCounts: {
        pass: 2,
        warn: 8,
        fail: 0
      },
      issueCounts: {
        "inconsistent-headers": 0,
        "missing-handoff-surface": 24,
        "unsupported-operation-gap": 24,
        "read-flag-drift": 0,
        "no-write-flag-drift": 0
      },
      source: {
        operatorReadinessContentType: CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
        handoffIndexContentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
        fieldCoverageContentType: CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE
      },
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(checks.entries.map((entry) => entry.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(checks.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
  });

  it("passes bidirectional contact checks without header or flag drift", () => {
    const check = getCsvContractQaEntityCheck("contacts");

    if (check === null) {
      throw new Error("Expected contacts CSV contract QA check");
    }

    expect(check).toMatchObject({
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "pass",
      issueCount: 0,
      statusCounts: {
        pass: 4,
        warn: 0,
        fail: 0
      },
      issueCounts: {
        "inconsistent-headers": 0,
        "missing-handoff-surface": 0,
        "unsupported-operation-gap": 0,
        "read-flag-drift": 0,
        "no-write-flag-drift": 0
      },
      write: noWrites()
    });

    const exportCheck = check.operations.find(
      (operation) => operation.operation === "export"
    );
    const importPreflightCheck = check.operations.find(
      (operation) => operation.operation === "import-preflight"
    );

    expect(exportCheck).toMatchObject({
      status: "pass",
      supported: true,
      checkedHeaderSurfaceKinds: [
        "export-capability",
        "export-delivery-packet"
      ],
      read: {
        metadata: true,
        database: true,
        csvInput: false,
        csvOutput: true
      },
      issues: []
    });
    expect(importPreflightCheck).toMatchObject({
      status: "pass",
      checkedHeaderSurfaceKinds: [
        "import-preflight-capability",
        "import-dry-run-receipt"
      ],
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: false
      },
      issues: []
    });
  });

  it("warns on unsupported export-only import operation gaps", () => {
    const check = getCsvContractQaEntityCheck("accounts");

    if (check === null) {
      throw new Error("Expected accounts CSV contract QA check");
    }

    expect(check.status).toBe("warn");
    expect(check.statusCounts).toEqual({
      pass: 1,
      warn: 3,
      fail: 0
    });
    expect(check.issueCounts).toEqual({
      "inconsistent-headers": 0,
      "missing-handoff-surface": 3,
      "unsupported-operation-gap": 3,
      "read-flag-drift": 0,
      "no-write-flag-drift": 0
    });

    const importTemplateCheck = check.operations.find(
      (operation) => operation.operation === "import-template"
    );

    expect(importTemplateCheck).toMatchObject({
      status: "warn",
      supported: false,
      issueCount: 2,
      missingSurfaceKinds: [
        "import-template-capability",
        "import-template",
        "import-template-example"
      ],
      issues: [
        {
          code: "missing-handoff-surface",
          severity: "warning",
          missingSurfaceKinds: [
            "import-template-capability",
            "import-template",
            "import-template-example"
          ]
        },
        {
          code: "unsupported-operation-gap",
          severity: "warning",
          missingSurfaceKinds: [
            "import-template-capability",
            "import-template",
            "import-template-example"
          ]
        }
      ],
      write: noWrites()
    });
    expect(isCsvContractQaEntity("accounts")).toBe(true);
    expect(isCsvContractQaEntity("salesforce-sync")).toBe(false);
    expect(getCsvContractQaEntityCheck("salesforce-sync")).toBeNull();
  });

  it("aggregates operation checks and keeps every QA contract no-write", () => {
    const importPreviewChecks = listCsvContractQaOperationChecks("import-preview");
    const summary = getCsvContractQaChecks();
    const importPreviewAggregate = summary.operations.find(
      (operation) => operation.operation === "import-preview"
    );

    expect(importPreviewChecks.map((check) => check.status)).toEqual([
      "warn",
      "pass",
      "warn",
      "pass",
      "warn",
      "warn",
      "warn",
      "warn",
      "warn",
      "warn"
    ]);
    expect(importPreviewAggregate).toMatchObject({
      operation: "import-preview",
      entityCount: 10,
      passEntityCount: 2,
      warnEntityCount: 8,
      failEntityCount: 0,
      issueCount: 16,
      issueCounts: {
        "inconsistent-headers": 0,
        "missing-handoff-surface": 8,
        "unsupported-operation-gap": 8,
        "read-flag-drift": 0,
        "no-write-flag-drift": 0
      },
      read: {
        metadata: true,
        database: false,
        csvInput: true,
        csvOutput: false
      },
      write: noWrites()
    });

    for (const entityCheck of listCsvContractQaEntityChecks()) {
      expect(entityCheck.write).toEqual(noWrites());

      for (const operationCheck of entityCheck.operations) {
        expect(operationCheck.write).toEqual(noWrites());
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
