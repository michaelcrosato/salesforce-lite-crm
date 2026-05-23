import type { AuditEvent, Prisma } from "@prisma/client";
import { z } from "zod";
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
  "report",
  "csv",
  "system"
] as const;

export type AuditEventCategory = keyof typeof AUDIT_EVENT_ACTIONS;
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

const auditCategorySchema = z.enum([
  "user",
  "record",
  "ai",
  "import",
  "routing",
  "workflow"
] satisfies [AuditEventCategory, ...AuditEventCategory[]]);

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

export type AuditEventCreateInput = z.input<typeof auditEventCreateSchema>;
export type AuditEventListInput = z.input<typeof auditEventListSchema>;

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

export function recordAuditEventOperation(
  input: unknown
): Prisma.PrismaPromise<AuditEvent> {
  const parsed = auditEventCreateSchema.parse(input);
  const data: Prisma.AuditEventUncheckedCreateInput = {
    category: parsed.category,
    action: parsed.action,
    actorUserId: parsed.actorUserId ?? null,
    entityType: parsed.entityType ?? null,
    entityId: parsed.entityId ?? null,
    summary: parsed.summary,
    metadata: serializeAuditMetadata(parsed.metadata),
    occurredAt: parsed.occurredAt
  };

  return prisma.auditEvent.create({ data });
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
