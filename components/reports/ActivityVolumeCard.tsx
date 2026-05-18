import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { ActivityVolumeByDayRow } from "@/lib/services/reports";

interface ActivityVolumeCardProps {
  data: ActivityVolumeByDayRow[];
  isLoading?: boolean;
}

export function ActivityVolumeCard({ data, isLoading }: ActivityVolumeCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Volume (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState variant="loading" title="Loading activity" description="Aggregating daily activity volume..." />
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Activity Volume (Last 30 Days)</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState title="No activity data" description="No activities recorded in the selected period." />
        </CardContent>
      </Card>
    );
  }

  const max = Math.max(...data.map((d) => d.count));

  return (
    <Card>
      <CardHeader>
        <CardTitle>Activity Volume (Last 30 Days)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-1 h-32">
          {data.map((row, idx) => {
            const height = max > 0 ? Math.round((row.count / max) * 100) : 0;
            return (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full bg-primary rounded-t" style={{ height: `${height}%` }} />
                <div className="text-[10px] text-muted-foreground mt-1 truncate w-full text-center">
                  {row.day.slice(5)}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
