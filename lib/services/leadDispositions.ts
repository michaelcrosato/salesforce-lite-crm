import type { Activity, Lead, Prisma } from "@prisma/client";
import {
  ASSIGNMENT_REASONS,
  LEAD_STATUSES,
  type AssignmentReason,
  type LeadStatus
} from "@/lib/crm-constants";
import { prisma } from "@/lib/prisma";
import { idSchema } from "@/lib/validation";

export const LEAD_DISPOSITION_STATES = [
  "unrouted",
  "assigned_without_routing",
  "routing_failed",
  "routed_uncontacted",
  "routed_missing_evidence",
  "contacted",
  "closed",
  "dead"
] as const;

export type LeadDispositionState =
  (typeof LEAD_DISPOSITION_STATES)[number];

export const LEAD_DISPOSITION_REASON_CODES = [
  "new_unrouted",
  "assigned_without_routing",
  "legacy_status_unrouted",
  "routing_failed_no_area_match",
  "routing_failed_no_matching_active_order",
  "routing_failed_all_orders_at_quota",
  "routed_with_event",
  "routed_missing_event",
  "status_contacted",
  "status_closed",
  "status_dead"
] as const;

export type LeadDispositionReasonCode =
  (typeof LEAD_DISPOSITION_REASON_CODES)[number];

export type LeadDispositionClock = {
  now(): Date;
};

export type LeadDispositionActivitySource = Pick<
  Activity,
  "id" | "type" | "createdAt"
>;

export type LeadDispositionSource = Pick<
  Lead,
  | "id"
  | "firstName"
  | "lastName"
  | "status"
  | "assignmentReason"
  | "assignedOrderId"
  | "createdAt"
  | "updatedAt"
> & {
  activities: readonly LeadDispositionActivitySource[];
};

export type LeadDispositionSnapshot = {
  leadId: string;
  leadName: string;
  status: string;
  knownStatus: LeadStatus | null;
  state: LeadDispositionState;
  reasonCode: LeadDispositionReasonCode;
  assignmentReason: string | null;
  knownAssignmentReason: AssignmentReason | null;
  assignedOrderId: string | null;
  createdAt: Date;
  updatedAt: Date;
  evaluatedAt: Date;
  createdAgeDays: number;
  updatedAgeDays: number;
  hasRoutingEvent: boolean;
  routingEventId: string | null;
  routingEventAt: Date | null;
};

export type LeadDispositionListOptions = {
  leadIds?: readonly string[];
  status?: LeadStatus;
  limit?: number;
};

export const DEFAULT_LEAD_DISPOSITION_LIMIT = 25;
export const MAX_LEAD_DISPOSITION_LIMIT = 100;

const assignmentReasonValues: readonly string[] = ASSIGNMENT_REASONS;
const leadStatusValues: readonly string[] = LEAD_STATUSES;

export function buildLeadDispositionSnapshot(
  lead: LeadDispositionSource,
  clock: LeadDispositionClock = systemLeadDispositionClock
): LeadDispositionSnapshot {
  const evaluatedAt = copyDate(clock.now());
  const routingEvent = latestRoutingEvent(lead.activities);
  const knownStatus = normalizeLeadStatus(lead.status);
  const knownAssignmentReason = normalizeAssignmentReason(
    lead.assignmentReason
  );
  const classification = classifyLeadDisposition(
    lead,
    knownStatus,
    knownAssignmentReason,
    routingEvent
  );

  return {
    leadId: lead.id,
    leadName: formatLeadName(lead),
    status: lead.status,
    knownStatus,
    state: classification.state,
    reasonCode: classification.reasonCode,
    assignmentReason: lead.assignmentReason,
    knownAssignmentReason,
    assignedOrderId: lead.assignedOrderId,
    createdAt: copyDate(lead.createdAt),
    updatedAt: copyDate(lead.updatedAt),
    evaluatedAt,
    createdAgeDays: ageInWholeDays(lead.createdAt, evaluatedAt),
    updatedAgeDays: ageInWholeDays(lead.updatedAt, evaluatedAt),
    hasRoutingEvent: routingEvent !== null,
    routingEventId: routingEvent?.id ?? null,
    routingEventAt: routingEvent ? copyDate(routingEvent.createdAt) : null
  };
}

export function buildLeadDispositionSnapshots(
  leads: readonly LeadDispositionSource[],
  clock: LeadDispositionClock = systemLeadDispositionClock
): LeadDispositionSnapshot[] {
  const evaluatedAt = copyDate(clock.now());
  const stableClock: LeadDispositionClock = {
    now: () => copyDate(evaluatedAt)
  };

  return leads.map((lead) => buildLeadDispositionSnapshot(lead, stableClock));
}

export async function getLeadDispositionSnapshot(
  leadId: string,
  clock: LeadDispositionClock = systemLeadDispositionClock
): Promise<LeadDispositionSnapshot | null> {
  const parsedLeadId = idSchema.parse(leadId);
  const lead = await prisma.lead.findUnique({
    where: {
      id: parsedLeadId
    },
    include: routingEvidenceInclude
  });

  return lead ? buildLeadDispositionSnapshot(lead, clock) : null;
}

export async function listLeadDispositionSnapshots(
  options: LeadDispositionListOptions = {},
  clock: LeadDispositionClock = systemLeadDispositionClock
): Promise<LeadDispositionSnapshot[]> {
  const leadIds = parseLeadIds(options.leadIds);

  if (leadIds && leadIds.length === 0) {
    return [];
  }

  const leads = await prisma.lead.findMany({
    where: {
      ...(leadIds ? { id: { in: leadIds } } : {}),
      ...(options.status ? { status: options.status } : {})
    },
    include: routingEvidenceInclude,
    orderBy: [
      {
        createdAt: "desc"
      },
      {
        id: "asc"
      }
    ],
    take: clampLeadDispositionLimit(options.limit)
  });

  return buildLeadDispositionSnapshots(leads, clock);
}

function classifyLeadDisposition(
  lead: LeadDispositionSource,
  knownStatus: LeadStatus | null,
  knownAssignmentReason: AssignmentReason | null,
  routingEvent: LeadDispositionActivitySource | null
): {
  state: LeadDispositionState;
  reasonCode: LeadDispositionReasonCode;
} {
  if (knownStatus === "dead") {
    return {
      state: "dead",
      reasonCode: "status_dead"
    };
  }

  if (knownStatus === "closed") {
    return {
      state: "closed",
      reasonCode: "status_closed"
    };
  }

  if (knownStatus === "contacted") {
    return {
      state: "contacted",
      reasonCode: "status_contacted"
    };
  }

  if (knownAssignmentReason === "routed" || lead.assignedOrderId) {
    return routingEvent
      ? {
          state: "routed_uncontacted",
          reasonCode: "routed_with_event"
        }
      : {
          state: "routed_missing_evidence",
          reasonCode: "routed_missing_event"
        };
  }

  const failedReason = routingFailureReasonCode(knownAssignmentReason);

  if (failedReason) {
    return {
      state: "routing_failed",
      reasonCode: failedReason
    };
  }

  if (knownStatus === "assigned") {
    return {
      state: "assigned_without_routing",
      reasonCode: "assigned_without_routing"
    };
  }

  return {
    state: "unrouted",
    reasonCode: knownStatus === "new" ? "new_unrouted" : "legacy_status_unrouted"
  };
}

function routingFailureReasonCode(
  assignmentReason: AssignmentReason | null
): LeadDispositionReasonCode | null {
  switch (assignmentReason) {
    case "no_area_match":
      return "routing_failed_no_area_match";
    case "no_matching_active_order":
      return "routing_failed_no_matching_active_order";
    case "all_orders_at_quota":
      return "routing_failed_all_orders_at_quota";
    case "routed":
    case null:
      return null;
  }
}

function latestRoutingEvent(
  activities: readonly LeadDispositionActivitySource[]
): LeadDispositionActivitySource | null {
  let latest: LeadDispositionActivitySource | null = null;

  for (const activity of activities) {
    if (activity.type !== "routing_event") {
      continue;
    }

    if (
      latest === null ||
      activity.createdAt.getTime() > latest.createdAt.getTime() ||
      (activity.createdAt.getTime() === latest.createdAt.getTime() &&
        activity.id > latest.id)
    ) {
      latest = activity;
    }
  }

  return latest;
}

function formatLeadName(lead: Pick<Lead, "firstName" | "lastName">): string {
  return `${lead.firstName} ${lead.lastName}`.trim();
}

function normalizeLeadStatus(status: string): LeadStatus | null {
  return leadStatusValues.includes(status) ? (status as LeadStatus) : null;
}

function normalizeAssignmentReason(
  assignmentReason: string | null
): AssignmentReason | null {
  if (!assignmentReason) {
    return null;
  }

  return assignmentReasonValues.includes(assignmentReason)
    ? (assignmentReason as AssignmentReason)
    : null;
}

function ageInWholeDays(start: Date, end: Date): number {
  const ageMs = Math.max(0, end.getTime() - start.getTime());

  return Math.floor(ageMs / (24 * 60 * 60 * 1000));
}

function copyDate(date: Date): Date {
  return new Date(date.getTime());
}

function clampLeadDispositionLimit(limit: number | undefined): number {
  if (limit === undefined || !Number.isFinite(limit)) {
    return DEFAULT_LEAD_DISPOSITION_LIMIT;
  }

  return Math.min(
    MAX_LEAD_DISPOSITION_LIMIT,
    Math.max(1, Math.trunc(limit))
  );
}

function parseLeadIds(leadIds: readonly string[] | undefined): string[] | null {
  if (!leadIds) {
    return null;
  }

  return Array.from(new Set(leadIds.map((leadId) => idSchema.parse(leadId))));
}

const routingEvidenceInclude = {
  activities: {
    where: {
      type: "routing_event"
    },
    orderBy: [
      {
        createdAt: "desc"
      },
      {
        id: "desc"
      }
    ],
    take: 1
  }
} satisfies Prisma.LeadInclude;

const systemLeadDispositionClock: LeadDispositionClock = {
  now: () => new Date()
};
