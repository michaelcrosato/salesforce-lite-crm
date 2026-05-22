import { createHash } from "node:crypto";
import {
  CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE,
  getCsvOperatorWalkthroughManifest,
  isCsvOperatorWalkthroughEntity,
  isCsvOperatorWalkthroughOperation,
  type CsvOperatorWalkthroughEntity,
  type CsvOperatorWalkthroughEntityManifest,
  type CsvOperatorWalkthroughItem,
  type CsvOperatorWalkthroughManifest,
  type CsvOperatorWalkthroughOperation,
  type CsvOperatorWalkthroughOperationManifest,
  type CsvOperatorWalkthroughReadFlags,
  type CsvOperatorWalkthroughStatus
} from "@/lib/server/csvOperatorWalkthroughManifests";
import {
  CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE,
  getCsvReleaseClosureScorecard,
  isCsvReleaseClosureEntity,
  isCsvReleaseClosureOperation,
  type CsvReleaseClosureEntityScorecard,
  type CsvReleaseClosureItem,
  type CsvReleaseClosureOperationScorecard,
  type CsvReleaseClosureOptions,
  type CsvReleaseClosureReadFlags,
  type CsvReleaseClosureScorecard,
  type CsvReleaseClosureStatus,
  type CsvReleaseClosureStatusCounts
} from "@/lib/server/csvReleaseClosureScorecards";

export const CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvReleaseHandoffCatalogOptions = CsvReleaseClosureOptions;
export type CsvReleaseHandoffEntity = CsvOperatorWalkthroughEntity;
export type CsvReleaseHandoffOperation = CsvOperatorWalkthroughOperation;
export type CsvReleaseHandoffStatus = "ready" | "watch" | "block";

export type CsvReleaseHandoffStatusCounts = {
  ready: number;
  watch: number;
  block: number;
};

export type CsvReleaseHandoffReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvReleaseHandoffWriteFlags = {
  database: false;
  files: false;
  externalServices: false;
  exportHistory: false;
  scheduledDelivery: false;
  backgroundJobs: false;
  routingAssignments: false;
  importApply: false;
  bulkMutations: false;
  headerRemapping: false;
  salesforceSync: false;
};

export type CsvReleaseHandoffSourceName =
  | "operator-walkthrough-manifest"
  | "release-closure-scorecard";

export type CsvReleaseHandoffSourceScope = "root" | "entity" | "operation";

export type CsvReleaseHandoffSourceFingerprint = {
  source: CsvReleaseHandoffSourceName;
  scope: CsvReleaseHandoffSourceScope;
  key: string | null;
  contentType: string;
  fingerprint: string;
};

export type CsvReleaseHandoffSource = {
  operatorWalkthroughContentType:
    typeof CSV_OPERATOR_WALKTHROUGH_MANIFEST_CONTENT_TYPE;
  operatorWalkthroughManifestVersion: 1;
  operatorWalkthroughFingerprint: string;
  releaseClosureContentType: typeof CSV_RELEASE_CLOSURE_SCORECARD_CONTENT_TYPE;
  releaseClosureScorecardVersion: 1;
  releaseClosureFingerprint: string;
  sourceFingerprints: readonly CsvReleaseHandoffSourceFingerprint[];
};

export type CsvReleaseHandoffWalkthroughAnchor = {
  nativeStatus: CsvOperatorWalkthroughStatus;
  status: CsvReleaseHandoffStatus;
  stepCount: number;
  watchNoteCount: number;
  blockingNoteCount: number;
  stepStatusCounts: CsvReleaseHandoffStatusCounts;
  sourceContentTypes: readonly string[];
};

export type CsvReleaseHandoffClosureAnchor = {
  status: CsvReleaseClosureStatus;
  releaseStatus: CsvReleaseClosureItem["releaseStatus"];
  acceptanceStatus: CsvReleaseClosureItem["acceptanceStatus"];
  checkCount: number;
  checkStatusCounts: CsvReleaseClosureStatusCounts;
  acceptanceCriteriaCounts: CsvReleaseClosureItem["acceptanceCriteriaCounts"];
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  sourceContentTypes: readonly string[];
};

export type CsvReleaseHandoffCatalogItem = {
  id: string;
  entity: CsvReleaseHandoffEntity;
  label: string;
  route: string | null;
  operation: CsvReleaseHandoffOperation;
  status: CsvReleaseHandoffStatus;
  fingerprint: string;
  supported: boolean;
  fixtureAvailable: boolean;
  fixtureKind: CsvReleaseClosureItem["fixture"]["kind"];
  walkthrough: CsvReleaseHandoffWalkthroughAnchor;
  closure: CsvReleaseHandoffClosureAnchor;
  sourceFingerprints: readonly CsvReleaseHandoffSourceFingerprint[];
  sourceContentTypes: readonly string[];
  read: CsvReleaseHandoffReadFlags;
  write: CsvReleaseHandoffWriteFlags;
};

export type CsvReleaseHandoffEntityCatalog = {
  contentType: typeof CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE;
  catalogVersion: 1;
  entity: CsvReleaseHandoffEntity;
  label: string;
  route: string | null;
  direction: CsvReleaseClosureEntityScorecard["direction"];
  status: CsvReleaseHandoffStatus;
  fingerprint: string;
  operationCount: number;
  supportedOperationCount: number;
  unsupportedOperationCount: number;
  fixtureOperationCount: number;
  catalogItemCount: number;
  statusCounts: CsvReleaseHandoffStatusCounts;
  walkthroughStatusCounts: CsvReleaseHandoffStatusCounts;
  closureStatusCounts: CsvReleaseClosureStatusCounts;
  walkthroughStepStatusCounts: CsvReleaseHandoffStatusCounts;
  closureCheckStatusCounts: CsvReleaseClosureStatusCounts;
  sourceFingerprints: readonly CsvReleaseHandoffSourceFingerprint[];
  sourceContentTypes: readonly string[];
  items: readonly CsvReleaseHandoffCatalogItem[];
  source: CsvReleaseHandoffSource;
  read: CsvReleaseHandoffReadFlags;
  write: CsvReleaseHandoffWriteFlags;
};

export type CsvReleaseHandoffOperationCatalog = {
  contentType: typeof CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE;
  catalogVersion: 1;
  operation: CsvReleaseHandoffOperation;
  status: CsvReleaseHandoffStatus;
  fingerprint: string;
  entityCount: number;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  fixtureEntityCount: number;
  catalogItemCount: number;
  statusCounts: CsvReleaseHandoffStatusCounts;
  walkthroughStatusCounts: CsvReleaseHandoffStatusCounts;
  closureStatusCounts: CsvReleaseClosureStatusCounts;
  walkthroughStepStatusCounts: CsvReleaseHandoffStatusCounts;
  closureCheckStatusCounts: CsvReleaseClosureStatusCounts;
  sourceFingerprints: readonly CsvReleaseHandoffSourceFingerprint[];
  sourceContentTypes: readonly string[];
  items: readonly CsvReleaseHandoffCatalogItem[];
  source: CsvReleaseHandoffSource;
  read: CsvReleaseHandoffReadFlags;
  write: CsvReleaseHandoffWriteFlags;
};

export type CsvReleaseHandoffCatalog = {
  contentType: typeof CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE;
  catalogVersion: 1;
  status: CsvReleaseHandoffStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  catalogItemCount: number;
  supportedItemCount: number;
  unsupportedItemCount: number;
  fixtureItemCount: number;
  statusCounts: CsvReleaseHandoffStatusCounts;
  entityStatusCounts: CsvReleaseHandoffStatusCounts;
  operationStatusCounts: CsvReleaseHandoffStatusCounts;
  walkthroughStatusCounts: CsvReleaseHandoffStatusCounts;
  closureStatusCounts: CsvReleaseClosureStatusCounts;
  walkthroughStepStatusCounts: CsvReleaseHandoffStatusCounts;
  closureCheckStatusCounts: CsvReleaseClosureStatusCounts;
  sourceFingerprints: readonly CsvReleaseHandoffSourceFingerprint[];
  sourceContentTypes: readonly string[];
  entities: readonly CsvReleaseHandoffEntityCatalog[];
  operations: readonly CsvReleaseHandoffOperationCatalog[];
  source: CsvReleaseHandoffSource;
  read: CsvReleaseHandoffReadFlags;
  write: CsvReleaseHandoffWriteFlags;
};

type ReadFlagInput =
  | CsvOperatorWalkthroughReadFlags
  | CsvReleaseClosureReadFlags
  | CsvReleaseHandoffReadFlags;

function noWrites(): CsvReleaseHandoffWriteFlags {
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

function combineReads(
  reads: readonly ReadFlagInput[]
): CsvReleaseHandoffReadFlags {
  return {
    metadata: true,
    database: reads.some((read) => read.database),
    csvInput: reads.some((read) => read.csvInput),
    csvOutput: reads.some((read) => read.csvOutput)
  };
}

function stableSerialize(value: unknown): string {
  if (value === null) {
    return "null";
  }

  if (value instanceof Date) {
    return JSON.stringify(value.toISOString());
  }

  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(",")}]`;
  }

  switch (typeof value) {
    case "boolean":
    case "number":
    case "string":
      return JSON.stringify(value);
    case "object": {
      const record = value as Record<string, unknown>;
      const keys = Object.keys(record)
        .filter((key) => record[key] !== undefined)
        .sort();

      return `{${keys
        .map((key) => `${JSON.stringify(key)}:${stableSerialize(record[key])}`)
        .join(",")}}`;
    }
    default:
      return "null";
  }
}

function digestPayload(payload: unknown): string {
  return createHash("sha256").update(stableSerialize(payload)).digest("hex");
}

function emptyStatusCounts(): CsvReleaseHandoffStatusCounts {
  return {
    ready: 0,
    watch: 0,
    block: 0
  };
}

function countStatuses(
  values: readonly { status: CsvReleaseHandoffStatus }[]
): CsvReleaseHandoffStatusCounts {
  const counts = emptyStatusCounts();

  for (const value of values) {
    counts[value.status] += 1;
  }

  return counts;
}

function countWalkthroughStatuses(
  values: readonly { status: CsvOperatorWalkthroughStatus }[]
): CsvReleaseHandoffStatusCounts {
  const counts = emptyStatusCounts();

  for (const value of values) {
    counts[walkthroughStatusToHandoffStatus(value.status)] += 1;
  }

  return counts;
}

function combineStatusCounts(
  values: readonly CsvReleaseHandoffStatusCounts[]
): CsvReleaseHandoffStatusCounts {
  return values.reduce<CsvReleaseHandoffStatusCounts>(
    (current, counts) => ({
      ready: current.ready + counts.ready,
      watch: current.watch + counts.watch,
      block: current.block + counts.block
    }),
    emptyStatusCounts()
  );
}

function statusFromCounts(
  counts: CsvReleaseHandoffStatusCounts
): CsvReleaseHandoffStatus {
  if (counts.block > 0) {
    return "block";
  }

  return counts.watch > 0 ? "watch" : "ready";
}

function walkthroughStatusToHandoffStatus(
  status: CsvOperatorWalkthroughStatus
): CsvReleaseHandoffStatus {
  switch (status) {
    case "pass":
      return "ready";
    case "watch":
      return "watch";
    case "block":
      return "block";
  }
}

function mergeStatuses(
  statuses: readonly CsvReleaseHandoffStatus[]
): CsvReleaseHandoffStatus {
  return statusFromCounts(countStatuses(statuses.map((status) => ({ status }))));
}

function uniqueStrings(
  values: readonly (string | null | undefined)[]
): string[] {
  const seen = new Set<string>();
  const result: string[] = [];

  for (const value of values) {
    if (value !== null && value !== undefined && !seen.has(value)) {
      seen.add(value);
      result.push(value);
    }
  }

  return result;
}

function sourceFingerprint(input: {
  source: CsvReleaseHandoffSourceName;
  scope: CsvReleaseHandoffSourceScope;
  key: string | null;
  contentType: string;
  fingerprint: string;
}): CsvReleaseHandoffSourceFingerprint {
  return {
    source: input.source,
    scope: input.scope,
    key: input.key,
    contentType: input.contentType,
    fingerprint: input.fingerprint
  };
}

function buildSource(input: {
  walkthrough: CsvOperatorWalkthroughManifest;
  closure: CsvReleaseClosureScorecard;
}): CsvReleaseHandoffSource {
  return {
    operatorWalkthroughContentType: input.walkthrough.contentType,
    operatorWalkthroughManifestVersion: input.walkthrough.manifestVersion,
    operatorWalkthroughFingerprint: input.walkthrough.fingerprint,
    releaseClosureContentType: input.closure.contentType,
    releaseClosureScorecardVersion: input.closure.scorecardVersion,
    releaseClosureFingerprint: input.closure.fingerprint,
    sourceFingerprints: [
      sourceFingerprint({
        source: "operator-walkthrough-manifest",
        scope: "root",
        key: null,
        contentType: input.walkthrough.contentType,
        fingerprint: input.walkthrough.fingerprint
      }),
      sourceFingerprint({
        source: "release-closure-scorecard",
        scope: "root",
        key: null,
        contentType: input.closure.contentType,
        fingerprint: input.closure.fingerprint
      })
    ]
  };
}

function entitySourceFingerprints(input: {
  walkthrough: CsvOperatorWalkthroughEntityManifest;
  closure: CsvReleaseClosureEntityScorecard;
}): CsvReleaseHandoffSourceFingerprint[] {
  return [
    sourceFingerprint({
      source: "operator-walkthrough-manifest",
      scope: "entity",
      key: input.walkthrough.entity,
      contentType: input.walkthrough.contentType,
      fingerprint: input.walkthrough.fingerprint
    }),
    sourceFingerprint({
      source: "release-closure-scorecard",
      scope: "entity",
      key: input.closure.entity,
      contentType: input.closure.contentType,
      fingerprint: input.closure.fingerprint
    })
  ];
}

function operationSourceFingerprints(input: {
  walkthrough: CsvOperatorWalkthroughOperationManifest;
  closure: CsvReleaseClosureOperationScorecard;
}): CsvReleaseHandoffSourceFingerprint[] {
  return [
    sourceFingerprint({
      source: "operator-walkthrough-manifest",
      scope: "operation",
      key: input.walkthrough.operation,
      contentType: input.walkthrough.contentType,
      fingerprint: input.walkthrough.fingerprint
    }),
    sourceFingerprint({
      source: "release-closure-scorecard",
      scope: "operation",
      key: input.closure.operation,
      contentType: input.closure.contentType,
      fingerprint: input.closure.fingerprint
    })
  ];
}

function findWalkthroughEntity(
  walkthrough: CsvOperatorWalkthroughManifest,
  entity: CsvReleaseHandoffEntity
): CsvOperatorWalkthroughEntityManifest {
  const manifest = walkthrough.entities.find((entry) => entry.entity === entity);

  if (manifest === undefined) {
    throw new Error(`Missing CSV release handoff walkthrough entity ${entity}`);
  }

  return manifest;
}

function findWalkthroughOperation(
  walkthrough: CsvOperatorWalkthroughManifest,
  operation: CsvReleaseHandoffOperation
): CsvOperatorWalkthroughOperationManifest {
  const manifest = walkthrough.operations.find(
    (entry) => entry.operation === operation
  );

  if (manifest === undefined) {
    throw new Error(
      `Missing CSV release handoff walkthrough operation ${operation}`
    );
  }

  return manifest;
}

function findWalkthroughItem(input: {
  entity: CsvOperatorWalkthroughEntityManifest;
  operation: CsvReleaseHandoffOperation;
}): CsvOperatorWalkthroughItem {
  const item = input.entity.items.find(
    (candidate) => candidate.operation === input.operation
  );

  if (item === undefined) {
    throw new Error(
      `Missing CSV release handoff walkthrough item ${input.operation} for ${input.entity.entity}`
    );
  }

  return item;
}

function findClosureOperation(
  closure: CsvReleaseClosureScorecard,
  operation: CsvReleaseHandoffOperation
): CsvReleaseClosureOperationScorecard {
  const scorecard = closure.operations.find(
    (entry) => entry.operation === operation
  );

  if (scorecard === undefined) {
    throw new Error(
      `Missing CSV release handoff closure operation ${operation}`
    );
  }

  return scorecard;
}

function findCatalogItem(input: {
  entity: CsvReleaseHandoffEntityCatalog;
  operation: CsvReleaseHandoffOperation;
}): CsvReleaseHandoffCatalogItem {
  const item = input.entity.items.find(
    (candidate) => candidate.operation === input.operation
  );

  if (item === undefined) {
    throw new Error(
      `Missing CSV release handoff catalog item ${input.operation} for ${input.entity.entity}`
    );
  }

  return item;
}

function buildItemFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseHandoffSourceFingerprint[];
  id: string;
  status: CsvReleaseHandoffStatus;
  walkthroughStatus: CsvReleaseHandoffStatus;
  closureStatus: CsvReleaseClosureStatus;
  stepStatusCounts: CsvReleaseHandoffStatusCounts;
  checkStatusCounts: CsvReleaseClosureStatusCounts;
}): string {
  return digestPayload({
    source: input.sourceFingerprints,
    id: input.id,
    status: input.status,
    walkthroughStatus: input.walkthroughStatus,
    closureStatus: input.closureStatus,
    stepStatusCounts: input.stepStatusCounts,
    checkStatusCounts: input.checkStatusCounts
  });
}

function buildItem(input: {
  walkthroughItem: CsvOperatorWalkthroughItem;
  closureItem: CsvReleaseClosureItem;
  walkthroughEntity: CsvOperatorWalkthroughEntityManifest;
  closureEntity: CsvReleaseClosureEntityScorecard;
  walkthroughOperation: CsvOperatorWalkthroughOperationManifest;
  closureOperation: CsvReleaseClosureOperationScorecard;
}): CsvReleaseHandoffCatalogItem {
  const walkthroughStatus = walkthroughStatusToHandoffStatus(
    input.walkthroughItem.status
  );
  const status = mergeStatuses([walkthroughStatus, input.closureItem.status]);
  const stepStatusCounts = countWalkthroughStatuses(input.walkthroughItem.steps);
  const sourceFingerprints = [
    ...entitySourceFingerprints({
      walkthrough: input.walkthroughEntity,
      closure: input.closureEntity
    }),
    ...operationSourceFingerprints({
      walkthrough: input.walkthroughOperation,
      closure: input.closureOperation
    })
  ];
  const fingerprint = buildItemFingerprint({
    sourceFingerprints,
    id: input.closureItem.id,
    status,
    walkthroughStatus,
    closureStatus: input.closureItem.status,
    stepStatusCounts,
    checkStatusCounts: input.closureItem.checkStatusCounts
  });

  return {
    id: input.closureItem.id,
    entity: input.closureItem.entity,
    label: input.closureItem.label,
    route: input.closureItem.route,
    operation: input.closureItem.operation,
    status,
    fingerprint,
    supported: input.closureItem.supported,
    fixtureAvailable: input.closureItem.fixture.available,
    fixtureKind: input.closureItem.fixture.kind,
    walkthrough: {
      nativeStatus: input.walkthroughItem.status,
      status: walkthroughStatus,
      stepCount: input.walkthroughItem.stepCount,
      watchNoteCount: input.walkthroughItem.watchNoteCount,
      blockingNoteCount: input.walkthroughItem.blockingNoteCount,
      stepStatusCounts,
      sourceContentTypes: input.walkthroughItem.sourceContentTypes
    },
    closure: {
      status: input.closureItem.status,
      releaseStatus: input.closureItem.releaseStatus,
      acceptanceStatus: input.closureItem.acceptanceStatus,
      checkCount: input.closureItem.checks.length,
      checkStatusCounts: input.closureItem.checkStatusCounts,
      acceptanceCriteriaCounts: input.closureItem.acceptanceCriteriaCounts,
      warningCodes: input.closureItem.warningCodes,
      sourceCodes: input.closureItem.sourceCodes,
      sourceContentTypes: input.closureItem.sourceContentTypes
    },
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      ...input.walkthroughItem.sourceContentTypes,
      ...input.closureItem.sourceContentTypes,
      ...sourceFingerprints.map((source) => source.contentType)
    ]),
    read: combineReads([input.walkthroughItem.read, input.closureItem.read]),
    write: noWrites()
  };
}

function buildEntityFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseHandoffSourceFingerprint[];
  entity: CsvReleaseHandoffEntity;
  status: CsvReleaseHandoffStatus;
  items: readonly CsvReleaseHandoffCatalogItem[];
}): string {
  return digestPayload({
    source: input.sourceFingerprints,
    entity: input.entity,
    status: input.status,
    items: input.items.map((item) => ({
      id: item.id,
      operation: item.operation,
      status: item.status,
      fingerprint: item.fingerprint
    }))
  });
}

function buildEntityCatalog(input: {
  closureEntity: CsvReleaseClosureEntityScorecard;
  closure: CsvReleaseClosureScorecard;
  walkthrough: CsvOperatorWalkthroughManifest;
  source: CsvReleaseHandoffSource;
}): CsvReleaseHandoffEntityCatalog {
  const walkthroughEntity = findWalkthroughEntity(
    input.walkthrough,
    input.closureEntity.entity
  );
  const items = input.closureEntity.items.map((closureItem) => {
    const walkthroughOperation = findWalkthroughOperation(
      input.walkthrough,
      closureItem.operation
    );
    const closureOperation = findClosureOperation(
      input.closure,
      closureItem.operation
    );

    return buildItem({
      walkthroughItem: findWalkthroughItem({
        entity: walkthroughEntity,
        operation: closureItem.operation
      }),
      closureItem,
      walkthroughEntity,
      closureEntity: input.closureEntity,
      walkthroughOperation,
      closureOperation
    });
  });
  const statusCounts = countStatuses(items);
  const status = statusFromCounts(statusCounts);
  const sourceFingerprints = entitySourceFingerprints({
    walkthrough: walkthroughEntity,
    closure: input.closureEntity
  });
  const fingerprint = buildEntityFingerprint({
    sourceFingerprints,
    entity: input.closureEntity.entity,
    status,
    items
  });

  return {
    contentType: CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
    catalogVersion: 1,
    entity: input.closureEntity.entity,
    label: input.closureEntity.label,
    route: input.closureEntity.route,
    direction: input.closureEntity.direction,
    status,
    fingerprint,
    operationCount: input.closureEntity.operationCount,
    supportedOperationCount: input.closureEntity.supportedOperationCount,
    unsupportedOperationCount: input.closureEntity.unsupportedOperationCount,
    fixtureOperationCount: input.closureEntity.fixtureOperationCount,
    catalogItemCount: items.length,
    statusCounts,
    walkthroughStatusCounts: countWalkthroughStatuses(walkthroughEntity.items),
    closureStatusCounts: input.closureEntity.statusCounts,
    walkthroughStepStatusCounts: combineStatusCounts(
      items.map((item) => item.walkthrough.stepStatusCounts)
    ),
    closureCheckStatusCounts: input.closureEntity.checkStatusCounts,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
      walkthroughEntity.contentType,
      input.closureEntity.contentType,
      ...input.source.sourceFingerprints.map((source) => source.contentType),
      ...walkthroughEntity.sourceContentTypes,
      ...input.closureEntity.sourceContentTypes,
      ...items.flatMap((item) => item.sourceContentTypes)
    ]),
    items,
    source: input.source,
    read: combineReads([
      walkthroughEntity.read,
      input.closureEntity.read,
      ...items.map((item) => item.read)
    ]),
    write: noWrites()
  };
}

function buildOperationFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseHandoffSourceFingerprint[];
  operation: CsvReleaseHandoffOperation;
  status: CsvReleaseHandoffStatus;
  items: readonly CsvReleaseHandoffCatalogItem[];
}): string {
  return digestPayload({
    source: input.sourceFingerprints,
    operation: input.operation,
    status: input.status,
    items: input.items.map((item) => ({
      id: item.id,
      entity: item.entity,
      status: item.status,
      fingerprint: item.fingerprint
    }))
  });
}

function buildOperationCatalog(input: {
  closureOperation: CsvReleaseClosureOperationScorecard;
  entityCatalogs: readonly CsvReleaseHandoffEntityCatalog[];
  walkthrough: CsvOperatorWalkthroughManifest;
  source: CsvReleaseHandoffSource;
}): CsvReleaseHandoffOperationCatalog {
  const walkthroughOperation = findWalkthroughOperation(
    input.walkthrough,
    input.closureOperation.operation
  );
  const items = input.entityCatalogs.map((entity) =>
    findCatalogItem({
      entity,
      operation: input.closureOperation.operation
    })
  );
  const statusCounts = countStatuses(items);
  const status = statusFromCounts(statusCounts);
  const sourceFingerprints = operationSourceFingerprints({
    walkthrough: walkthroughOperation,
    closure: input.closureOperation
  });
  const fingerprint = buildOperationFingerprint({
    sourceFingerprints,
    operation: input.closureOperation.operation,
    status,
    items
  });

  return {
    contentType: CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
    catalogVersion: 1,
    operation: input.closureOperation.operation,
    status,
    fingerprint,
    entityCount: input.closureOperation.entityCount,
    supportedEntityCount: input.closureOperation.supportedEntityCount,
    unsupportedEntityCount: input.closureOperation.unsupportedEntityCount,
    fixtureEntityCount: input.closureOperation.fixtureEntityCount,
    catalogItemCount: items.length,
    statusCounts,
    walkthroughStatusCounts: countWalkthroughStatuses(walkthroughOperation.items),
    closureStatusCounts: input.closureOperation.statusCounts,
    walkthroughStepStatusCounts: combineStatusCounts(
      items.map((item) => item.walkthrough.stepStatusCounts)
    ),
    closureCheckStatusCounts: input.closureOperation.checkStatusCounts,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
      walkthroughOperation.contentType,
      input.closureOperation.contentType,
      ...input.source.sourceFingerprints.map((source) => source.contentType),
      ...walkthroughOperation.sourceContentTypes,
      ...input.closureOperation.sourceContentTypes,
      ...items.flatMap((item) => item.sourceContentTypes)
    ]),
    items,
    source: input.source,
    read: combineReads([
      walkthroughOperation.read,
      input.closureOperation.read,
      ...items.map((item) => item.read)
    ]),
    write: noWrites()
  };
}

function buildCatalogFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseHandoffSourceFingerprint[];
  status: CsvReleaseHandoffStatus;
  entities: readonly CsvReleaseHandoffEntityCatalog[];
  operations: readonly CsvReleaseHandoffOperationCatalog[];
}): string {
  return digestPayload({
    source: input.sourceFingerprints,
    status: input.status,
    entities: input.entities.map((entity) => ({
      entity: entity.entity,
      status: entity.status,
      fingerprint: entity.fingerprint,
      statusCounts: entity.statusCounts
    })),
    operations: input.operations.map((operation) => ({
      operation: operation.operation,
      status: operation.status,
      fingerprint: operation.fingerprint,
      statusCounts: operation.statusCounts
    }))
  });
}

export function isCsvReleaseHandoffEntity(
  value: string
): value is CsvReleaseHandoffEntity {
  return isCsvOperatorWalkthroughEntity(value) && isCsvReleaseClosureEntity(value);
}

export function isCsvReleaseHandoffOperation(
  value: string
): value is CsvReleaseHandoffOperation {
  return (
    isCsvOperatorWalkthroughOperation(value) &&
    isCsvReleaseClosureOperation(value)
  );
}

export async function getCsvReleaseHandoffCatalog(
  options: CsvReleaseHandoffCatalogOptions = {}
): Promise<CsvReleaseHandoffCatalog> {
  const [walkthrough, closure] = await Promise.all([
    getCsvOperatorWalkthroughManifest(options),
    getCsvReleaseClosureScorecard(options)
  ]);
  const source = buildSource({ walkthrough, closure });
  const entities = closure.entities.map((closureEntity) =>
    buildEntityCatalog({
      closureEntity,
      closure,
      walkthrough,
      source
    })
  );
  const operations = closure.operations.map((closureOperation) =>
    buildOperationCatalog({
      closureOperation,
      entityCatalogs: entities,
      walkthrough,
      source
    })
  );
  const allItems = entities.flatMap((entity) => entity.items);
  const statusCounts = countStatuses(allItems);
  const status = statusFromCounts(statusCounts);
  const sourceFingerprints = source.sourceFingerprints;
  const fingerprint = buildCatalogFingerprint({
    sourceFingerprints,
    status,
    entities,
    operations
  });

  return {
    contentType: CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
    catalogVersion: 1,
    status,
    fingerprint,
    entityCount: entities.length,
    operationCount: operations.length,
    catalogItemCount: allItems.length,
    supportedItemCount: allItems.filter((item) => item.supported).length,
    unsupportedItemCount: allItems.filter((item) => !item.supported).length,
    fixtureItemCount: allItems.filter((item) => item.fixtureAvailable).length,
    statusCounts,
    entityStatusCounts: countStatuses(entities),
    operationStatusCounts: countStatuses(operations),
    walkthroughStatusCounts: countWalkthroughStatuses(
      walkthrough.entities.flatMap((entity) => entity.items)
    ),
    closureStatusCounts: closure.statusCounts,
    walkthroughStepStatusCounts: combineStatusCounts(
      allItems.map((item) => item.walkthrough.stepStatusCounts)
    ),
    closureCheckStatusCounts: closure.checkStatusCounts,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
      walkthrough.contentType,
      closure.contentType,
      ...walkthrough.sourceContentTypes,
      ...closure.sourceContentTypes,
      ...entities.flatMap((entity) => entity.sourceContentTypes),
      ...operations.flatMap((operation) => operation.sourceContentTypes)
    ]),
    entities,
    operations,
    source,
    read: combineReads([
      walkthrough.read,
      closure.read,
      ...entities.map((entity) => entity.read),
      ...operations.map((operation) => operation.read)
    ]),
    write: noWrites()
  };
}

export async function listCsvReleaseHandoffEntityCatalogs(
  options: CsvReleaseHandoffCatalogOptions = {}
): Promise<CsvReleaseHandoffEntityCatalog[]> {
  return (await getCsvReleaseHandoffCatalog(options)).entities.slice();
}

export async function getCsvReleaseHandoffEntityCatalog(
  entity: string,
  options: CsvReleaseHandoffCatalogOptions = {}
): Promise<CsvReleaseHandoffEntityCatalog | null> {
  if (!isCsvReleaseHandoffEntity(entity)) {
    return null;
  }

  const catalog = await getCsvReleaseHandoffCatalog(options);

  return catalog.entities.find((entry) => entry.entity === entity) ?? null;
}

export async function listCsvReleaseHandoffOperationCatalogs(
  options: CsvReleaseHandoffCatalogOptions = {}
): Promise<CsvReleaseHandoffOperationCatalog[]> {
  return (await getCsvReleaseHandoffCatalog(options)).operations.slice();
}

export async function getCsvReleaseHandoffOperationCatalog(
  operation: string,
  options: CsvReleaseHandoffCatalogOptions = {}
): Promise<CsvReleaseHandoffOperationCatalog | null> {
  if (!isCsvReleaseHandoffOperation(operation)) {
    return null;
  }

  const catalog = await getCsvReleaseHandoffCatalog(options);

  return (
    catalog.operations.find((entry) => entry.operation === operation) ?? null
  );
}
