"use client";

import { type FormEvent, useMemo, useState, useTransition } from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  Gauge,
  ListChecks,
  Play,
  Scale,
  ShieldCheck,
  Table2,
  type LucideIcon
} from "lucide-react";
import {
  previewRoutingFairnessReviewAction,
  type RoutingFairnessReviewActionResult
} from "@/app/reports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/toast";
import type { RoutingSimulatorInputCatalog } from "@/lib/server/routingSimulatorContracts";
import type {
  RoutingFairnessReviewPacket,
  RoutingFairnessReviewRowSample,
  RoutingFairnessReviewStatus,
  RoutingFairnessReviewWriteFlags
} from "@/lib/server/routingFairnessReviewPackets";
import type { RoutingFairnessMetricStatus } from "@/lib/server/routingFairnessMetrics";

type RoutingFairnessOperatorProps = {
  catalog: RoutingSimulatorInputCatalog;
};

type MetricHighlight =
  RoutingFairnessReviewRowSample["metricHighlights"][number];

const writeFlagLabels = [
  { key: "database", label: "Database" },
  { key: "leads", label: "Leads" },
  { key: "activities", label: "Activities" },
  { key: "routingEvents", label: "Routing events" },
  { key: "dealerOrders", label: "Dealer orders" },
  { key: "areas", label: "Areas" },
  { key: "pacingEngine", label: "Pacing engine" },
  { key: "forecasts", label: "Forecasts" },
  { key: "routes", label: "Routes" },
  { key: "files", label: "Files" },
  { key: "externalServices", label: "External services" },
  { key: "backgroundJobs", label: "Background jobs" },
  { key: "metricSnapshots", label: "Metric snapshots" },
  { key: "fairnessWeights", label: "Fairness weights" },
  { key: "routingAssignments", label: "Routing assignments" },
  { key: "scenarioPersistence", label: "Scenario persistence" },
  { key: "simulatorRuns", label: "Simulator runs" },
  { key: "reviewSnapshots", label: "Review snapshots" },
  { key: "fairnessReviewHistory", label: "Review history" }
] satisfies ReadonlyArray<{
  key: keyof RoutingFairnessReviewWriteFlags;
  label: string;
}>;

export function RoutingFairnessOperator({
  catalog
}: RoutingFairnessOperatorProps) {
  const { showToast } = useToast();
  const [input, setInput] = useState("");
  const [result, setResult] =
    useState<RoutingFairnessReviewActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const fixtureInput = useMemo(
    () =>
      JSON.stringify(
        {
          leads: catalog.fixtures
        },
        null,
        2
      ),
    [catalog.fixtures]
  );
  const packet = result?.ok ? result.packet : null;
  const fieldErrors = result && !result.ok ? result.fieldErrors : null;

  function useFixtures() {
    setInput(fixtureInput);
    setResult(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const actionResult = await previewRoutingFairnessReviewAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok
            ? "Fairness review ready"
            : "Fairness review failed",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  return (
    <section className="space-y-4" data-testid="routing-fairness-operator">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Routing Fairness Review
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review deterministic fairness metrics for hypothetical routing
            batches without changing lead, order, or pacing data.
          </p>
        </div>
        <Badge variant="outline">S54-F3</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={Scale}
          label="Metric families"
          value="4"
          testId="routing-fairness-summary-metrics"
        />
        <SummaryCard
          icon={Table2}
          label="Max batch"
          value={formatNumber(catalog.limits.batch.max)}
          testId="routing-fairness-summary-max-batch"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Fixture rows"
          value={formatNumber(catalog.fixtures.length)}
          testId="routing-fairness-summary-fixtures"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value="None"
          testId="routing-fairness-summary-writes"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hypothetical Fairness Batch</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            onSubmit={handleSubmit}
            className="grid min-w-0 gap-4 lg:grid-cols-[18rem_minmax(0,1fr)]"
          >
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm font-medium">Supported fields</div>
                <div className="flex flex-wrap gap-2">
                  {catalog.fields.map((field) => (
                    <Badge
                      key={field.key}
                      variant={field.required ? "warning" : "outline"}
                    >
                      {field.label}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Fixture batch</div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(catalog.fixtures.length)} rows use the same
                  published routing simulator input contract.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useFixtures}
                  data-testid="routing-fairness-use-fixtures"
                >
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  Use fixtures
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="routing-fairness-input">JSON</Label>
                <Textarea
                  id="routing-fairness-input"
                  name="routingFairnessInput"
                  value={input}
                  onChange={(event) => {
                    setInput(event.target.value);
                    setResult(null);
                  }}
                  placeholder={'{ "leads": [{ "postalCode": "V5K 0A1", "country": "CA" }] }'}
                  className="min-h-[14rem] font-mono"
                  data-testid="routing-fairness-input"
                />
                <FieldError message={fieldErrors?.input?.[0]} />
                <FieldError message={fieldErrors?.target?.[0]} />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {input.trim().length > 0
                    ? `${formatNumber(input.length)} characters ready`
                    : "No batch entered"}
                </p>
                <Button
                  type="submit"
                  loading={isPending}
                  data-testid="routing-fairness-submit"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {isPending ? "Reviewing..." : "Review fairness"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {packet ? <RoutingFairnessResult packet={packet} /> : null}
    </section>
  );
}

function RoutingFairnessResult({
  packet
}: {
  packet: RoutingFairnessReviewPacket;
}) {
  const hasWriteSurface = writeFlagLabels.some((flag) => packet.write[flag.key]);

  return (
    <div className="space-y-4" data-testid="routing-fairness-result-panel">
      <div className="grid gap-4 md:grid-cols-5">
        <SummaryCard
          icon={Gauge}
          label="Review status"
          value={formatToken(packet.summary.reviewStatus)}
          testId="routing-fairness-summary-status"
        />
        <SummaryCard
          icon={Scale}
          label="Assigned"
          value={formatNumber(packet.summary.assignedCount)}
          testId="routing-fairness-summary-assigned"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Blocked"
          value={formatNumber(packet.summary.blockedCount)}
          testId="routing-fairness-summary-blocked"
        />
        <SummaryCard
          icon={ListChecks}
          label="Issues"
          value={formatNumber(packet.summary.issueCount)}
          testId="routing-fairness-summary-issues"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value={hasWriteSurface ? "Review" : "None"}
          testId="routing-fairness-result-writes"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Fairness Review Packet</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatNumber(packet.summary.representativeSampleCount)} sampled
              of {formatNumber(packet.leadCount)} hypothetical leads.
            </p>
          </div>
          <Badge variant={reviewStatusVariant(packet.summary.reviewStatus)}>
            {formatToken(packet.summary.reviewStatus)}
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-3 md:grid-cols-4">
            <Metric
              label="Issue categories"
              value={formatNumber(packet.summary.issueCategoryCount)}
            />
            <Metric
              label="Thin lead context"
              value={formatNumber(packet.summary.thinLeadQualityCount)}
            />
            <Metric
              label="SLA watch"
              value={formatNumber(packet.summary.slaWatchCount)}
            />
            <Metric label="Packet" value={packet.packetVersion} />
          </div>

          <Table data-testid="routing-fairness-issue-table">
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Count</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>Message</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packet.issues.length > 0 ? (
                packet.issues.map((issue) => (
                  <TableRow key={issue.code}>
                    <TableCell className="font-medium">
                      {formatToken(issue.code)}
                    </TableCell>
                    <TableCell>
                      <Badge
                        variant={
                          issue.severity === "critical" ? "danger" : "warning"
                        }
                      >
                        {issue.severity}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatNumber(issue.count)}</TableCell>
                    <TableCell>{issue.rowNumbers.join(", ")}</TableCell>
                    <TableCell>
                      <span className="block max-w-[34rem] truncate">
                        {issue.message}
                      </span>
                      <span className="mt-1 block max-w-[34rem] truncate text-xs text-muted-foreground">
                        {issue.explanations.join("; ") || "No extra context"}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>No fairness issue categories.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Table data-testid="routing-fairness-row-table">
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Postal</TableHead>
                <TableHead>Selected order</TableHead>
                <TableHead>Issues</TableHead>
                <TableHead>Reasons</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packet.rowSamples.map((row) => (
                <RoutingFairnessRow key={row.rowNumber} row={row} />
              ))}
            </TableBody>
          </Table>

          <Table data-testid="routing-fairness-metric-table">
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Metric</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Band</TableHead>
                <TableHead>Explanation</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packet.rowSamples.flatMap((row) =>
                row.metricHighlights.map((metric) => (
                  <TableRow key={`${row.rowNumber}-${metric.key}`}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell className="font-medium">
                      {metric.label}
                    </TableCell>
                    <TableCell>{formatMetricValue(metric)}</TableCell>
                    <TableCell>
                      <Badge variant={metricStatusVariant(metric.status)}>
                        {metric.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{formatToken(metric.band)}</TableCell>
                    <TableCell>
                      <span className="block max-w-[38rem] truncate">
                        {metric.explanation}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
            data-testid="routing-fairness-write-flags"
          >
            {writeFlagLabels.map((flag) => (
              <div
                key={flag.key}
                className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
              >
                <span className="font-medium">{flag.label}</span>{" "}
                <span className="ml-2 text-muted-foreground">
                  {packet.write[flag.key] ? "on" : "off"}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function RoutingFairnessRow({
  row
}: {
  row: RoutingFairnessReviewRowSample;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">
        {row.rowNumber}
        <span className="mt-1 block max-w-[10rem] truncate text-xs text-muted-foreground">
          {row.referenceId ?? "No reference"}
        </span>
      </TableCell>
      <TableCell>
        <Badge variant={row.status === "assigned" ? "success" : "warning"}>
          {row.status}
        </Badge>
      </TableCell>
      <TableCell>
        {row.normalizedPostalCode}
        <span className="mt-1 block text-xs text-muted-foreground">
          {row.postalPrefix}
        </span>
      </TableCell>
      <TableCell>
        {row.selectedOrder?.dealerName ?? "No order"}
        <span className="mt-1 block max-w-[16rem] truncate text-xs text-muted-foreground">
          {row.selectedOrder
            ? `${row.selectedOrder.deliveredThisMonth}/${row.selectedOrder.monthlyQuota} delivered`
            : formatToken(row.reason)}
        </span>
      </TableCell>
      <TableCell>
        {row.issueCodes.length > 0
          ? row.issueCodes.map((code) => (
              <Badge key={code} variant="outline" className="mb-1 mr-1">
                {formatToken(code)}
              </Badge>
            ))
          : "None"}
      </TableCell>
      <TableCell>
        <span className="block max-w-[36rem] truncate">
          {row.explanationReasons.join("; ")}
        </span>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tracking-normal">{value}</div>
    </div>
  );
}

function FieldError({ message }: { message?: string | null }) {
  if (!message) {
    return null;
  }

  return <p className="text-xs text-destructive">{message}</p>;
}

function reviewStatusVariant(status: RoutingFairnessReviewStatus) {
  switch (status) {
    case "clear":
      return "success";
    case "watch":
      return "warning";
    case "risk":
    case "blocked":
      return "danger";
  }
}

function metricStatusVariant(status: RoutingFairnessMetricStatus) {
  switch (status) {
    case "ok":
      return "success";
    case "watch":
      return "warning";
    case "risk":
    case "blocked":
      return "danger";
  }
}

function formatMetricValue(metric: MetricHighlight): string {
  if (metric.value === null) {
    return "n/a";
  }

  if (
    metric.key === "quotaSaturation" ||
    metric.key === "leadQualityProxy" ||
    metric.key === "slaRisk"
  ) {
    return `${Math.round(metric.value * 100)}%`;
  }

  return metric.value.toFixed(2);
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
