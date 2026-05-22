import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import { CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE } from "@/lib/server/csvOperatorWalkthroughManifests";
import { CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE } from "@/lib/server/csvReleaseClosureScorecards";
import {
  CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
  getCsvReleaseHandoffCatalog,
  getCsvReleaseHandoffEntityCatalog,
  getCsvReleaseHandoffOperationCatalog,
  isCsvReleaseHandoffEntity,
  isCsvReleaseHandoffOperation,
  listCsvReleaseHandoffEntityCatalogs,
  listCsvReleaseHandoffOperationCatalogs
} from "@/lib/server/csvReleaseHandoffCatalog";
import { prisma } from "@/lib/prisma";

const fixtureOptions = {
  exportLimit: 1,
  importPreviewLimit: 2,
  importSampleLimit: 1
};

describe("server CSV release handoff catalog", () => {
  it("publishes deterministic root handoff metadata from walkthroughs and closure scorecards", async () => {
    const catalog = await getCsvReleaseHandoffCatalog(fixtureOptions);
    const repeated = await getCsvReleaseHandoffCatalog(fixtureOptions);

    expect(catalog).toEqual(repeated);
    expect(catalog.fingerprint).toMatch(fingerprintPattern());
    expect(catalog).toMatchObject({
      contentType: CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
      catalogVersion: 1,
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      catalogItemCount: 40,
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
      walkthroughStatusCounts: {
        ready: 6,
        watch: 10,
        block: 24
      },
      closureStatusCounts: {
        ready: 6,
        watch: 10,
        block: 24
      },
      walkthroughStepStatusCounts: {
        ready: 100,
        watch: 20,
        block: 120
      },
      closureCheckStatusCounts: {
        ready: 68,
        watch: 20,
        block: 72
      },
      source: {
        operatorWalkthroughContentType:
          CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
        operatorWalkthroughManifestVersion: 1,
        releaseClosureContentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
        releaseClosureScorecardVersion: 1
      },
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: true
      },
      write: noWrites()
    });
    expect(catalog.source.operatorWalkthroughFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(catalog.source.releaseClosureFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(catalog.sourceFingerprints).toEqual([
      {
        source: "operator-walkthrough-manifest",
        scope: "root",
        key: null,
        contentType: CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
        fingerprint: catalog.source.operatorWalkthroughFingerprint
      },
      {
        source: "release-closure-scorecard",
        scope: "root",
        key: null,
        contentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
        fingerprint: catalog.source.releaseClosureFingerprint
      }
    ]);
    expect(catalog.sourceContentTypes).toContain(
      CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE
    );
    expect(catalog.entities.map((entity) => entity.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(catalog.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
  });

  it("indexes entity handoff catalogs with source fingerprints and rollups", async () => {
    const entities = await listCsvReleaseHandoffEntityCatalogs(fixtureOptions);
    const contacts = await getCsvReleaseHandoffEntityCatalog(
      "contacts",
      fixtureOptions
    );
    const accounts = await getCsvReleaseHandoffEntityCatalog(
      "accounts",
      fixtureOptions
    );

    expect(entities.map((entity) => entity.entity)).toEqual(CSV_EXPORT_ENTITIES);

    if (contacts === null || accounts === null) {
      throw new Error("Expected CSV release handoff entity catalogs");
    }

    expect(contacts).toMatchObject({
      contentType: CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
      catalogVersion: 1,
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "watch",
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      supportedOperationCount: 4,
      unsupportedOperationCount: 0,
      fixtureOperationCount: 4,
      catalogItemCount: 4,
      statusCounts: {
        ready: 3,
        watch: 1,
        block: 0
      },
      walkthroughStatusCounts: {
        ready: 3,
        watch: 1,
        block: 0
      },
      closureStatusCounts: {
        ready: 3,
        watch: 1,
        block: 0
      },
      walkthroughStepStatusCounts: {
        ready: 22,
        watch: 2,
        block: 0
      },
      closureCheckStatusCounts: {
        ready: 14,
        watch: 2,
        block: 0
      },
      write: noWrites()
    });
    expect(contacts.fingerprint).toMatch(fingerprintPattern());
    expect(contacts.sourceFingerprints.map((source) => source.scope)).toEqual([
      "entity",
      "entity"
    ]);
    expect(contacts.sourceFingerprints.map((source) => source.key)).toEqual([
      "contacts",
      "contacts"
    ]);

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
      fixtureAvailable: true,
      fixtureKind: "export-delivery-packet",
      walkthrough: {
        nativeStatus: "watch",
        status: "watch",
        stepCount: 6,
        watchNoteCount: 2,
        blockingNoteCount: 0,
        stepStatusCounts: {
          ready: 4,
          watch: 2,
          block: 0
        }
      },
      closure: {
        status: "watch",
        releaseStatus: "watch",
        acceptanceStatus: "watch",
        checkCount: 4,
        checkStatusCounts: {
          ready: 2,
          watch: 2,
          block: 0
        },
        warningCodes: ["export-field-only"],
        sourceCodes: ["export-field-only"]
      },
      write: noWrites()
    });
    expect(contactExport?.fingerprint).toMatch(fingerprintPattern());
    expect(contactExport?.sourceFingerprints.map((source) => source.scope)).toEqual([
      "entity",
      "entity",
      "operation",
      "operation"
    ]);
    expect(contactImportPreview).toMatchObject({
      status: "ready",
      fixtureAvailable: true,
      fixtureKind: "import-dry-run-receipt",
      walkthrough: {
        status: "ready",
        stepStatusCounts: {
          ready: 6,
          watch: 0,
          block: 0
        }
      },
      closure: {
        status: "ready",
        releaseStatus: "stable",
        acceptanceStatus: "pass"
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
      walkthroughStepStatusCounts: {
        ready: 7,
        watch: 2,
        block: 15
      },
      write: noWrites()
    });
  });

  it("indexes operation handoff catalogs with release-ready counts", async () => {
    const operations = await listCsvReleaseHandoffOperationCatalogs(
      fixtureOptions
    );
    const exportCatalog = await getCsvReleaseHandoffOperationCatalog(
      "export",
      fixtureOptions
    );
    const preflightCatalog = await getCsvReleaseHandoffOperationCatalog(
      "import-preflight",
      fixtureOptions
    );

    expect(operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (exportCatalog === null || preflightCatalog === null) {
      throw new Error("Expected CSV release handoff operation catalogs");
    }

    expect(exportCatalog).toMatchObject({
      contentType: CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
      catalogVersion: 1,
      operation: "export",
      status: "watch",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_EXPORT_ENTITIES.length,
      unsupportedEntityCount: 0,
      fixtureEntityCount: CSV_EXPORT_ENTITIES.length,
      catalogItemCount: CSV_EXPORT_ENTITIES.length,
      statusCounts: {
        ready: 0,
        watch: 10,
        block: 0
      },
      walkthroughStepStatusCounts: {
        ready: 40,
        watch: 20,
        block: 0
      },
      closureCheckStatusCounts: {
        ready: 20,
        watch: 20,
        block: 0
      },
      write: noWrites()
    });
    expect(exportCatalog.fingerprint).toMatch(fingerprintPattern());
    expect(exportCatalog.sourceFingerprints.map((source) => source.scope)).toEqual([
      "operation",
      "operation"
    ]);
    expect(
      exportCatalog.items.every(
        (item) =>
          item.status === "watch" &&
          item.fixtureAvailable &&
          item.fixtureKind === "export-delivery-packet"
      )
    ).toBe(true);

    expect(preflightCatalog).toMatchObject({
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
      walkthroughStepStatusCounts: {
        ready: 20,
        watch: 0,
        block: 40
      },
      closureCheckStatusCounts: {
        ready: 16,
        watch: 0,
        block: 24
      },
      write: noWrites()
    });
    expect(
      preflightCatalog.items
        .filter((item) => item.status === "ready")
        .map((item) => item.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(
      preflightCatalog.items
        .filter((item) => item.status === "block")
        .every(
          (item) =>
            !item.supported &&
            !item.fixtureAvailable &&
            item.walkthrough.blockingNoteCount > 0 &&
            item.closure.checkStatusCounts.block === 3
        )
    ).toBe(true);
  });

  it("keeps catalog construction no-write and rejects unknown keys", async () => {
    const before = await countHandoffWriteState();
    const catalog = await getCsvReleaseHandoffCatalog(fixtureOptions);
    const after = await countHandoffWriteState();

    expect(after).toEqual(before);
    expect(catalog.write).toEqual(noWrites());

    for (const entity of catalog.entities) {
      expect(entity.write).toEqual(noWrites());

      for (const item of entity.items) {
        expect(item.write).toEqual(noWrites());
      }
    }

    for (const operation of catalog.operations) {
      expect(operation.write).toEqual(noWrites());

      for (const item of operation.items) {
        expect(item.write).toEqual(noWrites());
      }
    }

    expect(isCsvReleaseHandoffEntity("contacts")).toBe(true);
    expect(isCsvReleaseHandoffEntity("salesforce-sync")).toBe(false);
    expect(await getCsvReleaseHandoffEntityCatalog("salesforce-sync")).toBeNull();
    expect(isCsvReleaseHandoffOperation("export")).toBe(true);
    expect(isCsvReleaseHandoffOperation("sync")).toBe(false);
    expect(await getCsvReleaseHandoffOperationCatalog("sync")).toBeNull();
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

async function countHandoffWriteState() {
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
