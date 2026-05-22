import { describe, expect, it } from "vitest";
import {
  CSV_CAPABILITY_OPERATIONS,
  listCsvCapabilities
} from "@/lib/server/csvCapabilities";
import { CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE } from "@/lib/server/csvContractDriftSnapshots";
import { CSV_EXPORT_ENTITIES } from "@/lib/server/csvExport";
import { CSV_HANDOFF_INDEX_CONTENT_TYPE } from "@/lib/server/csvHandoffIndex";
import { CSV_IMPORT_TEMPLATE_CONTENT_TYPE } from "@/lib/server/csvImportTemplates";
import { CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE } from "@/lib/server/csvOperatorReadinessScorecards";
import { CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE } from "@/lib/server/csvOperatorRemediationRunbooks";
import {
  CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
  getCsvOperatorHandoffEntityPacket,
  getCsvOperatorHandoffOperationPacket,
  getCsvOperatorHandoffPackets,
  isCsvOperatorHandoffPacketEntity,
  isCsvOperatorHandoffPacketOperation,
  listCsvOperatorHandoffEntityPackets,
  listCsvOperatorHandoffOperationPackets,
  listCsvOperatorHandoffPacketEntities
} from "@/lib/server/csvOperatorHandoffPackets";

describe("server CSV operator handoff packets", () => {
  it("publishes deterministic root packet metadata for the current CSV surface", () => {
    const packets = getCsvOperatorHandoffPackets();
    const repeated = getCsvOperatorHandoffPackets();

    expect(packets).toEqual(repeated);
    expect(listCsvOperatorHandoffPacketEntities()).toEqual(CSV_EXPORT_ENTITIES);
    expect(packets).toMatchObject({
      contentType: CSV_OPERATOR_HANDOFF_PACKET_CONTENT_TYPE,
      packetVersion: 1,
      status: "blocked",
      entityCount: CSV_EXPORT_ENTITIES.length,
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      capabilityCount: listCsvCapabilities().length,
      statusCounts: {
        stable: 0,
        watch: 2,
        blocked: 8
      },
      source: {
        capabilityOperations: CSV_CAPABILITY_OPERATIONS,
        handoffIndexContentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
        operatorReadinessContentType:
          CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
        operatorRemediationContentType:
          CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
        contractDriftContentType: CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE
      },
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(packets.source.contractDriftFingerprint).toMatch(
      fingerprintPattern()
    );
    expect(packets.entries.map((entry) => entry.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(packets.operations.map((operation) => operation.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
    expect(packets.sourceContentTypes).toEqual(
      expect.arrayContaining([
        CSV_HANDOFF_INDEX_CONTENT_TYPE,
        CSV_OPERATOR_READINESS_SCORECARD_CONTENT_TYPE,
        CSV_OPERATOR_REMEDIATION_RUNBOOK_CONTENT_TYPE,
        CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE,
        CSV_IMPORT_TEMPLATE_CONTENT_TYPE
      ])
    );
  });

  it("packages bidirectional contact capabilities and operator evidence", () => {
    const packet = getCsvOperatorHandoffEntityPacket("contacts");

    if (packet === null) {
      throw new Error("Expected contacts operator handoff packet");
    }

    expect(packet).toMatchObject({
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      status: "watch",
      operationCount: CSV_CAPABILITY_OPERATIONS.length,
      supportedOperationCount: 4,
      blockedOperationCount: 0,
      statusCounts: {
        stable: 3,
        watch: 1,
        blocked: 0
      },
      readiness: {
        status: "needs-review",
        warningCodes: ["export-field-only"]
      },
      remediation: {
        status: "needs-action",
        severity: "warning",
        remediationCount: 1,
        sourceCodes: ["export-field-only"]
      },
      handoff: {
        capabilities: {
          export: true,
          importPreview: true,
          importTemplate: true,
          importPreflight: true
        },
        packets: {
          exportDeliveryPacket: true,
          importDryRunReceipt: true
        }
      },
      write: noWrites()
    });
    expect(packet.capabilities.map((capability) => capability.operation)).toEqual(
      CSV_CAPABILITY_OPERATIONS
    );
    expect(packet.handoff.surfaceKinds).toEqual([
      "compatibility-report",
      "export-capability",
      "export-delivery-packet",
      "export-delivery-manifest",
      "import-preview-capability",
      "import-template-capability",
      "import-preflight-capability",
      "import-template",
      "import-template-example",
      "import-dry-run-receipt",
      "import-dry-run-manifest"
    ]);

    const exportOperation = packet.operations.find(
      (operation) => operation.operation === "export"
    );
    const importTemplateOperation = packet.operations.find(
      (operation) => operation.operation === "import-template"
    );

    expect(exportOperation).toMatchObject({
      status: "watch",
      supported: true,
      remediation: {
        nextAction: {
          code: "review-directional-field-coverage",
          safeForCurrentSprint: true,
          requiresContractChange: false
        }
      }
    });
    expect(importTemplateOperation).toMatchObject({
      status: "stable",
      supported: true,
      capability: {
        outputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
        returnsCsv: true
      }
    });
    expect(packet.sourceContentTypes).toContain(CSV_IMPORT_TEMPLATE_CONTENT_TYPE);
    expect(packet.read).toEqual({
      metadata: true,
      database: true,
      csvInput: true,
      csvOutput: true
    });
  });

  it("keeps export-only account import operations blocked without widening scope", () => {
    const packet = getCsvOperatorHandoffEntityPacket("accounts");

    if (packet === null) {
      throw new Error("Expected accounts operator handoff packet");
    }

    const importOperations = packet.operations.filter(
      (operation) => operation.operation !== "export"
    );

    expect(packet).toMatchObject({
      entity: "accounts",
      status: "blocked",
      supportedOperationCount: 1,
      blockedOperationCount: 3,
      handoff: {
        capabilities: {
          export: true,
          importPreview: false,
          importTemplate: false,
          importPreflight: false
        },
        packets: {
          exportDeliveryPacket: true,
          importDryRunReceipt: false
        }
      }
    });
    expect(packet.capabilities.map((capability) => capability.operation)).toEqual([
      "export"
    ]);
    expect(importOperations.map((operation) => operation.status)).toEqual([
      "blocked",
      "blocked",
      "blocked"
    ]);
    expect(importOperations[0]).toMatchObject({
      operation: "import-preview",
      supported: false,
      capability: null,
      readiness: {
        missingSurfaceKinds: ["import-preview-capability"]
      },
      remediation: {
        nextAction: {
          code: "keep-unsupported-operation-excluded",
          safeForCurrentSprint: false,
          requiresContractChange: true
        }
      }
    });
  });

  it("aggregates operation packets with supported capabilities and blocked entities", () => {
    const packet = getCsvOperatorHandoffOperationPacket("import-template");

    if (packet === null) {
      throw new Error("Expected import-template operator handoff packet");
    }

    expect(packet).toMatchObject({
      operation: "import-template",
      status: "blocked",
      entityCount: CSV_EXPORT_ENTITIES.length,
      capabilityCount: 2,
      supportedEntityCount: 2,
      stableEntityCount: 2,
      watchEntityCount: 0,
      blockedEntityCount: 8,
      statusCounts: {
        stable: 2,
        watch: 0,
        blocked: 8
      },
      write: noWrites()
    });
    expect(packet.capabilities.map((capability) => capability.entity)).toEqual([
      "contacts",
      "leads"
    ]);
    expect(
      packet.entities
        .filter((entity) => entity.status === "stable")
        .map((entity) => entity.entity)
    ).toEqual(["contacts", "leads"]);
    expect(packet.sourceContentTypes).toEqual(
      expect.arrayContaining([
        CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
        CSV_CONTRACT_DRIFT_SNAPSHOT_CONTENT_TYPE
      ])
    );
  });

  it("keeps every packet and nested summary explicitly no-write", () => {
    for (const entityPacket of listCsvOperatorHandoffEntityPackets()) {
      expect(entityPacket.write).toEqual(noWrites());

      for (const capability of entityPacket.capabilities) {
        expect(capability.write).toEqual(noWrites());
      }

      for (const operation of entityPacket.operations) {
        expect(operation.write).toEqual(noWrites());

        if (operation.capability !== null) {
          expect(operation.capability.write).toEqual(noWrites());
        }
      }
    }

    for (const operationPacket of listCsvOperatorHandoffOperationPackets()) {
      expect(operationPacket.write).toEqual(noWrites());

      for (const entity of operationPacket.entities) {
        expect(entity.write).toEqual(noWrites());
      }
    }
  });

  it("rejects unknown entities and operations", () => {
    expect(isCsvOperatorHandoffPacketEntity("contacts")).toBe(true);
    expect(isCsvOperatorHandoffPacketEntity("salesforce-sync")).toBe(false);
    expect(getCsvOperatorHandoffEntityPacket("salesforce-sync")).toBeNull();
    expect(isCsvOperatorHandoffPacketOperation("export")).toBe(true);
    expect(isCsvOperatorHandoffPacketOperation("sync")).toBe(false);
    expect(getCsvOperatorHandoffOperationPacket("sync")).toBeNull();
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
