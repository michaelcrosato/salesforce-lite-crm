import { PrismaClient } from "@prisma/client";
import { buildAnalystPanel } from "./lib/business/analyst";

const prisma = new PrismaClient();

async function debug() {
  const [orders, leads, deals] = await Promise.all([
    prisma.dealerOrder.findMany({ include: { account: true } }),
    prisma.lead.findMany(),
    prisma.deal.findMany({ include: { account: true } })
  ]);

  const panel = buildAnalystPanel({
    orders: orders.map((o) => ({
      id: o.id,
      name: o.name,
      status: o.status,
      monthlyQuota: o.monthlyQuota,
      deliveredThisMonth: 0, // Simplified for debug
      account: {
        id: o.account.id,
        name: o.account.name,
        healthScore: o.account.healthScore
      }
    })),
    leads: leads.map((l) => ({
      id: l.id,
      firstName: l.firstName,
      lastName: l.lastName,
      assignmentReason: l.assignmentReason
    })),
    deals: deals.map((d) => ({
      id: d.id,
      name: d.name,
      stage: d.stage,
      value: d.value,
      createdAt: d.createdAt,
      lastActivityAt: d.lastActivityAt,
      accountId: d.accountId,
      accountName: d.account?.name
    }))
  });

  console.log("Analyst Panel Debug:");
  console.log("Stale High-Value Deals:", panel.staleHighValueDeals);
  process.exit(0);
}

debug();
