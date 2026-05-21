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
  CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
  getCsvOperatorReadinessScorecard,
  getCsvOperatorReadinessScorecards,
  isCsvOperatorReadinessEntity,
  listCsvOperatorReadinessEntities,
  listCsvOperatorReadinessOperationScorecards,
  listCsvOperatorReadinessScorecards
} from "@/lib/server/csvOperatorReadinessScorecards";

describe("server CSV operator readiness scorecards", () => {
  it("publishes deterministic entity and operation scorecard indexes", () => {
    const scorecards = getCsvOperatorReadinessScorecards();

    expect(listCsvOperatorReadinessEntities()).toEqual(CSV_EXPORT_ENTITIES);
    expect(scorecards).toMatchObject({
      contentType: CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      source: {
        handoffIndexContentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
        fieldCoverageContentType: CSV_FIELD_COVERAGE_SUMMARY_CONTENT_TYPE
      },
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(scorecards.entries.map((entry) => entry.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(scorecards.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
    expect(scorecards.statusCounts).toEqual({
      ready: 0,
      "needs-review": 10,
      blocked: 0
    });
  });

  it("classifies bidirectional contact operations from handoff and coverage data", () => {
    const scorecard = getCsvOperatorReadinessScorecard("contacts");

    if (scorecard === null) {
      throw new Error("Expected contacts operator readiness scorecard");
    }

    expect(scorecard).toMatchObject({
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "needs-review",
      statusCounts: {
        ready: 3,
        "needs-review": 1,
        blocked: 0
      },
      warningCodes: ["export-field-only"],
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: true
      },
      write: noWrites()
    });

    const operations = Object.fromEntries(
      scorecard.operations.map((operation) => [operation.operation, operation])
    );

    expect(operations.export).toMatchObject({
      status: "needs-review",
      supported: true,
      expectedSurfaceKinds: [
        "export-capability",
        "export-delivery-packet",
        "export-delivery-manifest"
      ],
      missingSurfaceKinds: [],
      warningCodes: ["export-field-only"],
      counts: {
        exportOnly: 4,
        shared: 7,
        unsupported: 0,
        warnings: 1
      }
    });
    expect(operations["import-template"]).toMatchObject({
      status: "ready",
      supported: true,
      expectedSurfaceKinds: [
        "import-template-capability",
        "import-template",
        "import-template-example"
      ],
      presentSurfaceKinds: [
        "import-template-capability",
        "import-template",
        "import-template-example"
      ],
      missingSurfaceKinds: [],
      warningCodes: []
    });
    expect(operations["import-preflight"]).toMatchObject({
      status: "ready",
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: false
      }
    });
  });

  it("blocks unsupported import operations without widening export-only scope", () => {
    const scorecard = getCsvOperatorReadinessScorecard("accounts");

    if (scorecard === null) {
      throw new Error("Expected accounts operator readiness scorecard");
    }

    expect(scorecard.statusCounts).toEqual({
      ready: 0,
      "needs-review": 1,
      blocked: 3
    });

    const importOperations = scorecard.operations.filter(
      (operation) => operation.operation !== "export"
    );

    expect(importOperations.map((operation) => operation.status)).toEqual([
      "blocked",
      "blocked",
      "blocked"
    ]);
    expect(importOperations[0]).toMatchObject({
      operation: "import-preview",
      supported: false,
      missingSurfaceKinds: ["import-preview-capability"],
      warningCodes: [
        "unsupported-import-direction",
        "unsupported-operation",
        "missing-handoff-surface"
      ],
      counts: {
        unsupported: 1,
        warnings: 1
      }
    });
    expect(isCsvOperatorReadinessEntity("accounts")).toBe(true);
    expect(isCsvOperatorReadinessEntity("salesforce-objects")).toBe(false);
    expect(getCsvOperatorReadinessScorecard("salesforce-objects")).toBeNull();
  });

  it("aggregates operation status counts and keeps every scorecard no-write", () => {
    const importTemplateScorecards = listCsvOperatorReadinessOperationScorecards(
      "import-template"
    );
    const summary = getCsvOperatorReadinessScorecards();
    const importTemplateAggregate = summary.operations.find(
      (operation) => operation.operation === "import-template"
    );

    expect(
      importTemplateScorecards
        .filter((scorecard) => scorecard.status === "ready")
        .map((scorecard) => scorecard.entity)
    ).toEqual(["contacts", "leads"]);
    expect(importTemplateAggregate).toMatchObject({
      operation: "import-template",
      entityCount: 10,
      readyEntityCount: 2,
      needsReviewEntityCount: 0,
      blockedEntityCount: 8,
      statusCounts: {
        ready: 2,
        "needs-review": 0,
        blocked: 8
      },
      warningCodes: [
        "unsupported-import-direction",
        "unsupported-operation",
        "missing-handoff-surface"
      ],
      read: {
        metadata: true,
        database: false,
        csvInput: false,
        csvOutput: true
      },
      write: noWrites()
    });

    for (const scorecard of listCsvOperatorReadinessScorecards()) {
      expect(scorecard.write).toEqual(noWrites());

      for (const operation of scorecard.operations) {
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
