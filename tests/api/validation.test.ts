import { describe, expect, it } from "vitest";
import type { z } from "zod/v4";
import {
  accountCreateSchema,
  activityCreateSchema,
  areaCreateSchema,
  campaignCreateSchema,
  caseCreateSchema,
  contactCreateSchema,
  dealerOrderCreateSchema,
  knowledgeArticleCreateSchema,
  leadCreateSchema,
  noteCreateSchema,
  opportunityCreateSchema,
  opportunityStageHistoryCreateSchema,
  taskCreateSchema
} from "@/lib/validation";

type ValidationCase = {
  entity: string;
  schema: z.ZodType<unknown>;
  input: unknown;
};

const invalidCases: ValidationCase[] = [
  {
    entity: "Account",
    schema: accountCreateSchema,
    input: {
      name: "",
      status: "active",
      healthScore: 80
    }
  },
  {
    entity: "Contact",
    schema: contactCreateSchema,
    input: {
      firstName: "Invalid",
      lastName: "Contact",
      email: "not-an-email",
      status: "active"
    }
  },
  {
    entity: "Opportunity",
    schema: opportunityCreateSchema,
    input: {
      name: "Invalid opportunity",
      stage: "bad-stage",
      value: 1000,
      probability: 50
    }
  },
  {
    entity: "Lead",
    schema: leadCreateSchema,
    input: {
      firstName: "",
      lastName: "Lead"
    }
  },
  {
    entity: "Activity",
    schema: activityCreateSchema,
    input: {
      title: "Invalid activity",
      type: "bad-type"
    }
  },
  {
    entity: "Note",
    schema: noteCreateSchema,
    input: {
      title: "",
      rawText: "Missing usable title"
    }
  },
  {
    entity: "DealerOrder",
    schema: dealerOrderCreateSchema,
    input: {
      accountId: "",
      name: "Invalid dealer order",
      monthlyQuota: 10,
      status: "active",
      startDate: "2026-05-01"
    }
  },
  {
    entity: "Area",
    schema: areaCreateSchema,
    input: {
      name: "Invalid area",
      postalPrefixes: ""
    }
  },
  {
    entity: "Task",
    schema: taskCreateSchema,
    input: {
      title: "Invalid task",
      status: "bad-status"
    }
  },
  {
    entity: "Case",
    schema: caseCreateSchema,
    input: {
      subject: "Invalid case",
      priority: "bad-priority"
    }
  },
  {
    entity: "KnowledgeArticle",
    schema: knowledgeArticleCreateSchema,
    input: {
      title: "Invalid knowledge article",
      body: "",
      status: "published"
    }
  },
  {
    entity: "Campaign",
    schema: campaignCreateSchema,
    input: {
      name: "Invalid campaign",
      status: "bad-status"
    }
  },
  {
    entity: "OpportunityStageHistory",
    schema: opportunityStageHistoryCreateSchema,
    input: {
      dealId: "deal-1",
      fromStage: "new",
      toStage: "bad-stage"
    }
  }
];

describe("CRM validation schemas", () => {
  it.each(invalidCases)(
    "rejects invalid $entity input",
    ({ input, schema }) => {
      expect(schema.safeParse(input).success).toBe(false);
    }
  );

  it("rejects blank required integer fields instead of coercing them to zero", () => {
    expect(
      accountCreateSchema.safeParse({
        name: "Blank Health",
        status: "active",
        healthScore: ""
      }).success
    ).toBe(false);
    expect(
      opportunityCreateSchema.safeParse({
        name: "Blank Value",
        stage: "new",
        value: "",
        probability: 10
      }).success
    ).toBe(false);
  });

  it("treats a blank optional campaign budget as absent", () => {
    const parsed = campaignCreateSchema.safeParse({
      name: "Optional Budget",
      budget: ""
    });

    expect(parsed.success).toBe(true);
    expect(
      parsed.success ? parsed.data.budget : "parse failed"
    ).toBeUndefined();
  });
});
