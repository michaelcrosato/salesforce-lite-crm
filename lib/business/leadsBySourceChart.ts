import type { LeadsBySourceRow } from "@/lib/services/reports";

export interface LeadsBySourceChartData {
  labels: string[];
  data: number[];
  rates: number[];
}

export function leadsBySourceChart(
  rows: LeadsBySourceRow[]
): LeadsBySourceChartData {
  const sorted = [...rows].sort((a, b) => b.count - a.count);

  return {
    labels: sorted.map((r) => r.source),
    data: sorted.map((r) => r.count),
    rates: sorted.map((r) => Math.round(r.rate * 100))
  };
}
