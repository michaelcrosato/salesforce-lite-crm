import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { LeadsBySourceRow } from "@/lib/services/reports";
import { leadsBySourceChart } from "@/lib/business/leadsBySourceChart";

interface LeadsBySourceCardProps {
  data: LeadsBySourceRow[];
  isLoading?: boolean;
}

export function LeadsBySourceCard({ data, isLoading }: LeadsBySourceCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            variant="loading"
            title="Loading leads by source"
            description="Fetching the latest lead distribution..."
          />
        </CardContent>
      </Card>
    );
  }

  const chart = leadsBySourceChart(data);

  if (chart.labels.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Leads by Source</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No lead source data"
            description="No leads have been recorded yet for this period."
          />
        </CardContent>
      </Card>
    );
  }

  const max = Math.max(...chart.data);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Leads by Source</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {chart.labels.map((label, i) => {
          const count = chart.data[i];
          const rate = chart.rates[i];
          const width = max > 0 ? Math.round((count / max) * 100) : 0;

          return (
            <div key={label} className="flex items-center gap-3 text-sm">
              <div className="w-28 truncate font-medium">{label}</div>
              <div className="flex-1">
                <div className="h-2.5 rounded bg-muted">
                  <div
                    className="h-2.5 rounded bg-primary"
                    style={{ width: `${width}%` }}
                  />
                </div>
              </div>
              <div className="w-20 text-right tabular-nums">
                {count} <span className="text-muted-foreground">({rate}%)</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
