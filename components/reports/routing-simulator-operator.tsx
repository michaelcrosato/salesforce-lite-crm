"use client";

import {
  type FormEvent,
  useMemo,
  useState,
  useSyncExternalStore,
  useTransition
} from "react";
import {
  AlertTriangle,
  ClipboardCheck,
  MapPinned,
  Play,
  Route,
  ShieldCheck,
  Table2,
  type LucideIcon
} from "lucide-react";
import { previewRoutingSimulatorReviewAction, type RoutingSimulatorReviewActionResult } from "@/app/reports/actions";
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
import type { DealerCapacityWindowCatalog } from "@/lib/server/dealerCapacityWindowContracts";
import type { RoutingSimulatorInputCatalog } from "@/lib/server/routingSimulatorContracts";
import type {
  RoutingSimulatorReviewPacket,
  RoutingSimulatorReviewRowSample,
  RoutingSimulatorReviewStatus,
  RoutingSimulatorReviewWriteFlags
} from "@/lib/server/routingSimulatorReviewPackets";

type RoutingSimulatorOperatorProps = {
  catalog: RoutingSimulatorInputCatalog;
  capacityCatalog: DealerCapacityWindowCatalog;
};

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
  { key: "scenarioPersistence", label: "Scenario persistence" },
  { key: "simulatorRuns", label: "Simulator runs" }
] satisfies ReadonlyArray<{
  key: keyof RoutingSimulatorReviewWriteFlags;
  label: string;
}>;

export function RoutingSimulatorOperator({
  catalog,
  capacityCatalog
}: RoutingSimulatorOperatorProps) {
  const { showToast } = useToast();
  const [input, setInput] = useState("");
  const [capacityInput, setCapacityInput] = useState("");
  const [result, setResult] =
    useState<RoutingSimulatorReviewActionResult | null>(null);
  const [isPending, startTransition] = useTransition();
  const isHydrated = useSyncExternalStore(
    subscribeHydration,
    getHydrationSnapshot,
    getServerHydrationSnapshot
  );
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
  const capacityFixtureInput = useMemo(
    () =>
      JSON.stringify(
        {
          windows: capacityCatalog.fixtures
        },
        null,
        2
      ),
    [capacityCatalog.fixtures]
  );
  const packet = result?.ok ? result.packet : null;
  const fieldErrors = result && !result.ok ? result.fieldErrors : null;

  function useFixtures() {
    setInput(fixtureInput);
    setResult(null);
  }

  function useCapacityFixtures() {
    setCapacityInput(capacityFixtureInput);
    setResult(null);
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    startTransition(() => {
      void (async () => {
        const actionResult = await previewRoutingSimulatorReviewAction(formData);
        setResult(actionResult);
        showToast({
          title: actionResult.ok
            ? "Routing preview ready"
            : "Routing preview failed",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  return (
    <section
      className="space-y-4"
      data-hydrated={isHydrated ? "true" : "false"}
      data-testid="routing-simulator-operator"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Routing Simulator Preview
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Preview hypothetical consumer-lead routing outcomes without
            creating leads or routing events.
          </p>
        </div>
        <Badge variant="outline">{catalog.catalogVersion}</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={MapPinned}
          label="Countries"
          value={formatNumber(catalog.supportedCountryCount)}
          testId="routing-simulator-summary-countries"
        />
        <SummaryCard
          icon={Table2}
          label="Max batch"
          value={formatNumber(catalog.limits.batch.max)}
          testId="routing-simulator-summary-max-batch"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Fixture rows"
          value={formatNumber(catalog.fixtures.length)}
          testId="routing-simulator-summary-fixtures"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value="None"
          testId="routing-simulator-summary-writes"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hypothetical Lead Batch</CardTitle>
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
                  {formatNumber(catalog.fixtures.length)} sample rows use the
                  published input contract.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useFixtures}
                  data-testid="routing-simulator-use-fixtures"
                >
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  Use fixtures
                </Button>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Capacity fields</div>
                <div className="flex flex-wrap gap-2">
                  {capacityCatalog.fields.map((field) => (
                    <Badge
                      key={field.key}
                      variant={field.required ? "warning" : "outline"}
                    >
                      {field.label}
                    </Badge>
                  ))}
                </div>
                <p className="text-xs text-muted-foreground">
                  {formatNumber(capacityCatalog.fixtures.length)} sample
                  capacity windows use the published input contract.
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={useCapacityFixtures}
                  data-testid="routing-simulator-use-capacity-fixtures"
                >
                  <ClipboardCheck className="h-4 w-4" aria-hidden="true" />
                  Use capacity fixtures
                </Button>
              </div>
            </div>

            <div className="space-y-3">
              <div className="grid gap-3 xl:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="routing-simulator-input">Lead batch JSON</Label>
                  <Textarea
                    id="routing-simulator-input"
                    name="routingSimulatorInput"
                    value={input}
                    onChange={(event) => {
                      setInput(event.target.value);
                      setResult(null);
                    }}
                    placeholder={'{ "leads": [{ "postalCode": "V5K 0A1", "country": "CA" }] }'}
                    className="min-h-[14rem] font-mono"
                    data-testid="routing-simulator-input"
                  />
                  <FieldError message={fieldErrors?.input?.[0]} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="routing-simulator-capacity-input">
                    Capacity windows JSON
                  </Label>
                  <Textarea
                    id="routing-simulator-capacity-input"
                    name="routingSimulatorCapacityInput"
                    value={capacityInput}
                    onChange={(event) => {
                      setCapacityInput(event.target.value);
                      setResult(null);
                    }}
                    placeholder={'{ "windows": [{ "dealerOrderId": "order-id", "startsOn": "2026-05-16", "endsOn": "2026-05-16", "dailyCap": 1 }] }'}
                    className="min-h-[14rem] font-mono"
                    data-testid="routing-simulator-capacity-input"
                  />
                  <FieldError message={fieldErrors?.capacity?.[0]} />
                </div>
              </div>
              <FieldError message={fieldErrors?.target?.[0]} />
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-muted-foreground">
                  {input.trim().length > 0
                    ? `${formatNumber(input.length + capacityInput.length)} characters ready`
                    : "No batch entered"}
                </p>
                <Button
                  type="submit"
                  loading={isPending}
                  data-testid="routing-simulator-submit"
                >
                  <Play className="h-4 w-4" aria-hidden="true" />
                  {isPending ? "Previewing..." : "Preview routing"}
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>

      {packet ? <RoutingSimulatorResult packet={packet} /> : null}
    </section>
  );
}

function RoutingSimulatorResult({
  packet
}: {
  packet: RoutingSimulatorReviewPacket;
}) {
  const hasWriteSurface = writeFlagLabels.some((flag) => packet.write[flag.key]);

  return (
    <div className="space-y-4" data-testid="routing-simulator-result-panel">
      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={Route}
          label="Assigned"
          value={formatNumber(packet.summary.assignedCount)}
          testId="routing-simulator-summary-assigned"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Blocked"
          value={formatNumber(packet.summary.blockedCount)}
          testId="routing-simulator-summary-blocked"
        />
        <SummaryCard
          icon={ClipboardCheck}
          label="Assignment rate"
          value={`${Math.round(packet.summary.assignmentRate * 100)}%`}
          testId="routing-simulator-summary-rate"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value={hasWriteSurface ? "Review" : "None"}
          testId="routing-simulator-summary-writes"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Review Packet</CardTitle>
            <p className="text-sm text-muted-foreground">
              {formatNumber(packet.summary.sampleCount)} sampled of{" "}
              {formatNumber(packet.leadCount)} hypothetical leads.
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
              label="Selected orders"
              value={formatNumber(packet.summary.selectedOrderCount)}
            />
            <Metric
              label="Capacity notes"
              value={formatNumber(packet.summary.capacityImpactNoteCount)}
            />
            <Metric label="Packet" value={packet.packetVersion} />
          </div>

          <div
            className="grid gap-3 md:grid-cols-4"
            data-testid="routing-simulator-capacity-summary"
          >
            <Metric
              label="Capacity"
              value={packet.capacitySummary.applied ? "Applied" : "Not applied"}
            />
            <Metric
              label="Windows"
              value={formatNumber(packet.capacitySummary.windowCount)}
            />
            <Metric
              label="Blocked by capacity"
              value={formatNumber(packet.capacitySummary.blockedCount)}
            />
            <Metric
              label="Overflowed"
              value={formatNumber(packet.capacitySummary.overflowCount)}
            />
          </div>

          <Table data-testid="routing-simulator-capacity-outcome-table">
            <TableHeader>
              <TableRow>
                <TableHead>Capacity outcome</TableHead>
                <TableHead>Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {Object.entries(packet.capacitySummary.outcomeCounts).map(
                ([outcome, count]) => (
                  <TableRow key={outcome}>
                    <TableCell className="font-medium">
                      {formatToken(outcome)}
                    </TableCell>
                    <TableCell>{formatNumber(count)}</TableCell>
                  </TableRow>
                )
              )}
            </TableBody>
          </Table>

          <Table data-testid="routing-simulator-issue-table">
            <TableHeader>
              <TableRow>
                <TableHead>Issue</TableHead>
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
                    <TableCell>{formatNumber(issue.count)}</TableCell>
                    <TableCell>{issue.rowNumbers.join(", ")}</TableCell>
                    <TableCell>
                      <span className="block max-w-[32rem] truncate">
                        {issue.message}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>No blocked issue categories.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Table data-testid="routing-simulator-capacity-table">
            <TableHeader>
              <TableRow>
                <TableHead>Dealer order</TableHead>
                <TableHead>Simulated leads</TableHead>
                <TableHead>Projected delivery</TableHead>
                <TableHead>Note</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packet.capacityImpact.length > 0 ? (
                packet.capacityImpact.map((impact) => (
                  <TableRow key={impact.orderId}>
                    <TableCell className="font-medium">
                      {impact.dealerName}
                      <span className="mt-1 block max-w-[18rem] truncate text-xs text-muted-foreground">
                        {impact.accountName}
                      </span>
                    </TableCell>
                    <TableCell>
                      {formatNumber(impact.simulatedAssignedLeadCount)}
                    </TableCell>
                    <TableCell>
                      {formatNumber(impact.projectedDeliveredThisMonth)} /{" "}
                      {formatNumber(impact.monthlyQuota)}
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[36rem] truncate">
                        {impact.note}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4}>No capacity impact.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>

          <Table data-testid="routing-simulator-row-table">
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Postal</TableHead>
                <TableHead>Area</TableHead>
                <TableHead>Selected order</TableHead>
                <TableHead>Summary</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packet.rowSamples.map((row) => (
                <RoutingSimulatorRow key={row.rowNumber} row={row} />
              ))}
            </TableBody>
          </Table>

          <Table data-testid="routing-simulator-step-table">
            <TableHeader>
              <TableRow>
                <TableHead>Row</TableHead>
                <TableHead>Step</TableHead>
                <TableHead>Result</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {packet.rowSamples.flatMap((row) =>
                row.steps.map((step) => (
                  <TableRow key={`${row.rowNumber}-${step.step}`}>
                    <TableCell>{row.rowNumber}</TableCell>
                    <TableCell className="font-medium">
                      {formatToken(step.step)}
                    </TableCell>
                    <TableCell>
                      <span className="block max-w-[42rem] truncate font-mono text-xs">
                        {formatStepResult(step.result)}
                      </span>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>

          <div
            className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
            data-testid="routing-simulator-write-flags"
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

function RoutingSimulatorRow({
  row
}: {
  row: RoutingSimulatorReviewRowSample;
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
      <TableCell>{row.matchedArea?.name ?? "No area"}</TableCell>
      <TableCell>
        {row.selectedOrder?.dealerName ?? "No order"}
        <span className="mt-1 block max-w-[16rem] truncate text-xs text-muted-foreground">
          {row.selectedOrder
            ? `${row.selectedOrder.deliveredThisMonth}/${row.selectedOrder.monthlyQuota} delivered`
            : formatToken(row.reason)}
        </span>
      </TableCell>
      <TableCell>
        <span className="block max-w-[36rem] truncate">{row.summary}</span>
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

function reviewStatusVariant(status: RoutingSimulatorReviewStatus) {
  switch (status) {
    case "all_assigned":
      return "success";
    case "partially_blocked":
      return "warning";
    case "all_blocked":
      return "danger";
  }
}

function formatStepResult(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  return JSON.stringify(value);
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function subscribeHydration(onStoreChange: () => void): () => void {
  queueMicrotask(onStoreChange);

  return () => {};
}

function getHydrationSnapshot(): boolean {
  return true;
}

function getServerHydrationSnapshot(): boolean {
  return false;
}
