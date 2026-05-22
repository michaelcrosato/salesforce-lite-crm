import { describe, expect, it } from "vitest";
import { CSV_CAPABILITY_OPERATIONS } from "@/lib/server/csvCapabilities";
import { CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE } from "@/lib/server/csvContractReleaseDigest";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_IMPORT_PREVIEW_ENTITIES } from "@/lib/server/csvImportPreview";
import { CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE } from "@/lib/server/csvReleaseClosureScorecards";
import { CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE } from "@/lib/server/csvReleaseDispositionManifests";
import { CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE } from "@/lib/server/csvReleaseExceptionRegisters";
import {
  CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
  getCsvReleaseReadinessEntityPacket,
  getCsvReleaseReadinessOperationPacket,
  getCsvReleaseReadinessPacket,
  isCsvReleaseReadinessEntity,
  isCsvReleaseReadinessOperation,
  listCsvReleaseReadinessEntityPackets,
  listCsvReleaseReadinessOperationPackets
} from "@/lib/server/csvReleaseReadinessPackets";
import { CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE } from "@/lib/server/csvReleaseVerificationManifests";
import { prisma } from "@/lib/prisma";

const fixtureOptions = {
  exportLimit: 1,
  importPreviewLimit: 2,
  importSampleLimit: 1
};

describe("server CSV release readiness packets", () => {
  it("publishes deterministic root readiness metadata from release surfaces", async () => {
    const packet = await getCsvReleaseReadinessPacket(fixtureOptions);
    const repeated = await getCsvReleaseReadinessPacket(fixtureOptions);

    expect(packet).toEqual(repeated);
    expect(packet.fingerprint).toMatch(fingerprintPattern());
    expect(packet).toMatchObject({
      contentType: CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
      packetVersion: 1,
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      readinessCount: 40,
      passReadinessCount: 6,
      watchReadinessCount: 10,
      blockReadinessCount: 24,
      supportedReadinessCount: 16,
      unsupportedReadinessCount: 24,
      missingFixtureReadinessCount: 24,
      remediationAnchorCount: 34,
      watchRemediationAnchorCount: 10,
      blockRemediationAnchorCount: 24,
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
      dispositionStatusCounts: {
        pass: 6,
        watch: 10,
        block: 24
      },
      verificationStatusCounts: {
        pass: 6,
        watch: 10,
        block: 24
      },
      closureStatusCounts: {
        pass: 6,
        watch: 10,
        block: 24
      },
      exceptionSeverityCounts: {
        watch: 10,
        block: 24
      },
      releaseConsumerSummary: {
        title: "CSV release readiness packet",
        status: "block",
        statusLabel: "blocked",
        passTotal: 6,
        watchTotal: 10,
        blockTotal: 24,
        remediationAnchorCount: 34,
        safeForCurrentSprint: true,
        requiresContractChange: true,
        noWriteGuarantee:
          "Readiness packets are read-only metadata and add no routes, product UI, persistence, database writes, approval workflows, background jobs, integrations, or CSV apply flow."
      },
      source: {
        releaseDispositionContentType:
          CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
        releaseDispositionManifestVersion: 1,
        releaseDigestContentType: CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
        releaseDigestVersion: 1,
        releaseVerificationContentType:
          CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
        releaseVerificationManifestVersion: 1,
        releaseClosureContentType: CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
        releaseClosureScorecardVersion: 1,
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
    expect(packet.source.releaseDispositionFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(packet.source.releaseDigestFingerprint).toMatch(fingerprintPattern());
    expect(packet.source.releaseVerificationFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(packet.source.releaseClosureFingerprint).toMatch(fingerprintPattern());
    expect(packet.source.releaseExceptionFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(packet.sourceFingerprints.map((source) => source.source)).toEqual([
      "release-disposition-manifest",
      "contract-release-digest",
      "release-verification-manifest",
      "release-closure-scorecard",
      "release-exception-register"
    ]);
    expect(packet.sourceContentTypes).toEqual(
      expect.arrayContaining([
        CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
        CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
        CSV_CONTRACT_RELEASE_DIGEST_CONTENT_TYPE,
        CSV_RELEASE_VERIFICATION_MANIFEST_CONTENT_TYPE,
        CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
        CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE
      ])
    );
    expect(packet.warningCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface"
    ]);
    expect(packet.sourceCodes).toEqual([
      "export-field-only",
      "unsupported-import-direction",
      "unsupported-operation",
      "missing-handoff-surface",
      "unsupported-operation-gap"
    ]);
    expect(packet.entities.map((entity) => entity.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(packet.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
  });

  it("indexes entity readiness packets with remediation anchors", async () => {
    const entities = await listCsvReleaseReadinessEntityPackets(fixtureOptions);
    const contacts = await getCsvReleaseReadinessEntityPacket(
      "contacts",
      fixtureOptions
    );
    const accounts = await getCsvReleaseReadinessEntityPacket(
      "accounts",
      fixtureOptions
    );

    expect(entities.map((entity) => entity.entity)).toEqual(CSV_EXPORT_ENTITIES);

    if (contacts === null || accounts === null) {
      throw new Error("Expected CSV release readiness entity packets");
    }

    expect(contacts).toMatchObject({
      contentType: CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
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
      readinessCount: 4,
      passReadinessCount: 3,
      watchReadinessCount: 1,
      blockReadinessCount: 0,
      remediationAnchorCount: 1,
      watchRemediationAnchorCount: 1,
      blockRemediationAnchorCount: 0,
      statusCounts: {
        pass: 3,
        watch: 1,
        block: 0
      },
      exceptionSeverityCounts: {
        watch: 1,
        block: 0
      },
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      releaseConsumerSummary: {
        title: "Contacts CSV release readiness",
        status: "watch",
        statusLabel: "review-before-consumption",
        passTotal: 3,
        watchTotal: 1,
        blockTotal: 0,
        remediationAnchorCount: 1,
        requiresContractChange: false
      },
      write: noWrites()
    });
    expect(contacts.fingerprint).toMatch(fingerprintPattern());
    expect(contacts.sourceFingerprints.map((source) => source.scope)).toEqual([
      "entity",
      "entity",
      "entity"
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
      hasException: true,
      exceptionSeverity: "watch",
      remediationAnchors: [
        {
          severity: "watch",
          status: "watch",
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
      ],
      trace: {
        disposition: {
          status: "watch",
          supported: true,
          fixtureAvailable: true,
          fixtureKind: "export-delivery-packet"
        },
        verification: {
          status: "watch",
          supported: true,
          warningCodes: ["export-field-only"],
          sourceCodes: ["export-field-only"]
        },
        closure: {
          status: "watch",
          releaseStatus: "watch",
          acceptanceStatus: "watch"
        },
        exception: {
          severity: "watch",
          status: "watch",
          remediation: {
            sourceCodes: ["export-field-only"]
          }
        },
        releaseDigest: {
          operationStatus: "watch",
          releaseNoteStatus: "review-before-ui",
          safeForCurrentSprint: true,
          requiresContractChange: false
        }
      },
      write: noWrites()
    });
    expect(contactExport?.fingerprint).toMatch(fingerprintPattern());
    expect(contactExport?.trace.disposition.fingerprint).toMatch(
      fingerprintPattern()
    );
    expect(contactExport?.trace.exception?.fingerprint).toMatch(
      fingerprintPattern()
    );

    expect(contactImportPreview).toMatchObject({
      status: "pass",
      hasException: false,
      exceptionSeverity: null,
      remediationAnchors: [],
      trace: {
        disposition: {
          status: "ready"
        },
        verification: {
          status: "stable"
        },
        closure: {
          status: "ready",
          releaseStatus: "stable",
          acceptanceStatus: "pass"
        },
        exception: null
      },
      write: noWrites()
    });

    expect(accounts).toMatchObject({
      entity: "accounts",
      status: "block",
      readinessCount: 4,
      passReadinessCount: 0,
      watchReadinessCount: 1,
      blockReadinessCount: 3,
      remediationAnchorCount: 4,
      exceptionSeverityCounts: {
        watch: 1,
        block: 3
      },
      supportedReadinessCount: 1,
      unsupportedReadinessCount: 3,
      missingFixtureReadinessCount: 3,
      write: noWrites()
    });
  });

  it("indexes operation readiness packets with release-consumer summaries", async () => {
    const operations = await listCsvReleaseReadinessOperationPackets(
      fixtureOptions
    );
    const exportPacket = await getCsvReleaseReadinessOperationPacket(
      "export",
      fixtureOptions
    );
    const preflightPacket = await getCsvReleaseReadinessOperationPacket(
      "import-preflight",
      fixtureOptions
    );

    expect(operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );

    if (exportPacket === null || preflightPacket === null) {
      throw new Error("Expected CSV release readiness operation packets");
    }

    expect(exportPacket).toMatchObject({
      contentType: CSV_RELEASE_READINESS_PACKET_CONTENT_TYPE,
      packetVersion: 1,
      operation: "export",
      status: "watch",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_EXPORT_ENTITIES.length,
      unsupportedEntityCount: 0,
      fixtureEntityCount: CSV_EXPORT_ENTITIES.length,
      readinessCount: CSV_EXPORT_ENTITIES.length,
      passReadinessCount: 0,
      watchReadinessCount: CSV_EXPORT_ENTITIES.length,
      blockReadinessCount: 0,
      remediationAnchorCount: CSV_EXPORT_ENTITIES.length,
      statusCounts: {
        pass: 0,
        watch: CSV_EXPORT_ENTITIES.length,
        block: 0
      },
      warningCodes: ["export-field-only"],
      sourceCodes: ["export-field-only"],
      releaseConsumerSummary: {
        title: "export CSV release readiness",
        status: "watch",
        statusLabel: "review-before-consumption",
        passTotal: 0,
        watchTotal: CSV_EXPORT_ENTITIES.length,
        blockTotal: 0,
        remediationAnchorCount: CSV_EXPORT_ENTITIES.length,
        requiresContractChange: false
      },
      write: noWrites()
    });
    expect(exportPacket.fingerprint).toMatch(fingerprintPattern());
    expect(exportPacket.sourceFingerprints.map((source) => source.scope)).toEqual([
      "operation",
      "operation",
      "operation"
    ]);
    expect(
      exportPacket.items.every(
        (item) =>
          item.status === "watch" &&
          item.hasException &&
          item.remediationAnchors[0]?.nextAction.code ===
            "review-directional-field-coverage"
      )
    ).toBe(true);

    expect(preflightPacket).toMatchObject({
      operation: "import-preflight",
      status: "block",
      entityCount: CSV_EXPORT_ENTITIES.length,
      supportedEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      unsupportedEntityCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      fixtureEntityCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      passReadinessCount: CSV_IMPORT_PREVIEW_ENTITIES.length,
      watchReadinessCount: 0,
      blockReadinessCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      remediationAnchorCount:
        CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length,
      exceptionSeverityCounts: {
        watch: 0,
        block: CSV_EXPORT_ENTITIES.length - CSV_IMPORT_PREVIEW_ENTITIES.length
      },
      write: noWrites()
    });
    expect(
      preflightPacket.items
        .filter((item) => item.status === "pass")
        .map((item) => item.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(
      preflightPacket.items
        .filter((item) => item.status === "block")
        .every(
          (item) =>
            !item.supported &&
            !item.fixtureAvailable &&
            item.remediationAnchors[0]?.nextAction.code ===
              "keep-unsupported-operation-excluded"
        )
    ).toBe(true);
  });

  it("keeps readiness packet construction no-write and rejects unknown keys", async () => {
    const before = await countReadinessWriteState();
    const packet = await getCsvReleaseReadinessPacket(fixtureOptions);
    const after = await countReadinessWriteState();

    expect(after).toEqual(before);
    expect(packet.write).toEqual(noWrites());

    for (const entity of packet.entities) {
      expect(entity.write).toEqual(noWrites());

      for (const item of entity.items) {
        expect(item.write).toEqual(noWrites());
      }
    }

    for (const operation of packet.operations) {
      expect(operation.write).toEqual(noWrites());

      for (const item of operation.items) {
        expect(item.write).toEqual(noWrites());
      }
    }

    expect(isCsvReleaseReadinessEntity("contacts")).toBe(true);
    expect(isCsvReleaseReadinessEntity("salesforce-sync")).toBe(false);
    expect(
      await getCsvReleaseReadinessEntityPacket("salesforce-sync")
    ).toBeNull();
    expect(isCsvReleaseReadinessOperation("export")).toBe(true);
    expect(isCsvReleaseReadinessOperation("sync")).toBe(false);
    expect(await getCsvReleaseReadinessOperationPacket("sync")).toBeNull();
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

async function countReadinessWriteState() {
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
