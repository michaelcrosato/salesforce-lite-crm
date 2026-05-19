import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found"
};

export default function GlobalNotFound() {
  return (
    <div
      data-testid="page-not-found"
      className="crm-page flex flex-col items-start gap-4"
    >
      <div className="space-y-2">
        <h1 className="text-2xl font-semibold">Page not found</h1>
        <p className="text-sm text-muted-foreground">
          The page you requested does not exist. It may have been moved, the
          record may have been removed, or the URL may be mistyped.
        </p>
      </div>
      <div className="flex gap-2">
        <Button asChild data-testid="page-not-found-dashboard">
          <Link href="/dashboard">Return to dashboard</Link>
        </Button>
        <Button asChild variant="outline" data-testid="page-not-found-accounts">
          <Link href="/accounts">Browse accounts</Link>
        </Button>
      </div>
    </div>
  );
}
