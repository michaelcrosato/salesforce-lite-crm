import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import { CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE } from "@/lib/server/csvReleaseExceptionRegisters";
import { CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE } from "@/lib/server/csvReleaseHandoffCatalog";
import {
  CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
  getCsvReleaseDispositionEntityManifest,
  getCsvReleaseDispositionManifest,
  getCsvReleaseDispositionOperationManifest,
  isCsvReleaseDispositionEntity,
  isCsvReleaseDispositionOperation,
  listCsvReleaseDispositionEntityManifests,
  listCsvReleaseDispositionOperationManifests
} from "@/lib/server/csvReleaseDispositionManifests";
import { prisma } from "@/lib/prisma";

const fixtureOptions = {
  exportLimit: 1,
  importPreviewLimit: 2,
  importSampleLimit: 1
};

describe("server CSV release disposition manifests", () => {
  it("publishes deterministic root disposition metadata from handoff and exception sources", async () => {
    const manifest = await getCsvReleaseDispositionManifest(fixtureOptions);
    const repeated = await getCsvReleaseDispositionManifest(fixtureOptions);

    expect(manifest).toEqual(repeated);
    expect(manifest.fingerprint).toMatch(fingerprintPattern());
    expect(manifest).toMatchObject({
      contentType: CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
      manifestVersion: 1,
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      dispositionCount: 40,
      readyDispositionCount: 6,
      watchDispositionCount: 10,
      blockDispositionCount: 24,
      exceptionCount: 34,
      watchExceptionCount: 10,
      blockExceptionCount: 24,
      supportedDispositionCount: 16,
      unsupportedDispositionCount: 24,
      missingFixtureDispositionCount: 24,
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
      handoffStatusCounts: {
        ready: 6,
        watch: 10,
        block: 24
      },
      exceptionSeverityCounts: {
        watch: 10,
        block: 24
      },
      source: {
        releaseHandoffContentType: CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
        releaseHandoffCatalogVersion: 1,
        releaseExceptionContentType:
          CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
        releaseExceptionRegisterVersion: 1
      },
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: true
      },
      write: noWrites()
    });
    expect(manifest.source.releaseHandoffFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(manifest.source.releaseExceptionFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(manifest.sourceFingerprints).toEqual([
      {
        source: "release-handoff-catalog",
        scope: "root",
        key: null,
        contentType: CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
        fingerprint: manifest.source.releaseHandoffFingerprint
      },
      {
        source: "release-exception-register",
        scope: "root",
        key: null,
        contentType: CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
        fingerprint: manifest.source.releaseExceptionFingerprint
      }
    ]);
    expect(manifest.sourceContentTypes).toContain(
      CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE
    );
    expect(manifest.entities.map((entity) => entity.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(manifest.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
  });

  it("indexes entity disposition manifests with trace anchors", async () => {
    const entities = await listCsvReleaseDispositionEntityManifests(
      fixtureOptions
    );
    const contacts = await getCsvReleaseDispositionEntityManifest(
      "contacts",
      fixtureOptions
    );
    const accounts = await getCsvReleaseDispositionEntityManifest(
      "accounts",
      fixtureOptions
    );

    expect(entities.map((entity) => entity.entity)).toEqual(CSV_EXPORT_ENTITIES);

    if (contacts === null || accounts === null) {
      throw new Error("Expected CSV release disposition entity manifests");
    }

    expect(contacts).toMatchObject({
      contentType: CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
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
      dispositionCount: 4,
      readyDispositionCount: 3,
      watchDispositionCount: 1,
      blockDispositionCount: 0,
      exceptionCount: 1,
      watchExceptionCount: 1,
      blockExceptionCount: 0,
      supportedDispositionCount: 4,
      unsupportedDispositionCount: 0,
      missingFixtureDispositionCount: 0,
      statusCounts: {
        ready: 3,
        watch: 1,
        block: 0
      },
      exceptionSeverityCounts: {
        watch: 1,
        block: 0
      },
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(contacts.fingerprint).toMatch(fingerprintPattern());
    expect(contacts.sourceFingerprints.map((source) => source.source)).toEqual([
      "release-handoff-catalog",
      "release-exception-register"
    ]);
    expect(contacts.sourceFingerprints.map((source) => source.scope)).toEqual([
      "entity",
      "entity"
    ]);

    const contactExport = contacts.dispositions.find(
      (disposition) => disposition.operation === "export"
    );
    const contactImportPreview = contacts.dispositions.find(
      (disposition) => disposition.operation === "import-preview"
    );

    expect(contactExport).toMatchObject({
      id: "contacts:export",
      status: "watch",
      supported: true,
      fixtureAvailable: true,
      fixtureKind: "export-delivery-packet",
      hasException: true,
      exceptionSeverity: "watch",
      trace: {
        handoff: {
          status: "watch",
          supported: true,
          fixtureAvailable: true,
          closure: {
            status: "watch",
            releaseStatus: "watch",
            acceptanceStatus: "watch",
            warningCodes: ["export-field-only"],
            sourceCodes: ["export-field-only"]
          }
        },
        exception: {
          severity: "watch",
          status: "watch",
          remediation: {
            nextAction: {
              code: "review-directional-field-coverage",
              safeForCurrentSprint: true,
              requiresContractChange: false
            },
            warningCodes: ["export-field-only"],
            sourceCodes: ["export-field-only"],
            issueCount: 0,
            remediationCount: 1
          }
        }
      },
      write: noWrites()
    });
    expect(contactExport?.fingerprint).toMatch(fingerprintPattern());
    expect(contactExport?.sourceFingerprints.map((source) => source.scope)).toEqual([
      "item",
      "item"
    ]);
    expect(contactExport?.trace.handoff.fingerprint).toMatch(
      fingerprintPattern()
    );
    expect(contactExport?.trace.exception?.fingerprint).toMatch(
      fingerprintPattern()
    );

    expect(contactImportPreview).toMatchObject({
      status: "ready",
      hasException: false,
      exceptionSeverity: null,
      trace: {
        exception: null,
        handoff: {
          status: "ready",
          closure: {
            status: "ready",
            releaseStatus: "stable",
            acceptanceStatus: "pass"
          }
        }
      },
      write: noWrites()
    });

    expect(accounts).toMatchObject({
      entity: "accounts",
      status: "block",
      dispositionCount: 4,
      readyDispositionCount: 0,
      watchDispositionCount: 1,
      blockDispositionCount: 3,
      exceptionCount: 4,
      exceptionSeverityCounts: {
        watch: 1,
        block: 3
      },
      supportedDispositionCount: 1,
      unsupportedDispositionCount: 3,
      missingFixtureDispositionCount: 3,
      write: noWrites()
    });
  });

  it("indexes operation disposition manifests with release counts", async () => {
    const operations = await listCsvReleaseDispositionOperationManifests(
      fixtureOptions
    );
    const exportManifest = await getCsvReleaseDispositionOperationManifest(
      "export",
      fixtureOptions
    );
    const preflightManifest = await getCsvReleaseDispositionOperationManifest(
      "import-preflight",
      fixtureOptions
    );

    expect(operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (exportManifest === null || preflightManifest === null) {
      throw new Error("Expected CSV release disposition operation manifests");
    }

    expect(exportManifest).toMatchObject({
      contentType: CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
      manifestVersion: 1,
      operation: "export",
      status: "watch",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_EXPORT_ENTITIES.length,
      unsupportedEntityCount: 0,
      fixtureEntityCount: CSV_EXPORT_ENTITIES.length,
      dispositionCount: CSV_EXPORT_ENTITIES.length,
      readyDispositionCount: 0,
      watchDispositionCount: CSV_EXPORT_ENTITIES.length,
      blockDispositionCount: 0,
      exceptionCount: CSV_EXPORT_ENTITIES.length,
      exceptionSeverityCounts: {
        watch: CSV_EXPORT_ENTITIES.length,
        block: 0
      },
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(exportManifest.fingerprint).toMatch(fingerprintPattern());
    expect(exportManifest.sourceFingerprints.map((source) => source.scope)).toEqual([
      "operation",
      "operation"
    ]);
    expect(
      exportManifest.dispositions.every(
        (disposition) =>
          disposition.status === "watch" &&
          disposition.hasException &&
          disposition.trace.exception?.remediation.nextAction.code ===
            "review-directional-field-coverage"
      )
    ).toBe(true);

    expect(preflightManifest).toMatchObject({
      operation: "import-preflight",
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      unsupportedEntityCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      fixtureEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      readyDispositionCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      watchDispositionCount: 0,
      blockDispositionCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      exceptionSeverityCounts: {
        watch: 0,
        block: CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length
      },
      write: noWrites()
    });
    expect(
      preflightManifest.dispositions
        .filter((disposition) => disposition.status === "ready")
        .map((disposition) => disposition.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(
      preflightManifest.dispositions
        .filter((disposition) => disposition.status === "block")
        .every(
          (disposition) =>
            !disposition.supported &&
            !disposition.fixtureAvailable &&
            disposition.hasException &&
            disposition.trace.exception?.remediation.nextAction.code ===
              "keep-unsupported-operation-excluded"
        )
    ).toBe(true);
  });

  it("keeps disposition construction no-write and rejects unknown keys", async () => {
    const before = await countDispositionWriteState();
    const manifest = await getCsvReleaseDispositionManifest(fixtureOptions);
    const after = await countDispositionWriteState();

    expect(after).toEqual(before);
    expect(manifest.write).toEqual(noWrites());

    for (const entity of manifest.entities) {
      expect(entity.write).toEqual(noWrites());

      for (const disposition of entity.dispositions) {
        expect(disposition.write).toEqual(noWrites());
      }
    }

    for (const operation of manifest.operations) {
      expect(operation.write).toEqual(noWrites());

      for (const disposition of operation.dispositions) {
        expect(disposition.write).toEqual(noWrites());
      }
    }

    expect(isCsvReleaseDispositionEntity("contacts")).toBe(true);
    expect(isCsvReleaseDispositionEntity("salesforce-sync")).toBe(false);
    expect(
      await getCsvReleaseDispositionEntityManifest("salesforce-sync")
    ).toBeNull();
    expect(isCsvReleaseDispositionOperation("export")).toBe(true);
    expect(isCsvReleaseDispositionOperation("sync")).toBe(false);
    expect(await getCsvReleaseDispositionOperationManifest("sync")).toBeNull();
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

async function countDispositionWriteState() {
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
