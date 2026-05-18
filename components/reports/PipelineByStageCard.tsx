import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { PipelineByStageRow } from "@/lib/services/reports";

interface PipelineByStageCardProps {
  data: PipelineByStageRow[];
  isLoading?: boolean;
}

const STAGE_LABELS: Record<string, string> = {
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost"
};

export function PipelineByStageCard({ data, isLoading }: PipelineByStageCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState variant="loading" title="Loading pipeline" description="Aggregating deal values by stage..." />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Pipeline by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="No pipeline data" description="No open deals in the current period." />
        </CardContent>
      </Card>
    );
  }

  const maxValue = Math.max(...data.map((d) => d.value));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Pipeline by Stage</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {data
          .sort((a, b) => (STAGE_LABELS[a.stage] || a.stage).localeCompare(STAGE_LABELS[b.stage] || b.stage))
          .map((row) => {
            const width = maxValue > 0 ? Math.round((row.value / maxValue) * 100) : 0;
            return (
              <div key={row.stage} className="flex items-center gap-3 text-sm">
                <div className="w-24 font-medium">{STAGE_LABELS[row.stage] || row.stage}</div>
                <div className="flex-1">
                  <div className="h-2 rounded bg-muted">
                    <div className="h-2 rounded bg-primary" style={{ width: `${width}%` }} />
                  </div>
                </div>
                <div className="w-28 text-right tabular-nums">
                  {row.count} deals · ${Math.round(row.value / 1000)}k
                </div>
              </div>
            );
          })}
      </CardContent>
    </Card>
  );
}
