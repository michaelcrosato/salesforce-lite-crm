import { Badge } from "@/components/ui/badge";
import { getPacingStatus, pacingPercent, type DealerOpsOrder } from "@/lib/business/dealerOps";
import { cn } from "@/lib/utils";

const pacingLabels = {
  behind: "Behind",
  on_pace: "On pace",
  ahead: "Ahead",
  over: "Over"
};

export function PacingBar({
  order,
  now = new Date()
}: {
  order: Pick<DealerOpsOrder, "monthlyQuota" | "deliveredThisMonth">;
  now?: Date;
}) {
  const percent = pacingPercent(order);
  const status = getPacingStatus(order, now);

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-2">
        <Badge variant={status === "behind" ? "danger" : status === "on_pace" ? "secondary" : "success"}>
          {pacingLabels[status]}
        </Badge>
        <span className="text-xs text-muted-foreground">{percent}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            "h-full rounded-full",
            status === "behind" && "bg-destructive",
            status === "on_pace" && "bg-primary",
            (status === "ahead" || status === "over") && "bg-emerald-600"
          )}
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
