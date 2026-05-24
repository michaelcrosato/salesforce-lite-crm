import { createHash } from "node:crypto";
import {
  CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
  getCsvReleaseExceptionRegister,
  isCsvReleaseExceptionEntity,
  isCsvReleaseExceptionOperation,
  type CsvReleaseExceptionEntityRegister,
  type CsvReleaseExceptionOperationRegister,
  type CsvReleaseExceptionReadFlags,
  type CsvReleaseExceptionRegister,
  type CsvReleaseExceptionRegisterEntry,
  type CsvReleaseExceptionSeverity,
  type CsvReleaseExceptionSeverityCounts,
  type CsvReleaseExceptionStatus
} from "@/lib/server/csvReleaseExceptionRegisters";
import {
  CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
  getCsvReleaseHandoffCatalog,
  isCsvReleaseHandoffEntity,
  isCsvReleaseHandoffOperation,
  type CsvReleaseHandoffCatalog,
  type CsvReleaseHandoffCatalogItem,
  type CsvReleaseHandoffCatalogOptions,
  type CsvReleaseHandoffEntity,
  type CsvReleaseHandoffEntityCatalog,
  type CsvReleaseHandoffOperation,
  type CsvReleaseHandoffOperationCatalog,
  type CsvReleaseHandoffReadFlags,
  type CsvReleaseHandoffStatus
} from "@/lib/server/csvReleaseHandoffCatalog";
import { getInFlightCsvPacket } from "@/lib/server/csvInFlightCache";

export const CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export type CsvReleaseDispositionManifestOptions =
  CsvReleaseHandoffCatalogOptions;
export type CsvReleaseDispositionEntity = CsvReleaseHandoffEntity;
export type CsvReleaseDispositionOperation = CsvReleaseHandoffOperation;
export type CsvReleaseDispositionStatus = CsvReleaseHandoffStatus;

const dispositionManifestCache = new Map<
  string,
  Promise<CsvReleaseDispositionManifest>
>();

export type CsvReleaseDispositionStatusCounts = {
  ready: number;
  watch: number;
  block: number;
};

export type CsvReleaseDispositionReadFlags = {
  metadata: true;
  database: boolean;
  csvInput: boolean;
  csvOutput: boolean;
};

export type CsvReleaseDispositionWriteFlags = {
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

export type CsvReleaseDispositionSourceName =
  | "release-handoff-catalog"
  | "release-exception-register";

export type CsvReleaseDispositionSourceScope =
  | "root"
  | "entity"
  | "operation"
  | "item";

export type CsvReleaseDispositionSourceFingerprint = {
  source: CsvReleaseDispositionSourceName;
  scope: CsvReleaseDispositionSourceScope;
  key: string | null;
  contentType: string;
  fingerprint: string;
};

export type CsvReleaseDispositionSource = {
  releaseHandoffContentType: typeof CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE;
  releaseHandoffCatalogVersion: 1;
  releaseHandoffFingerprint: string;
  releaseExceptionContentType:
    typeof CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE;
  releaseExceptionRegisterVersion: 1;
  releaseExceptionFingerprint: string;
  sourceFingerprints: readonly CsvReleaseDispositionSourceFingerprint[];
};

export type CsvReleaseDispositionHandoffAnchor = {
  status: CsvReleaseHandoffStatus;
  fingerprint: string;
  supported: boolean;
  fixtureAvailable: boolean;
  fixtureKind: CsvReleaseHandoffCatalogItem["fixtureKind"];
  walkthrough: {
    status: CsvReleaseHandoffCatalogItem["walkthrough"]["status"];
    nativeStatus: CsvReleaseHandoffCatalogItem["walkthrough"]["nativeStatus"];
    stepStatusCounts: CsvReleaseHandoffCatalogItem["walkthrough"]["stepStatusCounts"];
    watchNoteCount: number;
    blockingNoteCount: number;
  };
  closure: {
    status: CsvReleaseHandoffCatalogItem["closure"]["status"];
    releaseStatus: CsvReleaseHandoffCatalogItem["closure"]["releaseStatus"];
    acceptanceStatus: CsvReleaseHandoffCatalogItem["closure"]["acceptanceStatus"];
    checkStatusCounts: CsvReleaseHandoffCatalogItem["closure"]["checkStatusCounts"];
    warningCodes: readonly string[];
    sourceCodes: readonly string[];
  };
  sourceContentTypes: readonly string[];
};

export type CsvReleaseDispositionExceptionAnchor = {
  severity: CsvReleaseExceptionSeverity;
  status: CsvReleaseExceptionStatus;
  order: number;
  fingerprint: string;
  remediation: CsvReleaseExceptionRegisterEntry["remediation"];
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  sourceContentTypes: readonly string[];
};

export type CsvReleaseDispositionTraceAnchor = {
  handoff: CsvReleaseDispositionHandoffAnchor;
  exception: CsvReleaseDispositionExceptionAnchor | null;
};

export type CsvReleaseDispositionItem = {
  id: string;
  entity: CsvReleaseDispositionEntity;
  label: string;
  route: string | null;
  operation: CsvReleaseDispositionOperation;
  status: CsvReleaseDispositionStatus;
  fingerprint: string;
  supported: boolean;
  fixtureAvailable: boolean;
  fixtureKind: CsvReleaseHandoffCatalogItem["fixtureKind"];
  hasException: boolean;
  exceptionSeverity: CsvReleaseExceptionSeverity | null;
  trace: CsvReleaseDispositionTraceAnchor;
  sourceFingerprints: readonly CsvReleaseDispositionSourceFingerprint[];
  sourceContentTypes: readonly string[];
  read: CsvReleaseDispositionReadFlags;
  write: CsvReleaseDispositionWriteFlags;
};

export type CsvReleaseDispositionEntityManifest = {
  contentType: typeof CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE;
  manifestVersion: 1;
  entity: CsvReleaseDispositionEntity;
  label: string;
  route: string | null;
  direction: CsvReleaseHandoffEntityCatalog["direction"];
  status: CsvReleaseDispositionStatus;
  fingerprint: string;
  operationCount: number;
  supportedOperationCount: number;
  unsupportedOperationCount: number;
  fixtureOperationCount: number;
  dispositionCount: number;
  readyDispositionCount: number;
  watchDispositionCount: number;
  blockDispositionCount: number;
  exceptionCount: number;
  watchExceptionCount: number;
  blockExceptionCount: number;
  supportedDispositionCount: number;
  unsupportedDispositionCount: number;
  missingFixtureDispositionCount: number;
  statusCounts: CsvReleaseDispositionStatusCounts;
  handoffStatusCounts: CsvReleaseDispositionStatusCounts;
  exceptionSeverityCounts: CsvReleaseExceptionSeverityCounts;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  dispositions: readonly CsvReleaseDispositionItem[];
  sourceFingerprints: readonly CsvReleaseDispositionSourceFingerprint[];
  sourceContentTypes: readonly string[];
  source: CsvReleaseDispositionSource;
  read: CsvReleaseDispositionReadFlags;
  write: CsvReleaseDispositionWriteFlags;
};

export type CsvReleaseDispositionOperationManifest = {
  contentType: typeof CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE;
  manifestVersion: 1;
  operation: CsvReleaseDispositionOperation;
  status: CsvReleaseDispositionStatus;
  fingerprint: string;
  entityCount: number;
  supportedEntityCount: number;
  unsupportedEntityCount: number;
  fixtureEntityCount: number;
  dispositionCount: number;
  readyDispositionCount: number;
  watchDispositionCount: number;
  blockDispositionCount: number;
  exceptionCount: number;
  watchExceptionCount: number;
  blockExceptionCount: number;
  supportedDispositionCount: number;
  unsupportedDispositionCount: number;
  missingFixtureDispositionCount: number;
  statusCounts: CsvReleaseDispositionStatusCounts;
  handoffStatusCounts: CsvReleaseDispositionStatusCounts;
  exceptionSeverityCounts: CsvReleaseExceptionSeverityCounts;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  dispositions: readonly CsvReleaseDispositionItem[];
  sourceFingerprints: readonly CsvReleaseDispositionSourceFingerprint[];
  sourceContentTypes: readonly string[];
  source: CsvReleaseDispositionSource;
  read: CsvReleaseDispositionReadFlags;
  write: CsvReleaseDispositionWriteFlags;
};

export type CsvReleaseDispositionManifest = {
  contentType: typeof CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE;
  manifestVersion: 1;
  status: CsvReleaseDispositionStatus;
  fingerprint: string;
  entityCount: number;
  operationCount: number;
  dispositionCount: number;
  readyDispositionCount: number;
  watchDispositionCount: number;
  blockDispositionCount: number;
  exceptionCount: number;
  watchExceptionCount: number;
  blockExceptionCount: number;
  supportedDispositionCount: number;
  unsupportedDispositionCount: number;
  missingFixtureDispositionCount: number;
  statusCounts: CsvReleaseDispositionStatusCounts;
  entityStatusCounts: CsvReleaseDispositionStatusCounts;
  operationStatusCounts: CsvReleaseDispositionStatusCounts;
  handoffStatusCounts: CsvReleaseDispositionStatusCounts;
  exceptionSeverityCounts: CsvReleaseExceptionSeverityCounts;
  warningCodes: readonly string[];
  sourceCodes: readonly string[];
  dispositions: readonly CsvReleaseDispositionItem[];
  entities: readonly CsvReleaseDispositionEntityManifest[];
  operations: readonly CsvReleaseDispositionOperationManifest[];
  sourceFingerprints: readonly CsvReleaseDispositionSourceFingerprint[];
  sourceContentTypes: readonly string[];
  source: CsvReleaseDispositionSource;
  read: CsvReleaseDispositionReadFlags;
  write: CsvReleaseDispositionWriteFlags;
};

type ReadFlagInput =
  | CsvReleaseHandoffReadFlags
  | CsvReleaseExceptionReadFlags
  | CsvReleaseDispositionReadFlags;

function noWrites(): CsvReleaseDispositionWriteFlags {
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
): CsvReleaseDispositionReadFlags {
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

function emptyStatusCounts(): CsvReleaseDispositionStatusCounts {
  return {
    ready: 0,
    watch: 0,
    block: 0
  };
}

function countStatuses(
  values: readonly { status: CsvReleaseDispositionStatus }[]
): CsvReleaseDispositionStatusCounts {
  const counts = emptyStatusCounts();

  for (const value of values) {
    counts[value.status] += 1;
  }

  return counts;
}

function statusFromCounts(
  counts: CsvReleaseDispositionStatusCounts
): CsvReleaseDispositionStatus {
  if (counts.block > 0) {
    return "block";
  }

  return counts.watch > 0 ? "watch" : "ready";
}

function emptyExceptionCounts(): CsvReleaseExceptionSeverityCounts {
  return {
    watch: 0,
    block: 0
  };
}

function countExceptions(
  dispositions: readonly CsvReleaseDispositionItem[]
): CsvReleaseExceptionSeverityCounts {
  const counts = emptyExceptionCounts();

  for (const disposition of dispositions) {
    if (disposition.exceptionSeverity !== null) {
      counts[disposition.exceptionSeverity] += 1;
    }
  }

  return counts;
}

function mergeStatuses(
  statuses: readonly CsvReleaseDispositionStatus[]
): CsvReleaseDispositionStatus {
  return statusFromCounts(statuses.map((status) => ({ status })).reduce(
    (counts, value) => ({
      ...counts,
      [value.status]: counts[value.status] + 1
    }),
    emptyStatusCounts()
  ));
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
  source: CsvReleaseDispositionSourceName;
  scope: CsvReleaseDispositionSourceScope;
  key: string | null;
  contentType: string;
  fingerprint: string;
}): CsvReleaseDispositionSourceFingerprint {
  return {
    source: input.source,
    scope: input.scope,
    key: input.key,
    contentType: input.contentType,
    fingerprint: input.fingerprint
  };
}

function buildSource(input: {
  handoff: CsvReleaseHandoffCatalog;
  exception: CsvReleaseExceptionRegister;
}): CsvReleaseDispositionSource {
  return {
    releaseHandoffContentType: input.handoff.contentType,
    releaseHandoffCatalogVersion: input.handoff.catalogVersion,
    releaseHandoffFingerprint: input.handoff.fingerprint,
    releaseExceptionContentType: input.exception.contentType,
    releaseExceptionRegisterVersion: input.exception.registerVersion,
    releaseExceptionFingerprint: input.exception.fingerprint,
    sourceFingerprints: [
      sourceFingerprint({
        source: "release-handoff-catalog",
        scope: "root",
        key: null,
        contentType: input.handoff.contentType,
        fingerprint: input.handoff.fingerprint
      }),
      sourceFingerprint({
        source: "release-exception-register",
        scope: "root",
        key: null,
        contentType: input.exception.contentType,
        fingerprint: input.exception.fingerprint
      })
    ]
  };
}

function entitySourceFingerprints(input: {
  handoff: CsvReleaseHandoffEntityCatalog;
  exception: CsvReleaseExceptionEntityRegister;
}): CsvReleaseDispositionSourceFingerprint[] {
  return [
    sourceFingerprint({
      source: "release-handoff-catalog",
      scope: "entity",
      key: input.handoff.entity,
      contentType: input.handoff.contentType,
      fingerprint: input.handoff.fingerprint
    }),
    sourceFingerprint({
      source: "release-exception-register",
      scope: "entity",
      key: input.exception.entity,
      contentType: input.exception.contentType,
      fingerprint: input.exception.fingerprint
    })
  ];
}

function operationSourceFingerprints(input: {
  handoff: CsvReleaseHandoffOperationCatalog;
  exception: CsvReleaseExceptionOperationRegister;
}): CsvReleaseDispositionSourceFingerprint[] {
  return [
    sourceFingerprint({
      source: "release-handoff-catalog",
      scope: "operation",
      key: input.handoff.operation,
      contentType: input.handoff.contentType,
      fingerprint: input.handoff.fingerprint
    }),
    sourceFingerprint({
      source: "release-exception-register",
      scope: "operation",
      key: input.exception.operation,
      contentType: input.exception.contentType,
      fingerprint: input.exception.fingerprint
    })
  ];
}

function itemSourceFingerprints(input: {
  handoff: CsvReleaseHandoffCatalogItem;
  exception: CsvReleaseExceptionRegisterEntry | null;
}): CsvReleaseDispositionSourceFingerprint[] {
  const sources = [
    sourceFingerprint({
      source: "release-handoff-catalog",
      scope: "item",
      key: input.handoff.id,
      contentType: CSV_RELEASE_HANDOFF_CATALOG_CONTENT_TYPE,
      fingerprint: input.handoff.fingerprint
    })
  ];

  if (input.exception !== null) {
    sources.push(
      sourceFingerprint({
        source: "release-exception-register",
        scope: "item",
        key: input.exception.id,
        contentType: CSV_RELEASE_EXCEPTION_REGISTER_CONTENT_TYPE,
        fingerprint: input.exception.fingerprint
      })
    );
  }

  return sources;
}

function findExceptionEntity(
  register: CsvReleaseExceptionRegister,
  entity: CsvReleaseDispositionEntity
): CsvReleaseExceptionEntityRegister {
  const match = register.entities.find((entry) => entry.entity === entity);

  if (match === undefined) {
    throw new Error(`Missing CSV release disposition exception entity ${entity}`);
  }

  return match;
}

function findExceptionOperation(
  register: CsvReleaseExceptionRegister,
  operation: CsvReleaseDispositionOperation
): CsvReleaseExceptionOperationRegister {
  const match = register.operations.find(
    (entry) => entry.operation === operation
  );

  if (match === undefined) {
    throw new Error(
      `Missing CSV release disposition exception operation ${operation}`
    );
  }

  return match;
}

function findExceptionEntry(input: {
  exceptionEntity: CsvReleaseExceptionEntityRegister;
  id: string;
}): CsvReleaseExceptionRegisterEntry | null {
  return input.exceptionEntity.entries.find((entry) => entry.id === input.id) ?? null;
}

function buildItemFingerprint(input: {
  id: string;
  status: CsvReleaseDispositionStatus;
  sourceFingerprints: readonly CsvReleaseDispositionSourceFingerprint[];
  handoffFingerprint: string;
  exceptionFingerprint: string | null;
}): string {
  return digestPayload({
    id: input.id,
    status: input.status,
    source: input.sourceFingerprints,
    handoffFingerprint: input.handoffFingerprint,
    exceptionFingerprint: input.exceptionFingerprint
  });
}

function buildDispositionItem(input: {
  handoffItem: CsvReleaseHandoffCatalogItem;
  exceptionEntry: CsvReleaseExceptionRegisterEntry | null;
}): CsvReleaseDispositionItem {
  const exceptionStatus =
    input.exceptionEntry?.severity ?? ("ready" as CsvReleaseDispositionStatus);
  const status = mergeStatuses([input.handoffItem.status, exceptionStatus]);
  const sourceFingerprints = itemSourceFingerprints({
    handoff: input.handoffItem,
    exception: input.exceptionEntry
  });
  const fingerprint = buildItemFingerprint({
    id: input.handoffItem.id,
    status,
    sourceFingerprints,
    handoffFingerprint: input.handoffItem.fingerprint,
    exceptionFingerprint: input.exceptionEntry?.fingerprint ?? null
  });
  const exceptionAnchor: CsvReleaseDispositionExceptionAnchor | null =
    input.exceptionEntry === null
      ? null
      : {
          severity: input.exceptionEntry.severity,
          status: input.exceptionEntry.status,
          order: input.exceptionEntry.order,
          fingerprint: input.exceptionEntry.fingerprint,
          remediation: input.exceptionEntry.remediation,
          warningCodes: input.exceptionEntry.remediation.warningCodes,
          sourceCodes: input.exceptionEntry.remediation.sourceCodes,
          sourceContentTypes: input.exceptionEntry.sourceContentTypes
        };

  return {
    id: input.handoffItem.id,
    entity: input.handoffItem.entity,
    label: input.handoffItem.label,
    route: input.handoffItem.route,
    operation: input.handoffItem.operation,
    status,
    fingerprint,
    supported: input.handoffItem.supported,
    fixtureAvailable: input.handoffItem.fixtureAvailable,
    fixtureKind: input.handoffItem.fixtureKind,
    hasException: input.exceptionEntry !== null,
    exceptionSeverity: input.exceptionEntry?.severity ?? null,
    trace: {
      handoff: {
        status: input.handoffItem.status,
        fingerprint: input.handoffItem.fingerprint,
        supported: input.handoffItem.supported,
        fixtureAvailable: input.handoffItem.fixtureAvailable,
        fixtureKind: input.handoffItem.fixtureKind,
        walkthrough: {
          status: input.handoffItem.walkthrough.status,
          nativeStatus: input.handoffItem.walkthrough.nativeStatus,
          stepStatusCounts: input.handoffItem.walkthrough.stepStatusCounts,
          watchNoteCount: input.handoffItem.walkthrough.watchNoteCount,
          blockingNoteCount: input.handoffItem.walkthrough.blockingNoteCount
        },
        closure: {
          status: input.handoffItem.closure.status,
          releaseStatus: input.handoffItem.closure.releaseStatus,
          acceptanceStatus: input.handoffItem.closure.acceptanceStatus,
          checkStatusCounts: input.handoffItem.closure.checkStatusCounts,
          warningCodes: input.handoffItem.closure.warningCodes,
          sourceCodes: input.handoffItem.closure.sourceCodes
        },
        sourceContentTypes: input.handoffItem.sourceContentTypes
      },
      exception: exceptionAnchor
    },
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
      ...input.handoffItem.sourceContentTypes,
      ...(input.exceptionEntry?.sourceContentTypes ?? []),
      ...sourceFingerprints.map((source) => source.contentType)
    ]),
    read: combineReads([
      input.handoffItem.read,
      ...(input.exceptionEntry === null ? [] : [input.exceptionEntry.read])
    ]),
    write: noWrites()
  };
}

function dispositionRollup(
  dispositions: readonly CsvReleaseDispositionItem[]
) {
  const statusCounts = countStatuses(dispositions);

  return {
    statusCounts,
    status: statusFromCounts(statusCounts),
    readyDispositionCount: statusCounts.ready,
    watchDispositionCount: statusCounts.watch,
    blockDispositionCount: statusCounts.block,
    supportedDispositionCount: dispositions.filter((item) => item.supported)
      .length,
    unsupportedDispositionCount: dispositions.filter((item) => !item.supported)
      .length,
    missingFixtureDispositionCount: dispositions.filter(
      (item) => !item.fixtureAvailable
    ).length,
    exceptionSeverityCounts: countExceptions(dispositions)
  };
}

function buildEntityFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseDispositionSourceFingerprint[];
  entity: CsvReleaseDispositionEntity;
  status: CsvReleaseDispositionStatus;
  dispositions: readonly CsvReleaseDispositionItem[];
}): string {
  return digestPayload({
    source: input.sourceFingerprints,
    entity: input.entity,
    status: input.status,
    dispositions: input.dispositions.map((disposition) => ({
      id: disposition.id,
      operation: disposition.operation,
      status: disposition.status,
      fingerprint: disposition.fingerprint
    }))
  });
}

function buildEntityManifest(input: {
  handoffEntity: CsvReleaseHandoffEntityCatalog;
  exceptionEntity: CsvReleaseExceptionEntityRegister;
  source: CsvReleaseDispositionSource;
}): CsvReleaseDispositionEntityManifest {
  const dispositions = input.handoffEntity.items.map((handoffItem) =>
    buildDispositionItem({
      handoffItem,
      exceptionEntry: findExceptionEntry({
        exceptionEntity: input.exceptionEntity,
        id: handoffItem.id
      })
    })
  );
  const rollup = dispositionRollup(dispositions);
  const sourceFingerprints = entitySourceFingerprints({
    handoff: input.handoffEntity,
    exception: input.exceptionEntity
  });
  const fingerprint = buildEntityFingerprint({
    sourceFingerprints,
    entity: input.handoffEntity.entity,
    status: rollup.status,
    dispositions
  });

  return {
    contentType: CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
    manifestVersion: 1,
    entity: input.handoffEntity.entity,
    label: input.handoffEntity.label,
    route: input.handoffEntity.route,
    direction: input.handoffEntity.direction,
    status: rollup.status,
    fingerprint,
    operationCount: input.handoffEntity.operationCount,
    supportedOperationCount: input.handoffEntity.supportedOperationCount,
    unsupportedOperationCount: input.handoffEntity.unsupportedOperationCount,
    fixtureOperationCount: input.handoffEntity.fixtureOperationCount,
    dispositionCount: dispositions.length,
    readyDispositionCount: rollup.readyDispositionCount,
    watchDispositionCount: rollup.watchDispositionCount,
    blockDispositionCount: rollup.blockDispositionCount,
    exceptionCount: input.exceptionEntity.exceptionCount,
    watchExceptionCount: input.exceptionEntity.watchExceptionCount,
    blockExceptionCount: input.exceptionEntity.blockExceptionCount,
    supportedDispositionCount: rollup.supportedDispositionCount,
    unsupportedDispositionCount: rollup.unsupportedDispositionCount,
    missingFixtureDispositionCount: rollup.missingFixtureDispositionCount,
    statusCounts: rollup.statusCounts,
    handoffStatusCounts: input.handoffEntity.statusCounts,
    exceptionSeverityCounts: rollup.exceptionSeverityCounts,
    warningCodes: input.exceptionEntity.warningCodes,
    sourceCodes: input.exceptionEntity.sourceCodes,
    dispositions,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
      input.handoffEntity.contentType,
      input.exceptionEntity.contentType,
      ...input.source.sourceFingerprints.map((source) => source.contentType),
      ...input.handoffEntity.sourceContentTypes,
      ...input.exceptionEntity.sourceContentTypes,
      ...dispositions.flatMap((disposition) => disposition.sourceContentTypes)
    ]),
    source: input.source,
    read: combineReads([
      input.handoffEntity.read,
      input.exceptionEntity.read,
      ...dispositions.map((disposition) => disposition.read)
    ]),
    write: noWrites()
  };
}

function buildOperationFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseDispositionSourceFingerprint[];
  operation: CsvReleaseDispositionOperation;
  status: CsvReleaseDispositionStatus;
  dispositions: readonly CsvReleaseDispositionItem[];
}): string {
  return digestPayload({
    source: input.sourceFingerprints,
    operation: input.operation,
    status: input.status,
    dispositions: input.dispositions.map((disposition) => ({
      id: disposition.id,
      entity: disposition.entity,
      status: disposition.status,
      fingerprint: disposition.fingerprint
    }))
  });
}

function buildOperationManifest(input: {
  handoffOperation: CsvReleaseHandoffOperationCatalog;
  exceptionOperation: CsvReleaseExceptionOperationRegister;
  entityManifests: readonly CsvReleaseDispositionEntityManifest[];
  source: CsvReleaseDispositionSource;
}): CsvReleaseDispositionOperationManifest {
  const dispositions = input.entityManifests.flatMap((entity) =>
    entity.dispositions.filter(
      (disposition) =>
        disposition.operation === input.handoffOperation.operation
    )
  );
  const rollup = dispositionRollup(dispositions);
  const sourceFingerprints = operationSourceFingerprints({
    handoff: input.handoffOperation,
    exception: input.exceptionOperation
  });
  const fingerprint = buildOperationFingerprint({
    sourceFingerprints,
    operation: input.handoffOperation.operation,
    status: rollup.status,
    dispositions
  });

  return {
    contentType: CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
    manifestVersion: 1,
    operation: input.handoffOperation.operation,
    status: rollup.status,
    fingerprint,
    entityCount: input.handoffOperation.entityCount,
    supportedEntityCount: input.handoffOperation.supportedEntityCount,
    unsupportedEntityCount: input.handoffOperation.unsupportedEntityCount,
    fixtureEntityCount: input.handoffOperation.fixtureEntityCount,
    dispositionCount: dispositions.length,
    readyDispositionCount: rollup.readyDispositionCount,
    watchDispositionCount: rollup.watchDispositionCount,
    blockDispositionCount: rollup.blockDispositionCount,
    exceptionCount: input.exceptionOperation.exceptionCount,
    watchExceptionCount: input.exceptionOperation.watchExceptionCount,
    blockExceptionCount: input.exceptionOperation.blockExceptionCount,
    supportedDispositionCount: rollup.supportedDispositionCount,
    unsupportedDispositionCount: rollup.unsupportedDispositionCount,
    missingFixtureDispositionCount: rollup.missingFixtureDispositionCount,
    statusCounts: rollup.statusCounts,
    handoffStatusCounts: input.handoffOperation.statusCounts,
    exceptionSeverityCounts: rollup.exceptionSeverityCounts,
    warningCodes: input.exceptionOperation.warningCodes,
    sourceCodes: input.exceptionOperation.sourceCodes,
    dispositions,
    sourceFingerprints,
    sourceContentTypes: uniqueStrings([
      CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
      input.handoffOperation.contentType,
      input.exceptionOperation.contentType,
      ...input.source.sourceFingerprints.map((source) => source.contentType),
      ...input.handoffOperation.sourceContentTypes,
      ...input.exceptionOperation.sourceContentTypes,
      ...dispositions.flatMap((disposition) => disposition.sourceContentTypes)
    ]),
    source: input.source,
    read: combineReads([
      input.handoffOperation.read,
      input.exceptionOperation.read,
      ...dispositions.map((disposition) => disposition.read)
    ]),
    write: noWrites()
  };
}

function buildManifestFingerprint(input: {
  sourceFingerprints: readonly CsvReleaseDispositionSourceFingerprint[];
  status: CsvReleaseDispositionStatus;
  entities: readonly CsvReleaseDispositionEntityManifest[];
  operations: readonly CsvReleaseDispositionOperationManifest[];
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

export function isCsvReleaseDispositionEntity(
  value: string
): value is CsvReleaseDispositionEntity {
  return isCsvReleaseHandoffEntity(value) && isCsvReleaseExceptionEntity(value);
}

export function isCsvReleaseDispositionOperation(
  value: string
): value is CsvReleaseDispositionOperation {
  return (
    isCsvReleaseHandoffOperation(value) &&
    isCsvReleaseExceptionOperation(value)
  );
}

export async function getCsvReleaseDispositionManifest(
  options: CsvReleaseDispositionManifestOptions = {}
): Promise<CsvReleaseDispositionManifest> {
  return getInFlightCsvPacket(dispositionManifestCache, options, async () => {
    const [handoff, exception] = await Promise.all([
      getCsvReleaseHandoffCatalog(options),
      getCsvReleaseExceptionRegister(options)
    ]);
    const source = buildSource({ handoff, exception });
    const entities = handoff.entities.map((handoffEntity) =>
      buildEntityManifest({
        handoffEntity,
        exceptionEntity: findExceptionEntity(exception, handoffEntity.entity),
        source
      })
    );
    const operations = handoff.operations.map((handoffOperation) =>
      buildOperationManifest({
        handoffOperation,
        exceptionOperation: findExceptionOperation(
          exception,
          handoffOperation.operation
        ),
        entityManifests: entities,
        source
      })
    );
    const dispositions = entities.flatMap((entity) => entity.dispositions);
    const rollup = dispositionRollup(dispositions);
    const sourceFingerprints = source.sourceFingerprints;
    const fingerprint = buildManifestFingerprint({
      sourceFingerprints,
      status: rollup.status,
      entities,
      operations
    });

    return {
      contentType: CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
      manifestVersion: 1,
      status: rollup.status,
      fingerprint,
      entityCount: entities.length,
      operationCount: operations.length,
      dispositionCount: dispositions.length,
      readyDispositionCount: rollup.readyDispositionCount,
      watchDispositionCount: rollup.watchDispositionCount,
      blockDispositionCount: rollup.blockDispositionCount,
      exceptionCount: exception.exceptionCount,
      watchExceptionCount: exception.watchExceptionCount,
      blockExceptionCount: exception.blockExceptionCount,
      supportedDispositionCount: rollup.supportedDispositionCount,
      unsupportedDispositionCount: rollup.unsupportedDispositionCount,
      missingFixtureDispositionCount: rollup.missingFixtureDispositionCount,
      statusCounts: rollup.statusCounts,
      entityStatusCounts: countStatuses(entities),
      operationStatusCounts: countStatuses(operations),
      handoffStatusCounts: handoff.statusCounts,
      exceptionSeverityCounts: rollup.exceptionSeverityCounts,
      warningCodes: exception.warningCodes,
      sourceCodes: exception.sourceCodes,
      dispositions,
      entities,
      operations,
      sourceFingerprints,
      sourceContentTypes: uniqueStrings([
        CSV_RELEASE_DISPOSITION_MANIFEST_CONTENT_TYPE,
        handoff.contentType,
        exception.contentType,
        ...handoff.sourceContentTypes,
        ...exception.sourceContentTypes,
        ...entities.flatMap((entity) => entity.sourceContentTypes),
        ...operations.flatMap((operation) => operation.sourceContentTypes)
      ]),
      source,
      read: combineReads([
        handoff.read,
        exception.read,
        ...entities.map((entity) => entity.read),
        ...operations.map((operation) => operation.read)
      ]),
      write: noWrites()
    };
  });
}

export async function listCsvReleaseDispositionEntityManifests(
  options: CsvReleaseDispositionManifestOptions = {}
): Promise<CsvReleaseDispositionEntityManifest[]> {
  return (await getCsvReleaseDispositionManifest(options)).entities.slice();
}

export async function getCsvReleaseDispositionEntityManifest(
  entity: string,
  options: CsvReleaseDispositionManifestOptions = {}
): Promise<CsvReleaseDispositionEntityManifest | null> {
  if (!isCsvReleaseDispositionEntity(entity)) {
    return null;
  }

  const manifest = await getCsvReleaseDispositionManifest(options);

  return manifest.entities.find((entry) => entry.entity === entity) ?? null;
}

export async function listCsvReleaseDispositionOperationManifests(
  options: CsvReleaseDispositionManifestOptions = {}
): Promise<CsvReleaseDispositionOperationManifest[]> {
  return (await getCsvReleaseDispositionManifest(options)).operations.slice();
}

export async function getCsvReleaseDispositionOperationManifest(
  operation: string,
  options: CsvReleaseDispositionManifestOptions = {}
): Promise<CsvReleaseDispositionOperationManifest | null> {
  if (!isCsvReleaseDispositionOperation(operation)) {
    return null;
  }

  const manifest = await getCsvReleaseDispositionManifest(options);

  return (
    manifest.operations.find((entry) => entry.operation === operation) ?? null
  );
}
