import Link from "next/link";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import {
  buildForecast,
  calculateDefaultAssignmentRate,
  clampAssignmentRate,
  clampLeadVolumeMultiplier,
  type ForecastRisk
} from "@/lib/business/forecast";
import { formatNumber } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { boundedNumberQueryParam, nonEmptyQueryParam } from "@/lib/queryParams";
import { currentMonthRange } from "@/lib/routing/leadRouter";

export const dynamic = "force-dynamic";

export default async function ForecastPage({
  searchParams
}: {
  searchParams: Promise<{ multiplier?: string; assignmentRate?: string; area?: string }>;
}) {
  const now = new Date();
  const { start, end } = currentMonthRange(now);
  const params = await searchParams;
  const leadVolumeMultiplierParam = boundedNumberQueryParam(params.multiplier, {
    min: 0.5,
    max: 3
  });
  const assignmentRateParam = boundedNumberQueryParam(params.assignmentRate, {
    min: 10,
    max: 100
  });
  const selectedAreaId = nonEmptyQueryParam(params.area);
  const [orders, areas, totalLeadsThisMonth, routedLeadsThisMonth] = await Promise.all([
    prisma.dealerOrder.findMany({
      where: {
        status: "active"
      },
      orderBy: {
        name: "asc"
      },
      include: {
        account: {
          select: {
            id: true,
            name: true
          }
        },
        areas: {
          include: {
            area: {
              select: {
                id: true,
                name: true
              }
            }
          }
        },
        leads: {
          where: {
            createdAt: {
              gte: start,
              lt: end
            }
          },
          select: {
            id: true
          }
        }
      }
    }),
    prisma.area.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    }),
    prisma.lead.count({
      where: {
        createdAt: {
          gte: start,
          lt: end
        }
      }
    }),
    prisma.lead.count({
      where: {
        assignmentReason: "routed",
        createdAt: {
          gte: start,
          lt: end
        }
      }
    })
  ]);

  const defaultAssignmentRate = calculateDefaultAssignmentRate({
    totalLeads: totalLeadsThisMonth,
    routedLeads: routedLeadsThisMonth
  });
  const leadVolumeMultiplier = clampLeadVolumeMultiplier(leadVolumeMultiplierParam ?? 1);
  const assignmentRate = clampAssignmentRate(
    assignmentRateParam === undefined ? defaultAssignmentRate : assignmentRateParam / 100
  );
  const forecast = buildForecast({
    leadVolumeMultiplier,
    assignmentRate,
    areaId: selectedAreaId,
    now,
    orders: orders.map((order) => ({
      id: order.id,
      name: order.name,
      monthlyQuota: order.monthlyQuota,
      deliveredThisMonth: order.leads.length,
      account: order.account,
      areas: order.areas.map((link) => link.area)
    }))
  });

  return (
    <div className="crm-page max-w-[1500px]">
      <PageHeader
        title="Forecast Simulator"
        description="Stress-test dealer order delivery using transparent lead-volume and assignment assumptions."
      />

      <Card>
        <CardHeader>
          <CardTitle>Scenario Inputs</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/forecast" className="grid gap-4 md:grid-cols-[1fr_1fr_1fr_auto]">
            <div className="space-y-2">
              <Label htmlFor="multiplier">Lead volume multiplier</Label>
              <Input
                id="multiplier"
                name="multiplier"
                type="number"
                min="0.5"
                max="3"
                step="0.1"
                defaultValue={leadVolumeMultiplier}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="assignmentRate">Assignment rate</Label>
              <Input
                id="assignmentRate"
                name="assignmentRate"
                type="number"
                min="10"
                max="100"
                step="1"
                defaultValue={Math.round(assignmentRate * 100)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="area">Area</Label>
              <Select id="area" name="area" defaultValue={selectedAreaId ?? ""}>
                <option value="">All areas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Button type="submit" className="w-full">
                Apply
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Projected Leads"
          value={formatNumber(forecast.summary.projectedLeads)}
          detail={`${leadVolumeMultiplier}x volume at ${Math.round(assignmentRate * 100)}% assignment`}
        />
        <KpiCard
          label="Likely Hit Quota"
          value={formatNumber(forecast.summary.ordersLikelyToHitQuota)}
        />
        <KpiCard
          label="Likely Miss Quota"
          value={formatNumber(forecast.summary.ordersLikelyToMissQuota)}
        />
        <KpiCard
          label="Likely Over-Deliver"
          value={formatNumber(forecast.summary.ordersLikelyToOverDeliver)}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Order Projection</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                  <th className="py-3 pr-4 font-medium">Dealer</th>
                  <th className="py-3 pr-4 font-medium">Order</th>
                  <th className="py-3 pr-4 font-medium">Areas</th>
                  <th className="py-3 pr-4 font-medium">Current</th>
                  <th className="py-3 pr-4 font-medium">Quota</th>
                  <th className="py-3 pr-4 font-medium">Projected</th>
                  <th className="py-3 pr-4 font-medium">Needed</th>
                  <th className="py-3 pr-4 font-medium">Risk</th>
                </tr>
              </thead>
              <tbody>
                {forecast.rows.map((row) => (
                  <tr key={row.orderId} className="border-b last:border-0">
                    <td className="py-3 pr-4">
                      <Link href={`/accounts/${row.accountId}`} className="text-primary hover:underline">
                        {row.accountName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4 font-medium">
                      <Link href={`/orders/${row.orderId}`} className="text-primary hover:underline">
                        {row.orderName}
                      </Link>
                    </td>
                    <td className="py-3 pr-4">{row.areas.join(", ")}</td>
                    <td className="py-3 pr-4">{formatNumber(row.currentDelivered)}</td>
                    <td className="py-3 pr-4">{formatNumber(row.monthlyQuota)}</td>
                    <td className="py-3 pr-4" data-forecast-projected={row.orderId}>
                      {formatNumber(row.projectedDelivered)}
                    </td>
                    <td className="py-3 pr-4">{formatNumber(row.additionalLeadsNeeded)}</td>
                    <td className="py-3 pr-4">
                      <RiskBadge risk={row.risk} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>How This Works</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Projected delivered leads = current delivered leads / elapsed days in this month * days in
          month * lead volume multiplier * assignment rate. Area filtering limits the table to
          active orders linked to that routing area.
        </CardContent>
      </Card>
    </div>
  );
}

function RiskBadge({ risk }: { risk: ForecastRisk }) {
  const labels: Record<ForecastRisk, string> = {
    miss: "Miss",
    hit: "Hit",
    over: "Over"
  };

  return (
    <Badge variant={risk === "miss" ? "danger" : risk === "hit" ? "success" : "warning"}>
      {labels[risk]}
    </Badge>
  );
}
