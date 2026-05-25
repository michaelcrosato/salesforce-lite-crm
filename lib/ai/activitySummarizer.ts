import { z } from "zod";
import {
  validateDeterministicAiOutput,
  type DeterministicAiOutputValidationResult
} from "@/lib/ai/outputValidation";

export const activitySummaryResultSchema = z
  .object({
    summary: z.string(),
    nextStep: z.string().min(1),
    tags: z.array(z.string().min(1))
  })
  .strict();

export type ActivitySummaryResult = {
  summary: string;
  nextStep: string;
  tags: string[];
};

export type ActivitySummarizerInput = {
  rawText: string;
};

export interface ActivitySummarizer {
  summarize(input: ActivitySummarizerInput): ActivitySummaryResult;
}

const nextStepRules: Array<{
  tag: string;
  pattern: RegExp;
  nextStep: string;
}> = [
  {
    tag: "proposal",
    pattern: /\bsend (the )?proposal\b|\bproposal\b/i,
    nextStep: "Send proposal and confirm review timeline."
  },
  {
    tag: "follow-up",
    pattern: /\bfollow up\b|\bfollow-up\b/i,
    nextStep: "Follow up with the customer."
  },
  {
    tag: "call-back",
    pattern: /\bcall back\b|\bcallback\b/i,
    nextStep: "Call back and confirm next steps."
  },
  {
    tag: "pricing",
    pattern: /\bpricing\b|\bprice\b|\bdiscount\b/i,
    nextStep: "Review pricing and send options."
  },
  {
    tag: "decision-maker",
    pattern: /\bdecision maker\b|\bdecision-maker\b|\beconomic buyer\b/i,
    nextStep: "Confirm the decision maker and buying process."
  },
  {
    tag: "budget",
    pattern: /\bbudget\b|\bfunding\b/i,
    nextStep: "Clarify budget and business case."
  },
  {
    tag: "timeline",
    pattern: /\btimeline\b|\bclose date\b|\bgo-live\b/i,
    nextStep: "Confirm timeline and target close date."
  },
  {
    tag: "contract",
    pattern: /\bcontract\b|\bmsa\b|\border form\b/i,
    nextStep: "Send or review contract."
  },
  {
    tag: "friday",
    pattern: /\b(by|next|this)\s+friday\b/i,
    nextStep: "Follow up by Friday."
  },
  {
    tag: "next-week",
    pattern: /\bnext week\b/i,
    nextStep: "Schedule follow-up next week."
  }
];

function meaningfulSentences(rawText: string) {
  return rawText
    .replace(/\s+/g, " ")
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter((sentence) => sentence.split(/\s+/).filter(Boolean).length >= 3);
}

export class DeterministicActivitySummarizer implements ActivitySummarizer {
  summarize(input: ActivitySummarizerInput): ActivitySummaryResult {
    const cleaned = input.rawText.trim().replace(/\s+/g, " ");
    const sentences = meaningfulSentences(cleaned);
    const summary = sentences.slice(0, 2).join(" ") || cleaned.slice(0, 180);
    const matchedRules = nextStepRules.filter((rule) =>
      rule.pattern.test(cleaned)
    );
    const primaryRule = matchedRules[0];

    return {
      summary: summary.length > 220 ? `${summary.slice(0, 217)}...` : summary,
      nextStep: primaryRule?.nextStep ?? "Review and schedule follow-up.",
      tags: matchedRules.map((rule) => rule.tag)
    };
  }
}

export const deterministicActivitySummarizer =
  new DeterministicActivitySummarizer();

export function validateActivitySummaryResult(
  output: unknown
): DeterministicAiOutputValidationResult<ActivitySummaryResult> {
  return validateDeterministicAiOutput(activitySummaryResultSchema, output);
}
