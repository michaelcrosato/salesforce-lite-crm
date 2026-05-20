import { prisma } from "@/lib/prisma";
import {
  normalizePostalCode,
  validatePostalCode
} from "@/lib/postal";
import { idSchema } from "@/lib/validation";

export type RoutingDecisionJson =
  | string
  | number
  | boolean
  | null
  | { readonly [key: string]: RoutingDecisionJson }
  | readonly RoutingDecisionJson[];

export type RoutingDecisionStep = {
  step: string;
  result: RoutingDecisionJson;
};

export type RoutingDecision = {
  leadId: string;
  normalizedPostal: string;
  prefix: string;
  matchedAreaId: string | null;
  matchedAreaName: string | null;
  candidateOrders: Array<{
    id: string;
    dealerName: string;
    paceGap: number;
    rank: number;
  }>;
  selectedOrderId: string | null;
  decidedAt: Date;
  reason: string;
  summary: string;
  steps: RoutingDecisionStep[];
};

type LeadWithRoutingContext = NonNullable<
  Awaited<ReturnType<typeof findLeadWithRoutingContext>>
>;

export async function getRoutingDecisionForLead(
  leadId: string
): Promise<RoutingDecision | null> {
  const parsedLeadId = idSchema.parse(leadId);
  const routingEvent = await prisma.activity.findFirst({
    where: {
      leadId: parsedLeadId,
      type: "routing_event"
    },
    orderBy: [
      {
        createdAt: "desc"
      },
      {
        id: "desc"
      }
    ]
  });

  if (!routingEvent) {
    return null;
  }

  const lead = await findLeadWithRoutingContext(parsedLeadId);

  if (!lead) {
    return null;
  }

  const postal = resolvePostal(lead.postalCode);
  const parsedPayload = parseRoutingPayload(
    routingEvent.rawText ?? routingEvent.summary
  );
  const candidateOrders =
    buildCandidateOrdersFromSteps(parsedPayload.steps) ??
    buildLegacyCandidateOrders(lead, parsedPayload.summary);

  return {
    leadId: parsedLeadId,
    normalizedPostal: postal.normalized,
    prefix: postal.prefix,
    matchedAreaId: lead.areaId,
    matchedAreaName: lead.area?.name ?? null,
    candidateOrders,
    selectedOrderId: lead.assignedOrderId,
    decidedAt: routingEvent.createdAt,
    reason: parsedPayload.summary,
    summary: parsedPayload.summary,
    steps: parsedPayload.steps
  };
}

function findLeadWithRoutingContext(leadId: string) {
  return prisma.lead.findUnique({
    where: {
      id: leadId
    },
    include: {
      area: {
        select: {
          name: true
        }
      },
      assignedOrder: {
        select: {
          id: true,
          name: true
        }
      }
    }
  });
}

function resolvePostal(postalCode: string | null) {
  const input = postalCode ?? "";
  const canadian = validatePostalCode(input, "CA");

  if (canadian.ok) {
    return {
      normalized: canadian.normalized,
      prefix: canadian.prefix
    };
  }

  const us = validatePostalCode(input, "US");

  if (us.ok) {
    return {
      normalized: us.normalized,
      prefix: us.prefix
    };
  }

  const normalized = normalizePostalCode(input, "CA") ?? input.trim();

  return {
    normalized,
    prefix: normalized.length > 0 ? extractFallbackPrefix(normalized) : ""
  };
}

function extractFallbackPrefix(normalized: string): string {
  const compact = normalized.replace(/\s+/g, "").toUpperCase();

  if (/^\d/.test(compact)) {
    return compact.slice(0, 5);
  }

  return compact.slice(0, 3);
}

function parseRoutingPayload(summary: string | null) {
  const fallbackSummary = summary?.trim() ?? "";

  if (!fallbackSummary.startsWith("{")) {
    return {
      summary: fallbackSummary,
      steps: fallbackSummary
        ? [
            {
              step: "legacy_summary",
              result: fallbackSummary
            }
          ]
        : []
    };
  }

  try {
    const parsed: unknown = JSON.parse(fallbackSummary);

    if (!isRecord(parsed)) {
      return legacyPayload(fallbackSummary);
    }

    const summaryValue = parsed.summary;
    const stepsValue = parsed.steps;
    const steps = Array.isArray(stepsValue)
      ? stepsValue.filter(isRoutingDecisionStep)
      : [];

    return {
      summary:
        typeof summaryValue === "string" ? summaryValue : fallbackSummary,
      steps
    };
  } catch {
    return legacyPayload(fallbackSummary);
  }
}

function legacyPayload(summary: string) {
  return {
    summary,
    steps: summary
      ? [
          {
            step: "legacy_summary",
            result: summary
          }
        ]
      : []
  };
}

function isRoutingDecisionStep(value: unknown): value is RoutingDecisionStep {
  if (!isRecord(value)) {
    return false;
  }

  return typeof value.step === "string" && isRoutingDecisionJson(value.result);
}

function isRoutingDecisionJson(value: unknown): value is RoutingDecisionJson {
  if (value === null) {
    return true;
  }

  if (
    typeof value === "string" ||
    typeof value === "number" ||
    typeof value === "boolean"
  ) {
    return true;
  }

  if (Array.isArray(value)) {
    return value.every(isRoutingDecisionJson);
  }

  if (isRecord(value)) {
    return Object.values(value).every(isRoutingDecisionJson);
  }

  return false;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function buildLegacyCandidateOrders(
  lead: LeadWithRoutingContext,
  summary: string
): RoutingDecision["candidateOrders"] {
  if (!lead.assignedOrder) {
    return [];
  }

  return [
    {
      id: lead.assignedOrder.id,
      dealerName: lead.assignedOrder.name,
      paceGap: parsePaceGap(summary),
      rank: 1
    }
  ];
}

function buildCandidateOrdersFromSteps(
  steps: RoutingDecisionStep[]
): RoutingDecision["candidateOrders"] | null {
  const rankStep = steps.find((step) => step.step === "rank_pace_gap");

  if (!rankStep || !Array.isArray(rankStep.result)) {
    return null;
  }

  const candidateOrders: RoutingDecision["candidateOrders"] = [];

  for (const result of rankStep.result) {
    if (!isRecord(result)) {
      continue;
    }

    const orderId = result.orderId;
    const dealerName = result.dealerName;
    const paceGap = result.paceGap;
    const rank = result.rank;

    if (
      typeof orderId !== "string" ||
      typeof dealerName !== "string" ||
      typeof paceGap !== "number" ||
      typeof rank !== "number"
    ) {
      continue;
    }

    candidateOrders.push({
      id: orderId,
      dealerName,
      paceGap,
      rank
    });
  }

  return candidateOrders;
}

function parsePaceGap(summary: string): number {
  const match = summary.match(/pace gap ([0-9]+(?:\.[0-9]+)?)/i);

  if (!match) {
    return 0;
  }

  return Number(match[1]);
}
