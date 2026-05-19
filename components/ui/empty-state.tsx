import { AlertCircle, Inbox, Loader2 } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface EmptyStateProps {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
  variant?: "empty" | "loading" | "error";
  /** Compact mode for dense containers (e.g. kanban columns, small cards) — tighter spacing */
  compact?: boolean;
  /** Optional data-testid for test targeting of the empty state container */
  "data-testid"?: string;
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  variant = "empty",
  compact = false,
  "data-testid": testId
}: EmptyStateProps) {
  const iconSize = compact ? "h-4 w-4" : "h-5 w-5";
  const icon =
    variant === "loading" ? (
      <Loader2 className={`${iconSize} animate-spin`} />
    ) : variant === "error" ? (
      <AlertCircle className={iconSize} />
    ) : (
      <Inbox className={iconSize} />
    );

  const iconBg =
    variant === "error"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground";

  const contentPadding = compact ? "py-6" : "py-12";
  const rootClass = compact ? "border-dashed" : "border-dashed";

  return (
    <Card className={rootClass} data-testid={testId}>
      <CardContent className={`flex flex-col items-center gap-3 ${contentPadding} text-center`}>
        <div className={`rounded-full p-3 ${iconBg}`}>
          {icon}
        </div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">{description}</p>
        </div>
        {actionHref && actionLabel && variant !== "loading" ? (
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
