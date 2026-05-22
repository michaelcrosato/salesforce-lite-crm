import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE } from "@/lib/server/csvContractReleaseDigest";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE } from "@/lib/server/csvOperatorHandoffPackets";
import {
  CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
  getCsvReleaseVerificationEntityManifest,
  getCsvReleaseVerificationManifest,
  getCsvReleaseVerificationOperationManifest,
  isCsvReleaseVerificationManifestEntity,
  isCsvReleaseVerificationManifestOperation,
  listCsvReleaseVerificationEntityManifests,
  listCsvReleaseVerificationOperationManifests
} from "@/lib/server/csvReleaseVerificationManifests";

describe("server CSV release verification manifests", () => {
  it("publishes deterministic root verification metadata over the release surface", () => {
    const manifest = getCsvReleaseVerificationManifest();
    const repeated = getCsvReleaseVerificationManifest();

    expect(manifest).toEqual(repeated);
    expect(manifest.fingerprint).toMatch(fingerprintPattern());
    expect(manifest).toMatchObject({
      contentType: CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
      manifestVersion: 1,
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
      source: {
        releaseDigestContentType: CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
        releaseDigestVersion: 1,
        operatorHandoffContentType: CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
        operatorHandoffPacketVersion: 1,
        operatorHandoffStatus: "blocked"
      },
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(manifest.source.releaseDigestFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(manifest.source.contractDriftFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(manifest.coverage.entities.map((entry) => entry.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(
      manifest.coverage.operations.map((entry) => entry.operation)
    ).toEqual(CSV_CAPABILITY_OPERATIONS);
    expect(manifest.sourceContentTypes).toEqual(
      expect.arrayContaining([
        CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
        CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
        CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE
      ])
    );
  });

  it("carries source fingerprints, warning rollups, and source-code rollups", () => {
    const manifest = getCsvReleaseVerificationManifest();

    expect(manifest.sourceFingerprintRollup.sourceFingerprintCount).toBe(75);
    expect(manifest.sourceFingerprintRollup.payloadBytes).toBeGreaterThan(0);
    expect(
      manifest.sourceFingerprintRollup.entries.map((entry) => ({
        source: entry.source,
        scope: entry.scope,
        fingerprintCount: entry.fingerprintCount
      }))
    ).toContainEqual({
      source: "operator-readiness-scorecards",
      scope: "operation",
      fingerprintCount: 4
    });
    expect(
      manifest.sourceFingerprintRollup.entries.every((entry) =>
        entry.fingerprints.every((fingerprint) =>
          fingerprintPattern().test(fingerprint)
        )
      )
    ).toBe(true);
    expect(manifest.warningCodeRollup.warningCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface"
    ]);
    expect(manifest.sourceCodeRollup.sourceCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface",
      "unsupported-operation-gap"
    ]);
    expect(manifest.warningCodeRollup.entries[0]).toMatchObject({
      code: "export-field-only",
      entityCount: 10,
      operationCount: 1,
      occurrenceCount: 10
    });
    expect(manifest.sourceCodeRollup.entries[1]).toMatchObject({
      code: "unsupported-import-direction",
      entityCount: 8,
      operationCount: 3,
      occurrenceCount: 24,
      requiresContractChangeCount: 24
    });
  });

  it("publishes operation verification manifests from release digest and handoff packets", () => {
    const manifests = listCsvReleaseVerificationOperationManifests();
    const exportManifest = getCsvReleaseVerificationOperationManifest("export");
    const importTemplateManifest =
      getCsvReleaseVerificationOperationManifest("import-template");

    expect(manifests.map((manifest) => manifest.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (exportManifest === null || importTemplateManifest === null) {
      throw new Error("Expected release verification operation manifests");
    }

    expect(exportManifest).toMatchObject({
      contentType: CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
      manifestVersion: 1,
      operation: "export",
      status: "watch",
      entityCount: CSV_EXPORT_ENTITIES.length,
      capabilityCount: 10,
      supportedEntityCount: 10,
      unsupportedEntityCount: 0,
      stableEntityCount: 0,
      watchEntityCount: 10,
      blockedEntityCount: 0,
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      sourceFingerprintCount: 5,
      write: noWrites()
    });
    expect(exportManifest.sourceContentTypes.length).toBeGreaterThan(0);
    expect(exportManifest.read.database).toBe(true);
    expect(importTemplateManifest).toMatchObject({
      operation: "import-template",
      status: "blocked",
      supportedEntityCount: 2,
      unsupportedEntityCount: 8,
      stableEntityCount: 2,
      blockedEntityCount: 8,
      warningCodes: [
        "unsupported-import-direction",
        "unsupported-operation",
        "missing-handoff-surface"
      ],
      sourceCodes: [
        "unsupported-import-direction",
        "unsupported-operation",
        "missing-handoff-surface",
        "unsupported-operation-gap"
      ],
      write: noWrites()
    });
  });

  it("publishes entity verification manifests with operation coverage", () => {
    const manifests = listCsvReleaseVerificationEntityManifests();
    const contactsManifest = getCsvReleaseVerificationEntityManifest("contacts");
    const accountsManifest = getCsvReleaseVerificationEntityManifest("accounts");

    expect(manifests.map((manifest) => manifest.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );

    if (contactsManifest === null || accountsManifest === null) {
      throw new Error("Expected release verification entity manifests");
    }

    expect(contactsManifest).toMatchObject({
      contentType: CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
      manifestVersion: 1,
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "watch",
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      supportedOperationCount: 4,
      unsupportedOperationCount: 0,
      blockedOperationCount: 0,
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(contactsManifest.sourceFingerprintCount).toBeGreaterThan(0);
    expect(
      contactsManifest.sourceFingerprints.every((fingerprint) =>
        fingerprintPattern().test(fingerprint.fingerprint)
      )
    ).toBe(true);
    expect(contactsManifest.operations.map((operation) => operation.operation))
      .toEqual(CSV_CAPABILITY_OPERATIONS);
    expect(
      contactsManifest.operations.find(
        (operation) => operation.operation === "export"
      )
    ).toMatchObject({
      status: "watch",
      supported: true,
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      write: noWrites()
    });
    expect(accountsManifest).toMatchObject({
      entity: "accounts",
      status: "blocked",
      supportedOperationCount: 1,
      unsupportedOperationCount: 3,
      blockedOperationCount: 3,
      write: noWrites()
    });
  });

  it("keeps every manifest no-write and rejects unknown keys", () => {
    const manifest = getCsvReleaseVerificationManifest();

    expect(manifest.write).toEqual(noWrites());

    for (const entity of manifest.coverage.entities) {
      expect(entity.write).toEqual(noWrites());

      for (const operation of entity.operations) {
        expect(operation.write).toEqual(noWrites());
      }
    }

    for (const operation of manifest.coverage.operations) {
      expect(operation.write).toEqual(noWrites());
    }

    expect(isCsvReleaseVerificationManifestEntity("contacts")).toBe(true);
    expect(isCsvReleaseVerificationManifestEntity("salesforce-sync")).toBe(false);
    expect(getCsvReleaseVerificationEntityManifest("salesforce-sync")).toBeNull();
    expect(isCsvReleaseVerificationManifestOperation("export")).toBe(true);
    expect(isCsvReleaseVerificationManifestOperation("sync")).toBe(false);
    expect(getCsvReleaseVerificationOperationManifest("sync")).toBeNull();
  });
});

function fingerprintPattern() {
  return /^[a-f0-9]{64}$/;
}

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
