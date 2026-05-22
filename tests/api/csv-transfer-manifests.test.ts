import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  CSV_EXPORT_CONTENT_TYPE,
  CSV_EXPORT_DEFAULT_LIMIT,
  CSV_EXPORT_ENTITIES,
  CSV_EXPORT_MAX_LIMIT,
  CSV_EXPORT_PREVIEW_DEFAULT_LIMIT,
  CSV_EXPORT_PREVIEW_MAX_LIMIT
} from "@/lib/server/csvExport";
import {
  CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
  CSV_IMPORT_PREVIEW_ENTITIES,
  CSV_IMPORT_PREVIEW_MAX_LIMIT
} from "@/lib/server/csvImportPreview";
import {
  CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
  CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
} from "@/lib/server/csvImportReviewBundles";
import { CSV_IMPORT_TEMPLATE_CONTENT_TYPE } from "@/lib/server/csvImportTemplates";
import {
  CSV_TRANSFER_MANIFEST_CONTENT_TYPE,
  getCsvExportTransferManifest,
  getCsvImportDryRunTransferManifest,
  getCsvTransferManifestDefinition,
  isCsvTransferManifestEntity,
  isCsvTransferManifestOperation,
  listCsvTransferManifestDefinitions,
  listCsvTransferManifests
} from "@/lib/server/csvTransferManifests";

const accountId = "test-csv-transfer-account";
const contactId = "test-csv-transfer-contact";

describe("server CSV transfer manifests", () => {
  beforeEach(async () => {
    await cleanupCsvTransferFixtures();
    await createCsvTransferFixtures();
  });

  afterEach(async () => {
    await cleanupCsvTransferFixtures();
  });

  it("publishes deterministic manifest definitions for both transfer surfaces", () => {
    const definitions = listCsvTransferManifestDefinitions();
    const exportDefinitions = definitions.filter(
      (definition) => definition.operation === "export-delivery"
    );
    const importDefinitions = definitions.filter(
      (definition) => definition.operation === "import-dry-run"
    );
    const contactExport = getCsvTransferManifestDefinition(
      "export-delivery",
      "contacts"
    );
    const contactImport = getCsvTransferManifestDefinition(
      "import-dry-run",
      "contacts"
    );

    expect(exportDefinitions.map((definition) => definition.entity)).toEqual(
      CSV_EXPORT_ENTITIES
    );
    expect(importDefinitions.map((definition) => definition.entity)).toEqual(
      CSV_IMPORT_PREVIEW_ENTITIES
    );
    expect(contactExport).toMatchObject({
      operation: "export-delivery",
      entity: "contacts",
      route: "/contacts",
      filenames: {
        csv: "contacts.csv",
        template: null,
        manifest: "contacts-export-delivery-manifest.json"
      },
      contentTypes: {
        input: null,
        output: CSV_EXPORT_CONTENT_TYPE,
        manifest: CSV_TRANSFER_MANIFEST_CONTENT_TYPE
      },
      limits: {
        exportRows: {
          defaultLimit: CSV_EXPORT_DEFAULT_LIMIT,
          maxLimit: CSV_EXPORT_MAX_LIMIT
        },
        previewRows: {
          defaultLimit: CSV_EXPORT_PREVIEW_DEFAULT_LIMIT,
          maxLimit: CSV_EXPORT_PREVIEW_MAX_LIMIT
        },
        sampleRows: null
      },
      source: {
        inputRequired: false,
        inputFields: []
      },
      read: {
        metadata: true,
        database: true,
        csvInput: false,
        csvOutput: true
      },
      write: noWrites()
    });
    expect(contactImport).toMatchObject({
      operation: "import-dry-run",
      entity: "contacts",
      route: "/contacts",
      filenames: {
        csv: "contacts-import-template.csv",
        template: "contacts-import-template.csv",
        manifest: "contacts-import-dry-run-manifest.json"
      },
      contentTypes: {
        input: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
        output: null,
        manifest: CSV_TRANSFER_MANIFEST_CONTENT_TYPE
      },
      limits: {
        exportRows: null,
        previewRows: {
          defaultLimit: CSV_IMPORT_PREVIEW_DEFAULT_LIMIT,
          maxLimit: CSV_IMPORT_PREVIEW_MAX_LIMIT
        },
        sampleRows: {
          defaultLimit: CSV_IMPORT_REVIEW_BUNDLE_DEFAULT_SAMPLE_LIMIT,
          maxLimit: CSV_IMPORT_REVIEW_BUNDLE_MAX_SAMPLE_LIMIT
        }
      },
      source: {
        inputRequired: true,
        inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
        inputTemplateFilename: "contacts-import-template.csv",
        requiredInputFields: ["firstName", "lastName", "status"],
        requiredInputHeaders: ["First Name", "Last Name", "Status"]
      },
      read: {
        metadata: true,
        database: true,
        csvInput: true,
        csvOutput: false
      },
      write: noWrites()
    });
  });

  it("detects transfer operations and per-operation entity ids", () => {
    expect(isCsvTransferManifestOperation("export-delivery")).toBe(true);
    expect(isCsvTransferManifestOperation("import-dry-run")).toBe(true);
    expect(isCsvTransferManifestOperation("template-download")).toBe(false);

    expect(isCsvTransferManifestEntity("export-delivery", "contacts")).toBe(true);
    expect(isCsvTransferManifestEntity("export-delivery", "dealer-orders")).toBe(
      true
    );
    expect(isCsvTransferManifestEntity("import-dry-run", "contacts")).toBe(true);
    expect(isCsvTransferManifestEntity("import-dry-run", "dealer-orders")).toBe(
      false
    );
  });

  it("builds export delivery manifests without file, history, or database writes", async () => {
    const contactRowCountBefore = await prisma.contact.count();
    const manifest = await getCsvExportTransferManifest("contacts", { limit: 1 });
    const contactRowCountAfter = await prisma.contact.count();

    expect(contactRowCountAfter).toBe(contactRowCountBefore);
    expect(manifest).toMatchObject({
      operation: "export-delivery",
      entity: "contacts",
      filenames: {
        csv: "contacts.csv",
        manifest: "contacts-export-delivery-manifest.json"
      },
      transfer: {
        packetType: "csv-export-delivery-packet",
        rowCount: 1,
        totalAvailableRows: contactRowCountBefore,
        limits: {
          requestedLimit: 1,
          appliedLimit: 1,
          defaultLimit: CSV_EXPORT_DEFAULT_LIMIT,
          maxLimit: CSV_EXPORT_MAX_LIMIT,
          truncatedByLimit: contactRowCountBefore > 1
        },
        csvIncluded: false
      },
      write: noWrites()
    });
    expect(manifest.transfer.reviewNoteCodes).toContain("preview-truncated");
  });

  it("builds import dry-run manifests with source metadata and no import writes", async () => {
    const csv = [
      "First Name,Last Name,Email,Status,Phone",
      "Clean,Ready,clean.transfer@example.test,active,604-555-0111",
      "Second,Ready,second.transfer@example.test,active,604-555-0112"
    ].join("\n");
    const contactRowCountBefore = await prisma.contact.count();
    const manifest = await getCsvImportDryRunTransferManifest("contacts", csv, {
      limit: 1,
      sampleLimit: 1
    });
    const contactRowCountAfter = await prisma.contact.count();

    expect(contactRowCountAfter).toBe(contactRowCountBefore);
    expect(manifest).toMatchObject({
      operation: "import-dry-run",
      entity: "contacts",
      filenames: {
        csv: "contacts-import-template.csv",
        template: "contacts-import-template.csv",
        manifest: "contacts-import-dry-run-manifest.json"
      },
      transfer: {
        packetType: "csv-import-dry-run-receipt",
        mode: "dry_run",
        source: {
          inputContentType: CSV_IMPORT_TEMPLATE_CONTENT_TYPE,
          characterCount: csv.length,
          lineCount: 3,
          rowCount: 2,
          previewedRows: 1,
          requestedPreviewLimit: 1,
          appliedPreviewLimit: 1,
          requestedSampleLimit: 1,
          appliedSampleLimit: 1
        },
        issueSummary: {
          errorCount: 0,
          warningCount: 0,
          affectedRows: 0
        },
        readinessSummary: {
          readyRows: 1,
          importableRows: 1
        },
        actionSummary: {
          createCandidateRows: 1,
          importableRows: 1
        },
        diagnosticCount: 0,
        rowSample: {
          sampleLimit: 1,
          sampledRows: 1,
          hasMoreRows: true
        },
        rowDataIncluded: false
      },
      write: noWrites()
    });
  });

  it("lists bounded transfer manifests for every export and import dry-run entity", async () => {
    const manifests = await listCsvTransferManifests(
      {
        contacts: [
          "First Name,Last Name,Status",
          "A,One,active",
          "B,Two,active"
        ].join("\n"),
        leads: [
          "First Name,Last Name,Postal Code,Source",
          "Riley,Park,V5K0A1,Website",
          "Jordan,Lee,V6B1A1,Referral"
        ].join("\n")
      },
      {
        exportDelivery: {
          limit: 0
        },
        importDryRun: {
          limit: 1,
          sampleLimit: 0
        }
      }
    );

    expect(
      manifests
        .filter((manifest) => manifest.operation === "export-delivery")
        .map((manifest) => manifest.entity)
    ).toEqual(CSV_EXPORT_ENTITIES);
    expect(
      manifests
        .filter((manifest) => manifest.operation === "import-dry-run")
        .map((manifest) => manifest.entity)
    ).toEqual(CSV_IMPORT_PREVIEW_ENTITIES);
    expect(
      manifests.every(
        (manifest) =>
          manifest.write.database === false &&
          manifest.write.files === false &&
          manifest.write.externalServices === false &&
          manifest.write.exportHistory === false &&
          manifest.write.scheduledDelivery === false &&
          manifest.write.backgroundJobs === false &&
          manifest.write.routingAssignments === false &&
          manifest.write.importApply === false &&
          manifest.write.bulkMutations === false
      )
    ).toBe(true);
  });
});

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
    bulkMutations: false
  };
}

async function createCsvTransferFixtures() {
  await prisma.account.create({
    data: {
      id: accountId,
      name: "CSV Transfer Manifest Account",
      status: "active",
      healthScore: 91,
      createdAt: new Date("2026-05-07T10:00:00Z"),
      updatedAt: new Date("2026-05-07T10:00:00Z")
    }
  });
  await prisma.contact.create({
    data: {
      id: contactId,
      accountId,
      firstName: "Csv",
      lastName: "Transfer",
      email: "csv.transfer@example.test",
      title: "Buyer",
      status: "active",
      createdAt: new Date("2026-05-07T11:00:00Z"),
      updatedAt: new Date("2026-05-07T11:00:00Z")
    }
  });
}

async function cleanupCsvTransferFixtures() {
  await prisma.contact.deleteMany({
    where: {
      OR: [
        { id: contactId },
        {
          email: {
            in: [
              "csv.transfer@example.test",
              "clean.transfer@example.test",
              "second.transfer@example.test"
            ]
          }
        }
      ]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: accountId
    }
  });
}
