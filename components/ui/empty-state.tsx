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
}

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
  variant = "empty"
}: EmptyStateProps) {
  const icon =
    variant === "loading" ? (
      <Loader2 className="h-5 w-5 animate-spin" />
    ) : variant === "error" ? (
      <AlertCircle className="h-5 w-5" />
    ) : (
      <Inbox className="h-5 w-5" />
    );

  const iconBg =
    variant === "error"
      ? "bg-destructive/10 text-destructive"
      : "bg-muted text-muted-foreground";

  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
        <div className={`rounded-full p-3 ${iconBg}`}>{icon}</div>
        <div>
          <p className="font-medium">{title}</p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            {description}
          </p>
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
