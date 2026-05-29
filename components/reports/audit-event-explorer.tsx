import {
  Activity,
  Database,
  Filter,
  Rows3,
  ShieldCheck,
  type LucideIcon
} from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type {
  AuditEventActionOption,
  AuditEventExplorerCount,
  AuditEventExplorerEvent,
  AuditEventExplorerSnapshot
} from "@/lib/services/auditEvents";

type AuditEventExplorerProps = {
  snapshot: AuditEventExplorerSnapshot;
};

export function AuditEventExplorer({ snapshot }: AuditEventExplorerProps) {
  const selectedCategory = snapshot.filters.category ?? "";
  const selectedAction = snapshot.filters.action ?? "";
  const selectedEntityType = snapshot.filters.entityType ?? "";
  const actionOptions = filterActionOptions(
    snapshot.availableActions,
    selectedCategory
  );

  return (
    <section className="space-y-4" data-testid="audit-event-explorer">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Audit Event Explorer
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect recorded audit events by source, action, and entity.
          </p>
        </div>
        <Badge variant="success">read only</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={Database}
          label="Total events"
          value={formatNumber(snapshot.totalEventCount)}
          testId="audit-event-summary-total"
        />
        <SummaryCard
          icon={Filter}
          label="Matching events"
          value={formatNumber(snapshot.matchingEventCount)}
          testId="audit-event-summary-matching"
        />
        <SummaryCard
          icon={Activity}
          label="Sources"
          value={formatNumber(snapshot.categoryCounts.length)}
          testId="audit-event-summary-categories"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Entity types"
          value={formatNumber(snapshot.entityCounts.length)}
          testId="audit-event-summary-entities"
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Event Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form
            action="/reports"
            method="get"
            className="grid gap-4 lg:grid-cols-[repeat(3,minmax(0,1fr))_auto]"
          >
            <div className="space-y-2">
              <label
                htmlFor="audit-event-category"
                className="text-sm font-medium"
              >
                Source
              </label>
              <Select
                id="audit-event-category"
                name="auditCategory"
                defaultValue={selectedCategory}
                data-testid="audit-event-filter-category"
              >
                <option value="">All sources</option>
                {snapshot.availableCategories.map((category) => (
                  <option key={category} value={category}>
                    {formatToken(category)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="audit-event-action"
                className="text-sm font-medium"
              >
                Action
              </label>
              <Select
                id="audit-event-action"
                name="auditAction"
                defaultValue={selectedAction}
                data-testid="audit-event-filter-action"
              >
                <option value="">All actions</option>
                {actionOptions.map((option) => (
                  <option key={option.action} value={option.action}>
                    {option.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="space-y-2">
              <label
                htmlFor="audit-event-entity"
                className="text-sm font-medium"
              >
                Entity
              </label>
              <Select
                id="audit-event-entity"
                name="auditEntity"
                defaultValue={selectedEntityType}
                data-testid="audit-event-filter-entity"
              >
                <option value="">All entities</option>
                {snapshot.availableEntityTypes.map((entityType) => (
                  <option key={entityType} value={entityType}>
                    {formatToken(entityType)}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-end gap-2">
              <Button type="submit" data-testid="audit-event-filter-submit">
                Apply
              </Button>
              <Button
                asChild
                type="button"
                variant="outline"
                data-testid="audit-event-filter-reset"
              >
                <Link href="/reports">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[minmax(16rem,22rem)_1fr]">
        <div className="space-y-4">
          <CountCard
            title="Source Counts"
            counts={snapshot.categoryCounts}
            testId="audit-event-category-counts"
          />
          <CountCard
            title="Action Counts"
            counts={snapshot.actionCounts}
            testId="audit-event-action-counts"
          />
          <CountCard
            title="Entity Counts"
            counts={snapshot.entityCounts}
            testId="audit-event-entity-counts"
          />
        </div>

        <Card>
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Recent Events</CardTitle>
              <p className="text-sm text-muted-foreground">
                Showing {formatNumber(snapshot.events.length)} of{" "}
                {formatNumber(snapshot.matchingEventCount)} matching events.
              </p>
            </div>
            <Badge variant="outline">
              <Rows3 className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
              {formatNumber(snapshot.pageSize)} max
            </Badge>
          </CardHeader>
          <CardContent>
            <Table data-testid="audit-event-recent-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Occurred</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Entity</TableHead>
                  <TableHead>Summary</TableHead>
                  <TableHead>Record</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {snapshot.events.length > 0 ? (
                  snapshot.events.map((event) => (
                    <AuditEventRow key={event.id} event={event} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-muted-foreground"
                      data-testid="audit-event-empty"
                    >
                      No audit events match these filters.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}

function AuditEventRow({ event }: { event: AuditEventExplorerEvent }) {
  return (
    <TableRow>
      <TableCell className="whitespace-nowrap">
        {formatDateTime(event.occurredAt)}
      </TableCell>
      <TableCell>
        <Badge variant="outline">{formatToken(event.category)}</Badge>
      </TableCell>
      <TableCell>{formatToken(event.action)}</TableCell>
      <TableCell>
        {event.entityType ? (
          <span className="font-medium">{formatToken(event.entityType)}</span>
        ) : (
          <span className="text-muted-foreground">None</span>
        )}
      </TableCell>
      <TableCell>
        <span className="block max-w-md truncate">{event.summary}</span>
      </TableCell>
      <TableCell>
        {event.recordLink ? (
          <Link
            href={event.recordLink.href}
            className="font-medium text-primary hover:underline"
          >
            {event.recordLink.label}
          </Link>
        ) : (
          <span className="text-muted-foreground">No record link</span>
        )}
      </TableCell>
    </TableRow>
  );
}

function CountCard({
  title,
  counts,
  testId
}: {
  title: string;
  counts: AuditEventExplorerCount[];
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {counts.length > 0 ? (
          <div className="space-y-2">
            {counts.slice(0, 8).map((count) => (
              <div
                key={count.value}
                className="flex items-center justify-between gap-3 rounded-md border bg-muted/20 px-3 py-2 text-sm"
              >
                <span className="font-medium">{count.label}</span>
                <span className="text-muted-foreground">
                  {formatNumber(count.count)}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">No matching counts.</p>
        )}
      </CardContent>
    </Card>
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

function filterActionOptions(
  options: readonly AuditEventActionOption[],
  selectedCategory: string
): AuditEventActionOption[] {
  if (selectedCategory.length === 0) {
    return [...options];
  }

  return options.filter((option) => option.category === selectedCategory);
}

function formatDateTime(value: Date): string {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC"
  }).format(value);
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
