import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE } from "@/lib/server/csvContractReleaseDigest";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import { CSV_IMPORT_TEMPLATE_CONTENT_TYPE } from "@/lib/server/csvImportTemplates";
import { CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE } from "@/lib/server/csvOperatorHandoffPackets";
import {
  CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
  getCsvOperatorFixtureBundle,
  getCsvOperatorFixtureEntityBundle,
  getCsvOperatorFixtureOperationBundle,
  isCsvOperatorFixtureBundleEntity,
  isCsvOperatorFixtureBundleOperation,
  listCsvOperatorFixtureEntityBundles,
  listCsvOperatorFixtureOperationBundles
} from "@/lib/server/csvOperatorFixtureBundles";
import { prisma } from "@/lib/prisma";

const fixtureOptions = {
  exportLimit: 1,
  importPreviewLimit: 2,
  importSampleLimit: 1
};

describe("server CSV operator fixture bundles", () => {
  it("publishes deterministic bounded fixture metadata for the handoff surface", async () => {
    const bundle = await getCsvOperatorFixtureBundle(fixtureOptions);
    const repeated = await getCsvOperatorFixtureBundle(fixtureOptions);

    expect(bundle).toEqual(repeated);
    expect(bundle.fingerprint).toMatch(fingerprintPattern());
    expect(bundle).toMatchObject({
      contentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
      bundleVersion: 1,
      status: "blocked",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      capabilityCount: 16,
      supportedEntityOperationCount: 16,
      fixtureOperationCount: 16,
      exportFixtureCount: CSV_EXPORT_ENTITIES.length,
      importFixtureCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      source: {
        releaseDigestContentType: CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
        releaseDigestVersion: 1,
        operatorHandoffContentType: CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
        operatorHandoffPacketVersion: 1,
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
    expect(bundle.source.releaseDigestFingerprint).toMatch(fingerprintPattern());
    expect(bundle.source.contractDriftFingerprint).toMatch(fingerprintPattern());
    expect(bundle.release).toMatchObject({
      status: "blocked",
      supportedEntityOperationCount: 16,
      unsupportedEntityOperationCount: 24,
      safeForCurrentSprint: true,
      requiresContractChange: false
    });
    expect(bundle.entities.map((entry) => entry.entity)).toEqual(CSV_EXPORT_ENTITIES);
    expect(bundle.operations.map((entry) => entry.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
    expect(bundle.sourceContentTypes).toEqual(
      expect.arrayContaining([
        CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
        CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
        CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
        CSV_IMPORT_TEMPLATE_CONTENT_TYPE
      ])
    );
  });

  it("builds entity bundles with export snippets and import dry-run samples where supported", async () => {
    const contacts = await getCsvOperatorFixtureEntityBundle(
      "contacts",
      fixtureOptions
    );
    const accounts = await getCsvOperatorFixtureEntityBundle(
      "accounts",
      fixtureOptions
    );
    const entities = await listCsvOperatorFixtureEntityBundles(fixtureOptions);

    if (contacts === null || accounts === null) {
      throw new Error("Expected CSV operator fixture entity bundles");
    }

    expect(entities.map((entry) => entry.entity)).toEqual(CSV_EXPORT_ENTITIES);
    expect(contacts).toMatchObject({
      contentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
      bundleVersion: 1,
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "watch",
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      supportedOperationCount: 4,
      fixtureOperationCount: 4,
      write: noWrites()
    });
    expect(contacts.fingerprint).toMatch(fingerprintPattern());
    expect(contacts.exportFixture).toMatchObject({
      kind: "export-delivery-packet",
      operation: "export",
      entity: "contacts",
      filename: "contacts.csv",
      rowCount: expect.any(Number),
      limits: {
        requestedLimit: fixtureOptions.exportLimit,
        appliedLimit: fixtureOptions.exportLimit
      },
      write: noWrites()
    });
    expect(contacts.exportFixture?.rowCount).toBeLessThanOrEqual(1);
    expect(contacts.exportFixture?.csvSnippet).toContain(
      "Contact ID,First Name,Last Name,Email"
    );
    expect(contacts.importDryRunFixture).toMatchObject({
      kind: "import-dry-run-receipt",
      operations: ["import-preview", "import-template", "import-preflight"],
      entity: "contacts",
      inputFixture: {
        filename: "contacts-import-example.csv",
        templateFilename: "contacts-import-template.csv",
        contentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
        rowCount: 1
      },
      source: {
        rowCount: 1,
        previewedRows: 1,
        requestedPreviewLimit: fixtureOptions.importPreviewLimit,
        appliedPreviewLimit: fixtureOptions.importPreviewLimit,
        requestedSampleLimit: fixtureOptions.importSampleLimit,
        appliedSampleLimit: fixtureOptions.importSampleLimit
      },
      write: noWrites()
    });
    expect(contacts.importDryRunFixture?.inputFixture.csv).toContain(
      "Maya,Singh"
    );
    expect(contacts.importDryRunFixture?.rowSample.sampledRows).toBe(1);
    expect(contacts.operations.every((operation) => operation.fixture.available))
      .toBe(true);

    expect(accounts).toMatchObject({
      entity: "accounts",
      status: "blocked",
      supportedOperationCount: 1,
      fixtureOperationCount: 1,
      importDryRunFixture: null,
      write: noWrites()
    });
    expect(accounts.exportFixture?.kind).toBe("export-delivery-packet");
    expect(
      accounts.operations
        .filter((operation) => operation.operation !== "export")
        .map((operation) => operation.fixture)
    ).toEqual([
      unavailableFixture(),
      unavailableFixture(),
      unavailableFixture()
    ]);
  });

  it("groups operation bundles by supported fixture availability", async () => {
    const exportBundle = await getCsvOperatorFixtureOperationBundle(
      "export",
      fixtureOptions
    );
    const importPreflightBundle = await getCsvOperatorFixtureOperationBundle(
      "import-preflight",
      fixtureOptions
    );
    const operations =
      await listCsvOperatorFixtureOperationBundles(fixtureOptions);

    if (exportBundle === null || importPreflightBundle === null) {
      throw new Error("Expected CSV operator fixture operation bundles");
    }

    expect(operations.map((entry) => entry.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
    expect(exportBundle).toMatchObject({
      contentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
      bundleVersion: 1,
      operation: "export",
      status: "watch",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_EXPORT_ENTITIES.length,
      fixtureEntityCount: CSV_EXPORT_ENTITIES.length,
      write: noWrites()
    });
    expect(exportBundle.fingerprint).toMatch(fingerprintPattern());
    expect(
      exportBundle.entities.every(
        (entity) =>
          entity.fixture.available &&
          entity.fixture.kind === "export-delivery-packet"
      )
    ).toBe(true);
    expect(exportBundle.release).toMatchObject({
      operation: "export",
      warningCodes: ["export-field-only"],
      safeForCurrentSprint: true,
      requiresContractChange: false
    });

    expect(importPreflightBundle).toMatchObject({
      operation: "import-preflight",
      status: "blocked",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      fixtureEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      write: noWrites()
    });
    expect(
      importPreflightBundle.entities
        .filter((entity) => entity.fixture.available)
        .map((entity) => entity.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    for (const entity of importPreflightBundle.entities.filter(
      (candidate) => !candidate.fixture.available
    )) {
      if (entity.fixture.available) {
        throw new Error("Expected unavailable import-preflight fixture");
      }

      expect(entity.fixture.reason).toBe("unsupported-operation");
    }
  });

  it("keeps bundle construction no-write and rejects unknown keys", async () => {
    const before = await countFixtureWriteState();
    const bundle = await getCsvOperatorFixtureBundle(fixtureOptions);
    const after = await countFixtureWriteState();

    expect(after).toEqual(before);
    expect(bundle.write).toEqual(noWrites());

    for (const entity of bundle.entities) {
      expect(entity.write).toEqual(noWrites());
      expect(entity.exportFixture?.write ?? noWrites()).toEqual(noWrites());
      expect(entity.importDryRunFixture?.write ?? noWrites()).toEqual(noWrites());

      for (const operation of entity.operations) {
        expect(operation.write).toEqual(noWrites());
      }
    }

    for (const operation of bundle.operations) {
      expect(operation.write).toEqual(noWrites());

      for (const entity of operation.entities) {
        expect(entity.write).toEqual(noWrites());
      }
    }

    expect(isCsvOperatorFixtureBundleEntity("contacts")).toBe(true);
    expect(isCsvOperatorFixtureBundleEntity("salesforce-sync")).toBe(false);
    expect(await getCsvOperatorFixtureEntityBundle("salesforce-sync")).toBeNull();
    expect(isCsvOperatorFixtureBundleOperation("export")).toBe(true);
    expect(isCsvOperatorFixtureBundleOperation("sync")).toBe(false);
    expect(await getCsvOperatorFixtureOperationBundle("sync")).toBeNull();
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

async function countFixtureWriteState() {
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
