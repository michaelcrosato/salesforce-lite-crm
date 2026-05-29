import { z } from "zod/v4";
import {
  AUDIT_ENTITY_TYPES,
  AUDIT_EVENT_ACTIONS,
  type AuditEntityType,
  type AuditEventAction,
  type AuditEventCategory
} from "@/lib/services/auditEvents";

export const AUDIT_COVERAGE_MANIFEST_CONTENT_TYPE =
  "application/json; charset=utf-8" as const;

export const AUDIT_COVERAGE_ENTITIES = [
  "task",
  "case",
  "campaign"
] as const satisfies readonly AuditEntityType[];

const AUDIT_EVENT_CATEGORY_ORDER = [
  "user",
  "record",
  "ai",
  "import",
  "routing",
  "workflow"
] as const satisfies readonly AuditEventCategory[];

export type AuditCoverageEntity = (typeof AUDIT_COVERAGE_ENTITIES)[number];
export type AuditCoverageStatus = "covered" | "known_gap" | "taxonomy_only";

export type AuditCoverageReadFlags = {
  metadata: true;
  database: false;
  runtimeEvents: false;
  requestLogs: false;
  telemetry: false;
};

export type AuditCoverageWriteFlags = {
  database: false;
  mutations: false;
  auditEvents: false;
  requestLogs: false;
  externalTelemetry: false;
  externalServices: false;
  backgroundJobs: false;
};

export type AuditCoverageTaxonomyCategory = {
  category: AuditEventCategory;
  actions: readonly AuditEventAction[];
};

export type AuditCoverageTaxonomy = {
  categoryCount: number;
  actionCount: number;
  entityTypeCount: number;
  categories: readonly AuditCoverageTaxonomyCategory[];
  entityTypes: readonly AuditEntityType[];
};

export type AuditCoverageSourceSurface = {
  id: string;
  entity: AuditCoverageEntity;
  entityType: AuditEntityType;
  label: string;
  route: string;
  category: AuditEventCategory;
  action: AuditEventAction;
  status: "covered";
  sourceSurface: string;
  serviceModule: string;
  operation: string;
  summary: string;
  metadataFields: readonly string[];
  transaction: true;
  activitySideEffect: boolean;
  read: AuditCoverageReadFlags;
  write: AuditCoverageWriteFlags;
};

export type AuditCoverageKnownGap = {
  id: string;
  entity: AuditCoverageEntity;
  entityType: AuditEntityType;
  label: string;
  route: string;
  category: AuditEventCategory;
  action: AuditEventAction;
  status: "known_gap";
  severity: "watch";
  sourceSurface: string;
  serviceModule: string;
  operation: string;
  reason: string;
  safeNextAction: string;
  read: AuditCoverageReadFlags;
  write: AuditCoverageWriteFlags;
};

export type AuditCoverageActionCoverage = {
  category: AuditEventCategory;
  action: AuditEventAction;
  status: AuditCoverageStatus;
  coveredCount: number;
  knownGapCount: number;
  entityCount: number;
  sourceSurfaceIds: readonly string[];
  knownGapIds: readonly string[];
  entities: readonly string[];
};

export type AuditCoverageEntityManifest = {
  entity: AuditCoverageEntity;
  entityType: AuditEntityType;
  label: string;
  route: string;
  status: AuditCoverageStatus;
  sourceSurfaceCount: number;
  coveredActionCount: number;
  knownGapCount: number;
  actionCoverage: readonly AuditCoverageActionCoverage[];
  sourceSurfaces: readonly AuditCoverageSourceSurface[];
  knownGaps: readonly AuditCoverageKnownGap[];
  read: AuditCoverageReadFlags;
  write: AuditCoverageWriteFlags;
};

export type AuditCoverageCategoryManifest = {
  category: AuditEventCategory;
  status: AuditCoverageStatus;
  actionCount: number;
  coveredActionCount: number;
  knownGapCount: number;
  entityCount: number;
  actions: readonly AuditCoverageActionCoverage[];
  read: AuditCoverageReadFlags;
  write: AuditCoverageWriteFlags;
};

export type AuditCoverageManifest = {
  contentType: typeof AUDIT_COVERAGE_MANIFEST_CONTENT_TYPE;
  manifestType: "audit-coverage-manifest";
  entityCount: number;
  taxonomy: AuditCoverageTaxonomy;
  sourceSurfaceCount: number;
  coveredActionCount: number;
  knownGapCount: number;
  entities: readonly AuditCoverageEntityManifest[];
  categories: readonly AuditCoverageCategoryManifest[];
  knownGaps: readonly AuditCoverageKnownGap[];
  source: {
    taxonomyModule: "lib/services/auditEvents.ts";
    auditedMutationModules: readonly string[];
    auditedMutationScope: "core-productivity-services";
  };
  read: AuditCoverageReadFlags;
  write: AuditCoverageWriteFlags;
};

type EntityMetadata = {
  label: string;
  route: string;
};

type SourceSurfaceSeed = {
  entity: AuditCoverageEntity;
  category: AuditEventCategory;
  action: AuditEventAction;
  operation: string;
  summary: string;
  metadataFields: readonly string[];
  activitySideEffect?: boolean;
};

const manifestInputSchema = z.object({}).strict();

const entityMetadata: Record<AuditCoverageEntity, EntityMetadata> = {
  task: {
    label: "Tasks",
    route: "/tasks"
  },
  case: {
    label: "Cases",
    route: "/cases"
  },
  campaign: {
    label: "Campaigns",
    route: "/campaigns"
  }
};

const taskMetadataFields = [
  "accountId",
  "contactId",
  "dealId",
  "dueDate",
  "leadId",
  "ownerId",
  "priority",
  "status",
  "title"
] as const;

const caseMetadataFields = [
  "accountId",
  "contactId",
  "ownerId",
  "priority",
  "status",
  "subject"
] as const;

const campaignMetadataFields = [
  "budget",
  "endDate",
  "name",
  "ownerId",
  "startDate",
  "status"
] as const;

const coveredSurfaceSeeds = [
  {
    entity: "task",
    category: "record",
    action: "created",
    operation: "createTask",
    summary: "Task creation records a record-created AuditEvent.",
    metadataFields: taskMetadataFields
  },
  {
    entity: "task",
    category: "record",
    action: "updated",
    operation: "updateTask",
    summary: "Task non-status updates record a record-updated AuditEvent.",
    metadataFields: [
      ...taskMetadataFields,
      "changedFields",
      "previousStatus"
    ] as const
  },
  {
    entity: "task",
    category: "record",
    action: "status_changed",
    operation: "updateTask",
    summary: "Task status updates record a record-status-changed AuditEvent.",
    metadataFields: [
      ...taskMetadataFields,
      "changedFields",
      "previousStatus"
    ] as const
  },
  {
    entity: "task",
    category: "workflow",
    action: "task_completed",
    operation: "completeTask",
    summary: "Task completion records a workflow AuditEvent.",
    metadataFields: [
      ...taskMetadataFields,
      "activityCreated",
      "previousStatus"
    ] as const,
    activitySideEffect: true
  },
  {
    entity: "case",
    category: "record",
    action: "created",
    operation: "createCase",
    summary: "Case creation records a record-created AuditEvent.",
    metadataFields: caseMetadataFields
  },
  {
    entity: "case",
    category: "record",
    action: "updated",
    operation: "updateCase",
    summary: "Case non-status updates record a record-updated AuditEvent.",
    metadataFields: [
      ...caseMetadataFields,
      "changedFields",
      "previousStatus"
    ] as const
  },
  {
    entity: "case",
    category: "record",
    action: "status_changed",
    operation: "updateCase",
    summary: "Case status updates record a record-status-changed AuditEvent.",
    metadataFields: [
      ...caseMetadataFields,
      "changedFields",
      "previousStatus"
    ] as const
  },
  {
    entity: "case",
    category: "workflow",
    action: "case_resolved",
    operation: "resolveCase",
    summary: "Case resolution records a workflow AuditEvent.",
    metadataFields: [...caseMetadataFields, "previousStatus"] as const
  },
  {
    entity: "campaign",
    category: "record",
    action: "created",
    operation: "createCampaign",
    summary: "Campaign creation records a record-created AuditEvent.",
    metadataFields: [...campaignMetadataFields, "contactIds", "leadIds"] as const
  },
  {
    entity: "campaign",
    category: "record",
    action: "updated",
    operation: "updateCampaign",
    summary: "Campaign non-status updates record a record-updated AuditEvent.",
    metadataFields: [
      ...campaignMetadataFields,
      "changedFields",
      "contactIds",
      "leadIds",
      "previousStatus"
    ] as const
  },
  {
    entity: "campaign",
    category: "record",
    action: "status_changed",
    operation: "updateCampaign",
    summary:
      "Campaign status updates record a record-status-changed AuditEvent.",
    metadataFields: [
      ...campaignMetadataFields,
      "changedFields",
      "contactIds",
      "leadIds",
      "previousStatus"
    ] as const
  },
  {
    entity: "campaign",
    category: "workflow",
    action: "campaign_completed",
    operation: "completeCampaign",
    summary: "Campaign completion records a workflow AuditEvent.",
    metadataFields: [...campaignMetadataFields, "previousStatus"] as const
  }
] as const satisfies readonly SourceSurfaceSeed[];

function readMetadata(): AuditCoverageReadFlags {
  return {
    metadata: true,
    database: false,
    runtimeEvents: false,
    requestLogs: false,
    telemetry: false
  };
}

function noWrites(): AuditCoverageWriteFlags {
  return {
    database: false,
    mutations: false,
    auditEvents: false,
    requestLogs: false,
    externalTelemetry: false,
    externalServices: false,
    backgroundJobs: false
  };
}

function sourceModule(entity: AuditCoverageEntity): string {
  return `lib/services/${entity === "case" ? "cases" : `${entity}s`}.ts`;
}

function sourceSurface(
  entity: AuditCoverageEntity,
  operation: string
): string {
  return `${sourceModule(entity)}#${operation}`;
}

function entitySourceId(
  entity: AuditCoverageEntity,
  category: AuditEventCategory,
  action: AuditEventAction,
  operation: string
): string {
  return `${entity}:${category}.${action}:${operation}`;
}

function entityKnownGapId(entity: AuditCoverageEntity): string {
  return `${entity}:record.deleted:delete${entityMetadata[entity].label.slice(
    0,
    -1
  )}`;
}

function buildSourceSurface(
  seed: SourceSurfaceSeed
): AuditCoverageSourceSurface {
  const metadata = entityMetadata[seed.entity];

  return {
    id: entitySourceId(
      seed.entity,
      seed.category,
      seed.action,
      seed.operation
    ),
    entity: seed.entity,
    entityType: seed.entity,
    label: metadata.label,
    route: metadata.route,
    category: seed.category,
    action: seed.action,
    status: "covered",
    sourceSurface: sourceSurface(seed.entity, seed.operation),
    serviceModule: sourceModule(seed.entity),
    operation: seed.operation,
    summary: seed.summary,
    metadataFields: seed.metadataFields,
    transaction: true,
    activitySideEffect: seed.activitySideEffect ?? false,
    read: readMetadata(),
    write: noWrites()
  };
}

function buildKnownGap(entity: AuditCoverageEntity): AuditCoverageKnownGap {
  const metadata = entityMetadata[entity];
  const operation = `delete${metadata.label.slice(0, -1)}`;

  return {
    id: entityKnownGapId(entity),
    entity,
    entityType: entity,
    label: metadata.label,
    route: metadata.route,
    category: "record",
    action: "deleted",
    status: "known_gap",
    severity: "watch",
    sourceSurface: sourceSurface(entity, operation),
    serviceModule: sourceModule(entity),
    operation,
    reason:
      "The current delete service removes the record without recording an AuditEvent.",
    safeNextAction:
      "Promote audited delete semantics before marking delete coverage complete.",
    read: readMetadata(),
    write: noWrites()
  };
}

function coveredSourceSurfaces(): AuditCoverageSourceSurface[] {
  return coveredSurfaceSeeds.map((seed) => buildSourceSurface(seed));
}

function knownGaps(): AuditCoverageKnownGap[] {
  return AUDIT_COVERAGE_ENTITIES.map((entity) => buildKnownGap(entity));
}

function taxonomy(): AuditCoverageTaxonomy {
  const categories = AUDIT_EVENT_CATEGORY_ORDER.map((category) => ({
    category,
    actions: [...AUDIT_EVENT_ACTIONS[category]]
  }));

  return {
    categoryCount: categories.length,
    actionCount: categories.reduce(
      (total, category) => total + category.actions.length,
      0
    ),
    entityTypeCount: AUDIT_ENTITY_TYPES.length,
    categories,
    entityTypes: [...AUDIT_ENTITY_TYPES]
  };
}

function sortedUnique(values: readonly string[]): string[] {
  return [...new Set(values)].sort();
}

function statusFromCounts(
  coveredCount: number,
  knownGapCount: number
): AuditCoverageStatus {
  if (knownGapCount > 0) {
    return "known_gap";
  }

  if (coveredCount > 0) {
    return "covered";
  }

  return "taxonomy_only";
}

function buildActionCoverage(
  category: AuditEventCategory,
  action: AuditEventAction,
  surfaces: readonly AuditCoverageSourceSurface[],
  gaps: readonly AuditCoverageKnownGap[]
): AuditCoverageActionCoverage {
  const covered = surfaces.filter(
    (surface) => surface.category === category && surface.action === action
  );
  const known = gaps.filter(
    (gap) => gap.category === category && gap.action === action
  );
  const entities = sortedUnique([
    ...covered.map((surface) => surface.entity),
    ...known.map((gap) => gap.entity)
  ]);

  return {
    category,
    action,
    status: statusFromCounts(covered.length, known.length),
    coveredCount: covered.length,
    knownGapCount: known.length,
    entityCount: entities.length,
    sourceSurfaceIds: covered.map((surface) => surface.id).sort(),
    knownGapIds: known.map((gap) => gap.id).sort(),
    entities
  };
}

function buildCategoryManifest(
  category: AuditEventCategory,
  surfaces: readonly AuditCoverageSourceSurface[],
  gaps: readonly AuditCoverageKnownGap[]
): AuditCoverageCategoryManifest {
  const actions = AUDIT_EVENT_ACTIONS[category].map((action) =>
    buildActionCoverage(category, action, surfaces, gaps)
  );
  const coveredActionCount = actions.reduce(
    (total, action) => total + action.coveredCount,
    0
  );
  const knownGapCount = actions.reduce(
    (total, action) => total + action.knownGapCount,
    0
  );
  const entities = sortedUnique(actions.flatMap((action) => action.entities));

  return {
    category,
    status: statusFromCounts(coveredActionCount, knownGapCount),
    actionCount: actions.length,
    coveredActionCount,
    knownGapCount,
    entityCount: entities.length,
    actions,
    read: readMetadata(),
    write: noWrites()
  };
}

function buildEntityManifest(
  entity: AuditCoverageEntity,
  allSurfaces: readonly AuditCoverageSourceSurface[],
  allGaps: readonly AuditCoverageKnownGap[]
): AuditCoverageEntityManifest {
  const metadata = entityMetadata[entity];
  const surfaces = allSurfaces.filter((surface) => surface.entity === entity);
  const gaps = allGaps.filter((gap) => gap.entity === entity);
  const actionCoverage = AUDIT_EVENT_CATEGORY_ORDER.flatMap((category) =>
    AUDIT_EVENT_ACTIONS[category].map((action) =>
      buildActionCoverage(category, action, surfaces, gaps)
    )
  );

  return {
    entity,
    entityType: entity,
    label: metadata.label,
    route: metadata.route,
    status: statusFromCounts(surfaces.length, gaps.length),
    sourceSurfaceCount: surfaces.length,
    coveredActionCount: surfaces.length,
    knownGapCount: gaps.length,
    actionCoverage,
    sourceSurfaces: surfaces,
    knownGaps: gaps,
    read: readMetadata(),
    write: noWrites()
  };
}

export function isAuditCoverageEntity(
  value: string
): value is AuditCoverageEntity {
  return (AUDIT_COVERAGE_ENTITIES as readonly string[]).includes(value);
}

export function listAuditCoverageEntities(): AuditCoverageEntity[] {
  return [...AUDIT_COVERAGE_ENTITIES];
}

export function getAuditCoverageEntityManifest(
  entity: string
): AuditCoverageEntityManifest | null {
  if (!isAuditCoverageEntity(entity)) {
    return null;
  }

  return buildEntityManifest(entity, coveredSourceSurfaces(), knownGaps());
}

export function getAuditCoverageManifest(
  input: unknown = {}
): AuditCoverageManifest {
  manifestInputSchema.parse(input);

  const surfaces = coveredSourceSurfaces();
  const gaps = knownGaps();
  const entities = AUDIT_COVERAGE_ENTITIES.map((entity) =>
    buildEntityManifest(entity, surfaces, gaps)
  );
  const categories = AUDIT_EVENT_CATEGORY_ORDER.map((category) =>
    buildCategoryManifest(category, surfaces, gaps)
  );

  return {
    contentType: AUDIT_COVERAGE_MANIFEST_CONTENT_TYPE,
    manifestType: "audit-coverage-manifest",
    entityCount: entities.length,
    taxonomy: taxonomy(),
    sourceSurfaceCount: surfaces.length,
    coveredActionCount: surfaces.length,
    knownGapCount: gaps.length,
    entities,
    categories,
    knownGaps: gaps,
    source: {
      taxonomyModule: "lib/services/auditEvents.ts",
      auditedMutationModules: [
        "lib/services/tasks.ts",
        "lib/services/cases.ts",
        "lib/services/campaigns.ts"
      ],
      auditedMutationScope: "core-productivity-services"
    },
    read: readMetadata(),
    write: noWrites()
  };
}
