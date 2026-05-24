import type { CaseQueueKey } from "@/lib/crm/registry";

export type CaseQueueAssignment = {
  queueKey: CaseQueueKey;
  reason: string;
};

type CaseQueueInput = {
  subject: string;
  description?: string | null;
  priority?: string | null;
  accountId?: string | null;
  contactId?: string | null;
  queueKey?: CaseQueueKey | null;
};

type KeywordQueueRule = {
  queueKey: CaseQueueKey;
  reason: string;
  keywords: readonly string[];
};

const keywordQueueRules: readonly KeywordQueueRule[] = [
  {
    queueKey: "billing_support",
    reason: "matched_billing_language",
    keywords: ["billing", "invoice", "payment", "renewal", "quote"]
  },
  {
    queueKey: "dealer_operations",
    reason: "matched_dealer_operations_language",
    keywords: ["dealer", "routing", "lead", "order", "quota", "pace"]
  },
  {
    queueKey: "data_quality",
    reason: "matched_data_quality_language",
    keywords: [
      "bulk import",
      "data",
      "migration",
      "integration",
      "compliance",
      "audit"
    ]
  },
  {
    queueKey: "customer_success",
    reason: "matched_customer_success_language",
    keywords: ["onboarding", "training", "portal", "feature request"]
  }
];

export function assignCaseQueue(input: CaseQueueInput): CaseQueueAssignment {
  if (input.queueKey) {
    return {
      queueKey: input.queueKey,
      reason: "explicit_queue"
    };
  }

  if (input.priority === "urgent") {
    return {
      queueKey: "critical_support",
      reason: "urgent_priority"
    };
  }

  const searchableText = `${input.subject} ${input.description ?? ""}`
    .trim()
    .toLowerCase();

  for (const rule of keywordQueueRules) {
    if (rule.keywords.some((keyword) => searchableText.includes(keyword))) {
      return {
        queueKey: rule.queueKey,
        reason: rule.reason
      };
    }
  }

  if (input.accountId || input.contactId) {
    return {
      queueKey: "customer_success",
      reason: "linked_customer_record"
    };
  }

  return {
    queueKey: "general_support",
    reason: "default_general_support"
  };
}
