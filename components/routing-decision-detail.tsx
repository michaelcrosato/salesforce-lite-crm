"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import type { RoutingDecision } from "@/lib/services/leads";

interface RoutingDecisionDetailProps {
  decision: RoutingDecision | null;
  testid?: string;
}

export function RoutingDecisionDetail({ decision, testid }: RoutingDecisionDetailProps) {
  const [expanded, setExpanded] = useState(false);

  if (!decision) {
    return (
      <EmptyState
        title="No routing decision"
        description="No routing record found for this lead."
        compact
        data-testid={testid ? `${testid}-empty` : "routing-detail-empty"}
      />
    );
  }

  const toggle = () => setExpanded(!expanded);

  return (
    <div data-testid={testid} className="rounded-lg border bg-card">
      <button
        type="button"
        onClick={toggle}
        data-testid="routing-detail-toggle"
        className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-accent/50"
        aria-expanded={expanded}
      >
        <div className="flex items-center gap-2 text-sm">
          <span className="font-medium">Routing decision</span>
          <span className="text-muted-foreground">
            {decision.matchedAreaName ? `→ ${decision.matchedAreaName}` : ""}
            {decision.selectedOrderId ? " (routed)" : " (no match)"}
          </span>
        </div>
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
      </button>

      {expanded && (
        <div className="border-t px-4 py-4 text-sm">
          <div className="space-y-3">
            {decision.steps.map((step) => {
              const label = formatStep(step.step, step.result);
              return (
                <div key={routingStepKey(step)} className="rounded border bg-muted/40 p-3">
                  <div className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                    {step.step}
                  </div>
                  <div className="text-sm text-foreground">{label}</div>
                </div>
              );
            })}
          </div>

          {decision.summary && (
            <div className="mt-4 rounded bg-muted p-3 text-sm">
              <span className="font-medium">Summary:</span> {decision.summary}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function routingStepKey(step: RoutingDecision["steps"][number]): string {
  return `${step.step}:${stableKeyValue(step.result)}`;
}

function stableKeyValue(value: unknown): string {
  if (value === null) return "null";
  if (typeof value === "string") return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return JSON.stringify(value) ?? "undefined";
}

function formatStep(step: string, result: unknown): string {
  if (typeof result === "string") return result;
  if (typeof result === "number" || typeof result === "boolean") return String(result);

  if (Array.isArray(result)) {
    return result.map((r) => (typeof r === "object" ? JSON.stringify(r) : String(r))).join(", ");
  }

  if (result && typeof result === "object") {
    const r = result as Record<string, unknown>;

    if (step.includes("normalize") || step.includes("postal")) {
      return `${r.raw ?? ""} → ${r.normalized ?? r.prefix ?? ""}`;
    }
    if (step.includes("prefix")) {
      return String(r.prefix ?? "");
    }
    if (step.includes("area")) {
      return r.areaName ? String(r.areaName) : "no match";
    }
    if (step.includes("filter") || step.includes("candidate")) {
      const count = Array.isArray(r.candidates) ? r.candidates.length : 0;
      return `${count} candidate orders`;
    }
    if (step.includes("rank") || step.includes("pace")) {
      if (Array.isArray(r)) {
        return r
          .map((item: Record<string, unknown>) => {
            const dealer = item.dealerName ?? item.orderId;
            const gap = item.paceGap;
            return `${dealer} (${gap})`;
          })
          .join(" · ");
      }
    }
    if (step.includes("select")) {
      return r.selectedOrderId ? `Selected ${r.selectedOrderId}` : "No selection";
    }

    return Object.entries(r)
      .map(([k, v]) => `${k}: ${v}`)
      .join(" | ");
  }

  return JSON.stringify(result);
}
