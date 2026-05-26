import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import type { CampaignInfluenceSummary } from "@/lib/services/campaignInfluence";

export function CampaignPerformanceListSummary({
  summary
}: {
  summary: CampaignInfluenceSummary | null;
}) {
  if (!summary) {
    return (
      <span className="text-sm text-muted-foreground">No performance data</span>
    );
  }

  return (
    <div className="space-y-1 text-sm" data-testid="campaign-row-performance">
      <div className="font-medium">
        {formatNumber(summary.memberCounts.total)} members
      </div>
      <div className="text-muted-foreground">
        {formatCurrency(summary.opportunityMetrics.openValue)} open pipeline
      </div>
      <div className="text-muted-foreground">
        {formatRate(summary.influenceLite.opportunityCoverageRate)} opportunity
        coverage
      </div>
    </div>
  );
}

export function CampaignPerformanceCard({
  summary
}: {
  summary: CampaignInfluenceSummary | null;
}) {
  if (!summary) {
    return (
      <Card data-testid="campaign-empty-performance">
        <CardHeader>
          <CardTitle>Performance</CardTitle>
          <CardDescription>
            No campaign influence summary is available.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card data-testid="campaign-summary-performance">
      <CardHeader>
        <CardTitle>Performance</CardTitle>
        <CardDescription>
          Member and influence-lite summary from local CRM data.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <Metric
            label="Members"
            value={formatNumber(summary.memberCounts.total)}
            detail={`${formatNumber(summary.memberCounts.contacts)} contacts / ${formatNumber(summary.memberCounts.leads)} leads`}
            testId="campaign-metric-members"
          />
          <Metric
            label="Open pipeline"
            value={formatCurrency(summary.opportunityMetrics.openValue)}
            detail={`${formatNumber(summary.opportunityMetrics.openCount)} open opportunities`}
            testId="campaign-metric-open-pipeline"
          />
          <Metric
            label="Routed lead rate"
            value={formatRate(summary.influenceLite.routedLeadRate)}
            detail={`${formatNumber(summary.influenceLite.routedLeadMembers)} routed lead members`}
            testId="campaign-metric-routed-rate"
          />
          <Metric
            label="Opportunity coverage"
            value={formatRate(summary.influenceLite.opportunityCoverageRate)}
            detail={`${formatNumber(summary.influenceLite.contactsWithOpportunities)} contacts with opportunities`}
            testId="campaign-metric-coverage-rate"
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-3">
            <h3 className="text-sm font-semibold">Top opportunities</h3>
            <Badge variant="outline">
              {formatCurrency(summary.opportunityMetrics.weightedOpenValue)}{" "}
              weighted open
            </Badge>
          </div>
          {summary.topOpportunities.length > 0 ? (
            <div className="space-y-2">
              {summary.topOpportunities.map((opportunity) => (
                <Link
                  key={opportunity.id}
                  href={opportunity.route}
                  className="block rounded-md border bg-background p-3 hover:border-primary"
                  data-testid="campaign-opportunity-influence"
                >
                  <span className="block text-sm font-medium">
                    {opportunity.name}
                  </span>
                  <span className="mt-1 block text-xs text-muted-foreground">
                    {formatCurrency(opportunity.value)} ·{" "}
                    {formatRate(opportunity.probability / 100)} probability ·{" "}
                    {opportunity.contactName}
                  </span>
                </Link>
              ))}
            </div>
          ) : (
            <p
              className="rounded-md border bg-muted/40 p-3 text-sm text-muted-foreground"
              data-testid="campaign-empty-performance"
            >
              {emptyMessage(summary.emptyReason)}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Metric({
  detail,
  label,
  testId,
  value
}: {
  detail: string;
  label: string;
  testId: string;
  value: string;
}) {
  return (
    <div className="rounded-md border bg-background p-3" data-testid={testId}>
      <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block text-lg font-semibold">{value}</span>
      <span className="mt-1 block text-xs text-muted-foreground">{detail}</span>
    </div>
  );
}

function formatRate(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function emptyMessage(
  reason: CampaignInfluenceSummary["emptyReason"]
): string {
  if (reason === "no_members") {
    return "No campaign members are linked yet.";
  }

  if (reason === "no_related_opportunities") {
    return "Campaign members do not have related opportunities yet.";
  }

  return "No related opportunities are available.";
}
