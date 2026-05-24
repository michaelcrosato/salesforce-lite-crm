import type { Case } from "@prisma/client";
import {
  CASE_PRIORITIES,
  type CasePriority
} from "@/lib/crm/registry";

export const CASE_SLA_STATES = [
  "on_track",
  "due_soon",
  "overdue",
  "stopped_on_time",
  "stopped_overdue"
] as const;

export type CaseSlaState = (typeof CASE_SLA_STATES)[number];

export type CaseSlaClock = {
  now(): Date;
};

export type CaseSlaPolicy = {
  priority: CasePriority;
  targetHours: number;
  dueSoonHours: number;
  label: string;
};

export type CaseSlaSource = Pick<
  Case,
  | "id"
  | "subject"
  | "status"
  | "priority"
  | "queueKey"
  | "createdAt"
  | "updatedAt"
>;

export type CaseSlaSnapshot = {
  caseId: string;
  subject: string;
  status: string;
  priority: CasePriority;
  queueKey: string;
  policyLabel: string;
  targetHours: number;
  dueSoonHours: number;
  startedAt: Date;
  dueAt: Date;
  evaluatedAt: Date;
  stoppedAt: Date | null;
  remainingMinutes: number;
  overdueMinutes: number;
  state: CaseSlaState;
  isOverdue: boolean;
  isStopped: boolean;
};

const MS_PER_MINUTE = 60 * 1000;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;

export const CASE_SLA_POLICIES = {
  urgent: {
    priority: "urgent",
    targetHours: 4,
    dueSoonHours: 1,
    label: "Urgent response"
  },
  high: {
    priority: "high",
    targetHours: 24,
    dueSoonHours: 4,
    label: "High priority response"
  },
  normal: {
    priority: "normal",
    targetHours: 48,
    dueSoonHours: 8,
    label: "Normal response"
  },
  low: {
    priority: "low",
    targetHours: 96,
    dueSoonHours: 24,
    label: "Low priority response"
  }
} satisfies Record<CasePriority, CaseSlaPolicy>;

const stoppedStatuses = new Set<string>(["resolved", "closed"]);
const casePriorityValues: readonly string[] = CASE_PRIORITIES;

export function buildCaseSlaSnapshot(
  crmCase: CaseSlaSource,
  clock: CaseSlaClock = systemCaseSlaClock
): CaseSlaSnapshot {
  const evaluatedAt = copyDate(clock.now());
  const startedAt = copyDate(crmCase.createdAt);
  const priority = normalizePriority(crmCase.priority);
  const policy = CASE_SLA_POLICIES[priority];
  const dueAt = addHours(startedAt, policy.targetHours);
  const isStopped = stoppedStatuses.has(crmCase.status);
  const stoppedAt = isStopped ? copyDate(crmCase.updatedAt) : null;
  const comparisonAt = stoppedAt ?? evaluatedAt;
  const remainingMs = dueAt.getTime() - comparisonAt.getTime();
  const remainingMinutes = Math.max(
    0,
    Math.ceil(remainingMs / MS_PER_MINUTE)
  );
  const overdueMinutes = Math.max(
    0,
    Math.ceil(-remainingMs / MS_PER_MINUTE)
  );
  const state = caseSlaState(policy, isStopped, remainingMinutes, overdueMinutes);

  return {
    caseId: crmCase.id,
    subject: crmCase.subject,
    status: crmCase.status,
    priority,
    queueKey: crmCase.queueKey,
    policyLabel: policy.label,
    targetHours: policy.targetHours,
    dueSoonHours: policy.dueSoonHours,
    startedAt,
    dueAt,
    evaluatedAt,
    stoppedAt,
    remainingMinutes,
    overdueMinutes,
    state,
    isOverdue: overdueMinutes > 0,
    isStopped
  };
}

export function buildCaseSlaSnapshots(
  cases: readonly CaseSlaSource[],
  clock: CaseSlaClock = systemCaseSlaClock
): CaseSlaSnapshot[] {
  const evaluatedAt = copyDate(clock.now());
  const stableClock: CaseSlaClock = {
    now: () => copyDate(evaluatedAt)
  };

  return cases.map((crmCase) => buildCaseSlaSnapshot(crmCase, stableClock));
}

export function getCaseSlaPolicy(priority: string): CaseSlaPolicy {
  return CASE_SLA_POLICIES[normalizePriority(priority)];
}

function caseSlaState(
  policy: CaseSlaPolicy,
  isStopped: boolean,
  remainingMinutes: number,
  overdueMinutes: number
): CaseSlaState {
  if (isStopped) {
    return overdueMinutes > 0 ? "stopped_overdue" : "stopped_on_time";
  }

  if (overdueMinutes > 0) {
    return "overdue";
  }

  return remainingMinutes <= policy.dueSoonHours * 60
    ? "due_soon"
    : "on_track";
}

function normalizePriority(priority: string): CasePriority {
  if (isCasePriority(priority)) {
    return priority;
  }

  return "normal";
}

function isCasePriority(priority: string): priority is CasePriority {
  return casePriorityValues.includes(priority);
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * MS_PER_HOUR);
}

function copyDate(date: Date): Date {
  return new Date(date.getTime());
}

const systemCaseSlaClock: CaseSlaClock = {
  now: () => new Date()
};
