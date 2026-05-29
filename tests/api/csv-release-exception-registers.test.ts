import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import { CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE } from "@/lib/server/csvOperatorAcceptanceChecklists";
import { CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE } from "@/lib/server/csvOperatorFixtureBundles";
import { CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE } from "@/lib/server/csvOperatorWalkthroughManifests";
import {
  CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE
} from "@/lib/server/csvReleaseClosureScorecards";
import {
  CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
  getCsvReleaseExceptionEntityRegister,
  getCsvReleaseExceptionOperationRegister,
  getCsvReleaseExceptionRegister,
  isCsvReleaseExceptionEntity,
  isCsvReleaseExceptionOperation,
  listCsvReleaseExceptionEntityRegisters,
  listCsvReleaseExceptionOperationRegisters
} from "@/lib/server/csvReleaseExceptionRegisters";
import { prisma } from "@/lib/prisma";

const fixtureOptions = {
  exportLimit: 1,
  importPreviewLimit: 2,
  importSampleLimit: 1
};

describe("server CSV release exception registers", () => {
  it("publishes deterministic root exception metadata from closure, acceptance, fixture, and walkthrough sources", async () => {
    const register = await getCsvReleaseExceptionRegister(fixtureOptions);
    const repeated = await getCsvReleaseExceptionRegister(fixtureOptions);

    expect(register).toEqual(repeated);
    expect(register.fingerprint).toMatch(fingerprintPattern());
    expect(register).toMatchObject({
      contentType: CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
      registerVersion: 1,
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      exceptionCount: 34,
      watchExceptionCount: 10,
      blockExceptionCount: 24,
      supportedExceptionCount: 10,
      unsupportedExceptionCount: 24,
      missingFixtureExceptionCount: 24,
      severityCounts: {
        watch: 10,
        block: 24
      },
      entitySeverityCounts: {
        watch: 2,
        block: 8
      },
      operationSeverityCounts: {
        watch: 1,
        block: 3
      },
      closureStatusCounts: {
        ready: 0,
        watch: 10,
        block: 24
      },
      acceptanceStatusCounts: {
        pass: 0,
        watch: 10,
        block: 24
      },
      walkthroughStatusCounts: {
        pass: 0,
        watch: 10,
        block: 24
      },
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: true
      },
      write: noWrites()
    });
    expect(register.source).toMatchObject({
      releaseClosureContentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
      releaseClosureScorecardVersion: 1,
      acceptanceChecklistContentType:
        CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
      acceptanceChecklistVersion: 1,
      operatorFixtureContentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
      operatorFixtureBundleVersion: 1,
      operatorWalkthroughContentType:
        CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
      operatorWalkthroughManifestVersion: 1
    });
    expect(register.source.releaseClosureFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(register.source.acceptanceChecklistFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(register.source.operatorFixtureFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(register.source.operatorWalkthroughFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(register.sourceFingerprints).toEqual([
      {
        source: "release-closure-scorecard",
        scope: "root",
        key: null,
        contentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
        fingerprint: register.source.releaseClosureFingerprint
      },
      {
        source: "operator-acceptance-checklist",
        scope: "root",
        key: null,
        contentType: CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
        fingerprint: register.source.acceptanceChecklistFingerprint
      },
      {
        source: "operator-fixture-bundle",
        scope: "root",
        key: null,
        contentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
        fingerprint: register.source.operatorFixtureFingerprint
      },
      {
        source: "operator-walkthrough-manifest",
        scope: "root",
        key: null,
        contentType: CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
        fingerprint: register.source.operatorWalkthroughFingerprint
      }
    ]);
    expect(register.sourceContentTypes).toContain(
      CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE
    );
    expect(register.entries.slice(0, 3).map((entry) => entry.id)).toEqual([
      "accounts:import-preflight",
      "accounts:import-preview",
      "accounts:import-template"
    ]);
    expect(register.entries.every((entry) => entry.order > 0)).toBe(true);
  });

  it("indexes entity exception registers with remediation-ready entries", async () => {
    const entities = await listCsvReleaseExceptionEntityRegisters(
      fixtureOptions
    );
    const contacts = await getCsvReleaseExceptionEntityRegister(
      "contacts",
      fixtureOptions
    );
    const accounts = await getCsvReleaseExceptionEntityRegister(
      "accounts",
      fixtureOptions
    );

    expect(entities.map((entity) => entity.entity)).toEqual(CSV_EXPORT_ENTITIES);

    if (contacts === null || accounts === null) {
      throw new Error("Expected CSV release exception entity registers");
    }

    expect(contacts).toMatchObject({
      contentType: CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
      registerVersion: 1,
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "watch",
      exceptionCount: 1,
      watchExceptionCount: 1,
      blockExceptionCount: 0,
      supportedExceptionCount: 1,
      unsupportedExceptionCount: 0,
      missingFixtureExceptionCount: 0,
      severityCounts: {
        watch: 1,
        block: 0
      },
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(contacts.fingerprint).toMatch(fingerprintPattern());
    expect(contacts.sourceFingerprints.map((source) => source.source)).toEqual([
      "release-closure-scorecard",
      "operator-acceptance-checklist",
      "operator-fixture-bundle",
      "operator-walkthrough-manifest"
    ]);
    expect(contacts.sourceFingerprints.map((source) => source.scope)).toEqual([
      "entity",
      "entity",
      "entity",
      "entity"
    ]);

    const contactExport = contacts.entries[0]!;

    expect(contactExport).toMatchObject({
      id: "contacts:export",
      order: 1,
      severity: "watch",
      status: "watch",
      supported: true,
      fixtureAvailable: true,
      fixtureKind: "export-delivery-packet",
      closure: {
        status: "watch",
        releaseStatus: "watch",
        acceptanceStatus: "watch",
        exceptionCheckCodes: [
          "release-note-status",
          "acceptance-checklist-status"
        ]
      },
      acceptance: {
        status: "watch",
        exceptionCriterionCodes: [
          "release-verification",
          "readiness-status",
          "remediation-status"
        ],
        issueCount: 0,
        remediationCount: 1,
        nextAction: {
          code: "review-directional-field-coverage",
          safeForCurrentSprint: true,
          requiresContractChange: false
        }
      },
      fixture: {
        coverage: {
          available: true,
          coveredCount: 1,
          expectedCount: 1,
          missingCount: 0
        },
        supported: true
      },
      walkthrough: {
        status: "watch",
        watchNoteCount: 2,
        blockingNoteCount: 0,
        exceptionStepCodes: ["release-note", "acceptance-checklist"]
      },
      remediation: {
        warningCodes: ["export-field-only"],
        sourceCodes: ["export-field-only"],
        issueCount: 0,
        remediationCount: 1
      },
      write: noWrites()
    });
    expect(contactExport.fingerprint).toMatch(fingerprintPattern());
    expect(contactExport.sourceFingerprints.map((source) => source.scope)).toEqual([
      "entity",
      "entity",
      "entity",
      "entity",
      "operation",
      "operation",
      "operation",
      "operation"
    ]);
    expect(contactExport.walkthrough.watchNotes).toHaveLength(2);
    expect(contactExport.walkthrough.blockingNotes).toHaveLength(0);

    expect(accounts).toMatchObject({
      entity: "accounts",
      status: "block",
      exceptionCount: 4,
      severityCounts: {
        watch: 1,
        block: 3
      },
      supportedExceptionCount: 1,
      unsupportedExceptionCount: 3,
      missingFixtureExceptionCount: 3,
      write: noWrites()
    });
    expect(accounts.entries.map((entry) => entry.id)).toEqual([
      "accounts:import-preflight",
      "accounts:import-preview",
      "accounts:import-template",
      "accounts:export"
    ]);
    expect(
      accounts.entries
        .filter((entry) => entry.severity === "block")
        .every(
          (entry) =>
            !entry.supported &&
            !entry.fixtureAvailable &&
            entry.acceptance.nextAction.requiresContractChange &&
            entry.walkthrough.blockingNotes.length > 0
        )
    ).toBe(true);
  });

  it("indexes operation exception registers with source anchors and severity ordering", async () => {
    const operations = await listCsvReleaseExceptionOperationRegisters(
      fixtureOptions
    );
    const exportRegister = await getCsvReleaseExceptionOperationRegister(
      "export",
      fixtureOptions
    );
    const preflightRegister = await getCsvReleaseExceptionOperationRegister(
      "import-preflight",
      fixtureOptions
    );

    expect(operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (exportRegister === null || preflightRegister === null) {
      throw new Error("Expected CSV release exception operation registers");
    }

    expect(exportRegister).toMatchObject({
      contentType: CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
      registerVersion: 1,
      operation: "export",
      status: "watch",
      exceptionCount: CSV_EXPORT_ENTITIES.length,
      severityCounts: {
        watch: CSV_EXPORT_ENTITIES.length,
        block: 0
      },
      supportedExceptionCount: CSV_EXPORT_ENTITIES.length,
      unsupportedExceptionCount: 0,
      missingFixtureExceptionCount: 0,
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(exportRegister.fingerprint).toMatch(fingerprintPattern());
    expect(exportRegister.sourceFingerprints.map((source) => source.scope)).toEqual([
      "operation",
      "operation",
      "operation",
      "operation"
    ]);
    expect(
      exportRegister.entries.every(
        (entry) =>
          entry.severity === "watch" &&
          entry.supported &&
          entry.fixtureAvailable &&
          entry.remediation.nextAction.code ===
            "review-directional-field-coverage"
      )
    ).toBe(true);

    expect(preflightRegister).toMatchObject({
      operation: "import-preflight",
      status: "block",
      exceptionCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      severityCounts: {
        watch: 0,
        block: CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length
      },
      supportedExceptionCount: 0,
      unsupportedExceptionCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      missingFixtureExceptionCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      closureStatusCounts: {
        ready: 0,
        watch: 0,
        block: CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length
      },
      acceptanceStatusCounts: {
        pass: 0,
        watch: 0,
        block: CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length
      },
      walkthroughStatusCounts: {
        pass: 0,
        watch: 0,
        block: CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length
      },
      write: noWrites()
    });
    expect(
      preflightRegister.entries.every(
        (entry) =>
          entry.severity === "block" &&
          !entry.supported &&
          !entry.fixtureAvailable &&
          entry.fixture.coverage.missingCount === 1 &&
          entry.acceptance.issueCount === 2 &&
          entry.remediation.nextAction.code ===
            "keep-unsupported-operation-excluded"
      )
    ).toBe(true);
  });

  it("keeps exception construction no-write and rejects unknown keys", async () => {
    const before = await countExceptionWriteState();
    const register = await getCsvReleaseExceptionRegister(fixtureOptions);
    const after = await countExceptionWriteState();

    expect(after).toEqual(before);
    expect(register.write).toEqual(noWrites());

    for (const entity of register.entities) {
      expect(entity.write).toEqual(noWrites());

      for (const entry of entity.entries) {
        expect(entry.write).toEqual(noWrites());
      }
    }

    for (const operation of register.operations) {
      expect(operation.write).toEqual(noWrites());

      for (const entry of operation.entries) {
        expect(entry.write).toEqual(noWrites());
      }
    }

    expect(isCsvReleaseExceptionEntity("contacts")).toBe(true);
    expect(isCsvReleaseExceptionEntity("salesforce-sync")).toBe(false);
    expect(
      await getCsvReleaseExceptionEntityRegister("salesforce-sync")
    ).toBeNull();
    expect(isCsvReleaseExceptionOperation("export")).toBe(true);
    expect(isCsvReleaseExceptionOperation("sync")).toBe(false);
    expect(await getCsvReleaseExceptionOperationRegister("sync")).toBeNull();
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

async function countExceptionWriteState() {
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
