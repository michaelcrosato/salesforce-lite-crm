import {
  AlertTriangle,
  ClipboardCheck,
  FileText,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type {
  AiActionReadinessDigest,
  AiActionReadinessDigestStatus,
  AiActionReadinessSampleProposalReference
} from "@/lib/ai/actionReadinessDigest";
import type {
  AiActionReviewPacketStatus,
  AiActionReviewPayloadValidationStatus
} from "@/lib/ai/actionReviewPackets";
import type { AiActionIntentWriteFlags } from "@/lib/ai/actionIntentRegistry";

type AiActionReviewOperatorProps = {
  digest: AiActionReadinessDigest;
};

const writeFlagLabels = [
  { key: "database", label: "Database" },
  { key: "crmRecords", label: "CRM records" },
  { key: "auditEvents", label: "Audit events" },
  { key: "routes", label: "Routes" },
  { key: "routeHandlers", label: "Route handlers" },
  { key: "productUi", label: "Product UI" },
  { key: "externalServices", label: "External services" },
  { key: "backgroundJobs", label: "Background jobs" },
  { key: "actionExecution", label: "Action execution" },
  { key: "approvals", label: "Approvals" }
] satisfies ReadonlyArray<{
  key: keyof AiActionIntentWriteFlags;
  label: string;
}>;

export function AiActionReviewOperator({
  digest
}: AiActionReviewOperatorProps) {
  const hasWriteSurface = writeFlagLabels.some(
    (flag) => digest.write[flag.key]
  );

  return (
    <section className="space-y-4" data-testid="ai-action-review-operator">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            AI Action Review
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect deterministic proposal reviews before any action executor
            exists.
          </p>
        </div>
        <Badge variant={digestStatusVariant(digest.status)}>
          {formatToken(digest.status)}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={ClipboardCheck}
          label="Ready samples"
          value={formatNumber(digest.summary.sampleStatusCounts.readyForReview)}
          testId="ai-action-review-summary-ready"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Blocked samples"
          value={formatNumber(digest.summary.sampleStatusCounts.blocked)}
          testId="ai-action-review-summary-blocked"
        />
        <SummaryCard
          icon={FileText}
          label="Deferred samples"
          value={formatNumber(digest.summary.sampleStatusCounts.deferred)}
          testId="ai-action-review-summary-deferred"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value={hasWriteSurface ? "Review" : "None"}
          testId="ai-action-review-summary-writes"
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <Card>
          <CardHeader>
            <CardTitle>Readiness Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <Table data-testid="ai-action-review-source-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Source</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Items</TableHead>
                  <TableHead>Issues</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {digest.sources.map((source) => (
                  <TableRow key={source.source}>
                    <TableCell className="font-medium">
                      {source.label}
                      <span className="mt-1 block text-xs text-muted-foreground">
                        {source.version}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant={digestStatusVariant(source.status)}>
                        {formatToken(source.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(source.itemCount)}</TableCell>
                    <TableCell>{formatNumber(source.issueCount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Proposal Previews</CardTitle>
              <p className="text-sm text-muted-foreground">
                {formatNumber(digest.summary.sampleProposalCount)} fixture
                proposals, {formatNumber(digest.summary.issueCount)} total
                issues.
              </p>
            </div>
            <Badge variant="outline">{digest.source.digestScope}</Badge>
          </CardHeader>
          <CardContent>
            <Table data-testid="ai-action-review-proposal-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Fixture</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payload</TableHead>
                  <TableHead>Intent</TableHead>
                  <TableHead>Issues</TableHead>
                  <TableHead>Review gates</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {digest.sampleProposals.map((sample) => (
                  <ProposalRow key={sample.fixtureId} sample={sample} />
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-5"
        data-testid="ai-action-review-safety-flags"
      >
        {writeFlagLabels.map((flag) => (
          <div
            key={flag.key}
            className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
          >
            <span className="font-medium">{flag.label}</span>
            {" "}
            <span className="ml-2 text-muted-foreground">
              {digest.write[flag.key] ? "on" : "off"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function ProposalRow({
  sample
}: {
  sample: AiActionReadinessSampleProposalReference;
}) {
  return (
    <TableRow data-testid={`ai-action-review-proposal-${sample.category}`}>
      <TableCell className="font-medium">
        {sample.category}
        <span className="mt-1 block max-w-[18rem] truncate text-xs text-muted-foreground">
          {sample.fixtureId}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={packetStatusVariant(sample.status)}>
          {formatToken(sample.status)}
        </Badge>
      </TableCell>
      <TableCell>
        <Badge variant={payloadStatusVariant(sample.payloadValidationStatus)}>
          {formatToken(sample.payloadValidationStatus)}
        </Badge>
        <span className="mt-1 block max-w-[16rem] truncate text-xs text-muted-foreground">
          {sample.payloadKeys.length > 0
            ? sample.payloadKeys.join(", ")
            : "No payload keys"}
        </span>
      </TableCell>
      <TableCell>
        {sample.intentId ?? "Unknown intent"}
        <span className="mt-1 block max-w-56 truncate text-xs text-muted-foreground">
          {sample.targetEntity ?? "No target"}
          {sample.targetRoute ? ` - ${sample.targetRoute}` : ""}
        </span>
      </TableCell>
      <TableCell>
        <span className="block max-w-[18rem] truncate">
          {sample.issueCodes.length > 0
            ? sample.issueCodes.map(formatToken).join(", ")
            : "none"}
        </span>
      </TableCell>
      <TableCell>
        <div className="flex flex-col gap-1">
          <span>Approval {sample.approvalRequired ? "required" : "not required"}</span>
          <span>
            Audit{" "}
            {sample.auditRequiredBeforeExecution
              ? "required before execution"
              : "not required"}
          </span>
          <span>
            Execution {sample.currentExecutionAllowed ? "on" : "off"} / writes{" "}
            {sample.wouldWriteNow ? "on" : "off"}
          </span>
        </div>
      </TableCell>
    </TableRow>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  testId
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-normal">{value}</div>
      </CardContent>
    </Card>
  );
}

function digestStatusVariant(status: AiActionReadinessDigestStatus) {
  switch (status) {
    case "ready":
      return "success";
    case "blocked":
      return "danger";
  }
}

function packetStatusVariant(status: AiActionReviewPacketStatus) {
  switch (status) {
    case "ready_for_review":
      return "success";
    case "deferred":
      return "warning";
    case "blocked":
      return "danger";
  }
}

function payloadStatusVariant(status: AiActionReviewPayloadValidationStatus) {
  switch (status) {
    case "valid":
      return "success";
    case "invalid":
      return "danger";
    case "skipped":
      return "outline-solid";
  }
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
