import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardCharts, type StageChartDatum } from "@/components/dashboard-charts";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { DEAL_STAGES, STAGE_LABELS } from "@/lib/crm-constants";
import { calculateDashboardKpis, rankTodaysFocus } from "@/lib/business/dashboard";
import { calculateDealerOpsKpis, rankDealerOpsFocus } from "@/lib/business/dealerOps";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { currentMonthRange } from "@/lib/routing/leadRouter";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const { start, end } = currentMonthRange(now);
  const [
    contactsCount,
    accounts,
    deals,
    activities,
    leadsThisMonth,
    dealerLeads,
    dealerOrders
  ] = await Promise.all([
    prisma.contact.count(),
    prisma.account.findMany({
      select: {
        id: true,
        name: true,
        status: true,
        healthScore: true
      }
    }),
    prisma.deal.findMany({
      include: {
        account: {
          select: {
            name: true
          }
        }
      }
    }),
    prisma.activity.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 12,
      include: {
        account: {
          select: {
            name: true
          }
        },
        contact: {
          select: {
            firstName: true,
            lastName: true
          }
        },
        deal: {
          select: {
            name: true
          }
        }
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
    prisma.lead.findMany({
      orderBy: {
        createdAt: "desc"
      },
      take: 30,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        assignmentReason: true,
        createdAt: true
      }
    }),
    prisma.dealerOrder.findMany({
      include: {
        account: {
          select: {
            id: true,
            name: true,
            healthScore: true
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
    })
  ]);

  const dashboardDeals = deals.map((deal) => ({
    id: deal.id,
    name: deal.name,
    stage: deal.stage,
    value: deal.value,
    probability: deal.probability,
    createdAt: deal.createdAt,
    lastActivityAt: deal.lastActivityAt,
    accountName: deal.account?.name
  }));
  const dashboardActivities = activities.map((activity) => ({
    id: activity.id,
    accountId: activity.accountId,
    contactId: activity.contactId,
    dealId: activity.dealId,
    title: activity.title,
    type: activity.type,
    nextStep: activity.nextStep,
    createdAt: activity.createdAt,
    accountName: activity.account?.name,
    contactName: activity.contact
      ? `${activity.contact.firstName} ${activity.contact.lastName}`
      : null,
    dealName: activity.deal?.name
  }));
  const kpis = calculateDashboardKpis({
    contactsCount,
    accounts,
    deals: dashboardDeals
  });
  const focusItems = rankTodaysFocus({
    accounts,
    deals: dashboardDeals,
    activities: dashboardActivities,
    limit: 5
  });
  const dealerOpsOrders = dealerOrders.map((order) => ({
    id: order.id,
    name: order.name,
    monthlyQuota: order.monthlyQuota,
    status: order.status,
    deliveredThisMonth: order.leads.length,
    account: order.account
  }));
  const dealerOpsKpis = calculateDealerOpsKpis({
    leadsThisMonth,
    leads: dealerLeads,
    orders: dealerOpsOrders,
    now
  });
  const dealerOpsFocus = rankDealerOpsFocus({
    orders: dealerOpsOrders,
    leads: dealerLeads,
    deals: deals.map((deal) => ({
      id: deal.id,
      name: deal.name,
      value: deal.value,
      accountId: deal.accountId
    })),
    now,
    limit: 5
  });

  const chartData: StageChartDatum[] = DEAL_STAGES.map((stage) => {
    const stageDeals = deals.filter((deal) => deal.stage === stage);
    return {
      stage,
      label: STAGE_LABELS[stage],
      value: stageDeals.reduce((total, deal) => total + deal.value, 0),
      count: stageDeals.length
    };
  });

  return (
    <div className="crm-page">
      <PageHeader
        title="Dashboard"
        description="A live view of accounts, contacts, pipeline, and sales follow-up."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <KpiCard label="Total Contacts" value={formatNumber(kpis.totalContacts)} />
        <KpiCard label="Active Accounts" value={formatNumber(kpis.activeAccounts)} />
        <KpiCard label="Open Deals" value={formatNumber(kpis.openDeals)} />
        <KpiCard
          label="Open Pipeline"
          value={formatCurrency(kpis.openPipelineValue)}
          detail="New through negotiation"
        />
        <KpiCard
          label="Weighted Forecast"
          value={formatCurrency(kpis.weightedForecastValue)}
          detail="Open value by probability"
        />
        <KpiCard label="Stale Deals" value={formatNumber(kpis.staleDeals)} />
      </div>

      <DashboardCharts data={chartData} />

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Dealer Ops</h2>
          <p className="text-sm text-muted-foreground">
            Lead routing and dealer order pacing for the current month.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-6">
          <KpiCard label="Leads This Month" value={formatNumber(dealerOpsKpis.leadsThisMonth)} />
          <KpiCard label="Unrouted Leads" value={formatNumber(dealerOpsKpis.unroutedLeads)} />
          <KpiCard
            label="Active Dealer Orders"
            value={formatNumber(dealerOpsKpis.activeDealerOrders)}
          />
          <KpiCard
            label="Behind-Pace Orders"
            value={formatNumber(dealerOpsKpis.behindPaceOrders)}
          />
          <KpiCard label="Orders At Quota" value={formatNumber(dealerOpsKpis.ordersAtQuota)} />
          <KpiCard
            label="Recent Routed Leads"
            value={formatNumber(dealerOpsKpis.recentRoutedLeads)}
          />
        </div>
        <Card>
          <CardHeader>
            <CardTitle>Dealer Ops Focus</CardTitle>
          </CardHeader>
          <CardContent>
            {dealerOpsFocus.length > 0 ? (
              <div className="grid gap-3 lg:grid-cols-5">
                {dealerOpsFocus.map((item) => (
                  <Link
                    key={item.id}
                    href={item.href}
                    className="rounded-md border bg-background p-4 transition-colors hover:bg-muted/50"
                  >
                    <Badge variant={item.kind === "order" ? "danger" : "secondary"}>
                      {item.kind}
                    </Badge>
                    <p className="mt-3 line-clamp-2 text-sm font-semibold">{item.title}</p>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                      {item.subtitle}
                    </p>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No dealer ops focus items for the current pacing window.
              </p>
            )}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Today&apos;s Focus</CardTitle>
        </CardHeader>
        <CardContent>
          {focusItems.length > 0 ? (
            <div className="grid gap-3 lg:grid-cols-5">
              {focusItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  className="rounded-md border bg-background p-4 transition-colors hover:bg-muted/50"
                >
                  <Badge variant={item.kind === "deal" ? "warning" : "secondary"}>
                    {item.kind}
                  </Badge>
                  <p className="mt-3 line-clamp-2 text-sm font-semibold">{item.title}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.subtitle}
                  </p>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No urgent focus items. Add activity notes or move deals to keep the loop current.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
