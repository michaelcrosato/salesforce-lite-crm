import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE } from "@/lib/server/csvOperatorHandoffPackets";
import {
  CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
  getCsvContractReleaseDigest,
  getCsvContractReleaseOperationDigest,
  isCsvContractReleaseDigestOperation,
  listCsvContractReleaseOperationDigests
} from "@/lib/server/csvContractReleaseDigest";

describe("server CSV contract release digest", () => {
  it("publishes deterministic root release metadata over the handoff surface", () => {
    const digest = getCsvContractReleaseDigest();
    const repeated = getCsvContractReleaseDigest();

    expect(digest).toEqual(repeated);
    expect(digest.fingerprint).toMatch(fingerprintPattern());
    expect(digest).toMatchObject({
      contentType: CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
      digestVersion: 1,
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
        operatorHandoffContentType: CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
        operatorHandoffPacketVersion: 1,
        operatorHandoffStatus: "blocked"
      },
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(digest.source.contractDriftFingerprint).toMatch(fingerprintPattern());
    expect(digest.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
    expect(digest.releaseNote).toMatchObject({
      title: "CSV handoff closure release digest",
      statusLabel: "blocked-by-contract",
      readyForReleaseNotes: true,
      safeForCurrentSprint: true,
      requiresContractChange: false,
      noWriteGuarantee:
        "This digest is read-only metadata. It adds no routes, product UI, storage, database writes, background jobs, integrations, or CSV apply flow."
    });
    expect(digest.releaseNote.highlights).toEqual([
      "16 entity-operation pairs are supported for later UI or docs consumption.",
      "24 entity-operation pairs are explicitly documented as unsupported under the current contract."
    ]);
  });

  it("summarizes release readiness per CSV operation", () => {
    const digests = listCsvContractReleaseOperationDigests();
    const exportDigest = getCsvContractReleaseOperationDigest("export");
    const importPreviewDigest =
      getCsvContractReleaseOperationDigest("import-preview");

    expect(digests.map((digest) => digest.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (exportDigest === null || importPreviewDigest === null) {
      throw new Error("Expected release operation digests");
    }

    expect(exportDigest).toMatchObject({
      operation: "export",
      status: "watch",
      entityCount: CSV_EXPORT_ENTITIES.length,
      capabilityCount: 10,
      supportedEntityCount: 10,
      unsupportedEntityCount: 0,
      stableEntityCount: 0,
      watchEntityCount: 10,
      blockedEntityCount: 0,
      statusCounts: {
        stable: 0,
        watch: 10,
        blocked: 0
      },
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      sourceFingerprintCount: 5,
      releaseNote: {
        statusLabel: "review-before-ui",
        safeForCurrentSprint: true,
        requiresContractChange: false
      },
      write: noWrites()
    });
    expect(importPreviewDigest).toMatchObject({
      operation: "import-preview",
      status: "blocked",
      entityCount: CSV_EXPORT_ENTITIES.length,
      capabilityCount: 2,
      supportedEntityCount: 2,
      unsupportedEntityCount: 8,
      stableEntityCount: 2,
      watchEntityCount: 0,
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
      releaseNote: {
        statusLabel: "blocked-by-contract",
        safeForCurrentSprint: false,
        requiresContractChange: true
      },
      write: noWrites()
    });
  });

  it("rolls warning and remediation source codes into release-note metadata", () => {
    const digest = getCsvContractReleaseDigest();

    expect(digest.warningCodeRollup.warningCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface"
    ]);
    expect(digest.warningCodeRollup.entries).toMatchObject([
      {
        code: "export-field-only",
        entityCount: 10,
        operationCount: 1,
        occurrenceCount: 10
      },
      {
        code: "unsupported-import-direction",
        entityCount: 8,
        operationCount: 3,
        occurrenceCount: 24
      },
      {
        code: "unsupported-operation",
        entityCount: 8,
        operationCount: 3,
        occurrenceCount: 24
      },
      {
        code: "missing-handoff-surface",
        entityCount: 8,
        operationCount: 3,
        occurrenceCount: 24
      }
    ]);
    expect(digest.sourceCodeRollup.sourceCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface",
      "unsupported-operation-gap"
    ]);
    expect(digest.sourceCodeRollup.entries[0]).toMatchObject({
      code: "export-field-only",
      entityCount: 10,
      operationCount: 1,
      occurrenceCount: 10,
      safeForCurrentSprintCount: 10,
      requiresContractChangeCount: 0
    });
    expect(digest.sourceCodeRollup.entries[1]).toMatchObject({
      code: "unsupported-import-direction",
      entityCount: 8,
      operationCount: 3,
      occurrenceCount: 24,
      safeForCurrentSprintCount: 0,
      requiresContractChangeCount: 24
    });
    expect(digest.warningCodeRollup.entries[0]!.examples[0]).toEqual({
      entity: "accounts",
      operation: "export",
      status: "watch"
    });
  });

  it("publishes source fingerprint rollups without persistent baselines", () => {
    const digest = getCsvContractReleaseDigest();

    expect(digest.sourceFingerprintRollup.sourceFingerprintCount).toBe(75);
    expect(digest.sourceFingerprintRollup.payloadBytes).toBeGreaterThan(0);
    expect(
      digest.sourceFingerprintRollup.entries.map((entry) => ({
        source: entry.source,
        scope: entry.scope,
        fingerprintCount: entry.fingerprintCount,
        entityCount: entry.entities.length,
        operationCount: entry.operations.length
      }))
    ).toEqual([
      {
        source: "field-coverage-summary",
        scope: "all",
        fingerprintCount: 1,
        entityCount: 0,
        operationCount: 0
      },
      {
        source: "handoff-index",
        scope: "all",
        fingerprintCount: 1,
        entityCount: 0,
        operationCount: 0
      },
      {
        source: "operator-readiness-scorecards",
        scope: "all",
        fingerprintCount: 1,
        entityCount: 0,
        operationCount: 0
      },
      {
        source: "contract-qa-checks",
        scope: "all",
        fingerprintCount: 1,
        entityCount: 0,
        operationCount: 0
      },
      {
        source: "operator-remediation-runbooks",
        scope: "all",
        fingerprintCount: 1,
        entityCount: 0,
        operationCount: 0
      },
      {
        source: "field-coverage-summary",
        scope: "entity",
        fingerprintCount: 10,
        entityCount: 10,
        operationCount: 0
      },
      {
        source: "handoff-index",
        scope: "entity",
        fingerprintCount: 10,
        entityCount: 10,
        operationCount: 0
      },
      {
        source: "operator-readiness-scorecards",
        scope: "entity",
        fingerprintCount: 10,
        entityCount: 10,
        operationCount: 0
      },
      {
        source: "contract-qa-checks",
        scope: "entity",
        fingerprintCount: 10,
        entityCount: 10,
        operationCount: 0
      },
      {
        source: "operator-remediation-runbooks",
        scope: "entity",
        fingerprintCount: 10,
        entityCount: 10,
        operationCount: 0
      },
      {
        source: "field-coverage-summary",
        scope: "operation",
        fingerprintCount: 4,
        entityCount: 0,
        operationCount: 4
      },
      {
        source: "handoff-index",
        scope: "operation",
        fingerprintCount: 4,
        entityCount: 0,
        operationCount: 4
      },
      {
        source: "operator-readiness-scorecards",
        scope: "operation",
        fingerprintCount: 4,
        entityCount: 0,
        operationCount: 4
      },
      {
        source: "contract-qa-checks",
        scope: "operation",
        fingerprintCount: 4,
        entityCount: 0,
        operationCount: 4
      },
      {
        source: "operator-remediation-runbooks",
        scope: "operation",
        fingerprintCount: 4,
        entityCount: 0,
        operationCount: 4
      }
    ]);

    for (const entry of digest.sourceFingerprintRollup.entries) {
      expect(entry.fingerprints.every((fingerprint) => fingerprintPattern().test(fingerprint)))
        .toBe(true);
    }
  });

  it("keeps digest helpers no-write and rejects unknown operations", () => {
    const digest = getCsvContractReleaseDigest();

    expect(digest.write).toEqual(noWrites());

    for (const operation of digest.operations) {
      expect(operation.write).toEqual(noWrites());
    }

    expect(isCsvContractReleaseDigestOperation("export")).toBe(true);
    expect(isCsvContractReleaseDigestOperation("sync")).toBe(false);
    expect(getCsvContractReleaseOperationDigest("sync")).toBeNull();
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
