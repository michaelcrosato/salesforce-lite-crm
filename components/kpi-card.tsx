import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export interface KpiCardProps {
  label: string;
  value: string;
  detail?: string;
  /** Optional data-testid for E2E / visual targeting (e.g. dashboard kpis) */
  "data-testid"?: string;
}

export function KpiCard({ label, value, detail, "data-testid": testid }: KpiCardProps) {
  return (
    <Card data-testid={testid}>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-normal">{value}</div>
        {detail ? (
          <p className="mt-1 text-xs text-muted-foreground">{detail}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
