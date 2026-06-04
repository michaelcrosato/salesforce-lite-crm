import { describe, it, expect } from "vitest";
import { prisma } from "../../lib/prisma";
import { resolveAreaForLead } from "../../lib/routing/leadRouter";
import { calculateDashboardKpis } from "../../lib/business/dashboard";
import { buildAnalystPanel } from "../../lib/business/analyst";

describe("Demo Anchor Seed Integrity", () => {
  it("a) Demo postal code resolves to Vancouver Metro", async () => {
    const areas = await prisma.area.findMany();
    const result = resolveAreaForLead({ postalCode: "V5K 0A1" }, areas);
    expect(result?.name).toBe("Vancouver Metro");
  });

  it("b) At least one behind-pace DealerOrder exists", async () => {
    const now = pacingAnchorDate();
    const dealerOrders = await prisma.dealerOrder.findMany({
      where: { status: "active" },
      include: {
        leads: {
          where: {
            createdAt: {
              gte: new Date(now.getFullYear(), now.getMonth(), 1),
              lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
            },
          },
        },
      },
    });

    const isBehind = dealerOrders.some((order) => {
      const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const expected = (order.monthlyQuota * now.getDate()) / daysInMonth;
      return order.leads.length - expected < -1;
    });

    expect(isBehind).toBe(true);
  });

  it("c) Dashboard KPIs are non-empty", async () => {
    const contactsCount = await prisma.contact.count();
    const accounts = await prisma.account.findMany();
    const deals = await prisma.deal.findMany();

    const kpis = calculateDashboardKpis({
      contactsCount,
      accounts,
      deals: deals.map((d) => ({ ...d, accountName: "dummy" })),
    });

    expect(kpis.totalContacts).toBeGreaterThan(0);
    expect(kpis.activeAccounts).toBeGreaterThan(0);
    expect(kpis.openDeals).toBeGreaterThan(0);
    expect(kpis.openPipelineValue).toBeGreaterThan(0);
    expect(kpis.weightedForecastValue).toBeGreaterThan(0);
  });

  it("d) Analyst panel has at least one actionable item", async () => {
    const now = new Date();
    const [orders, leads, deals] = await Promise.all([
      prisma.dealerOrder.findMany({
        include: {
          account: { select: { id: true, name: true, healthScore: true } },
          leads: {
            where: {
              createdAt: {
                gte: new Date(now.getFullYear(), now.getMonth(), 1),
                lt: new Date(now.getFullYear(), now.getMonth() + 1, 1),
              },
            },
          },
        },
      }),
      prisma.lead.findMany(),
      prisma.deal.findMany(),
    ]);

    const analystPanel = buildAnalystPanel({
      orders: orders.map((o) => ({
        ...o,
        deliveredThisMonth: o.leads.length,
        account: { ...o.account, healthScore: o.account.healthScore ?? 100 },
      })),
      leads: leads.map((l) => ({ ...l })),
      deals: deals.map((d) => ({ ...d })),
      now,
    });

    expect(analystPanel.actions.length).toBeGreaterThanOrEqual(1);
  });

  it("e) Forecast baseline is stable (regression guard)", async () => {
    const contactsCount = await prisma.contact.count();
    const accounts = await prisma.account.findMany();
    const deals = await prisma.deal.findMany();

    const kpis = calculateDashboardKpis({
      contactsCount,
      accounts,
      deals: deals.map((d) => ({ ...d, accountName: "dummy" })),
    });

    // Baseline values recorded from seed analysis
    const expectedForecast = 706250; // Actual baseline from initial run
    const margin = expectedForecast * 0.05;

    // We will verify the actual value first if it differs significantly
    expect(kpis.weightedForecastValue).toBeGreaterThan(expectedForecast - margin);
    expect(kpis.weightedForecastValue).toBeLessThan(expectedForecast + margin);
  });
});

function pacingAnchorDate() {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();

  return new Date(now.getFullYear(), now.getMonth(), Math.min(28, lastDay));
}
