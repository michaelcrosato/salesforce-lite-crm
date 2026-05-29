import Link from "next/link";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle
} from "@/components/ui/card";
import { Badge, type BadgeProps } from "@/components/ui/badge";
import { formatNumber } from "@/lib/formatters";
import type {
  LeadSlaFollowUpPacket,
  LeadSlaFollowUpPacketBatch,
  LeadSlaFollowUpSituation,
  LeadSlaFollowUpUrgency
} from "@/lib/services/leadSlaFollowUp";

type LeadFollowUpReadinessProps = {
  batch: LeadSlaFollowUpPacketBatch;
  filteredLeadCount: number;
};

const situationLabels: Record<LeadSlaFollowUpSituation, string> = {
  stale: "Stale",
  unrouted: "Unrouted",
  routed_uncontacted: "Routed, uncontacted",
  contacted: "Contacted",
  closed: "Closed",
  dead: "Dead"
};

export function LeadFollowUpReadiness({
  batch,
  filteredLeadCount
}: LeadFollowUpReadinessProps) {
  const representativePackets = selectRepresentativePackets(batch.packets);
  const scoredDetail =
    filteredLeadCount > batch.summary.packetCount
      ? `First ${formatNumber(batch.summary.packetCount)} of ${formatNumber(
          filteredLeadCount
        )} filtered leads`
      : `${formatNumber(batch.summary.packetCount)} filtered leads`;

  return (
    <Card data-testid="lead-follow-up-panel">
      <CardHeader>
        <CardTitle>Lead Follow-Up Readiness</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <SummaryCell
            label="Review"
            value={batch.summary.reviewRecommendedCount}
            detail={scoredDetail}
            testid="lead-follow-up-summary-review"
          />
          <SummaryCell
            label="Urgent"
            value={batch.summary.urgentCount}
            detail="Immediate operator review"
            testid="lead-follow-up-summary-urgent"
          />
          <SummaryCell
            label="High"
            value={batch.summary.highCount}
            detail="Elevated SLA risk"
            testid="lead-follow-up-summary-high"
          />
          <SummaryCell
            label="Unrouted"
            value={batch.summary.unroutedCount}
            detail="Routing gap review"
            testid="lead-follow-up-summary-unrouted"
          />
          <SummaryCell
            label="Routed"
            value={batch.summary.routedUncontactedCount}
            detail="Dealer follow-up ready"
            testid="lead-follow-up-summary-routed"
          />
          <SummaryCell
            label="Stale"
            value={batch.summary.staleCount}
            detail="Past stale threshold"
            testid="lead-follow-up-summary-stale"
          />
        </div>

        {representativePackets.length > 0 ? (
          <div
            className="grid gap-3 lg:grid-cols-5"
            data-testid="lead-follow-up-packet-list"
          >
            {representativePackets.map((packet) => (
              <FollowUpPacketCard key={packet.lead.id} packet={packet} />
            ))}
          </div>
        ) : (
          <p
            className="rounded-md border bg-background p-4 text-sm text-muted-foreground"
            data-testid="lead-follow-up-packet-list"
          >
            No lead follow-up packets match the current filters.
          </p>
        )}

        <div
          className="flex flex-wrap gap-2 text-xs text-muted-foreground"
          data-testid="lead-follow-up-write-flags"
        >
          <Badge variant={batch.write.databaseWrites ? "danger" : "outline-solid"}>
            Database {batch.write.databaseWrites ? "on" : "off"}
          </Badge>
          <Badge variant={batch.write.taskCreation ? "danger" : "outline-solid"}>
            Tasks {batch.write.taskCreation ? "on" : "off"}
          </Badge>
          <Badge variant={batch.write.routingExecution ? "danger" : "outline-solid"}>
            Routing {batch.write.routingExecution ? "on" : "off"}
          </Badge>
          <Badge variant={batch.write.providerCalls ? "danger" : "outline-solid"}>
            Provider calls {batch.write.providerCalls ? "on" : "off"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function SummaryCell({
  label,
  value,
  detail,
  testid
}: {
  label: string;
  value: number;
  detail: string;
  testid: string;
}) {
  return (
    <div className="rounded-md border bg-background p-3" data-testid={testid}>
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold tracking-normal">
        {formatNumber(value)}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
    </div>
  );
}

function FollowUpPacketCard({
  packet
}: {
  packet: LeadSlaFollowUpPacket;
}) {
  return (
    <Link
      href={packet.lead.route}
      className="block rounded-md border bg-background p-4 transition-colors hover:bg-muted/50"
      data-testid="lead-follow-up-packet-card"
    >
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant={urgencyVariant(packet.urgency)}>
          {urgencyLabel(packet.urgency)}
        </Badge>
        <Badge variant={packet.requiresOperatorReview ? "warning" : "outline-solid"}>
          {situationLabels[packet.situation]}
        </Badge>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-semibold">
        {packet.lead.name}
      </p>
      <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
        {humanizeCode(packet.reasonCode)} · updated{" "}
        {formatNumber(packet.age.updatedAgeDays)}d ago
      </p>
      <p className="mt-3 rounded-md bg-accent px-3 py-2 text-xs font-medium text-accent-foreground">
        {packet.suggestedNextAction.label}
      </p>
    </Link>
  );
}

function selectRepresentativePackets(
  packets: readonly LeadSlaFollowUpPacket[]
): LeadSlaFollowUpPacket[] {
  const reviewPackets = packets.filter((packet) => packet.requiresOperatorReview);
  const candidates = reviewPackets.length > 0 ? reviewPackets : packets;

  return [...candidates]
    .sort(
      (left, right) =>
        right.urgencyRank - left.urgencyRank ||
        right.age.updatedAgeDays - left.age.updatedAgeDays ||
        left.lead.name.localeCompare(right.lead.name)
    )
    .slice(0, 5);
}

function urgencyVariant(
  urgency: LeadSlaFollowUpUrgency
): BadgeProps["variant"] {
  switch (urgency) {
    case "urgent":
      return "danger";
    case "high":
      return "warning";
    case "normal":
      return "secondary";
    case "low":
    case "none":
      return "outline-solid";
  }
}

function urgencyLabel(urgency: LeadSlaFollowUpUrgency): string {
  switch (urgency) {
    case "urgent":
      return "Urgent";
    case "high":
      return "High";
    case "normal":
      return "Normal";
    case "low":
      return "Low";
    case "none":
      return "No SLA";
  }
}

function humanizeCode(value: string): string {
  return value
    .split("_")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
