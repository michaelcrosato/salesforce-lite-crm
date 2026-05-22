import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE } from "@/lib/server/csvHandoffReleaseNotesPackets";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import { CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE } from "@/lib/server/csvOperatorAcceptanceChecklists";
import { CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE } from "@/lib/server/csvOperatorFixtureBundles";
import {
  CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
  getCsvReleaseClosureEntityScorecard,
  getCsvReleaseClosureOperationScorecard,
  getCsvReleaseClosureScorecard,
  isCsvReleaseClosureEntity,
  isCsvReleaseClosureOperation,
  listCsvReleaseClosureEntityScorecards,
  listCsvReleaseClosureOperationScorecards
} from "@/lib/server/csvReleaseClosureScorecards";
import { prisma } from "@/lib/prisma";

const fixtureOptions = {
  exportLimit: 1,
  importPreviewLimit: 2,
  importSampleLimit: 1
};

describe("server CSV release closure scorecards", () => {
  it("publishes deterministic root closure metadata from release notes and acceptance checklists", async () => {
    const scorecard = await getCsvReleaseClosureScorecard(fixtureOptions);
    const repeated = await getCsvReleaseClosureScorecard(fixtureOptions);

    expect(scorecard).toEqual(repeated);
    expect(scorecard.fingerprint).toMatch(fingerprintPattern());
    expect(scorecard).toMatchObject({
      contentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
      scorecardVersion: 1,
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      closureItemCount: 40,
      supportedItemCount: 16,
      unsupportedItemCount: 24,
      fixtureItemCount: 16,
      statusCounts: {
        ready: 6,
        watch: 10,
        block: 24
      },
      entityStatusCounts: {
        ready: 0,
        watch: 2,
        block: 8
      },
      operationStatusCounts: {
        ready: 0,
        watch: 1,
        block: 3
      },
      checkStatusCounts: {
        ready: 68,
        watch: 20,
        block: 72
      },
      fixtureCoverage: {
        fixtureItemCount: 16,
        exportFixtureCount: CSV_EXPORT_ENTITIES.length,
        importFixtureCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
        missingFixtureItemCount: 24
      },
      releaseNoteAnchor: {
        title: "CSV handoff closure release digest",
        readyForReleaseNotes: true,
        safeForCurrentSprint: true,
        requiresContractChange: false
      },
      source: {
        handoffReleaseNotesContentType:
          CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
        handoffReleaseNotesPacketVersion: 1,
        acceptanceChecklistContentType:
          CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
        acceptanceChecklistVersion: 1,
        operatorFixtureContentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
        operatorFixtureBundleVersion: 1
      },
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: true
      },
      write: noWrites()
    });
    expect(scorecard.releaseNoteAnchor.sourceFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(scorecard.releaseNoteAnchor.warningCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface"
    ]);
    expect(scorecard.releaseNoteAnchor.sourceCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface",
      "unsupported-operation-gap"
    ]);
    expect(scorecard.source.handoffReleaseNotesFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(scorecard.source.acceptanceChecklistFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(scorecard.source.operatorFixtureFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(scorecard.source.contractDriftFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(scorecard.sourceFingerprints.map((source) => source.source)).toEqual([
      "handoff-release-notes",
      "operator-acceptance-checklist",
      "operator-fixture-bundle"
    ]);
    expect(scorecard.sourceContentTypes).toEqual(
      expect.arrayContaining([
        CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
        CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
        CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
        CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE
      ])
    );
    expect(scorecard.entities.map((entity) => entity.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(scorecard.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
  });

  it("publishes entity scorecards with release anchors and fixture coverage", async () => {
    const entities = await listCsvReleaseClosureEntityScorecards(fixtureOptions);
    const contacts = await getCsvReleaseClosureEntityScorecard(
      "contacts",
      fixtureOptions
    );
    const accounts = await getCsvReleaseClosureEntityScorecard(
      "accounts",
      fixtureOptions
    );

    expect(entities.map((entity) => entity.entity)).toEqual(CSV_EXPORT_ENTITIES);

    if (contacts === null || accounts === null) {
      throw new Error("Expected CSV release closure entity scorecards");
    }

    expect(contacts).toMatchObject({
      contentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
      scorecardVersion: 1,
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "watch",
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      supportedOperationCount: 4,
      unsupportedOperationCount: 0,
      fixtureOperationCount: 4,
      closureItemCount: 4,
      statusCounts: {
        ready: 3,
        watch: 1,
        block: 0
      },
      checkStatusCounts: {
        ready: 14,
        watch: 2,
        block: 0
      },
      fixtureCoverage: {
        available: true,
        coveredCount: 4,
        expectedCount: 4,
        missingCount: 0
      },
      releaseNoteAnchor: {
        title: "CSV handoff closure release digest",
        warningCodes: ["export-field-only"],
        sourceCodes: ["export-field-only"]
      },
      write: noWrites()
    });
    expect(contacts.fingerprint).toMatch(fingerprintPattern());

    const contactExport = contacts.items.find(
      (item) => item.operation === "export"
    );
    const contactImportPreview = contacts.items.find(
      (item) => item.operation === "import-preview"
    );

    expect(contactExport).toMatchObject({
      id: "contacts:export",
      status: "watch",
      releaseStatus: "watch",
      acceptanceStatus: "watch",
      supported: true,
      fixture: {
        available: true,
        kind: "export-delivery-packet"
      },
      fixtureCoverage: {
        available: true,
        coveredCount: 1,
        expectedCount: 1,
        missingCount: 0
      },
      checkStatusCounts: {
        ready: 2,
        watch: 2,
        block: 0
      },
      acceptanceCriteriaCounts: {
        pass: 4,
        watch: 3,
        block: 0
      },
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(contactExport?.checks.map((check) => check.code)).toEqual([
      "release-note-status",
      "acceptance-checklist-status",
      "fixture-coverage",
      "no-write-safety"
    ]);
    expect(contactImportPreview).toMatchObject({
      status: "ready",
      releaseStatus: "stable",
      acceptanceStatus: "pass",
      fixture: {
        available: true,
        kind: "import-dry-run-receipt"
      },
      checkStatusCounts: {
        ready: 4,
        watch: 0,
        block: 0
      }
    });

    expect(accounts).toMatchObject({
      entity: "accounts",
      status: "block",
      supportedOperationCount: 1,
      unsupportedOperationCount: 3,
      fixtureOperationCount: 1,
      statusCounts: {
        ready: 0,
        watch: 1,
        block: 3
      },
      checkStatusCounts: {
        ready: 5,
        watch: 2,
        block: 9
      },
      fixtureCoverage: {
        available: false,
        coveredCount: 1,
        expectedCount: 4,
        missingCount: 3
      },
      write: noWrites()
    });
    expect(
      accounts.items.find((item) => item.operation === "import-template")
    ).toMatchObject({
      status: "block",
      supported: false,
      fixture: unavailableFixture(),
      fixtureCoverage: {
        available: false,
        coveredCount: 0,
        expectedCount: 1,
        missingCount: 1
      },
      checkStatusCounts: {
        ready: 1,
        watch: 0,
        block: 3
      }
    });
  });

  it("publishes operation scorecards with ready/watch/block closure counts", async () => {
    const operations = await listCsvReleaseClosureOperationScorecards(
      fixtureOptions
    );
    const exportScorecard = await getCsvReleaseClosureOperationScorecard(
      "export",
      fixtureOptions
    );
    const preflightScorecard = await getCsvReleaseClosureOperationScorecard(
      "import-preflight",
      fixtureOptions
    );

    expect(operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (exportScorecard === null || preflightScorecard === null) {
      throw new Error("Expected CSV release closure operation scorecards");
    }

    expect(exportScorecard).toMatchObject({
      contentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
      scorecardVersion: 1,
      operation: "export",
      status: "watch",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_EXPORT_ENTITIES.length,
      unsupportedEntityCount: 0,
      fixtureEntityCount: CSV_EXPORT_ENTITIES.length,
      closureItemCount: CSV_EXPORT_ENTITIES.length,
      statusCounts: {
        ready: 0,
        watch: 10,
        block: 0
      },
      checkStatusCounts: {
        ready: 20,
        watch: 20,
        block: 0
      },
      fixtureCoverage: {
        available: true,
        coveredCount: CSV_EXPORT_ENTITIES.length,
        expectedCount: CSV_EXPORT_ENTITIES.length,
        missingCount: 0
      },
      releaseNoteAnchor: {
        warningCodes: ["export-field-only"],
        sourceCodes: ["export-field-only"]
      },
      write: noWrites()
    });
    expect(exportScorecard.fingerprint).toMatch(fingerprintPattern());
    expect(
      exportScorecard.items.every(
        (item) =>
          item.status === "watch" &&
          item.fixture.available &&
          item.fixture.kind === "export-delivery-packet"
      )
    ).toBe(true);

    expect(preflightScorecard).toMatchObject({
      operation: "import-preflight",
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      unsupportedEntityCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      fixtureEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      statusCounts: {
        ready: 2,
        watch: 0,
        block: 8
      },
      checkStatusCounts: {
        ready: 16,
        watch: 0,
        block: 24
      },
      fixtureCoverage: {
        available: false,
        coveredCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
        expectedCount: CSV_EXPORT_ENTITIES.length,
        missingCount:
          CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length
      },
      write: noWrites()
    });
    expect(
      preflightScorecard.items
        .filter((item) => item.status === "ready")
        .map((item) => item.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(
      preflightScorecard.items
        .filter((item) => item.status === "block")
        .every(
          (item) =>
            !item.supported &&
            !item.fixture.available &&
            item.checkStatusCounts.block === 3
        )
    ).toBe(true);
  });

  it("keeps scorecard construction no-write and rejects unknown keys", async () => {
    const before = await countClosureWriteState();
    const scorecard = await getCsvReleaseClosureScorecard(fixtureOptions);
    const after = await countClosureWriteState();

    expect(after).toEqual(before);
    expect(scorecard.write).toEqual(noWrites());

    for (const entity of scorecard.entities) {
      expect(entity.write).toEqual(noWrites());

      for (const item of entity.items) {
        expect(item.write).toEqual(noWrites());
      }
    }

    for (const operation of scorecard.operations) {
      expect(operation.write).toEqual(noWrites());

      for (const item of operation.items) {
        expect(item.write).toEqual(noWrites());
      }
    }

    expect(isCsvReleaseClosureEntity("contacts")).toBe(true);
    expect(isCsvReleaseClosureEntity("salesforce-sync")).toBe(false);
    expect(
      await getCsvReleaseClosureEntityScorecard("salesforce-sync")
    ).toBeNull();
    expect(isCsvReleaseClosureOperation("export")).toBe(true);
    expect(isCsvReleaseClosureOperation("sync")).toBe(false);
    expect(await getCsvReleaseClosureOperationScorecard("sync")).toBeNull();
  });
});

function fingerprintPattern() {
  return /^[a-f0-9]{64}$/;
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

function unavailableFixture() {
  return {
    available: false,
    kind: null,
    reason: "unsupported-operation"
  };
}

async function countClosureWriteState() {
  const [contacts, leads, activities] = await Promise.all([
    prisma.contact.count(),
    prisma.lead.count(),
    prisma.activity.count()
  ]);

  return {
    contacts,
    leads,
    activities
  };
}
