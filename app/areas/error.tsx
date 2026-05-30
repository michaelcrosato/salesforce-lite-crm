"use client";

import { RouteErrorBoundary } from "@/components/route-error-boundary";

export default function AreasError({
  error,
  reset
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorBoundary error={error} reset={reset} entityLabel="Areas" />;
}
