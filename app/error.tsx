"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function GlobalRouteError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Route error boundary caught:", error);
  }, [error]);

  return (
    <div
      data-testid="page-error-boundary"
      className="crm-page flex flex-col items-start gap-4"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Something went wrong</h1>
        <p className="text-sm text-muted-foreground">
          An unexpected error occurred while rendering this page. Resetting
          re-runs the failed server work; reloading the browser also clears any
          client cache.
        </p>
        {error.digest ? (
          <p className="text-xs text-muted-foreground">
            Error digest: <code>{error.digest}</code>
          </p>
        ) : null}
      </div>
      <div className="flex gap-2">
        <Button onClick={reset} data-testid="page-error-reset">
          Reset
        </Button>
        <Button
          variant="outline"
          onClick={() => {
            window.location.reload();
          }}
          data-testid="page-error-reload"
        >
          Reload page
        </Button>
      </div>
    </div>
  );
}
