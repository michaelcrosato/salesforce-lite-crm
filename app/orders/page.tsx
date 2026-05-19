import Link from "next/link";
import { PacingBar } from "@/components/pacing-bar";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  DEALER_ORDER_STATUS_LABELS,
  type DealerOrderStatus
} from "@/lib/crm-constants";
import { expectedDeliveredByToday, getPacingStatus } from "@/lib/business/dealerOps";
import { formatDate, formatNumber } from "@/lib/formatters";
import { currentMonthRange } from "@/lib/routing/leadRouter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function OrdersPage() {
  const now = new Date();
  const { start, end } = currentMonthRange(now);
  const orders = await prisma.dealerOrder.findMany({
    orderBy: [
      {
        status: "asc"
      },
      {
        name: "asc"
      }
    ],
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
  });

  return (
    <div className="crm-page max-w-[1500px]">
      <PageHeader
        title="Dealer Orders"
        description="Monitor monthly lead quota, delivered count, and order pacing by area."
      />

      <Card>
        <CardHeader>
          <CardTitle>Pacing Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          {orders.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Order</th>
                    <th className="py-3 pr-4 font-medium">Dealer</th>
                    <th className="py-3 pr-4 font-medium">Areas</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Quota</th>
                    <th className="py-3 pr-4 font-medium">Delivered</th>
                    <th className="py-3 pr-4 font-medium">Remaining</th>
                    <th className="py-3 pr-4 font-medium">Expected</th>
                    <th className="py-3 pr-4 font-medium">Pacing</th>
                    <th className="py-3 pr-4 font-medium">Start</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => {
                    const deliveredThisMonth = order.leads.length;
                    const orderForPacing = {
                      monthlyQuota: order.monthlyQuota,
                      deliveredThisMonth
                    };
                    const status = getPacingStatus(orderForPacing, now);

                    return (
                      <tr key={order.id} className="border-b align-top last:border-0">
                        <td className="py-3 pr-4 font-medium">
                          <Link href={`/orders/${order.id}`} className="text-primary hover:underline">
                            {order.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          <Link href={`/accounts/${order.account.id}`} className="text-primary hover:underline">
                            {order.account.name}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">
                          {order.areas.map((link) => link.area.name).join(", ")}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={order.status === "active" ? "success" : "secondary"}>
                            {DEALER_ORDER_STATUS_LABELS[order.status as DealerOrderStatus] ??
                              order.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">{formatNumber(order.monthlyQuota)}</td>
                        <td className="py-3 pr-4">{formatNumber(deliveredThisMonth)}</td>
                        <td className="py-3 pr-4">
                          {formatNumber(Math.max(0, order.monthlyQuota - deliveredThisMonth))}
                        </td>
                        <td className="py-3 pr-4">
                          {expectedDeliveredByToday(orderForPacing, now).toFixed(1)}
                        </td>
                        <td className="w-48 py-3 pr-4">
                          <PacingBar order={orderForPacing} now={now} />
                          <span className="sr-only">{status}</span>
                        </td>
                        <td className="py-3 pr-4">{formatDate(order.startDate)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No dealer orders"
              description="Seeded dealer orders cover this surface; create and edit flows are deferred."
              actionHref="/dashboard"
              actionLabel="Return to dashboard"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
