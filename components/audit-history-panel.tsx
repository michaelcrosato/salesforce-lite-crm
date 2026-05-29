"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/empty-state";
import { Button } from "@/components/ui/button";

export type HistoryEvent = {
  id: string;
  category: string;
  action: string;
  actorUserId: string | null;
  actorUser?: {
    id: string;
    name: string;
    email: string;
  } | null;
  entityType: string | null;
  entityId: string | null;
  summary: string;
  metadata: string | null;
  occurredAt: Date | string;
};

interface AuditHistoryPanelProps {
  events: HistoryEvent[];
  "data-testid"?: string;
}

export function AuditHistoryPanel({ events, "data-testid": testId }: AuditHistoryPanelProps) {
  const [pageSize, setPageSize] = useState(10);

  if (events.length === 0) {
    return (
      <EmptyState
        title="No history yet"
        description="No audit events have been recorded for this record."
        data-testid="audit-history-empty"
      />
    );
  }

  const visibleEvents = events.slice(0, pageSize);
  const hasMore = events.length > pageSize;

  return (
    <div className="space-y-4" data-testid={testId || "audit-history-panel"}>
      <div className="space-y-3">
        {visibleEvents.map((event) => {
          const actorName = event.actorUser?.name || event.actorUserId || "System";
          const actorEmail = event.actorUser?.email ? ` (${event.actorUser.email})` : "";
          const beforeAfter = formatMetadataSummary(event);

          return (
            <article
              key={event.id}
              className="rounded-md border bg-card p-4 transition-all hover:shadow-sm"
              data-testid="audit-history-row"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b pb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="capitalize">
                    {event.action.replace("_", " ")}
                  </Badge>
                  <span className="text-xs text-muted-foreground font-medium">
                    by <span className="text-foreground" data-testid="audit-history-actor">{actorName}{actorEmail}</span>
                  </span>
                </div>
                <span className="text-xs text-muted-foreground font-medium" data-testid="audit-history-timestamp">
                  {formatDateTime(event.occurredAt)}
                </span>
              </div>
              <div className="mt-3">
                <p className="text-sm font-medium text-foreground" data-testid="audit-history-summary">
                  {event.summary}
                </p>
                {beforeAfter && (
                  <div className="mt-2 rounded-md bg-muted/30 p-2 border border-muted/50" data-testid="audit-history-diff">
                    {beforeAfter}
                  </div>
                )}
              </div>
            </article>
          );
        })}
      </div>

      {hasMore && (
        <div className="flex justify-center pt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPageSize((prev) => prev + 10)}
            data-testid="audit-history-load-more"
          >
            Show More ({events.length - pageSize} remaining)
          </Button>
        </div>
      )}
    </div>
  );
}

function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Unknown date";
  }
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true
  }).format(date);
}

function formatMetadataSummary(event: HistoryEvent) {
  if (!event.metadata) return null;
  try {
    const meta = JSON.parse(event.metadata);
    if (!meta || typeof meta !== "object") return null;

    // 1. Check for stage_changed or status_changed previous properties
    if (meta.previousStage) {
      return (
        <div className="text-xs font-normal">
          Stage changed from <span className="font-semibold text-destructive">{String(meta.previousStage)}</span> to{" "}
          <span className="font-semibold text-success">{String(meta.stage || "")}</span>
        </div>
      );
    }
    if (meta.previousStatus) {
      return (
        <div className="text-xs font-normal">
          Status changed from <span className="font-semibold text-destructive">{String(meta.previousStatus)}</span> to{" "}
          <span className="font-semibold text-success">{String(meta.status || "")}</span>
        </div>
      );
    }

    // 2. Check for changedFields array
    if (Array.isArray(meta.changedFields) && meta.changedFields.length > 0) {
      const changes = meta.changedFields.map((field: string) => {
        const val = meta[field];
        const valStr = val !== undefined && val !== null ? String(val) : "null";
        return (
          <div key={field} className="text-xs font-normal text-muted-foreground">
            • <span className="font-medium text-foreground">{field}</span> updated to{" "}
            <span className="font-semibold text-success">&quot;{valStr}&quot;</span>
          </div>
        );
      });
      return <div className="space-y-1">{changes}</div>;
    }

    // 3. Fallback: render fields that were set (excluding changedFields/previous...)
    const keys = Object.keys(meta).filter(
      (k) => k !== "changedFields" && !k.startsWith("previous") && k !== "stage" && k !== "status"
    );
    if (keys.length > 0) {
      const items = keys.map((key) => {
        const valStr = meta[key] !== null && meta[key] !== undefined ? String(meta[key]) : "empty";
        return (
          <div key={key} className="text-xs text-muted-foreground">
            • <span className="font-medium">{key}</span>: &quot;{valStr}&quot;
          </div>
        );
      });
      return (
        <div>
          <div className="text-xs font-medium text-muted-foreground">Initial field values:</div>
          <div className="mt-1 space-y-1">{items}</div>
        </div>
      );
    }
  } catch {
    // ignore parse error, fallback to null
  }
  return null;
}
