import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE } from "@/lib/server/csvContractQaChecks";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import {
  CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE
} from "@/lib/server/csvFieldCoverageSummaries";
import {
  CSV_HANDOFF_INDEX_CONTENT_TYPE
} from "@/lib/server/csvHandoffIndex";
import { CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE } from "@/lib/server/csvOperatorReadinessScorecards";
import { CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE } from "@/lib/server/csvOperatorRemediationRunbooks";
import {
  CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE,
  getCsvContractDriftEntitySnapshot,
  getCsvContractDriftOperationSnapshot,
  getCsvContractDriftSnapshots,
  isCsvContractDriftSnapshotEntity,
  isCsvContractDriftSnapshotOperation,
  listCsvContractDriftEntitySnapshots,
  listCsvContractDriftOperationSnapshots,
  listCsvContractDriftSnapshotEntities
} from "@/lib/server/csvContractDriftSnapshots";

describe("server CSV contract drift snapshots", () => {
  it("publishes deterministic source fingerprints and rollups", () => {
    const snapshots = getCsvContractDriftSnapshots();
    const repeated = getCsvContractDriftSnapshots();

    expect(listCsvContractDriftSnapshotEntities()).toEqual(CSV_EXPORT_ENTITIES);
    expect(snapshots.fingerprint).toMatch(fingerprintPattern());
    expect(snapshots.fingerprint).toBe(repeated.fingerprint);
    expect(snapshots).toMatchObject({
      contentType: CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE,
      snapshotVersion: 1,
      status: "blocked",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      sourceCount: 5,
      source: {
        fieldCoverageContentType: CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE,
        handoffIndexContentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
        operatorReadinessContentType: CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
        contractQaContentType: CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
        operatorRemediationContentType: CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE
      },
      rollup: {
        entityCount: CSV_EXPORT_ENTITIES.length,
        operationCount: CSV_CAPABILITY_OPERATIONS.length,
        sourceCount: 5,
        issueCount: 48,
        remediationCount: 34,
        statusCounts: {
          stable: 0,
          watch: 2,
          blocked: 8
        },
        readinessStatusCounts: {
          ready: 0,
          "needs-review": 10,
          blocked: 0
        },
        qaStatusCounts: {
          pass: 2,
          warn: 8,
          fail: 0
        },
        remediationStatusCounts: {
          ready: 0,
          "needs-action": 2,
          blocked: 8
        }
      },
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(snapshots.entries.map((entry) => entry.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(snapshots.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
    expect(snapshots.sourceFingerprints.map((source) => source.source)).toEqual([
      "field-coverage-summary",
      "handoff-index",
      "operator-readiness-scorecards",
      "contract-qa-checks",
      "operator-remediation-runbooks"
    ]);

    for (const source of snapshots.sourceFingerprints) {
      expect(source.scope).toBe("all");
      expect(source.fingerprint).toMatch(fingerprintPattern());
      expect(source.payloadBytes).toBeGreaterThan(0);
    }
  });

  it("classifies contacts as a watched bidirectional contract", () => {
    const snapshot = getCsvContractDriftEntitySnapshot("contacts");

    if (snapshot === null) {
      throw new Error("Expected contacts CSV contract drift snapshot");
    }

    const exportSnapshot = snapshot.operations.find(
      (operation) => operation.operation === "export"
    );

    expect(snapshot).toMatchObject({
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "watch",
      issueCount: 0,
      remediationCount: 1,
      readinessStatus: "needs-review",
      qaStatus: "pass",
      remediationStatus: "needs-action",
      statusCounts: {
        stable: 3,
        watch: 1,
        blocked: 0
      },
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(snapshot.fingerprint).toMatch(fingerprintPattern());
    expect(snapshot.sourceFingerprints).toHaveLength(5);
    expect(exportSnapshot).toMatchObject({
      operation: "export",
      status: "watch",
      supported: true,
      readinessStatus: "needs-review",
      qaStatus: "pass",
      remediationStatus: "needs-action",
      issueCount: 0,
      remediationCount: 1,
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"]
    });
  });

  it("keeps unsupported account import drift blocked and no-write", () => {
    const snapshot = getCsvContractDriftEntitySnapshot("accounts");

    if (snapshot === null) {
      throw new Error("Expected accounts CSV contract drift snapshot");
    }

    const importTemplateSnapshot = snapshot.operations.find(
      (operation) => operation.operation === "import-template"
    );

    expect(snapshot).toMatchObject({
      entity: "accounts",
      status: "blocked",
      issueCount: 6,
      remediationCount: 4,
      readinessStatus: "needs-review",
      qaStatus: "warn",
      remediationStatus: "blocked",
      statusCounts: {
        stable: 0,
        watch: 1,
        blocked: 3
      },
      write: noWrites()
    });
    expect(importTemplateSnapshot).toMatchObject({
      status: "blocked",
      supported: false,
      issueCount: 2,
      remediationCount: 1,
      sourceCodes: [
        "unsupported-import-direction",
        "unsupported-operation",
        "missing-handoff-surface",
        "unsupported-operation-gap"
      ]
    });
  });

  it("aggregates operation snapshots with issue and readiness rollups", () => {
    const operationSnapshots = listCsvContractDriftOperationSnapshots();
    const importPreviewSnapshot =
      getCsvContractDriftOperationSnapshot("import-preview");

    expect(operationSnapshots.map((snapshot) => snapshot.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (importPreviewSnapshot === null) {
      throw new Error("Expected import-preview CSV contract drift snapshot");
    }

    expect(importPreviewSnapshot).toMatchObject({
      operation: "import-preview",
      status: "blocked",
      entityCount: CSV_EXPORT_ENTITIES.length,
      issueCount: 16,
      remediationCount: 8,
      statusCounts: {
        stable: 2,
        watch: 0,
        blocked: 8
      },
      readinessStatusCounts: {
        ready: 2,
        "needs-review": 0,
        blocked: 8
      },
      qaStatusCounts: {
        pass: 2,
        warn: 8,
        fail: 0
      },
      remediationStatusCounts: {
        ready: 2,
        "needs-action": 0,
        blocked: 8
      },
      issueCounts: {
        "inconsistent-headers": 0,
        "missing-handoff-surface": 8,
        "unsupported-operation-gap": 8,
        "read-flag-drift": 0,
        "no-write-flag-drift": 0
      },
      write: noWrites()
    });
    expect(importPreviewSnapshot.fingerprint).toMatch(fingerprintPattern());
    expect(importPreviewSnapshot.sourceFingerprints).toHaveLength(5);

    for (const snapshot of operationSnapshots) {
      expect(snapshot.write).toEqual(noWrites());
      expect(snapshot.sourceFingerprints.every((source) => source.payloadBytes > 0))
        .toBe(true);
    }
  });

  it("rejects unknown snapshot entities and operations", () => {
    expect(isCsvContractDriftSnapshotEntity("contacts")).toBe(true);
    expect(isCsvContractDriftSnapshotEntity("salesforce-sync")).toBe(false);
    expect(getCsvContractDriftEntitySnapshot("salesforce-sync")).toBeNull();
    expect(isCsvContractDriftSnapshotOperation("export")).toBe(true);
    expect(isCsvContractDriftSnapshotOperation("sync")).toBe(false);
    expect(getCsvContractDriftOperationSnapshot("sync")).toBeNull();
    expect(listCsvContractDriftEntitySnapshots()).toHaveLength(
      CSV_EXPORT_ENTITIES.length
    );
  });
});

function fingerprintPattern() {
  return /^[a-f0-9]{64}$/;
}

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
