"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

/**
 * Reusable route-level error boundary component.
 * Each `app/<entity>/error.tsx` re-exports this with an `entityLabel`.
 */
export function RouteErrorBoundary({
  error,
  reset,
  entityLabel
}: {
  error: Error & { digest?: string };
  reset: () => void;
  entityLabel: string;
}) {
  useEffect(() => {
    console.error(`Route error boundary (${entityLabel}):`, error);
  }, [error, entityLabel]);

  return (
    <div
      data-testid="route-error-boundary"
      className="crm-page flex flex-col items-start gap-4"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">
          Something went wrong in {entityLabel}
        </h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred while loading this page. You can try
          resetting or reloading your browser.
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground">
            Error digest: <code>{error.digest}</code>
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} data-testid="route-error-reset">
          Reset
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            window.location.reload();
          }}
          data-testid="route-error-reload"
        >
          Reload page
        </Button>
      </div>
    </div>
  );
}
