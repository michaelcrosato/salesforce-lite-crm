import { z } from "zod";
import {
  BULK_ACTION_DRY_RUN_ACTIONS,
  BULK_ACTION_DRY_RUN_MAX_RECORDS,
  type BulkActionDryRunAction
} from "@/lib/server/bulkActionDryRun";
import {
  getBulkActionExecutionDefinition,
  type BulkActionExecutionAction,
  type BulkActionExecutionWriteFlags
} from "@/lib/server/bulkActionExecution";
import {
  getBulkActionSelectedExportPacketDefinition,
  type BulkActionSelectedExportWriteFlags
} from "@/lib/server/bulkActionSelectedExportPackets";
import {
  LIST_FILTER_SUPPORT_ENTITIES,
  getListFilterSupportEntityCatalog,
  isListFilterSupportEntity,
  type ListFilterSupportEntity,
  type ListFilterSupportReadFlags,
  type ListFilterSupportWriteFlags
} from "@/lib/server/listFilterSupportCatalog";
import type { SortOrder } from "@/lib/services/listQuery";

export const BULK_LIST_SELECTION_CONTRACT_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const BULK_LIST_SELECTION_ENTITIES = LIST_FILTER_SUPPORT_ENTITIES;

export type BulkListSelectionEntity = ListFilterSupportEntity;

export type BulkListSelectionReadFlags = ListFilterSupportReadFlags;

export type BulkListSelectionWriteFlags = ListFilterSupportWriteFlags;

export type BulkListSelectionInputContract = {
  recordIdsField: "recordIds";
  recordIdField: "id";
  ordering: "visible-list-order";
  duplicatePolicy: "dedupe-first-occurrence";
  missingRecordPolicy: "downstream-not-found";
  maxSelectedRecords: typeof BULK_ACTION_DRY_RUN_MAX_RECORDS;
};

export type BulkListSelectionListStateContract = {
  route: string;
  sourceModule: string;
  sourceSurface: string;
  defaultSortBy: string;
  defaultSortOrder: SortOrder;
  filterCount: number;
  sortKeyCount: number;
  paginationPreserved: true;
  filtersPreserved: true;
  sortsPreserved: true;
  savedViewsPreserved: true;
  savedViewSource: "lib/services/savedListViews.ts#buildSavedListViewQuery";
};

export type BulkListSelectionDryRunContract = {
  source: "lib/server/bulkActionDryRun.ts#dryRunBulkAction";
  entityField: "entity";
  actionField: "action";
  recordIdsField: "recordIds";
  acceptedActions: readonly BulkActionDryRunAction[];
  maxSelectedRecords: typeof BULK_ACTION_DRY_RUN_MAX_RECORDS;
  wouldMutate: false;
  requiresApproval: false;
  write: BulkListSelectionWriteFlags;
};

export type BulkListSelectionSelectedExportContract = {
  source: "lib/server/bulkActionSelectedExportPackets.ts#getBulkActionSelectedExportPacket";
  packetType: "bulk-action-selected-export-packet";
  entityField: "entity";
  recordIdsField: "recordIds";
  supported: true;
  action: "selected_export";
  wouldMutate: false;
  requiresApproval: false;
  write: BulkActionSelectedExportWriteFlags;
};

export type BulkListSelectionExecutionContract = {
  source: "lib/server/bulkActionExecution.ts#executeBulkAction";
  mode: "bulk_action_execution";
  entityField: "entity";
  actionField: "action";
  recordIdsField: "recordIds";
  supportedActions: readonly BulkActionExecutionAction[];
  requiresConfirmation: true;
  requiresApproval: false;
  write: BulkActionExecutionWriteFlags;
};

export type BulkListSelectionDownstreamContracts = {
  dryRun: BulkListSelectionDryRunContract;
  selectedExport: BulkListSelectionSelectedExportContract;
  execution: BulkListSelectionExecutionContract;
};

export type BulkListSelectionContract = {
  contractType: "bulk-list-selection-contract";
  entity: BulkListSelectionEntity;
  label: string;
  listState: BulkListSelectionListStateContract;
  selection: BulkListSelectionInputContract;
  downstream: BulkListSelectionDownstreamContracts;
  read: BulkListSelectionReadFlags;
  write: BulkListSelectionWriteFlags;
};

export type BulkListSelectionContractCatalog = {
  contentType: typeof BULK_LIST_SELECTION_CONTRACT_CONTENT_TYPE;
  catalogType: "bulk-list-selection-contract-catalog";
  entityCount: number;
  maxSelectedRecords: typeof BULK_ACTION_DRY_RUN_MAX_RECORDS;
  entities: readonly BulkListSelectionContract[];
  source: {
    listFilterCatalog: "lib/server/listFilterSupportCatalog.ts";
    dryRunService: "lib/server/bulkActionDryRun.ts";
    selectedExportPacketService: "lib/server/bulkActionSelectedExportPackets.ts";
    executionService: "lib/server/bulkActionExecution.ts";
    savedViewService: "lib/services/savedListViews.ts";
  };
  read: BulkListSelectionReadFlags;
  write: BulkListSelectionWriteFlags;
};

const catalogInputSchema = z.object({}).strict();

function noWrites(): BulkListSelectionWriteFlags {
  return {
    database: false,
    mutations: false,
    schemas: false,
    routes: false,
    files: false,
    externalServices: false,
    backgroundJobs: false
  };
}

function metadataOnlyReads(): BulkListSelectionReadFlags {
  return {
    metadata: true,
    database: false,
    adapterInternals: false
  };
}

function selectionInput(): BulkListSelectionInputContract {
  return {
    recordIdsField: "recordIds",
    recordIdField: "id",
    ordering: "visible-list-order",
    duplicatePolicy: "dedupe-first-occurrence",
    missingRecordPolicy: "downstream-not-found",
    maxSelectedRecords: BULK_ACTION_DRY_RUN_MAX_RECORDS
  };
}

function dryRunContract(): BulkListSelectionDryRunContract {
  return {
    source: "lib/server/bulkActionDryRun.ts#dryRunBulkAction",
    entityField: "entity",
    actionField: "action",
    recordIdsField: "recordIds",
    acceptedActions: [...BULK_ACTION_DRY_RUN_ACTIONS],
    maxSelectedRecords: BULK_ACTION_DRY_RUN_MAX_RECORDS,
    wouldMutate: false,
    requiresApproval: false,
    write: noWrites()
  };
}

function selectedExportContract(
  entity: BulkListSelectionEntity
): BulkListSelectionSelectedExportContract {
  const definition = getBulkActionSelectedExportPacketDefinition(entity);

  return {
    source:
      "lib/server/bulkActionSelectedExportPackets.ts#getBulkActionSelectedExportPacket",
    packetType: definition.packetType,
    entityField: "entity",
    recordIdsField: "recordIds",
    supported: true,
    action: definition.actionMetadata.action,
    wouldMutate: definition.actionMetadata.wouldMutate,
    requiresApproval: definition.actionMetadata.requiresApproval,
    write: definition.write
  };
}

function executionContract(
  entity: BulkListSelectionEntity
): BulkListSelectionExecutionContract {
  const definition = getBulkActionExecutionDefinition(entity);

  return {
    source: "lib/server/bulkActionExecution.ts#executeBulkAction",
    mode: definition.mode,
    entityField: "entity",
    actionField: "action",
    recordIdsField: "recordIds",
    supportedActions: [...definition.supportedActions],
    requiresConfirmation: true,
    requiresApproval: definition.write.approvals,
    write: definition.write
  };
}

function listStateContract(
  entity: BulkListSelectionEntity
): BulkListSelectionListStateContract {
  const catalog = getListFilterSupportEntityCatalog(entity);

  if (!catalog) {
    throw new Error(`Bulk list selection has no list catalog for ${entity}.`);
  }

  return {
    route: catalog.route,
    sourceModule: catalog.sourceModule,
    sourceSurface: catalog.sourceSurface,
    defaultSortBy: catalog.defaultSortBy,
    defaultSortOrder: catalog.defaultSortOrder,
    filterCount: catalog.filterCount,
    sortKeyCount: catalog.sortKeyCount,
    paginationPreserved: true,
    filtersPreserved: true,
    sortsPreserved: true,
    savedViewsPreserved: true,
    savedViewSource: "lib/services/savedListViews.ts#buildSavedListViewQuery"
  };
}

function buildContract(
  entity: BulkListSelectionEntity
): BulkListSelectionContract {
  const listState = listStateContract(entity);
  const selectedExport = getBulkActionSelectedExportPacketDefinition(entity);

  return {
    contractType: "bulk-list-selection-contract",
    entity,
    label: selectedExport.entityMetadata.label,
    listState,
    selection: selectionInput(),
    downstream: {
      dryRun: dryRunContract(),
      selectedExport: selectedExportContract(entity),
      execution: executionContract(entity)
    },
    read: metadataOnlyReads(),
    write: noWrites()
  };
}

export function isBulkListSelectionEntity(
  value: string
): value is BulkListSelectionEntity {
  return isListFilterSupportEntity(value);
}

export function listBulkListSelectionEntities(): BulkListSelectionEntity[] {
  return [...BULK_LIST_SELECTION_ENTITIES];
}

export function getBulkListSelectionContract(
  entity: string
): BulkListSelectionContract | null {
  if (!isBulkListSelectionEntity(entity)) {
    return null;
  }

  return buildContract(entity);
}

export function listBulkListSelectionContracts(): BulkListSelectionContract[] {
  return BULK_LIST_SELECTION_ENTITIES.map((entity) => buildContract(entity));
}

export function getBulkListSelectionContractCatalog(
  input: unknown = {}
): BulkListSelectionContractCatalog {
  catalogInputSchema.parse(input);
  const entities = listBulkListSelectionContracts();

  return {
    contentType: BULK_LIST_SELECTION_CONTRACT_CONTENT_TYPE,
    catalogType: "bulk-list-selection-contract-catalog",
    entityCount: entities.length,
    maxSelectedRecords: BULK_ACTION_DRY_RUN_MAX_RECORDS,
    entities,
    source: {
      listFilterCatalog: "lib/server/listFilterSupportCatalog.ts",
      dryRunService: "lib/server/bulkActionDryRun.ts",
      selectedExportPacketService:
        "lib/server/bulkActionSelectedExportPackets.ts",
      executionService: "lib/server/bulkActionExecution.ts",
      savedViewService: "lib/services/savedListViews.ts"
    },
    read: metadataOnlyReads(),
    write: noWrites()
  };
}
