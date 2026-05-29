import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  BULK_LIST_SELECTION_CONTRACT_CONTENT_TYPE,
  BULK_LIST_SELECTION_ENTITIES,
  getBulkListSelectionContract,
  getBulkListSelectionContractCatalog,
  isBulkListSelectionEntity,
  listBulkListSelectionEntities
} from "@/lib/server/bulkListSelectionContracts";

const noCatalogWrites = {
  database: false,
  mutations: false,
  schemas: false,
  routes: false,
  files: false,
  externalServices: false,
  backgroundJobs: false
};

const metadataOnlyReads = {
  metadata: true,
  database: false,
  adapterInternals: false
};

describe("server bulk list selection contracts", () => {
  it("publishes deterministic root selection metadata for current CRM lists", () => {
    const catalog = getBulkListSelectionContractCatalog();

    expect(listBulkListSelectionEntities()).toEqual(BULK_LIST_SELECTION_ENTITIES);
    expect(catalog).toMatchObject({
      contentType: BULK_LIST_SELECTION_CONTRACT_CONTENT_TYPE,
      catalogType: "bulk-list-selection-contract-catalog",
      entityCount: 10,
      maxSelectedRecords: 200,
      source: {
        listFilterCatalog: "lib/server/listFilterSupportCatalog.ts",
        dryRunService: "lib/server/bulkActionDryRun.ts",
        selectedExportPacketService:
          "lib/server/bulkActionSelectedExportPackets.ts",
        executionService: "lib/server/bulkActionExecution.ts",
        savedViewService: "lib/services/savedListViews.ts"
      },
      read: metadataOnlyReads,
      write: noCatalogWrites
    });
    expect(catalog.entities.map((contract) => contract.entity)).toEqual([
      "accounts",
      "contacts",
      "opportunities",
      "leads",
      "activities",
      "dealer-orders",
      "areas",
      "tasks",
      "cases",
      "campaigns"
    ]);
  });

  it("describes visible-row ID selection for list-page downstream services", () => {
    const contactContract = requireSelectionContract("contacts");

    expect(contactContract).toMatchObject({
      contractType: "bulk-list-selection-contract",
      entity: "contacts",
      label: "Contacts",
      listState: {
        route: "/contacts",
        sourceModule: "lib/crm/crmClient.ts",
        sourceSurface: "lib/crm/crmClient.ts#listContacts",
        defaultSortBy: "lastName",
        defaultSortOrder: "asc",
        filterCount: 3,
        sortKeyCount: 4,
        paginationPreserved: true,
        filtersPreserved: true,
        sortsPreserved: true,
        savedViewsPreserved: true,
        savedViewSource: "lib/services/savedListViews.ts#buildSavedListViewQuery"
      },
      selection: {
        recordIdsField: "recordIds",
        recordIdField: "id",
        ordering: "visible-list-order",
        duplicatePolicy: "dedupe-first-occurrence",
        missingRecordPolicy: "downstream-not-found",
        maxSelectedRecords: 200
      },
      read: metadataOnlyReads,
      write: noCatalogWrites
    });
    expect(contactContract.downstream.dryRun).toEqual({
      source: "lib/server/bulkActionDryRun.ts#dryRunBulkAction",
      entityField: "entity",
      actionField: "action",
      recordIdsField: "recordIds",
      acceptedActions: [
        "status_update",
        "stage_update",
        "owner_assignment",
        "task_creation",
        "selected_export"
      ],
      maxSelectedRecords: 200,
      wouldMutate: false,
      requiresApproval: false,
      write: noCatalogWrites
    });
    expect(contactContract.downstream.selectedExport).toEqual({
      source:
        "lib/server/bulkActionSelectedExportPackets.ts#getBulkActionSelectedExportPacket",
      packetType: "bulk-action-selected-export-packet",
      entityField: "entity",
      recordIdsField: "recordIds",
      supported: true,
      action: "selected_export",
      wouldMutate: false,
      requiresApproval: false,
      write: {
        database: false,
        mutations: false,
        auditEvents: false,
        files: false,
        externalServices: false,
        backgroundJobs: false
      }
    });
  });

  it("carries execution support without treating the selection catalog as a write", () => {
    const accountContract = requireSelectionContract("accounts");
    const opportunityContract = requireSelectionContract("opportunities");
    const dealerOrderContract = requireSelectionContract("dealer-orders");

    expect(accountContract.downstream.execution).toMatchObject({
      source: "lib/server/bulkActionExecution.ts#executeBulkAction",
      mode: "bulk_action_execution",
      entityField: "entity",
      actionField: "action",
      recordIdsField: "recordIds",
      supportedActions: [
        "status_update",
        "owner_assignment",
        "task_creation"
      ],
      requiresConfirmation: true,
      requiresApproval: false,
      write: {
        database: true,
        mutations: true,
        auditEvents: true,
        approvals: false,
        files: false,
        externalServices: false,
        backgroundJobs: false
      }
    });
    expect(opportunityContract.downstream.execution.supportedActions).toEqual([
      "stage_update",
      "owner_assignment",
      "task_creation"
    ]);
    expect(dealerOrderContract.downstream.execution.supportedActions).toEqual(
      []
    );
    expect(accountContract.write).toEqual(noCatalogWrites);
    expect(opportunityContract.write).toEqual(noCatalogWrites);
    expect(dealerOrderContract.write).toEqual(noCatalogWrites);
  });

  it("keeps selection contract construction strict and no-write", async () => {
    const countsBefore = await currentCounts();

    expect(isBulkListSelectionEntity("tasks")).toBe(true);
    expect(isBulkListSelectionEntity("notes")).toBe(false);
    expect(getBulkListSelectionContract("notes")).toBeNull();
    expect(() =>
      getBulkListSelectionContractCatalog({ includeRows: true })
    ).toThrow(/Unrecognized key: .*includeRows/);
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

function requireSelectionContract(entity: string) {
  const contract = getBulkListSelectionContract(entity);

  if (contract === null) {
    throw new Error(`Expected bulk list selection contract for ${entity}`);
  }

  return contract;
}

async function currentCounts() {
  const [
    accounts,
    contacts,
    deals,
    leads,
    activities,
    dealerOrders,
    areas,
    tasks,
    cases,
    campaigns,
    auditEvents
  ] = await Promise.all([
    prisma.account.count(),
    prisma.contact.count(),
    prisma.deal.count(),
    prisma.lead.count(),
    prisma.activity.count(),
    prisma.dealerOrder.count(),
    prisma.area.count(),
    prisma.task.count(),
    prisma.case.count(),
    prisma.campaign.count(),
    prisma.auditEvent.count()
  ]);

  return {
    accounts,
    contacts,
    deals,
    leads,
    activities,
    dealerOrders,
    areas,
    tasks,
    cases,
    campaigns,
    auditEvents
  };
}
