import { describe, expect, it } from "vitest";
import {
  CSV_CAPABILITY_OPERATIONS
} from "@/lib/server/csvCapabilities";
import {
  CSV_EXPORT_ENTITIES
} from "@/lib/server/csvExport";
import {
  CSV_IMPORT_PREVIEW_ENTITIES
} from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_TEMPLATE_CONTENT_TYPE
} from "@/lib/server/csvImportTemplates";
import {
  CSV_TRANSFER_MANIFEST_OPERATIONS
} from "@/lib/server/csvTransferManifests";
import {
  CSV_HANDOFF_INDEX_CONTENT_TYPE,
  CSV_HANDOFF_PACKET_SURFACES,
  getCsvHandoffIndex,
  getCsvHandoffIndexEntry,
  isCsvHandoffIndexEntity,
  listCsvHandoffIndexEntries,
  listCsvHandoffIndexEntriesByDirection,
  listCsvHandoffIndexEntities
} from "@/lib/server/csvHandoffIndex";

describe("server CSV handoff index", () => {
  it("publishes a deterministic metadata-only index for the current CSV surface", () => {
    const exportEntityIds = new Set<string>(CSV_EXPORT_ENTITIES);
    const expectedEntities = [
      ...CSV_EXPORT_ENTITIES,
      ...CSV_IMPORT_PREVIEW_ENTITIES.filter((entity) => !exportEntityIds.has(entity))
    ];
    const index = getCsvHandoffIndex();

    expect(listCsvHandoffIndexEntities()).toEqual(expectedEntities);
    expect(index).toMatchObject({
      contentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
      entityCount: expectedEntities.length,
      operations: {
        capabilities: CSV_CAPABILITY_OPERATIONS,
        transferManifests: CSV_TRANSFER_MANIFEST_OPERATIONS,
        packets: CSV_HANDOFF_PACKET_SURFACES
      },
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(index.entries.map((entry) => entry.entity)).toEqual(expectedEntities);
    expect(
      listCsvHandoffIndexEntriesByDirection("bidirectional").map(
        (entry) => entry.entity
      )
    ).toEqual(["contacts", "leads"]);
  });

  it("ties bidirectional contact capabilities, templates, packets, and manifests", () => {
    const entry = getCsvHandoffIndexEntry("contacts");

    if (entry === null) {
      throw new Error("Expected contacts handoff index entry");
    }

    expect(entry).toMatchObject({
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      direction: "bidirectional",
      capabilities: {
        export: true,
        importPreview: true,
        importTemplate: true,
        importPreflight: true
      },
      template: {
        supported: true,
        filename: "contacts-import-template.csv",
        exampleFilename: "contacts-import-example.csv",
        requiredFieldKeys: ["firstName", "lastName", "status"],
        requiredHeaders: ["First Name", "Last Name", "Status"]
      },
      transferManifests: {
        exportDeliveryManifestFilename: "contacts-export-delivery-manifest.json",
        importDryRunManifestFilename: "contacts-import-dry-run-manifest.json"
      },
      packets: {
        exportDeliveryPacket: true,
        importDryRunReceipt: true
      },
      compatibilityReport: {
        direction: "bidirectional",
        warningCount: 1,
        warningCodes: ["export-field-only"]
      },
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(entry.surfaces.map((surface) => surface.kind)).toEqual([
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

    const importTemplate = entry.surfaces.find(
      (surface) => surface.kind === "import-template"
    );
    const importDryRunReceipt = entry.surfaces.find(
      (surface) => surface.kind === "import-dry-run-receipt"
    );
    const importManifest = entry.surfaces.find(
      (surface) => surface.kind === "import-dry-run-manifest"
    );

    expect(importTemplate).toMatchObject({
      filename: "contacts-import-template.csv",
      templateFilename: "contacts-import-template.csv",
      outputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      returnsCsv: true,
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(importDryRunReceipt).toMatchObject({
      contentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
      inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
      outputContentType: CSV_HANDOFF_INDEX_CONTENT_TYPE,
      acceptsCsvInput: true,
      returnsCsv: false,
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: false
      },
      write: noWrites()
    });
    expect(importManifest).toMatchObject({
      filename: "contacts-import-dry-run-manifest.json",
      manifestFilename: "contacts-import-dry-run-manifest.json",
      templateFilename: "contacts-import-template.csv",
      acceptsCsvInput: true,
      returnsCsv: false,
      write: noWrites()
    });
  });

  it("keeps export-only entities out of import handoff surfaces", () => {
    const entry = getCsvHandoffIndexEntry("accounts");

    if (entry === null) {
      throw new Error("Expected accounts handoff index entry");
    }

    expect(entry).toMatchObject({
      entity: "accounts",
      route: "/accounts",
      direction: "export-only",
      capabilities: {
        export: true,
        importPreview: false,
        importTemplate: false,
        importPreflight: false
      },
      template: {
        supported: false,
        filename: null,
        exampleFilename: null,
        requiredFieldKeys: [],
        requiredHeaders: []
      },
      transferManifests: {
        exportDeliveryManifestFilename: "accounts-export-delivery-manifest.json",
        importDryRunManifestFilename: null
      },
      packets: {
        exportDeliveryPacket: true,
        importDryRunReceipt: false
      }
    });
    expect(entry.surfaces.map((surface) => surface.kind)).toEqual([
      "compatibility-report",
      "export-capability",
      "export-delivery-packet",
      "export-delivery-manifest"
    ]);
    expect(entry.compatibilityReport.warningCodes).toEqual([
      "unsupported-import-direction",
      "export-field-only"
    ]);
    expect(isCsvHandoffIndexEntity("accounts")).toBe(true);
    expect(isCsvHandoffIndexEntity("salesforce-objects")).toBe(false);
    expect(getCsvHandoffIndexEntry("salesforce-objects")).toBeNull();
  });

  it("keeps every index entry and surface explicitly no-write", () => {
    for (const entry of listCsvHandoffIndexEntries()) {
      expect(entry.write).toEqual(noWrites());

      for (const surface of entry.surfaces) {
        expect(surface.write).toEqual(noWrites());
      }
    }
  });
});

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
