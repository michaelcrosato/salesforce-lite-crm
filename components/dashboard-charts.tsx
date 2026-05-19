"use client";

import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters";

export type StageChartDatum = {
  stage: string;
  label: string;
  value: number;
  count: number;
};

const colors = [
  "#1d4ed8",
  "#0f766e",
  "#a16207",
  "#be123c",
  "#15803d",
  "#475569"
];

export function DashboardCharts({ data }: { data: StageChartDatum[] }) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Pipeline Value by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-80">
            <BarChart
              data={data}
              margin={{ top: 8, right: 8, left: 8, bottom: 8 }}
              responsive
              style={{ width: "100%", height: "100%" }}
            >
              <XAxis dataKey="label" tickLine={false} axisLine={false} />
              <YAxis
                tickFormatter={(value: number) =>
                  `$${Math.round(value / 1000)}k`
                }
                tickLine={false}
                axisLine={false}
                width={56}
              />
              <Tooltip
                formatter={(value) =>
                  typeof value === "number"
                    ? formatCurrency(value)
                    : String(value ?? "")
                }
              />
              <Bar dataKey="value" radius={[6, 6, 0, 0]} fill="#1d4ed8" />
            </BarChart>
          </div>
        </CardContent>
      </Card>
      <Card className="min-w-0">
        <CardHeader>
          <CardTitle>Deals by Stage</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 sm:h-72">
            <PieChart responsive style={{ width: "100%", height: "100%" }}>
              <Pie
                data={data}
                dataKey="count"
                nameKey="label"
                innerRadius={60}
                outerRadius={105}
                paddingAngle={2}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={entry.stage}
                    fill={colors[index % colors.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                formatter={(value, name) => [
                  String(value ?? 0),
                  typeof name === "string" ? name : "Deals"
                ]}
              />
            </PieChart>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-muted-foreground sm:grid-cols-3">
            {data.map((stage, index) => (
              <div
                key={stage.stage}
                className="flex min-w-0 items-center gap-2"
              >
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: colors[index % colors.length] }}
                />
                <span className="truncate">
                  {stage.label}: {stage.count}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
