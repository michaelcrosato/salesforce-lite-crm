"use client";

import { BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  type CaseKnowledgeSuggestionEmptyReason,
  type CaseKnowledgeSuggestionReasonCode
} from "@/lib/services/caseKnowledgeSuggestions";
import { type CaseQueueKey } from "@/lib/crm/registry";
import { formatDate } from "@/lib/formatters";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger";

export type CaseKnowledgeSuggestionView = {
  rank: number;
  articleId: string;
  title: string;
  summary: string | null;
  category: string | null;
  audience: string;
  caseQueueKey: CaseQueueKey | null;
  publishedAt: string | null;
  score: number;
  reasonCodes: CaseKnowledgeSuggestionReasonCode[];
  matchedKeywords: string[];
  matchedTerms: string[];
};

export type CaseKnowledgeAssistPacketView = {
  caseId: string;
  caseSubject: string;
  caseQueueKey: CaseQueueKey | null;
  source: "local_case_article_metadata";
  limit: number;
  totalAvailable: number;
  emptyReason: CaseKnowledgeSuggestionEmptyReason | null;
  suggestions: CaseKnowledgeSuggestionView[];
};

const QUEUE_LABELS: Record<CaseQueueKey, string> = {
  critical_support: "Critical Support",
  billing_support: "Billing Support",
  dealer_operations: "Dealer Operations",
  data_quality: "Data Quality",
  customer_success: "Customer Success",
  general_support: "General Support"
};

const REASON_LABELS: Record<CaseKnowledgeSuggestionReasonCode, string> = {
  queue_match: "Queue match",
  keyword_match: "Keyword match",
  metadata_text_match: "Text match",
  urgent_priority_match: "Urgent match"
};

const EMPTY_COPY: Record<
  CaseKnowledgeSuggestionEmptyReason,
  { title: string; description: string }
> = {
  no_published_articles: {
    title: "No published articles",
    description: "Publish local articles before case assist can suggest them."
  },
  no_relevant_articles: {
    title: "No knowledge matches",
    description: "Published articles do not match this case yet."
  }
};

export function CaseKnowledgeListSummary({
  packet
}: {
  packet: CaseKnowledgeAssistPacketView;
}) {
  const topSuggestion = packet.suggestions[0];

  if (!topSuggestion) {
    return (
      <div
        className="flex min-w-36 flex-col gap-1"
        data-testid="case-knowledge-summary"
      >
        <Badge variant="outline">No matches</Badge>
        <span className="text-xs text-muted-foreground">
          {packet.emptyReason ? EMPTY_COPY[packet.emptyReason].title : "No data"}
        </span>
      </div>
    );
  }

  return (
    <div
      className="flex min-w-44 flex-col gap-1"
      data-testid="case-knowledge-summary"
    >
      <Badge variant={summaryVariant(packet.totalAvailable)}>
        {suggestionCountLabel(packet)}
      </Badge>
      <span className="line-clamp-2 text-xs text-muted-foreground">
        {topSuggestion.title}
      </span>
    </div>
  );
}

export function CaseKnowledgeAssistCard({
  packet
}: {
  packet: CaseKnowledgeAssistPacketView;
}) {
  return (
    <Card data-testid="case-knowledge-card">
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div className="space-y-1">
          <CardTitle>Knowledge assist</CardTitle>
          <p className="text-sm text-muted-foreground">
            {packet.totalAvailable > 0
              ? suggestionCountLabel(packet)
              : "No matching suggestions"}
          </p>
        </div>
        <div className="rounded-full bg-muted p-2 text-muted-foreground">
          <BookOpen className="h-4 w-4" aria-hidden="true" />
        </div>
      </CardHeader>
      <CardContent>
        {packet.suggestions.length > 0 ? (
          <ol className="space-y-3">
            {packet.suggestions.map((suggestion) => (
              <li
                key={suggestion.articleId}
                className="rounded-md border bg-background p-3"
                data-testid="case-knowledge-suggestion"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge variant="outline">#{suggestion.rank}</Badge>
                      <p className="font-medium">{suggestion.title}</p>
                    </div>
                    {suggestion.summary ? (
                      <p className="mt-2 text-sm text-muted-foreground">
                        {suggestion.summary}
                      </p>
                    ) : null}
                  </div>
                  <Badge variant="secondary">Score {suggestion.score}</Badge>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {suggestion.reasonCodes.map((reasonCode) => (
                    <Badge key={reasonCode} variant={reasonVariant(reasonCode)}>
                      {REASON_LABELS[reasonCode]}
                    </Badge>
                  ))}
                </div>

                <dl className="mt-3 grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                  <MetaItem label="Audience" value={audienceLabel(suggestion.audience)} />
                  <MetaItem
                    label="Queue"
                    value={
                      suggestion.caseQueueKey
                        ? QUEUE_LABELS[suggestion.caseQueueKey]
                        : "Any queue"
                    }
                  />
                  <MetaItem
                    label="Category"
                    value={suggestion.category ?? "Uncategorized"}
                  />
                  <MetaItem
                    label="Published"
                    value={formatDate(suggestion.publishedAt)}
                  />
                </dl>

                {suggestion.matchedKeywords.length > 0 ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Matched: {suggestion.matchedKeywords.join(", ")}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        ) : (
          <KnowledgeEmptyState emptyReason={packet.emptyReason} />
        )}
      </CardContent>
    </Card>
  );
}

function KnowledgeEmptyState({
  emptyReason
}: {
  emptyReason: CaseKnowledgeSuggestionEmptyReason | null;
}) {
  const copy = emptyReason
    ? EMPTY_COPY[emptyReason]
    : {
        title: "No knowledge data",
        description: "Knowledge suggestions are not available for this case."
      };

  return (
    <div
      className="rounded-md border border-dashed bg-muted/30 p-4 text-sm"
      data-testid="case-knowledge-empty"
    >
      <p className="font-medium">{copy.title}</p>
      <p className="mt-1 text-muted-foreground">{copy.description}</p>
    </div>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="font-medium uppercase tracking-normal">{label}</dt>
      <dd className="mt-0.5 text-foreground">{value}</dd>
    </div>
  );
}

function suggestionCountLabel(packet: CaseKnowledgeAssistPacketView): string {
  if (packet.totalAvailable > packet.suggestions.length) {
    return `${packet.suggestions.length} of ${packet.totalAvailable} suggestions`;
  }

  return packet.totalAvailable === 1
    ? "1 suggestion"
    : `${packet.totalAvailable} suggestions`;
}

function summaryVariant(totalAvailable: number): BadgeVariant {
  return totalAvailable > 0 ? "success" : "outline";
}

function reasonVariant(
  reasonCode: CaseKnowledgeSuggestionReasonCode
): BadgeVariant {
  return reasonCode === "urgent_priority_match"
    ? "danger"
    : reasonCode === "queue_match"
      ? "success"
      : "outline";
}

function audienceLabel(audience: string): string {
  return audience === "customer" ? "Customer" : "Internal";
}
