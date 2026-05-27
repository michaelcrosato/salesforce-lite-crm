import {
  getLeadDispositionSnapshot,
  listLeadDispositionSnapshots,
  type LeadDispositionClock,
  type LeadDispositionListOptions,
  type LeadDispositionSnapshot,
  type LeadDispositionState
} from "@/lib/services/leadDispositions";

export const LEAD_SLA_FOLLOW_UP_PACKET_VERSION = 1;

export const LEAD_SLA_FOLLOW_UP_SITUATIONS = [
  "stale",
  "unrouted",
  "routed_uncontacted",
  "contacted",
  "closed",
  "dead"
] as const;

export type LeadSlaFollowUpSituation =
  (typeof LEAD_SLA_FOLLOW_UP_SITUATIONS)[number];

export const LEAD_SLA_FOLLOW_UP_REASON_CODES = [
  "stale_open_lead",
  "stale_unrouted_lead",
  "stale_routed_uncontacted",
  "stale_contacted_lead",
  "unrouted_new_lead",
  "unrouted_routing_failed",
  "unrouted_assigned_without_routing",
  "routed_uncontacted",
  "routed_missing_evidence",
  "contacted_waiting_outcome",
  "closed_terminal",
  "dead_terminal"
] as const;

export type LeadSlaFollowUpReasonCode =
  (typeof LEAD_SLA_FOLLOW_UP_REASON_CODES)[number];

export const LEAD_SLA_FOLLOW_UP_URGENCIES = [
  "none",
  "low",
  "normal",
  "high",
  "urgent"
] as const;

export type LeadSlaFollowUpUrgency =
  (typeof LEAD_SLA_FOLLOW_UP_URGENCIES)[number];

export const LEAD_SLA_FOLLOW_UP_ACTION_CODES = [
  "review_stale_lead_follow_up",
  "review_routing_gap",
  "contact_routed_lead",
  "monitor_contacted_lead",
  "no_follow_up_closed",
  "no_follow_up_dead"
] as const;

export type LeadSlaFollowUpActionCode =
  (typeof LEAD_SLA_FOLLOW_UP_ACTION_CODES)[number];

export type LeadSlaFollowUpThresholds = {
  staleAfterDays: number;
  urgentStaleAfterDays: number;
  unroutedHighAfterDays: number;
  unroutedUrgentAfterDays: number;
  routedHighAfterDays: number;
  routedUrgentAfterDays: number;
};

export const DEFAULT_LEAD_SLA_FOLLOW_UP_THRESHOLDS = {
  staleAfterDays: 7,
  urgentStaleAfterDays: 14,
  unroutedHighAfterDays: 1,
  unroutedUrgentAfterDays: 3,
  routedHighAfterDays: 1,
  routedUrgentAfterDays: 2
} satisfies LeadSlaFollowUpThresholds;

export type LeadSlaFollowUpBuildOptions = {
  thresholds?: Partial<LeadSlaFollowUpThresholds>;
};

export type LeadSlaFollowUpListOptions = LeadDispositionListOptions &
  LeadSlaFollowUpBuildOptions & {
    clock?: LeadDispositionClock;
    situations?: readonly LeadSlaFollowUpSituation[];
    urgency?: LeadSlaFollowUpUrgency;
  };

export type LeadSlaFollowUpLookupOptions = LeadSlaFollowUpBuildOptions & {
  clock?: LeadDispositionClock;
};

export type LeadSlaFollowUpWriteSafety = {
  readOnly: true;
  databaseWrites: false;
  taskCreation: false;
  leadMutation: false;
  routingExecution: false;
  notifications: false;
  providerCalls: false;
  backgroundJobs: false;
};

export const LEAD_SLA_FOLLOW_UP_WRITE_SAFETY = {
  readOnly: true,
  databaseWrites: false,
  taskCreation: false,
  leadMutation: false,
  routingExecution: false,
  notifications: false,
  providerCalls: false,
  backgroundJobs: false
} satisfies LeadSlaFollowUpWriteSafety;

export type LeadSlaFollowUpSuggestedAction = {
  code: LeadSlaFollowUpActionCode;
  label: string;
  description: string;
  metadata: {
    requiresHumanReview: boolean;
    safeForCurrentSprint: true;
    createsTask: false;
    mutatesLead: false;
    sendsNotification: false;
    runsRouting: false;
    callsProvider: false;
    schedulesJob: false;
  };
};

export type LeadSlaFollowUpPacket = {
  packetType: "lead-sla-follow-up-packet";
  packetVersion: typeof LEAD_SLA_FOLLOW_UP_PACKET_VERSION;
  lead: {
    id: string;
    name: string;
    route: string;
    status: string;
    knownStatus: LeadDispositionSnapshot["knownStatus"];
    assignmentReason: string | null;
    knownAssignmentReason: LeadDispositionSnapshot["knownAssignmentReason"];
    assignedOrderId: string | null;
  };
  situation: LeadSlaFollowUpSituation;
  reasonCode: LeadSlaFollowUpReasonCode;
  urgency: LeadSlaFollowUpUrgency;
  urgencyRank: number;
  requiresOperatorReview: boolean;
  age: {
    createdAgeDays: number;
    updatedAgeDays: number;
    routingEventAgeDays: number | null;
  };
  stale: {
    isStale: boolean;
    staleAfterDays: number;
    urgentStaleAfterDays: number;
    staleAgeDays: number;
  };
  suggestedNextAction: LeadSlaFollowUpSuggestedAction;
  evidence: {
    dispositionState: LeadDispositionSnapshot["state"];
    dispositionReasonCode: LeadDispositionSnapshot["reasonCode"];
    hasRoutingEvent: boolean;
    routingEventId: string | null;
    routingEventAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    evaluatedAt: Date;
  };
  write: LeadSlaFollowUpWriteSafety;
};

export type LeadSlaFollowUpSummary = {
  packetCount: number;
  staleCount: number;
  unroutedCount: number;
  routedUncontactedCount: number;
  contactedCount: number;
  closedCount: number;
  deadCount: number;
  urgentCount: number;
  highCount: number;
  reviewRecommendedCount: number;
};

export type LeadSlaFollowUpPacketBatch = {
  packetType: "lead-sla-follow-up-packet-batch";
  packetVersion: typeof LEAD_SLA_FOLLOW_UP_PACKET_VERSION;
  packets: readonly LeadSlaFollowUpPacket[];
  summary: LeadSlaFollowUpSummary;
  write: LeadSlaFollowUpWriteSafety;
};

export function buildLeadSlaFollowUpPacket(
  snapshot: LeadDispositionSnapshot,
  options: LeadSlaFollowUpBuildOptions = {}
): LeadSlaFollowUpPacket {
  const thresholds = normalizeThresholds(options.thresholds);
  const routingEventAgeDays = snapshot.routingEventAt
    ? ageInWholeDays(snapshot.routingEventAt, snapshot.evaluatedAt)
    : null;
  const classification = classifyLeadSlaFollowUp(
    snapshot,
    thresholds,
    routingEventAgeDays
  );

  return {
    packetType: "lead-sla-follow-up-packet",
    packetVersion: LEAD_SLA_FOLLOW_UP_PACKET_VERSION,
    lead: {
      id: snapshot.leadId,
      name: snapshot.leadName,
      route: `/leads/${snapshot.leadId}`,
      status: snapshot.status,
      knownStatus: snapshot.knownStatus,
      assignmentReason: snapshot.assignmentReason,
      knownAssignmentReason: snapshot.knownAssignmentReason,
      assignedOrderId: snapshot.assignedOrderId
    },
    situation: classification.situation,
    reasonCode: classification.reasonCode,
    urgency: classification.urgency,
    urgencyRank: urgencyRank(classification.urgency),
    requiresOperatorReview: classification.urgency !== "none",
    age: {
      createdAgeDays: snapshot.createdAgeDays,
      updatedAgeDays: snapshot.updatedAgeDays,
      routingEventAgeDays
    },
    stale: {
      isStale: classification.situation === "stale",
      staleAfterDays: thresholds.staleAfterDays,
      urgentStaleAfterDays: thresholds.urgentStaleAfterDays,
      staleAgeDays: Math.max(0, snapshot.updatedAgeDays - thresholds.staleAfterDays)
    },
    suggestedNextAction: suggestedActionFor(classification.situation),
    evidence: {
      dispositionState: snapshot.state,
      dispositionReasonCode: snapshot.reasonCode,
      hasRoutingEvent: snapshot.hasRoutingEvent,
      routingEventId: snapshot.routingEventId,
      routingEventAt: copyDateOrNull(snapshot.routingEventAt),
      createdAt: copyDate(snapshot.createdAt),
      updatedAt: copyDate(snapshot.updatedAt),
      evaluatedAt: copyDate(snapshot.evaluatedAt)
    },
    write: LEAD_SLA_FOLLOW_UP_WRITE_SAFETY
  };
}

export function buildLeadSlaFollowUpPackets(
  snapshots: readonly LeadDispositionSnapshot[],
  options: LeadSlaFollowUpBuildOptions = {}
): LeadSlaFollowUpPacket[] {
  return snapshots.map((snapshot) =>
    buildLeadSlaFollowUpPacket(snapshot, options)
  );
}

export function buildLeadSlaFollowUpPacketBatch(
  snapshots: readonly LeadDispositionSnapshot[],
  options: LeadSlaFollowUpBuildOptions = {}
): LeadSlaFollowUpPacketBatch {
  const packets = buildLeadSlaFollowUpPackets(snapshots, options);

  return {
    packetType: "lead-sla-follow-up-packet-batch",
    packetVersion: LEAD_SLA_FOLLOW_UP_PACKET_VERSION,
    packets,
    summary: summarizeLeadSlaFollowUpPackets(packets),
    write: LEAD_SLA_FOLLOW_UP_WRITE_SAFETY
  };
}

export async function getLeadSlaFollowUpPacket(
  leadId: string,
  options: LeadSlaFollowUpLookupOptions = {}
): Promise<LeadSlaFollowUpPacket | null> {
  const snapshot = options.clock
    ? await getLeadDispositionSnapshot(leadId, options.clock)
    : await getLeadDispositionSnapshot(leadId);

  return snapshot ? buildLeadSlaFollowUpPacket(snapshot, options) : null;
}

export async function listLeadSlaFollowUpPackets(
  options: LeadSlaFollowUpListOptions = {}
): Promise<LeadSlaFollowUpPacket[]> {
  const dispositionOptions: LeadDispositionListOptions = {
    leadIds: options.leadIds,
    status: options.status,
    limit: options.limit
  };
  const snapshots = options.clock
    ? await listLeadDispositionSnapshots(dispositionOptions, options.clock)
    : await listLeadDispositionSnapshots(dispositionOptions);
  const packets = buildLeadSlaFollowUpPackets(snapshots, options);

  return filterPackets(packets, options);
}

export async function listLeadSlaFollowUpPacketBatch(
  options: LeadSlaFollowUpListOptions = {}
): Promise<LeadSlaFollowUpPacketBatch> {
  const packets = await listLeadSlaFollowUpPackets(options);

  return {
    packetType: "lead-sla-follow-up-packet-batch",
    packetVersion: LEAD_SLA_FOLLOW_UP_PACKET_VERSION,
    packets,
    summary: summarizeLeadSlaFollowUpPackets(packets),
    write: LEAD_SLA_FOLLOW_UP_WRITE_SAFETY
  };
}

export function summarizeLeadSlaFollowUpPackets(
  packets: readonly LeadSlaFollowUpPacket[]
): LeadSlaFollowUpSummary {
  return packets.reduce<LeadSlaFollowUpSummary>(
    (summary, packet) => ({
      packetCount: summary.packetCount + 1,
      staleCount: summary.staleCount + countSituation(packet, "stale"),
      unroutedCount: summary.unroutedCount + countSituation(packet, "unrouted"),
      routedUncontactedCount:
        summary.routedUncontactedCount +
        countSituation(packet, "routed_uncontacted"),
      contactedCount:
        summary.contactedCount + countSituation(packet, "contacted"),
      closedCount: summary.closedCount + countSituation(packet, "closed"),
      deadCount: summary.deadCount + countSituation(packet, "dead"),
      urgentCount: summary.urgentCount + countUrgency(packet, "urgent"),
      highCount: summary.highCount + countUrgency(packet, "high"),
      reviewRecommendedCount:
        summary.reviewRecommendedCount +
        (packet.requiresOperatorReview ? 1 : 0)
    }),
    {
      packetCount: 0,
      staleCount: 0,
      unroutedCount: 0,
      routedUncontactedCount: 0,
      contactedCount: 0,
      closedCount: 0,
      deadCount: 0,
      urgentCount: 0,
      highCount: 0,
      reviewRecommendedCount: 0
    }
  );
}

function classifyLeadSlaFollowUp(
  snapshot: LeadDispositionSnapshot,
  thresholds: LeadSlaFollowUpThresholds,
  routingEventAgeDays: number | null
): {
  situation: LeadSlaFollowUpSituation;
  reasonCode: LeadSlaFollowUpReasonCode;
  urgency: LeadSlaFollowUpUrgency;
} {
  if (snapshot.state === "dead") {
    return {
      situation: "dead",
      reasonCode: "dead_terminal",
      urgency: "none"
    };
  }

  if (snapshot.state === "closed") {
    return {
      situation: "closed",
      reasonCode: "closed_terminal",
      urgency: "none"
    };
  }

  if (snapshot.updatedAgeDays >= thresholds.staleAfterDays) {
    return {
      situation: "stale",
      reasonCode: staleReasonCode(snapshot.state),
      urgency:
        snapshot.updatedAgeDays >= thresholds.urgentStaleAfterDays
          ? "urgent"
          : "high"
    };
  }

  if (snapshot.state === "contacted") {
    return {
      situation: "contacted",
      reasonCode: "contacted_waiting_outcome",
      urgency: "low"
    };
  }

  if (
    snapshot.state === "routed_uncontacted" ||
    snapshot.state === "routed_missing_evidence"
  ) {
    const routedAgeDays = routingEventAgeDays ?? snapshot.createdAgeDays;

    return {
      situation: "routed_uncontacted",
      reasonCode:
        snapshot.state === "routed_missing_evidence"
          ? "routed_missing_evidence"
          : "routed_uncontacted",
      urgency: thresholdUrgency(
        routedAgeDays,
        thresholds.routedHighAfterDays,
        thresholds.routedUrgentAfterDays
      )
    };
  }

  return {
    situation: "unrouted",
    reasonCode: unroutedReasonCode(snapshot.state),
    urgency: thresholdUrgency(
      snapshot.createdAgeDays,
      thresholds.unroutedHighAfterDays,
      thresholds.unroutedUrgentAfterDays
    )
  };
}

function staleReasonCode(
  state: LeadDispositionState
): LeadSlaFollowUpReasonCode {
  switch (state) {
    case "unrouted":
    case "routing_failed":
    case "assigned_without_routing":
      return "stale_unrouted_lead";
    case "routed_uncontacted":
    case "routed_missing_evidence":
      return "stale_routed_uncontacted";
    case "contacted":
      return "stale_contacted_lead";
    case "closed":
    case "dead":
      return "stale_open_lead";
  }
}

function unroutedReasonCode(
  state: LeadDispositionState
): LeadSlaFollowUpReasonCode {
  switch (state) {
    case "routing_failed":
      return "unrouted_routing_failed";
    case "assigned_without_routing":
      return "unrouted_assigned_without_routing";
    case "unrouted":
    case "routed_uncontacted":
    case "routed_missing_evidence":
    case "contacted":
    case "closed":
    case "dead":
      return "unrouted_new_lead";
  }
}

function thresholdUrgency(
  ageDays: number,
  highAfterDays: number,
  urgentAfterDays: number
): LeadSlaFollowUpUrgency {
  if (ageDays >= urgentAfterDays) {
    return "urgent";
  }

  if (ageDays >= highAfterDays) {
    return "high";
  }

  return "normal";
}

function suggestedActionFor(
  situation: LeadSlaFollowUpSituation
): LeadSlaFollowUpSuggestedAction {
  switch (situation) {
    case "stale":
      return suggestedAction(
        "review_stale_lead_follow_up",
        "Review stale lead follow-up",
        "Review the existing lead timeline and decide whether a manual follow-up is still useful.",
        true
      );
    case "unrouted":
      return suggestedAction(
        "review_routing_gap",
        "Review routing gap",
        "Inspect the existing routing evidence before any manual routing or coverage change is considered.",
        true
      );
    case "routed_uncontacted":
      return suggestedAction(
        "contact_routed_lead",
        "Contact routed lead",
        "Use the existing lead and dealer-order context to plan a human follow-up outside this read-only packet.",
        true
      );
    case "contacted":
      return suggestedAction(
        "monitor_contacted_lead",
        "Monitor contacted lead",
        "Keep the contacted lead visible for later outcome review without changing status automatically.",
        true
      );
    case "closed":
      return suggestedAction(
        "no_follow_up_closed",
        "No follow-up for closed lead",
        "Closed leads are terminal for this readiness packet.",
        false
      );
    case "dead":
      return suggestedAction(
        "no_follow_up_dead",
        "No follow-up for dead lead",
        "Dead leads are terminal for this readiness packet.",
        false
      );
  }
}

function suggestedAction(
  code: LeadSlaFollowUpActionCode,
  label: string,
  description: string,
  requiresHumanReview: boolean
): LeadSlaFollowUpSuggestedAction {
  return {
    code,
    label,
    description,
    metadata: {
      requiresHumanReview,
      safeForCurrentSprint: true,
      createsTask: false,
      mutatesLead: false,
      sendsNotification: false,
      runsRouting: false,
      callsProvider: false,
      schedulesJob: false
    }
  };
}

function filterPackets(
  packets: readonly LeadSlaFollowUpPacket[],
  options: Pick<LeadSlaFollowUpListOptions, "situations" | "urgency">
): LeadSlaFollowUpPacket[] {
  const situationSet = options.situations
    ? new Set(options.situations)
    : null;

  return packets.filter(
    (packet) =>
      (!situationSet || situationSet.has(packet.situation)) &&
      (!options.urgency || packet.urgency === options.urgency)
  );
}

function normalizeThresholds(
  overrides: Partial<LeadSlaFollowUpThresholds> | undefined
): LeadSlaFollowUpThresholds {
  return {
    staleAfterDays: normalizeThreshold(
      overrides?.staleAfterDays,
      DEFAULT_LEAD_SLA_FOLLOW_UP_THRESHOLDS.staleAfterDays
    ),
    urgentStaleAfterDays: normalizeThreshold(
      overrides?.urgentStaleAfterDays,
      DEFAULT_LEAD_SLA_FOLLOW_UP_THRESHOLDS.urgentStaleAfterDays
    ),
    unroutedHighAfterDays: normalizeThreshold(
      overrides?.unroutedHighAfterDays,
      DEFAULT_LEAD_SLA_FOLLOW_UP_THRESHOLDS.unroutedHighAfterDays
    ),
    unroutedUrgentAfterDays: normalizeThreshold(
      overrides?.unroutedUrgentAfterDays,
      DEFAULT_LEAD_SLA_FOLLOW_UP_THRESHOLDS.unroutedUrgentAfterDays
    ),
    routedHighAfterDays: normalizeThreshold(
      overrides?.routedHighAfterDays,
      DEFAULT_LEAD_SLA_FOLLOW_UP_THRESHOLDS.routedHighAfterDays
    ),
    routedUrgentAfterDays: normalizeThreshold(
      overrides?.routedUrgentAfterDays,
      DEFAULT_LEAD_SLA_FOLLOW_UP_THRESHOLDS.routedUrgentAfterDays
    )
  };
}

function normalizeThreshold(value: number | undefined, fallback: number): number {
  if (value === undefined || !Number.isFinite(value)) {
    return fallback;
  }

  return Math.max(0, Math.trunc(value));
}

function urgencyRank(urgency: LeadSlaFollowUpUrgency): number {
  switch (urgency) {
    case "urgent":
      return 4;
    case "high":
      return 3;
    case "normal":
      return 2;
    case "low":
      return 1;
    case "none":
      return 0;
  }
}

function countSituation(
  packet: LeadSlaFollowUpPacket,
  situation: LeadSlaFollowUpSituation
): number {
  return packet.situation === situation ? 1 : 0;
}

function countUrgency(
  packet: LeadSlaFollowUpPacket,
  urgency: LeadSlaFollowUpUrgency
): number {
  return packet.urgency === urgency ? 1 : 0;
}

function ageInWholeDays(start: Date, end: Date): number {
  const ageMs = Math.max(0, end.getTime() - start.getTime());

  return Math.floor(ageMs / (24 * 60 * 60 * 1000));
}

function copyDate(date: Date): Date {
  return new Date(date.getTime());
}

function copyDateOrNull(date: Date | null): Date | null {
  return date ? copyDate(date) : null;
}
