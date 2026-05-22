import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE } from "@/lib/server/csvContractQaChecks";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import {
  CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
  getCsvOperatorAcceptanceChecklist,
  getCsvOperatorAcceptanceEntityChecklist,
  getCsvOperatorAcceptanceOperationChecklist,
  isCsvOperatorAcceptanceChecklistEntity,
  isCsvOperatorAcceptanceChecklistOperation,
  listCsvOperatorAcceptanceEntityChecklists,
  listCsvOperatorAcceptanceOperationChecklists
} from "@/lib/server/csvOperatorAcceptanceChecklists";
import { CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE } from "@/lib/server/csvOperatorFixtureBundles";
import { CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE } from "@/lib/server/csvOperatorReadinessScorecards";
import { CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE } from "@/lib/server/csvOperatorRemediationRunbooks";
import { CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE } from "@/lib/server/csvReleaseVerificationManifests";
import { prisma } from "@/lib/prisma";

const fixtureOptions = {
  exportLimit: 1,
  importPreviewLimit: 2,
  importSampleLimit: 1
};

describe("server CSV operator acceptance checklists", () => {
  it("publishes deterministic root acceptance metadata from verification, fixtures, remediation, and QA", async () => {
    const checklist = await getCsvOperatorAcceptanceChecklist(fixtureOptions);
    const repeated = await getCsvOperatorAcceptanceChecklist(fixtureOptions);

    expect(checklist).toEqual(repeated);
    expect(checklist.fingerprint).toMatch(fingerprintPattern());
    expect(checklist).toMatchObject({
      contentType: CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
      checklistVersion: 1,
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      checklistItemCount: 40,
      supportedItemCount: 16,
      unsupportedItemCount: 24,
      fixtureItemCount: 16,
      issueCount: 48,
      remediationCount: 34,
      statusCounts: {
        pass: 6,
        watch: 10,
        block: 24
      },
      entityStatusCounts: {
        pass: 0,
        watch: 2,
        block: 8
      },
      operationStatusCounts: {
        pass: 0,
        watch: 1,
        block: 3
      },
      source: {
        releaseVerificationContentType:
          CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
        releaseVerificationManifestVersion: 1,
        operatorFixtureContentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
        operatorFixtureBundleVersion: 1,
        operatorRemediationContentType:
          CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
        operatorReadinessContentType:
          CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
        contractQaContentType: CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE,
        operatorHandoffStatus: "blocked"
      },
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: true
      },
      write: noWrites()
    });
    expect(checklist.source.releaseVerificationFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(checklist.source.operatorFixtureFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(checklist.source.contractDriftFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(checklist.warningCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface"
    ]);
    expect(checklist.sourceCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface",
      "unsupported-operation-gap"
    ]);
    expect(checklist.sourceFingerprintRollup.sourceFingerprintCount).toBe(75);
    expect(checklist.sourceContentTypes).toEqual(
      expect.arrayContaining([
        CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
        CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
        CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
        CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
        CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
        CSV_CONTRACT_QA_CHECKS_CONTENT_TYPE
      ])
    );
    expect(checklist.entities.map((entity) => entity.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(checklist.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
  });

  it("publishes entity acceptance checklists with pass, watch, and block items", async () => {
    const entities = await listCsvOperatorAcceptanceEntityChecklists(
      fixtureOptions
    );
    const contacts = await getCsvOperatorAcceptanceEntityChecklist(
      "contacts",
      fixtureOptions
    );
    const accounts = await getCsvOperatorAcceptanceEntityChecklist(
      "accounts",
      fixtureOptions
    );

    expect(entities.map((entity) => entity.entity)).toEqual(CSV_EXPORT_ENTITIES);

    if (contacts === null || accounts === null) {
      throw new Error("Expected CSV operator acceptance entity checklists");
    }

    expect(contacts).toMatchObject({
      contentType: CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
      checklistVersion: 1,
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "watch",
      itemCount: CSV_CAPABILITY_OPERATIONS.length,
      supportedItemCount: 4,
      unsupportedItemCount: 0,
      fixtureItemCount: 4,
      issueCount: 0,
      remediationCount: 1,
      statusCounts: {
        pass: 3,
        watch: 1,
        block: 0
      },
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(contacts.fingerprint).toMatch(fingerprintPattern());
    expect(contacts.items.map((item) => item.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
    expect(
      contacts.items.find((item) => item.operation === "export")
    ).toMatchObject({
      id: "contacts:export",
      status: "watch",
      supported: true,
      releaseVerificationStatus: "watch",
      readinessStatus: "needs-review",
      remediationStatus: "needs-action",
      qaStatus: "pass",
      criteriaCounts: {
        pass: 4,
        watch: 3,
        block: 0
      },
      nextAction: {
        code: "review-directional-field-coverage",
        safeForCurrentSprint: true,
        requiresContractChange: false
      },
      write: noWrites()
    });
    expect(
      contacts.items.find((item) => item.operation === "import-preview")
    ).toMatchObject({
      status: "pass",
      fixture: {
        available: true,
        kind: "import-dry-run-receipt"
      },
      criteriaCounts: {
        pass: 7,
        watch: 0,
        block: 0
      }
    });

    expect(accounts).toMatchObject({
      entity: "accounts",
      status: "block",
      supportedItemCount: 1,
      unsupportedItemCount: 3,
      fixtureItemCount: 1,
      issueCount: 6,
      remediationCount: 4,
      statusCounts: {
        pass: 0,
        watch: 1,
        block: 3
      },
      write: noWrites()
    });
    expect(
      accounts.items.find((item) => item.operation === "import-template")
    ).toMatchObject({
      status: "block",
      supported: false,
      fixture: unavailableFixture(),
      qaStatus: "warn",
      issueCount: 2,
      remediationCount: 1,
      criteriaCounts: {
        pass: 1,
        watch: 1,
        block: 5
      },
      nextAction: {
        code: "keep-unsupported-operation-excluded",
        safeForCurrentSprint: false,
        requiresContractChange: true
      }
    });
  });

  it("publishes operation acceptance checklists by supported fixture availability", async () => {
    const operations = await listCsvOperatorAcceptanceOperationChecklists(
      fixtureOptions
    );
    const exportChecklist = await getCsvOperatorAcceptanceOperationChecklist(
      "export",
      fixtureOptions
    );
    const importPreflightChecklist =
      await getCsvOperatorAcceptanceOperationChecklist(
        "import-preflight",
        fixtureOptions
      );

    expect(operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (exportChecklist === null || importPreflightChecklist === null) {
      throw new Error("Expected CSV operator acceptance operation checklists");
    }

    expect(exportChecklist).toMatchObject({
      contentType: CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
      checklistVersion: 1,
      operation: "export",
      status: "watch",
      itemCount: CSV_EXPORT_ENTITIES.length,
      supportedItemCount: CSV_EXPORT_ENTITIES.length,
      unsupportedItemCount: 0,
      fixtureItemCount: CSV_EXPORT_ENTITIES.length,
      issueCount: 0,
      remediationCount: CSV_EXPORT_ENTITIES.length,
      statusCounts: {
        pass: 0,
        watch: 10,
        block: 0
      },
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(exportChecklist.fingerprint).toMatch(fingerprintPattern());
    expect(
      exportChecklist.items.every(
        (item) =>
          item.fixture.available &&
          item.fixture.kind === "export-delivery-packet"
      )
    ).toBe(true);

    expect(importPreflightChecklist).toMatchObject({
      operation: "import-preflight",
      status: "block",
      itemCount: CSV_EXPORT_ENTITIES.length,
      supportedItemCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      unsupportedItemCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      fixtureItemCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      issueCount: 16,
      remediationCount: 8,
      statusCounts: {
        pass: 2,
        watch: 0,
        block: 8
      },
      write: noWrites()
    });
    expect(
      importPreflightChecklist.items
        .filter((item) => item.status === "pass")
        .map((item) => item.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(
      importPreflightChecklist.items
        .filter((item) => item.status === "block")
        .every((item) => !item.supported && !item.fixture.available)
    ).toBe(true);
  });

  it("keeps acceptance checklist construction no-write and rejects unknown keys", async () => {
    const before = await countAcceptanceWriteState();
    const checklist = await getCsvOperatorAcceptanceChecklist(fixtureOptions);
    const after = await countAcceptanceWriteState();

    expect(after).toEqual(before);
    expect(checklist.write).toEqual(noWrites());

    for (const entity of checklist.entities) {
      expect(entity.write).toEqual(noWrites());

      for (const item of entity.items) {
        expect(item.write).toEqual(noWrites());
      }
    }

    for (const operation of checklist.operations) {
      expect(operation.write).toEqual(noWrites());

      for (const item of operation.items) {
        expect(item.write).toEqual(noWrites());
      }
    }

    expect(isCsvOperatorAcceptanceChecklistEntity("contacts")).toBe(true);
    expect(isCsvOperatorAcceptanceChecklistEntity("salesforce-sync")).toBe(false);
    expect(
      await getCsvOperatorAcceptanceEntityChecklist("salesforce-sync")
    ).toBeNull();
    expect(isCsvOperatorAcceptanceChecklistOperation("export")).toBe(true);
    expect(isCsvOperatorAcceptanceChecklistOperation("sync")).toBe(false);
    expect(await getCsvOperatorAcceptanceOperationChecklist("sync")).toBeNull();
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

async function countAcceptanceWriteState() {
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
