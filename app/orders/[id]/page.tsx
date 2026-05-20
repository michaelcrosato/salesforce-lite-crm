import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityTimeline } from "@/components/activity-timeline";
import { PacingBar } from "@/components/pacing-bar";
import { PageHeader } from "@/components/page-header";
import { RoutingDecisionDetail } from "@/components/routing-decision-detail";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoutingDecisionForLead } from "@/lib/crm/crmClient";
import {
  DEALER_ORDER_STATUS_LABELS,
  type DealerOrderStatus
} from "@/lib/crm-constants";
import { expectedDeliveredByToday } from "@/lib/business/dealerOps";
import { formatDate, formatNumber } from "@/lib/formatters";
import { currentMonthRange } from "@/lib/routing/leadRouter";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const order = await prisma.dealerOrder.findUnique({
    where: { id },
    select: { name: true }
  });
  return { title: order?.name ?? "Dealer order not found" };
}

export default async function OrderDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const now = new Date();
  const { start, end } = currentMonthRange(now);
  const order = await prisma.dealerOrder.findUnique({
    where: {
      id
    },
    include: {
      account: {
        select: {
          id: true,
          name: true,
          healthScore: true
        }
      },
      areas: {
        include: {
          area: true
        }
      },
      leads: {
        where: {
          createdAt: {
            gte: start,
            lt: end
          }
        },
        orderBy: {
          createdAt: "desc"
        }
      }
    }
  });

  if (!order) {
    notFound();
  }

  const routingEvents = await prisma.activity.findMany({
    where: {
      type: "routing_event",
      lead: {
        assignedOrderId: order.id
      }
    },
    orderBy: {
      createdAt: "desc"
    },
    take: 12,
    include: {
      account: {
        select: {
          id: true,
          name: true
        }
      },
      contact: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      },
      deal: {
        select: {
          id: true,
          name: true
        }
      },
      lead: {
        select: {
          id: true,
          firstName: true,
          lastName: true
        }
      }
    }
  });

  const deliveredThisMonth = order.leads.length;
  const pacingOrder = {
    monthlyQuota: order.monthlyQuota,
    deliveredThisMonth
  };

  const leadRoutingDecisions = await Promise.all(
    order.leads.map((lead) => getRoutingDecisionForLead(lead.id))
  );
  const decisionsByLeadId = new Map(
    order.leads.map((lead, index) => [
      lead.id,
      leadRoutingDecisions[index] ?? null
    ])
  );

  return (
    <div className="crm-page" data-testid="page-order-detail">
      <PageHeader
        title={order.name}
        description="Dealer order quota, assigned leads, areas, and recent routing events."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_380px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Assigned Leads This Month</CardTitle>
            </CardHeader>
            <CardContent>
              {order.leads.length > 0 ? (
                <div className="divide-y rounded-md border">
                  {order.leads.map((lead) => (
                    <div key={lead.id} className="space-y-2 p-3">
                      <Link
                        href={`/leads/${lead.id}`}
                        className="grid gap-1 transition-colors hover:bg-muted/50 md:grid-cols-[1fr_auto]"
                      >
                        <span className="font-medium">
                          {lead.firstName} {lead.lastName}
                        </span>
                        <span className="text-sm text-muted-foreground">
                          {lead.postalCode ?? "No postal"} ·{" "}
                          {formatDate(lead.createdAt)}
                        </span>
                      </Link>
                      <RoutingDecisionDetail
                        decision={decisionsByLeadId.get(lead.id) ?? null}
                        testid={`routing-detail-${lead.id}`}
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No leads have been delivered to this order this month.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent Routing Events</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={routingEvents} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Dealer
                </p>
                <Link
                  href={`/accounts/${order.account.id}`}
                  className="mt-1 block text-primary hover:underline"
                >
                  {order.account.name}
                </Link>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Status
                </p>
                <Badge
                  className="mt-1"
                  variant={order.status === "active" ? "success" : "secondary"}
                >
                  {DEALER_ORDER_STATUS_LABELS[
                    order.status as DealerOrderStatus
                  ] ?? order.status}
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Summary
                  label="Quota"
                  value={formatNumber(order.monthlyQuota)}
                />
                <Summary
                  label="Delivered"
                  value={formatNumber(deliveredThisMonth)}
                />
                <Summary
                  label="Expected"
                  value={expectedDeliveredByToday(pacingOrder, now).toFixed(1)}
                />
              </div>
              <PacingBar order={pacingOrder} now={now} />
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Areas
                </p>
                <p className="mt-1">
                  {order.areas.map((link) => link.area.name).join(", ")}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Dates
                </p>
                <p className="mt-1">
                  {formatDate(order.startDate)} to {formatDate(order.endDate)}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 font-semibold">{value}</p>
    </div>
  );
}
