"use client";

import {
  Archive,
  ArrowDown,
  ArrowUp,
  LayoutDashboard,
  Pin,
  ShieldCheck,
  Table2,
  Trash2,
  type LucideIcon
} from "lucide-react";
import { useMemo, useState, useTransition } from "react";
import {
  previewDashboardCardAction,
  type DashboardCardPreviewActionResult
} from "@/app/reports/actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import type {
  DashboardCardDefinitionCatalog,
  DashboardCardMutation,
  DashboardCardPlacement
} from "@/lib/server/dashboardCardDefinitions";
import type { DashboardCardPreviewResult } from "@/lib/server/dashboardCardPreviewRunner";
import type { SavedReportDefinitionSnapshot } from "@/lib/server/savedReportPersistence";

type DashboardCardOperatorProps = {
  surface: DashboardCardPlacement;
  catalog: DashboardCardDefinitionCatalog;
  savedReports: SavedReportDefinitionSnapshot[];
};

type OperatorCard = {
  key: string;
  preview: DashboardCardPreviewResult;
  archived: boolean;
  pinnedAt: number;
};

type OperatorAuditEvent = {
  sequence: number;
  mutation: DashboardCardMutation;
  summary: string;
  cardTitle: string;
  placement: DashboardCardPlacement;
  savedReportDefinitionId: string;
  previousPosition: number | null;
  nextPosition: number | null;
  metadata: string;
};

export function DashboardCardOperator({
  surface,
  catalog,
  savedReports
}: DashboardCardOperatorProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [cards, setCards] = useState<OperatorCard[]>([]);
  const [auditEvents, setAuditEvents] = useState<OperatorAuditEvent[]>([]);
  const [lastResult, setLastResult] =
    useState<DashboardCardPreviewActionResult | null>(null);
  const activeCards = cards.filter((card) => !card.archived);
  const archivedCards = cards.filter((card) => card.archived);
  const placement = useMemo(
    () => catalog.placements.find((candidate) => candidate.key === surface),
    [catalog.placements, surface]
  );
  const previewedRows = activeCards.reduce(
    (total, card) => total + card.preview.rowCount,
    0
  );

  function pinSavedReport(definition: SavedReportDefinitionSnapshot) {
    const formData = new FormData();

    formData.set("definitionId", definition.id);
    formData.set("placement", surface);
    formData.set("position", String(activeCards.length + 1));

    startTransition(() => {
      void (async () => {
        const actionResult = await previewDashboardCardAction(formData);

        setLastResult(actionResult);

        if (actionResult.ok) {
          setCards((current) => upsertPreviewCard(current, actionResult.preview));
          appendAuditEvent({
            mutation: "pin",
            preview: actionResult.preview,
            previousPosition: null,
            nextPosition: actionResult.preview.card?.position ?? null
          });
        }

        showToast({
          title: actionResult.ok
            ? "Dashboard card pinned"
            : "Dashboard card pin failed",
          description: actionResult.message,
          variant: actionResult.ok ? "success" : "error"
        });
      })();
    });
  }

  function moveCard(cardKey: string, direction: "up" | "down") {
    const activeIndex = activeCards.findIndex((card) => card.key === cardKey);
    const targetActiveIndex =
      direction === "up" ? activeIndex - 1 : activeIndex + 1;
    const movingCard = activeCards[activeIndex];

    if (
      activeIndex < 0 ||
      targetActiveIndex < 0 ||
      targetActiveIndex >= activeCards.length ||
      movingCard === undefined
    ) {
      return;
    }

    appendAuditEvent({
      mutation: "reorder",
      preview: movingCard.preview,
      previousPosition: activeIndex + 1,
      nextPosition: targetActiveIndex + 1
    });

    setCards((current) => {
      const activeIndexes = current.flatMap((card, index) =>
        card.archived ? [] : [index]
      );
      const activeIndex = activeIndexes.findIndex(
        (index) => current[index]?.key === cardKey
      );
      const targetActiveIndex =
        direction === "up" ? activeIndex - 1 : activeIndex + 1;

      if (
        activeIndex < 0 ||
        targetActiveIndex < 0 ||
        targetActiveIndex >= activeIndexes.length
      ) {
        return current;
      }

      const next = [...current];
      const sourceIndex = activeIndexes[activeIndex];
      const targetIndex = activeIndexes[targetActiveIndex];
      if (sourceIndex === undefined || targetIndex === undefined) {
        return current;
      }
      const sourceCard = next[sourceIndex];

      if (!sourceCard || !next[targetIndex]) {
        return current;
      }

      next[sourceIndex] = next[targetIndex];
      next[targetIndex] = sourceCard;

      return next;
    });
  }

  function archiveCard(cardKey: string) {
    const activeIndex = activeCards.findIndex((card) => card.key === cardKey);
    const card = activeCards[activeIndex];

    if (card) {
      appendAuditEvent({
        mutation: "archive",
        preview: card.preview,
        previousPosition: activeIndex + 1,
        nextPosition: null
      });
    }

    setCards((current) =>
      current.map((card) =>
        card.key === cardKey ? { ...card, archived: true } : card
      )
    );
  }

  function deleteCard(cardKey: string) {
    const card = cards.find((candidate) => candidate.key === cardKey);
    const activeIndex = activeCards.findIndex((candidate) => candidate.key === cardKey);

    if (card) {
      appendAuditEvent({
        mutation: "delete",
        preview: card.preview,
        previousPosition: activeIndex >= 0 ? activeIndex + 1 : null,
        nextPosition: null
      });
    }

    setCards((current) => current.filter((card) => card.key !== cardKey));
  }

  function appendAuditEvent(input: {
    mutation: DashboardCardMutation;
    preview: DashboardCardPreviewResult;
    previousPosition: number | null;
    nextPosition: number | null;
  }) {
    const definition = input.preview.card;

    if (!definition) {
      return;
    }

    setAuditEvents((current) => [
      ...current,
      {
        sequence: current.length + 1,
        mutation: input.mutation,
        summary: dashboardCardAuditSummary(input.mutation, definition.title),
        cardTitle: definition.title,
        placement: definition.placement,
        savedReportDefinitionId: definition.savedReportDefinitionId,
        previousPosition: input.previousPosition,
        nextPosition: input.nextPosition,
        metadata: dashboardCardAuditMetadata({
          placement: definition.placement,
          entity: definition.savedReport.entity,
          previousPosition: input.previousPosition,
          nextPosition: input.nextPosition
        })
      }
    ]);
  }

  return (
    <section className="space-y-4" data-testid="dashboard-card-operator">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Pinned Cards
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {placement?.label ?? formatSurface(surface)} cards from persisted saved
            reports.
          </p>
        </div>
        <Badge variant="success">saved-report backed</Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={LayoutDashboard}
          label="Active cards"
          value={formatNumber(activeCards.length)}
          testId="dashboard-card-summary-active"
        />
        <SummaryCard
          icon={Table2}
          label="Definitions"
          value={formatNumber(savedReports.length)}
          testId="dashboard-card-summary-available"
        />
        <SummaryCard
          icon={Archive}
          label="Archived cards"
          value={formatNumber(archivedCards.length)}
          testId="dashboard-card-summary-archived"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Preview rows"
          value={formatNumber(previewedRows)}
          testId="dashboard-card-summary-previewed"
        />
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
          <div className="space-y-1.5">
            <CardTitle>Available Definitions</CardTitle>
            <p className="text-sm text-muted-foreground">
              Active saved report definitions eligible for this surface.
            </p>
          </div>
          <Badge variant="outline">{formatSurface(surface)}</Badge>
        </CardHeader>
        <CardContent>
          {savedReports.length === 0 ? (
            <EmptyState
              title="No saved reports available"
              description="Save a report definition before pinning dashboard cards."
              compact
            />
          ) : (
            <div className="overflow-x-auto">
              <Table data-testid="dashboard-card-saved-report-list">
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Fields</TableHead>
                    <TableHead>Preview limit</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {savedReports.map((definition) => (
                    <TableRow key={definition.id}>
                      <TableCell className="font-medium">
                        {definition.name}
                      </TableCell>
                      <TableCell>{formatToken(definition.entity)}</TableCell>
                      <TableCell>{formatNumber(definition.fields.length)}</TableCell>
                      <TableCell>{formatNumber(definition.previewLimit)}</TableCell>
                      <TableCell>
                        <Button
                          type="button"
                          size="sm"
                          onClick={() => pinSavedReport(definition)}
                          loading={isPending}
                          data-testid={`dashboard-card-pin-${surface}`}
                        >
                          <Pin className="h-4 w-4" aria-hidden="true" />
                          Pin {placement?.label ?? formatSurface(surface)}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {lastResult && !lastResult.ok ? (
        <Card>
          <CardHeader>
            <CardTitle>Card Validation</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive">{lastResult.message}</p>
          </CardContent>
        </Card>
      ) : null}

      {auditEvents.length > 0 ? (
        <Card data-testid="dashboard-card-audit-log">
          <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
            <div className="space-y-1.5">
              <CardTitle>Card Audit Evidence</CardTitle>
              <p className="text-sm text-muted-foreground">
                Session evidence for dashboard card pin, order, archive, and delete actions.
              </p>
            </div>
            <Badge variant="outline">
              {formatNumber(auditEvents.length)} events
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Card</TableHead>
                    <TableHead>Evidence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditEvents.map((event) => (
                    <TableRow
                      key={event.sequence}
                      data-testid="dashboard-card-audit-row"
                    >
                      <TableCell
                        className="font-medium"
                        data-testid="dashboard-card-audit-mutation"
                      >
                        {formatNumber(event.sequence)}.{" "}
                        {formatMutation(event.mutation)}
                      </TableCell>
                      <TableCell data-testid="dashboard-card-audit-summary">
                        {event.summary}
                      </TableCell>
                      <TableCell data-testid="dashboard-card-audit-metadata">
                        {event.metadata}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      ) : null}

      <div className="space-y-4" data-testid="dashboard-card-list-active">
        {activeCards.length === 0 ? (
          <EmptyState
            title="No active cards"
            description="Pin a saved report to render it as a dashboard card."
            compact
          />
        ) : (
          activeCards.map((card, index) => (
            <DashboardPreviewCard
              key={card.key}
              card={card}
              position={index + 1}
              canMoveUp={index > 0}
              canMoveDown={index < activeCards.length - 1}
              onMoveUp={() => moveCard(card.key, "up")}
              onMoveDown={() => moveCard(card.key, "down")}
              onArchive={() => archiveCard(card.key)}
              onDelete={() => deleteCard(card.key)}
            />
          ))
        )}
      </div>

      {archivedCards.length > 0 ? (
        <Card data-testid="dashboard-card-archived-list">
          <CardHeader>
            <CardTitle>Archived Cards</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {archivedCards.map((card) => (
                <div
                  key={card.key}
                  className="flex flex-col gap-2 rounded-md border bg-muted/20 px-3 py-2 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div>
                    <p className="text-sm font-medium">
                      {card.preview.card?.title ?? "Archived card"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Pinned {formatTime(card.pinnedAt)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => deleteCard(card.key)}
                    data-testid="dashboard-card-delete"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                    Delete
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : null}
    </section>
  );
}

function DashboardPreviewCard({
  card,
  position,
  canMoveUp,
  canMoveDown,
  onMoveUp,
  onMoveDown,
  onArchive,
  onDelete
}: {
  card: OperatorCard;
  position: number;
  canMoveUp: boolean;
  canMoveDown: boolean;
  onMoveUp: () => void;
  onMoveDown: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const preview = card.preview;
  const definition = preview.card;
  const firstRow = preview.rows[0] ?? null;

  return (
    <Card data-testid="dashboard-card-preview-card">
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{definition?.title ?? "Dashboard card"}</CardTitle>
          <p className="text-sm text-muted-foreground">
            Position {formatNumber(position)} &middot;{" "}
            {definition ? formatToken(definition.savedReport.entity) : "saved report"}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Badge variant={preview.status === "valid" ? "success" : "danger"}>
            {preview.status}
          </Badge>
          <Badge variant="outline">
            {definition ? formatToken(definition.visualization.type) : "preview"}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3">
          <Metric label="Rows" value={formatNumber(preview.rowCount)} />
          <Metric
            label="Aggregates"
            value={formatNumber(preview.aggregates.length)}
          />
          <Metric label="Groups" value={formatNumber(preview.groups.length)} />
        </div>

        {preview.chart ? (
          <Table data-testid="dashboard-card-chart-table">
            <TableHeader>
              <TableRow>
                <TableHead>Point</TableHead>
                <TableHead>Rows</TableHead>
                <TableHead>{preview.chart.metricLabel}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {preview.chart.points.map((point) => (
                <TableRow key={point.key}>
                  <TableCell className="font-medium">{point.label}</TableCell>
                  <TableCell>{formatNumber(point.rowCount)}</TableCell>
                  <TableCell>{formatCellValue(point.value)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : null}

        {preview.rows.length === 0 ? (
          <EmptyState
            title="No preview rows"
            description="This saved report returned no rows for the current filters."
            compact
          />
        ) : (
          <div className="overflow-x-auto">
            <Table data-testid="dashboard-card-row-table">
              <TableHeader>
                <TableRow>
                  <TableHead>Record</TableHead>
                  {firstRow?.cells.slice(0, 4).map((cell) => (
                    <TableHead key={cell.fieldKey}>{cell.label}</TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.rows.slice(0, 4).map((row) => (
                  <TableRow key={row.recordId}>
                    <TableCell className="font-medium">{row.recordId}</TableCell>
                    {row.cells.slice(0, 4).map((cell) => (
                      <TableCell key={`${row.recordId}-${cell.fieldKey}`}>
                        {formatCellValue(cell.value)}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMoveUp}
            disabled={!canMoveUp}
            data-testid="dashboard-card-move-up"
          >
            <ArrowUp className="h-4 w-4" aria-hidden="true" />
            Move up
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onMoveDown}
            disabled={!canMoveDown}
            data-testid="dashboard-card-move-down"
          >
            <ArrowDown className="h-4 w-4" aria-hidden="true" />
            Move down
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onArchive}
            data-testid="dashboard-card-archive"
          >
            <Archive className="h-4 w-4" aria-hidden="true" />
            Archive
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDelete}
            data-testid="dashboard-card-delete"
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Delete
          </Button>
        </div>
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

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 max-w-full truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function upsertPreviewCard(
  current: OperatorCard[],
  preview: DashboardCardPreviewResult
): OperatorCard[] {
  const definition = preview.card;

  if (!definition) {
    return current;
  }

  const key = `${definition.placement}-${definition.savedReportDefinitionId}`;
  const nextCard: OperatorCard = {
    key,
    preview,
    archived: false,
    pinnedAt: Date.now()
  };

  return [...current.filter((card) => card.key !== key), nextCard];
}

function formatSurface(surface: DashboardCardPlacement): string {
  return surface.charAt(0).toUpperCase() + surface.slice(1);
}

function formatMutation(mutation: DashboardCardMutation): string {
  const labels: Record<DashboardCardMutation, string> = {
    pin: "Pinned",
    reorder: "Reordered",
    archive: "Archived",
    delete: "Deleted"
  };

  return labels[mutation];
}

function dashboardCardAuditSummary(
  mutation: DashboardCardMutation,
  title: string
): string {
  const verbs: Record<DashboardCardMutation, string> = {
    pin: "pinned",
    reorder: "reordered",
    archive: "archived",
    delete: "deleted"
  };

  return `Dashboard card ${verbs[mutation]}: ${title}.`;
}

function dashboardCardAuditMetadata(input: {
  placement: DashboardCardPlacement;
  entity: string;
  previousPosition: number | null;
  nextPosition: number | null;
}): string {
  return [
    formatSurface(input.placement),
    `position ${formatAuditPosition(input.previousPosition)} -> ${formatAuditPosition(
      input.nextPosition
    )}`,
    formatToken(input.entity)
  ].join(" | ");
}

function formatAuditPosition(position: number | null): string {
  return position === null ? "none" : formatNumber(position);
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function formatCellValue(value: string | number | null): string {
  if (value === null) {
    return "None";
  }

  if (typeof value === "number") {
    return formatNumber(value);
  }

  return value;
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function formatTime(value: number): string {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit"
  }).format(new Date(value));
}
