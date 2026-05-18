"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { RoutingDecision } from "@/lib/services/leads";

interface RoutingDecisionDetailProps {
  decision: RoutingDecision | null;
  testid?: string;
}

export function RoutingDecisionDetail({ decision, testid }: RoutingDecisionDetailProps) {
  const [expanded, setExpanded] = useState(false);

  if (!decision) {
    return (
      <div data-testid={testid ? `${testid}-empty` : "routing-detail-empty"} className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
        No routing record found for this lead.
      </div>
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
            {decision.steps.map((step, index) => (
              <div key={index} className="rounded border bg-muted/40 p-3">
                <div className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
                  {step.step}
                </div>
                <pre className="mt-1 whitespace-pre-wrap break-words text-xs text-foreground">
                  {JSON.stringify(step.result, null, 2)}
                </pre>
              </div>
            ))}
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
