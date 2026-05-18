import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import type { TopAccountByDealValueRow } from "@/lib/services/reports";
import { topAccountsCard } from "@/lib/business/topAccountsCard";

interface TopAccountsCardProps {
  data: TopAccountByDealValueRow[];
  limit?: number;
  isLoading?: boolean;
}

export function TopAccountsCard({ data, limit = 8, isLoading }: TopAccountsCardProps) {
  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Accounts by Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            variant="loading"
            title="Loading top accounts"
            description="Calculating pipeline value by account..."
          />
        </CardContent>
      </Card>
    );
  }

  const result = topAccountsCard(data, limit);

  if (result.rows.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Accounts by Pipeline</CardTitle>
        </CardHeader>
        <CardContent>
          <EmptyState
            title="No account data"
            description="No open deals found for top accounts calculation."
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Accounts by Pipeline</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {result.rows.map((row) => (
            <div key={row.accountId} className="flex items-center justify-between text-sm">
              <div className="truncate font-medium">{row.accountName}</div>
              <div className="tabular-nums text-right">
                {row.formattedValue}
                <span className="ml-2 text-xs text-muted-foreground">
                  ({row.openDealCount})
                </span>
              </div>
            </div>
          ))}
        </div>
        {result.hasMore && (
          <div className="mt-3 text-xs text-muted-foreground">+ more accounts</div>
        )}
      </CardContent>
    </Card>
  );
}
