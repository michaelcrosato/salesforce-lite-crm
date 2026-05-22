import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE } from "@/lib/server/csvContractReleaseDigest";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import { CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE } from "@/lib/server/csvOperatorFixtureBundles";
import { CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE } from "@/lib/server/csvReleaseVerificationManifests";
import {
  CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
  getCsvHandoffReleaseNotesEntityPacket,
  getCsvHandoffReleaseNotesOperationPacket,
  getCsvHandoffReleaseNotesPacket,
  isCsvHandoffReleaseNotesEntity,
  isCsvHandoffReleaseNotesOperation,
  listCsvHandoffReleaseNotesEntityPackets,
  listCsvHandoffReleaseNotesOperationPackets
} from "@/lib/server/csvHandoffReleaseNotesPackets";
import { prisma } from "@/lib/prisma";

const fixtureOptions = {
  exportLimit: 1,
  importPreviewLimit: 2,
  importSampleLimit: 1
};

describe("server CSV handoff release notes packets", () => {
  it("publishes deterministic release-note metadata from verification, digest, and fixtures", async () => {
    const packet = await getCsvHandoffReleaseNotesPacket(fixtureOptions);
    const repeated = await getCsvHandoffReleaseNotesPacket(fixtureOptions);

    expect(packet).toEqual(repeated);
    expect(packet.fingerprint).toMatch(fingerprintPattern());
    expect(packet).toMatchObject({
      contentType: CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
      packetVersion: 1,
      status: "blocked",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      capabilityCount: 16,
      supportedEntityOperationCount: 16,
      unsupportedEntityOperationCount: 24,
      statusCounts: {
        stable: 0,
        watch: 2,
        blocked: 8
      },
      operationStatusCounts: {
        stable: 0,
        watch: 1,
        blocked: 3
      },
      entityOperationStatusCounts: {
        stable: 6,
        watch: 10,
        blocked: 24
      },
      fixtureRollup: {
        fixtureOperationCount: 16,
        exportFixtureCount: CSV_EXPORT_ENTITIES.length,
        importFixtureCount: CSV_IMPORT_PREVIEW_ENTITIES.length
      },
      source: {
        releaseVerificationContentType:
          CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
        releaseVerificationManifestVersion: 1,
        releaseDigestContentType: CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
        releaseDigestVersion: 1,
        operatorFixtureContentType: CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE,
        operatorFixtureBundleVersion: 1,
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
    expect(packet.source.releaseVerificationFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(packet.source.releaseDigestFingerprint).toMatch(fingerprintPattern());
    expect(packet.source.operatorFixtureFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(packet.source.contractDriftFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(packet.releaseNote).toMatchObject({
      title: "CSV handoff closure release digest",
      readyForReleaseNotes: true,
      safeForCurrentSprint: true,
      requiresContractChange: false
    });
    expect(packet.entities.map((entity) => entity.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(packet.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
    expect(packet.sourceContentTypes).toEqual(
      expect.arrayContaining([
        CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
        CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
        CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
        CSV_OPERATOR_FIXTURE_BUNDLE_CONTENT_TYPE
      ])
    );
  });

  it("carries source fingerprints, warning rollups, and remediation source-code rollups", async () => {
    const packet = await getCsvHandoffReleaseNotesPacket(fixtureOptions);

    expect(packet.sourceFingerprintRollup.sourceFingerprintCount).toBe(75);
    expect(packet.sourceFingerprintRollup.payloadBytes).toBeGreaterThan(0);
    expect(packet.warningCodeRollup.warningCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface"
    ]);
    expect(packet.sourceCodeRollup.sourceCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface",
      "unsupported-operation-gap"
    ]);
    expect(packet.warningCodeRollup.entries[0]).toMatchObject({
      code: "export-field-only",
      occurrenceCount: 10
    });
    expect(packet.sourceCodeRollup.entries[1]).toMatchObject({
      code: "unsupported-import-direction",
      occurrenceCount: 24,
      requiresContractChangeCount: 24
    });
  });

  it("publishes entity release-note packets with supported operation and fixture counts", async () => {
    const entities = await listCsvHandoffReleaseNotesEntityPackets(
      fixtureOptions
    );
    const contacts = await getCsvHandoffReleaseNotesEntityPacket(
      "contacts",
      fixtureOptions
    );
    const accounts = await getCsvHandoffReleaseNotesEntityPacket(
      "accounts",
      fixtureOptions
    );

    expect(entities.map((entity) => entity.entity)).toEqual(CSV_EXPORT_ENTITIES);

    if (contacts === null || accounts === null) {
      throw new Error("Expected CSV handoff release notes entity packets");
    }

    expect(contacts).toMatchObject({
      contentType: CSV_HANDOFF_RELEASE_NOTES_PACKET_CONTENT_TYPE,
      packetVersion: 1,
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "watch",
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      supportedOperationCount: 4,
      unsupportedOperationCount: 0,
      fixtureOperationCount: 4,
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(contacts.fingerprint).toMatch(fingerprintPattern());
    expect(contacts.sourceFingerprintCount).toBeGreaterThan(0);
    expect(contacts.operations.every((operation) => operation.fixture.available))
      .toBe(true);
    expect(contacts.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    expect(accounts).toMatchObject({
      entity: "accounts",
      status: "blocked",
      supportedOperationCount: 1,
      unsupportedOperationCount: 3,
      fixtureOperationCount: 1,
      write: noWrites()
    });
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

  it("publishes operation release-note packets with fixture availability by entity", async () => {
    const operations = await listCsvHandoffReleaseNotesOperationPackets(
      fixtureOptions
    );
    const exportPacket = await getCsvHandoffReleaseNotesOperationPacket(
      "export",
      fixtureOptions
    );
    const importPreflightPacket =
      await getCsvHandoffReleaseNotesOperationPacket(
        "import-preflight",
        fixtureOptions
      );

    expect(operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (exportPacket === null || importPreflightPacket === null) {
      throw new Error("Expected CSV handoff release notes operation packets");
    }

    expect(exportPacket).toMatchObject({
      operation: "export",
      status: "watch",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_EXPORT_ENTITIES.length,
      unsupportedEntityCount: 0,
      fixtureEntityCount: CSV_EXPORT_ENTITIES.length,
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(exportPacket.fingerprint).toMatch(fingerprintPattern());
    expect(
      exportPacket.entities.every(
        (entity) =>
          entity.fixture.available &&
          entity.fixture.kind === "export-delivery-packet"
      )
    ).toBe(true);

    expect(importPreflightPacket).toMatchObject({
      operation: "import-preflight",
      status: "blocked",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      fixtureEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      write: noWrites()
    });
    expect(
      importPreflightPacket.entities
        .filter((entity) => entity.fixture.available)
        .map((entity) => entity.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
  });

  it("keeps release-note packet construction no-write and rejects unknown keys", async () => {
    const before = await countReleaseNotesWriteState();
    const packet = await getCsvHandoffReleaseNotesPacket(fixtureOptions);
    const after = await countReleaseNotesWriteState();

    expect(after).toEqual(before);
    expect(packet.write).toEqual(noWrites());

    for (const entity of packet.entities) {
      expect(entity.write).toEqual(noWrites());

      for (const operation of entity.operations) {
        expect(operation.write).toEqual(noWrites());
      }
    }

    for (const operation of packet.operations) {
      expect(operation.write).toEqual(noWrites());

      for (const entity of operation.entities) {
        expect(entity.write).toEqual(noWrites());
      }
    }

    expect(isCsvHandoffReleaseNotesEntity("contacts")).toBe(true);
    expect(isCsvHandoffReleaseNotesEntity("salesforce-sync")).toBe(false);
    expect(
      await getCsvHandoffReleaseNotesEntityPacket("salesforce-sync")
    ).toBeNull();
    expect(isCsvHandoffReleaseNotesOperation("export")).toBe(true);
    expect(isCsvHandoffReleaseNotesOperation("sync")).toBe(false);
    expect(await getCsvHandoffReleaseNotesOperationPacket("sync")).toBeNull();
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

async function countReleaseNotesWriteState() {
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
