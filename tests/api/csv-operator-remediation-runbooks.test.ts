import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE } from "@/lib/server/csvContractQaChecks";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE } from "@/lib/server/csvOperatorReadinessScorecards";
import {
  CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
  getCsvOperatorRemediationRunbook,
  getCsvOperatorRemediationRunbooks,
  isCsvOperatorRemediationEntity,
  listCsvOperatorRemediationEntities,
  listCsvOperatorRemediationOperationRunbooks,
  listCsvOperatorRemediationRunbooks
} from "@/lib/server/csvOperatorRemediationRunbooks";

describe("server CSV operator remediation runbooks", () => {
  it("publishes deterministic runbook indexes from readiness and QA sources", () => {
    const runbooks = getCsvOperatorRemediationRunbooks();

    expect(listCsvOperatorRemediationEntities()).toEqual(CSV_EXPORT_ENTITIES);
    expect(runbooks).toMatchObject({
      contentType: CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      remediationCount: 34,
      statusCounts: {
        ready: 0,
        "needs-action": 2,
        blocked: 8
      },
      severityCounts: {
        info: 0,
        warning: 10,
        error: 0
      },
      source: {
        operatorReadinessContentType: CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
        contractQaContentType: CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE
      },
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(runbooks.entries.map((entry) => entry.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(runbooks.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
  });

  it("turns contact export field coverage warnings into operator actions", () => {
    const runbook = getCsvOperatorRemediationRunbook("contacts");

    if (runbook === null) {
      throw new Error("Expected contacts CSV operator remediation runbook");
    }

    const exportRunbook = runbook.operations.find(
      (operation) => operation.operation === "export"
    );
    const importPreviewRunbook = runbook.operations.find(
      (operation) => operation.operation === "import-preview"
    );

    expect(runbook).toMatchObject({
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      status: "needs-action",
      severity: "warning",
      remediationCount: 1,
      statusCounts: {
        ready: 3,
        "needs-action": 1,
        blocked: 0
      },
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(exportRunbook).toMatchObject({
      status: "needs-action",
      severity: "warning",
      supported: true,
      readinessStatus: "needs-review",
      qaStatus: "pass",
      remediationCount: 1,
      sourceCodes: ["export-field-only"],
      nextAction: {
        code: "review-directional-field-coverage",
        safeForCurrentSprint: true,
        requiresContractChange: false
      }
    });
    expect(exportRunbook?.remediations[0]).toMatchObject({
      code: "review-directional-field-coverage",
      severity: "warning",
      sourceCodes: ["export-field-only"],
      evidence: {
        warningCodes: ["export-field-only"],
        issueCodes: [],
        missingSurfaceKinds: []
      }
    });
    expect(importPreviewRunbook).toMatchObject({
      status: "ready",
      severity: "info",
      remediationCount: 0,
      nextAction: {
        code: "no-action-needed",
        safeForCurrentSprint: true,
        requiresContractChange: false
      }
    });
  });

  it("keeps unsupported export-only import operations out of current scope", () => {
    const runbook = getCsvOperatorRemediationRunbook("accounts");

    if (runbook === null) {
      throw new Error("Expected accounts CSV operator remediation runbook");
    }

    const importPreviewRunbook = runbook.operations.find(
      (operation) => operation.operation === "import-preview"
    );

    expect(runbook.status).toBe("blocked");
    expect(importPreviewRunbook).toMatchObject({
      operation: "import-preview",
      status: "blocked",
      severity: "warning",
      supported: false,
      readinessStatus: "blocked",
      qaStatus: "warn",
      sourceCodes: [
        "unsupported-import-direction",
        "unsupported-operation",
        "missing-handoff-surface",
        "unsupported-operation-gap"
      ],
      missingSurfaceKinds: ["import-preview-capability"],
      remediationCount: 1,
      nextAction: {
        code: "keep-unsupported-operation-excluded",
        safeForCurrentSprint: false,
        requiresContractChange: true
      },
      write: noWrites()
    });
    expect(importPreviewRunbook?.remediations[0]).toMatchObject({
      code: "keep-unsupported-operation-excluded",
      evidence: {
        warningCodes: [
          "unsupported-import-direction",
          "unsupported-operation",
          "missing-handoff-surface"
        ],
        issueCodes: ["missing-handoff-surface", "unsupported-operation-gap"],
        missingSurfaceKinds: ["import-preview-capability"]
      }
    });
  });

  it("aggregates operation runbooks and keeps every entry no-write", () => {
    const importTemplateRunbooks =
      listCsvOperatorRemediationOperationRunbooks("import-template");
    const summary = getCsvOperatorRemediationRunbooks();
    const importTemplateAggregate = summary.operations.find(
      (operation) => operation.operation === "import-template"
    );

    expect(
      importTemplateRunbooks
        .filter((runbook) => runbook.status === "ready")
        .map((runbook) => runbook.entity)
    ).toEqual(["contacts", "leads"]);
    expect(importTemplateAggregate).toMatchObject({
      operation: "import-template",
      entityCount: 10,
      readyEntityCount: 2,
      needsActionEntityCount: 0,
      blockedEntityCount: 8,
      remediationCount: 8,
      statusCounts: {
        ready: 2,
        "needs-action": 0,
        blocked: 8
      },
      severityCounts: {
        info: 2,
        warning: 8,
        error: 0
      },
      sourceCodes: [
        "unsupported-import-direction",
        "unsupported-operation",
        "missing-handoff-surface",
        "unsupported-operation-gap"
      ],
      write: noWrites()
    });

    for (const entityRunbook of listCsvOperatorRemediationRunbooks()) {
      expect(entityRunbook.write).toEqual(noWrites());

      for (const operationRunbook of entityRunbook.operations) {
        expect(operationRunbook.write).toEqual(noWrites());

        for (const remediation of operationRunbook.remediations) {
          expect(remediation.nextAction).toHaveProperty("safeForCurrentSprint");
          expect(remediation.nextAction).toHaveProperty("requiresContractChange");
        }
      }
    }
  });

  it("rejects unknown remediation entities", () => {
    expect(isCsvOperatorRemediationEntity("contacts")).toBe(true);
    expect(isCsvOperatorRemediationEntity("salesforce-sync")).toBe(false);
    expect(getCsvOperatorRemediationRunbook("salesforce-sync")).toBeNull();
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
