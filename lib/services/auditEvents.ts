import type { AuditEvent, Prisma } from "@prisma/client";
import { z } from "zod";
import { ROUTE_REGISTRY } from "@/lib/crm/registry";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validation";

export const AUDIT_EVENT_ACTIONS = {
  user: ["profile_updated", "preference_updated"],
  record: ["created", "updated", "deleted", "stage_changed", "status_changed"],
  ai: ["summary_generated", "recommendation_generated"],
  import: ["csv_previewed", "csv_validated", "dry_run_receipt_created"],
  routing: ["lead_routed", "lead_unrouted", "routing_evaluated"],
  workflow: ["task_completed", "case_resolved", "campaign_completed"]
} as const;

export const AUDIT_ENTITY_TYPES = [
  "account",
  "contact",
  "opportunity",
  "lead",
  "activity",
  "dealer_order",
  "area",
  "task",
  "case",
  "campaign",
  "knowledge_article",
  "report",
  "csv",
  "system"
] as const;

export type AuditEventCategory = keyof typeof AUDIT_EVENT_ACTIONS;
export const AUDIT_EVENT_CATEGORIES = [
  "user",
  "record",
  "ai",
  "import",
  "routing",
  "workflow"
] as const satisfies readonly AuditEventCategory[];
export type AuditEventAction<
  Category extends AuditEventCategory = AuditEventCategory
> = (typeof AUDIT_EVENT_ACTIONS)[Category][number];
export type AuditEntityType = (typeof AUDIT_ENTITY_TYPES)[number];
export type AuditMetadataValue =
  | string
  | number
  | boolean
  | null
  | AuditMetadataValue[]
  | { [key: string]: AuditMetadataValue };

const auditCategorySchema = z.enum(AUDIT_EVENT_CATEGORIES);

const auditEntityTypeSchema = z.enum(AUDIT_ENTITY_TYPES);

const optionalDate = z.preprocess((value) => {
  if (value instanceof Date) {
    return value;
  }

  if (typeof value !== "string" && typeof value !== "number") {
    return undefined;
  }

  if (typeof value === "string" && value.trim().length === 0) {
    return undefined;
  }

  return new Date(value);
}, z.date().optional());

const auditMetadataValueSchema: z.ZodType<AuditMetadataValue> = z.lazy(() =>
  z.union([
    z.string(),
    z.number().finite(),
    z.boolean(),
    z.null(),
    z.array(auditMetadataValueSchema),
    z.record(auditMetadataValueSchema)
  ])
);

const auditEventCreateSchema = z
  .object({
    category: auditCategorySchema,
    action: z.string().trim().min(1, "Audit action is required."),
    actorUserId: idSchema.optional(),
    entityType: auditEntityTypeSchema.optional(),
    entityId: idSchema.optional(),
    summary: z.string().trim().min(1, "Audit summary is required."),
    metadata: auditMetadataValueSchema.optional(),
    occurredAt: optionalDate
  })
  .strict()
  .superRefine((value, ctx) => {
    if (!isAuditActionForCategory(value.category, value.action)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["action"],
        message: `Audit action '${value.action}' is not valid for category '${value.category}'.`
      });
    }
  });

const auditEventListSchema = z
  .object({
    category: auditCategorySchema.optional(),
    action: z.string().trim().min(1).optional(),
    actorUserId: idSchema.optional(),
    entityType: auditEntityTypeSchema.optional(),
    entityId: idSchema.optional(),
    occurredFrom: optionalDate,
    occurredTo: optionalDate,
    page: z.coerce.number().int().min(1).optional(),
    pageSize: z.coerce.number().int().min(1).max(100).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.category &&
      value.action &&
      !isAuditActionForCategory(value.category, value.action)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["action"],
        message: `Audit action '${value.action}' is not valid for category '${value.category}'.`
      });
    }
  });

const auditEventExplorerSchema = z
  .object({
    category: auditCategorySchema.optional(),
    action: z.string().trim().min(1).optional(),
    entityType: auditEntityTypeSchema.optional(),
    pageSize: z.coerce.number().int().min(1).max(50).optional()
  })
  .strict()
  .superRefine((value, ctx) => {
    if (
      value.category &&
      value.action &&
      !isAuditActionForCategory(value.category, value.action)
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["action"],
        message: `Audit action '${value.action}' is not valid for category '${value.category}'.`
      });
    }
  });

export type AuditEventCreateInput = z.input<typeof auditEventCreateSchema>;
export type AuditEventListInput = z.input<typeof auditEventListSchema>;
export type AuditEventExplorerInput = z.input<typeof auditEventExplorerSchema>;

export type AuditEventActionOption = {
  category: AuditEventCategory;
  action: string;
  label: string;
};

export type AuditEventExplorerCount = {
  value: string;
  label: string;
  count: number;
};

export type AuditEventRecordLink = {
  href: string;
  label: string;
} | null;

export type AuditEventExplorerEvent = Pick<
  AuditEvent,
  | "id"
  | "category"
  | "action"
  | "actorUserId"
  | "entityType"
  | "entityId"
  | "summary"
  | "occurredAt"
> & {
  recordLink: AuditEventRecordLink;
};

export type AuditEventExplorerSnapshot = {
  filters: {
    category?: AuditEventCategory;
    action?: string;
    entityType?: AuditEntityType;
  };
  totalEventCount: number;
  matchingEventCount: number;
  pageSize: number;
  availableCategories: readonly AuditEventCategory[];
  availableEntityTypes: readonly AuditEntityType[];
  availableActions: readonly AuditEventActionOption[];
  categoryCounts: AuditEventExplorerCount[];
  actionCounts: AuditEventExplorerCount[];
  entityCounts: AuditEventExplorerCount[];
  events: AuditEventExplorerEvent[];
};

export function isAuditActionForCategory(
  category: AuditEventCategory,
  action: string
): action is AuditEventAction<typeof category> {
  return (AUDIT_EVENT_ACTIONS[category] as readonly string[]).includes(action);
}

export function serializeAuditMetadata(
  metadata: AuditMetadataValue | undefined
): string | null {
  if (metadata === undefined) {
    return null;
  }

  return JSON.stringify(sortAuditMetadata(metadata));
}

export function buildAuditEventCreateData(
  input: unknown
): Prisma.AuditEventUncheckedCreateInput {
  const parsed = auditEventCreateSchema.parse(input);
  return {
    category: parsed.category,
    action: parsed.action,
    actorUserId: parsed.actorUserId ?? null,
    entityType: parsed.entityType ?? null,
    entityId: parsed.entityId ?? null,
    summary: parsed.summary,
    metadata: serializeAuditMetadata(parsed.metadata),
    occurredAt: parsed.occurredAt
  };
}

export function recordAuditEventOperation(
  input: unknown
): Prisma.PrismaPromise<AuditEvent> {
  return prisma.auditEvent.create({ data: buildAuditEventCreateData(input) });
}

export async function recordAuditEvent(input: unknown): Promise<AuditEvent> {
  return recordAuditEventOperation(input);
}

export async function listAuditEvents(
  input: unknown = {}
): Promise<AuditEvent[]> {
  const parsed = auditEventListSchema.parse(input);
  const page = parsed.page ?? 1;
  const take = parsed.pageSize ?? 25;
  const where: Prisma.AuditEventWhereInput = {};

  if (parsed.category) {
    where.category = parsed.category;
  }

  if (parsed.action) {
    where.action = parsed.action;
  }

  if (parsed.actorUserId) {
    where.actorUserId = parsed.actorUserId;
  }

  if (parsed.entityType) {
    where.entityType = parsed.entityType;
  }

  if (parsed.entityId) {
    where.entityId = parsed.entityId;
  }

  if (parsed.occurredFrom || parsed.occurredTo) {
    where.occurredAt = {
      gte: parsed.occurredFrom,
      lte: parsed.occurredTo
    };
  }

  return prisma.auditEvent.findMany({
    where,
    orderBy: [{ occurredAt: "desc" }, { id: "asc" }],
    skip: (page - 1) * take,
    take
  });
}

export async function listAuditEventsForEntity(
  entityType: AuditEntityType,
  entityId: string,
  input: Omit<AuditEventListInput, "entityType" | "entityId"> = {}
): Promise<AuditEvent[]> {
  return listAuditEvents({
    ...input,
    entityType,
    entityId
  });
}

export async function getAuditEventExplorer(
  input: unknown = {}
): Promise<AuditEventExplorerSnapshot> {
  const parsed = auditEventExplorerSchema.parse(input);
  const pageSize = parsed.pageSize ?? 10;
  const where = buildAuditEventExplorerWhere(parsed);

  const [
    totalEventCount,
    matchingEventCount,
    categoryGroups,
    actionGroups,
    entityGroups,
    events
  ] = await Promise.all([
    prisma.auditEvent.count(),
    prisma.auditEvent.count({ where }),
    prisma.auditEvent.groupBy({
      by: ["category"],
      where,
      _count: { _all: true },
      orderBy: { category: "asc" }
    }),
    prisma.auditEvent.groupBy({
      by: ["action"],
      where,
      _count: { _all: true },
      orderBy: { action: "asc" }
    }),
    prisma.auditEvent.groupBy({
      by: ["entityType"],
      where,
      _count: { _all: true },
      orderBy: { entityType: "asc" }
    }),
    prisma.auditEvent.findMany({
      where,
      orderBy: [{ occurredAt: "desc" }, { id: "asc" }],
      take: pageSize
    })
  ]);

  return {
    filters: {
      category: parsed.category,
      action: parsed.action,
      entityType: parsed.entityType
    },
    totalEventCount,
    matchingEventCount,
    pageSize,
    availableCategories: AUDIT_EVENT_CATEGORIES,
    availableEntityTypes: AUDIT_ENTITY_TYPES,
    availableActions: buildAuditEventActionOptions(),
    categoryCounts: categoryGroups.map((group) => ({
      value: group.category,
      label: formatAuditToken(group.category),
      count: group._count._all
    })),
    actionCounts: actionGroups.map((group) => ({
      value: group.action,
      label: formatAuditToken(group.action),
      count: group._count._all
    })),
    entityCounts: entityGroups.map((group) => ({
      value: group.entityType ?? "none",
      label: group.entityType ? formatAuditToken(group.entityType) : "No entity",
      count: group._count._all
    })),
    events: events.map((event) => ({
      id: event.id,
      category: event.category,
      action: event.action,
      actorUserId: event.actorUserId,
      entityType: event.entityType,
      entityId: event.entityId,
      summary: event.summary,
      occurredAt: event.occurredAt,
      recordLink: getAuditEventRecordLink(event)
    }))
  };
}

function sortAuditMetadata(value: AuditMetadataValue): AuditMetadataValue {
  if (Array.isArray(value)) {
    return value.map(sortAuditMetadata);
  }

  if (value !== null && typeof value === "object") {
    const sorted: { [key: string]: AuditMetadataValue } = {};

    for (const key of Object.keys(value).sort()) {
      sorted[key] = sortAuditMetadata(value[key]);
    }

    return sorted;
  }

  return value;
}

function buildAuditEventExplorerWhere(input: {
  category?: AuditEventCategory;
  action?: string;
  entityType?: AuditEntityType;
}): Prisma.AuditEventWhereInput {
  const where: Prisma.AuditEventWhereInput = {};

  if (input.category) {
    where.category = input.category;
  }

  if (input.action) {
    where.action = input.action;
  }

  if (input.entityType) {
    where.entityType = input.entityType;
  }

  return where;
}

function buildAuditEventActionOptions(): AuditEventActionOption[] {
  return AUDIT_EVENT_CATEGORIES.flatMap((category) =>
    AUDIT_EVENT_ACTIONS[category].map((action) => ({
      category,
      action,
      label: `${formatAuditToken(category)} / ${formatAuditToken(action)}`
    }))
  );
}

function getAuditEventRecordLink(event: {
  entityType: string | null;
  entityId: string | null;
}): AuditEventRecordLink {
  if (!event.entityType || !event.entityId) {
    return null;
  }

  switch (event.entityType) {
    case "account":
      return {
        href: ROUTE_REGISTRY.accountDetail(event.entityId),
        label: "Open account"
      };
    case "contact":
      return {
        href: ROUTE_REGISTRY.contactDetail(event.entityId),
        label: "Open contact"
      };
    case "opportunity":
      return {
        href: ROUTE_REGISTRY.opportunityDetail(event.entityId),
        label: "Open opportunity"
      };
    case "lead":
      return {
        href: ROUTE_REGISTRY.leadDetail(event.entityId),
        label: "Open lead"
      };
    case "dealer_order":
      return {
        href: ROUTE_REGISTRY.dealerOrderDetail(event.entityId),
        label: "Open dealer order"
      };
    case "task":
      return {
        href: ROUTE_REGISTRY.taskDetail(event.entityId),
        label: "Open task"
      };
    case "case":
      return {
        href: ROUTE_REGISTRY.caseDetail(event.entityId),
        label: "Open case"
      };
    case "campaign":
      return {
        href: ROUTE_REGISTRY.campaignDetail(event.entityId),
        label: "Open campaign"
      };
    default:
      return null;
  }
}

function formatAuditToken(value: string): string {
  return value.replaceAll("_", " ");
}
