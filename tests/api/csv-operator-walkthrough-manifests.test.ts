import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE } from "@/lib/server/csvHandoffReleaseNotesPackets";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import { CSV_IMPORT_TEMPLATE_CONTENT_TYPE } from "@/lib/server/csvImportTemplates";
import { CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE } from "@/lib/server/csvOperatorAcceptanceChecklists";
import { CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE } from "@/lib/server/csvOperatorFixtureBundles";
import {
  CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
  getCsvOperatorWalkthroughEntityManifest,
  getCsvOperatorWalkthroughManifest,
  getCsvOperatorWalkthroughOperationManifest,
  isCsvOperatorWalkthroughEntity,
  isCsvOperatorWalkthroughOperation,
  listCsvOperatorWalkthroughEntityManifests,
  listCsvOperatorWalkthroughOperationManifests
} from "@/lib/server/csvOperatorWalkthroughManifests";
import { prisma } from "@/lib/prisma";

const fixtureOptions = {
  exportLimit: 1,
  importPreviewLimit: 2,
  importSampleLimit: 1
};

describe("server CSV operator walkthrough manifests", () => {
  it("publishes deterministic root walkthrough metadata from release and acceptance surfaces", async () => {
    const manifest = await getCsvOperatorWalkthroughManifest(fixtureOptions);
    const repeated = await getCsvOperatorWalkthroughManifest(fixtureOptions);

    expect(manifest).toEqual(repeated);
    expect(manifest.fingerprint).toMatch(fingerprintPattern());
    expect(manifest).toMatchObject({
      contentType: CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
      manifestVersion: 1,
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      walkthroughCount: 40,
      supportedWalkthroughCount: 16,
      unsupportedWalkthroughCount: 24,
      fixtureWalkthroughCount: 16,
      stepCount: 240,
      watchNoteCount: 20,
      blockingNoteCount: 120,
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
        capabilityOperationCount: CSV_CAPABILITY_OPERATIONS.length,
        operatorFixtureContentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
        operatorFixtureBundleVersion: 1,
        handoffReleaseNotesContentType:
          CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
        handoffReleaseNotesPacketVersion: 1,
        acceptanceChecklistContentType:
          CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
        acceptanceChecklistVersion: 1
      },
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: true
      },
      write: noWrites()
    });
    expect(manifest.source.operatorFixtureFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(manifest.source.handoffReleaseNotesFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(manifest.source.acceptanceChecklistFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(manifest.source.contractDriftFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(manifest.sourceFingerprints.map((source) => source.source)).toEqual([
      "operator-fixture-bundle",
      "handoff-release-notes",
      "operator-acceptance-checklist"
    ]);
    expect(manifest.sourceContentTypes).toEqual(
      expect.arrayContaining([
        CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
        CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
        CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
        CSV_OPERATOR_ACCEPTANCE_CHECKLIST_CONTENT_TYPE,
        CSV_IMPORT_TEMPLATE_CONTENT_TYPE
      ])
    );
    expect(manifest.entities.map((entity) => entity.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(manifest.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
  });

  it("publishes operation walkthroughs with ordered steps and supported fixture coverage", async () => {
    const operations = await listCsvOperatorWalkthroughOperationManifests(
      fixtureOptions
    );
    const exportManifest = await getCsvOperatorWalkthroughOperationManifest(
      "export",
      fixtureOptions
    );
    const preflightManifest = await getCsvOperatorWalkthroughOperationManifest(
      "import-preflight",
      fixtureOptions
    );

    expect(operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (exportManifest === null || preflightManifest === null) {
      throw new Error("Expected CSV operator walkthrough operation manifests");
    }

    expect(exportManifest).toMatchObject({
      contentType: CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
      manifestVersion: 1,
      operation: "export",
      status: "watch",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_EXPORT_ENTITIES.length,
      unsupportedEntityCount: 0,
      fixtureEntityCount: CSV_EXPORT_ENTITIES.length,
      walkthroughCount: CSV_EXPORT_ENTITIES.length,
      stepCount: CSV_EXPORT_ENTITIES.length * 6,
      statusCounts: {
        pass: 0,
        watch: 10,
        block: 0
      },
      write: noWrites()
    });
    expect(exportManifest.fingerprint).toMatch(fingerprintPattern());
    expect(
      exportManifest.items.every(
        (item) =>
          item.supported &&
          item.fixture.available &&
          item.fixture.kind === "export-delivery-packet"
      )
    ).toBe(true);
    expect(exportManifest.items[0]!.steps.map((step) => step.order)).toEqual([
      1, 2, 3, 4, 5, 6
    ]);
    expect(exportManifest.items[0]!.steps.map((step) => step.sourceKind)).toEqual(
      [
        "csv-capability",
        "export-contract",
        "export-delivery-packet",
        "handoff-release-notes",
        "operator-acceptance-checklist",
        "no-write-flags"
      ]
    );

    expect(preflightManifest).toMatchObject({
      operation: "import-preflight",
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      unsupportedEntityCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      fixtureEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      statusCounts: {
        pass: 2,
        watch: 0,
        block: 8
      },
      blockingNoteCount: 40,
      write: noWrites()
    });
    expect(
      preflightManifest.items
        .filter((item) => item.status === "pass")
        .map((item) => item.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(
      preflightManifest.items
        .filter((item) => item.status === "block")
        .every(
          (item) =>
            !item.supported &&
            !item.capability.present &&
            !item.fixture.available &&
            item.blockingNoteCount > 0
        )
    ).toBe(true);
  });

  it("publishes entity walkthroughs with template, fixture, release, and acceptance notes", async () => {
    const entities = await listCsvOperatorWalkthroughEntityManifests(
      fixtureOptions
    );
    const contacts = await getCsvOperatorWalkthroughEntityManifest(
      "contacts",
      fixtureOptions
    );
    const accounts = await getCsvOperatorWalkthroughEntityManifest(
      "accounts",
      fixtureOptions
    );

    expect(entities.map((entity) => entity.entity)).toEqual(CSV_EXPORT_ENTITIES);

    if (contacts === null || accounts === null) {
      throw new Error("Expected CSV operator walkthrough entity manifests");
    }

    expect(contacts).toMatchObject({
      contentType: CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
      manifestVersion: 1,
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "watch",
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      supportedOperationCount: 4,
      unsupportedOperationCount: 0,
      fixtureOperationCount: 4,
      walkthroughCount: 4,
      stepCount: 24,
      watchNoteCount: 2,
      blockingNoteCount: 0,
      statusCounts: {
        pass: 3,
        watch: 1,
        block: 0
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
      supported: true,
      template: null,
      capability: {
        present: true,
        returnsCsv: true,
        filename: "contacts.csv",
        canonicalHeaderCount: 11
      },
      fixture: {
        available: true,
        kind: "export-delivery-packet"
      },
      watchNoteCount: 2,
      blockingNoteCount: 0,
      write: noWrites()
    });
    expect(contactExport?.steps[3]).toMatchObject({
      code: "release-note",
      status: "watch",
      watchNotes: [
        "Release-note review carries warnings export-field-only and source codes export-field-only."
      ]
    });
    expect(contactImportPreview).toMatchObject({
      status: "pass",
      template: {
        available: true,
        filename: "contacts-import-template.csv",
        exampleFilename: "contacts-import-example.csv",
        headerCount: 7,
        requiredHeaderCount: 3,
        exampleRowCount: 1
      },
      fixture: {
        available: true,
        kind: "import-dry-run-receipt"
      },
      watchNoteCount: 0,
      blockingNoteCount: 0
    });

    expect(accounts).toMatchObject({
      entity: "accounts",
      status: "block",
      supportedOperationCount: 1,
      unsupportedOperationCount: 3,
      fixtureOperationCount: 1,
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
      capability: {
        present: false,
        canonicalHeaderCount: 0
      },
      template: null,
      fixture: unavailableFixture(),
      blockingNoteCount: 5
    });
  });

  it("keeps walkthrough construction no-write and rejects unknown keys", async () => {
    const before = await countWalkthroughWriteState();
    const manifest = await getCsvOperatorWalkthroughManifest(fixtureOptions);
    const after = await countWalkthroughWriteState();

    expect(after).toEqual(before);
    expect(manifest.write).toEqual(noWrites());

    for (const entity of manifest.entities) {
      expect(entity.write).toEqual(noWrites());

      for (const item of entity.items) {
        expect(item.write).toEqual(noWrites());

        for (const step of item.steps) {
          expect(step.write).toEqual(noWrites());
        }
      }
    }

    for (const operation of manifest.operations) {
      expect(operation.write).toEqual(noWrites());

      for (const item of operation.items) {
        expect(item.write).toEqual(noWrites());
      }
    }

    expect(isCsvOperatorWalkthroughEntity("contacts")).toBe(true);
    expect(isCsvOperatorWalkthroughEntity("salesforce-sync")).toBe(false);
    expect(
      await getCsvOperatorWalkthroughEntityManifest("salesforce-sync")
    ).toBeNull();
    expect(isCsvOperatorWalkthroughOperation("export")).toBe(true);
    expect(isCsvOperatorWalkthroughOperation("sync")).toBe(false);
    expect(
      await getCsvOperatorWalkthroughOperationManifest("sync")
    ).toBeNull();
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

async function countWalkthroughWriteState() {
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
