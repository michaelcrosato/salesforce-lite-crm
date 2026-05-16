import { DEAL_STAGES } from "@/lib/crm-constants";
import { ROUTE_REGISTRY } from "@/lib/crm/registry";
import { isStaleDeal, stageSortIndex } from "@/lib/business/deals";
import { prisma } from "@/lib/prisma";

export type PipelineByStageRow = {
  stage: string;
  count: number;
  value: number;
  weightedValue: number;
};

export type LeadsBySourceRow = {
  source: string;
  count: number;
};

export type ActivityVolumeByDayRow = {
  day: string;
  count: number;
};

export type TopAccountByOpportunityValueRow = {
  accountId: string;
  accountName: string;
  opportunityCount: number;
  totalValue: number;
  route: string;
};

export type StaleOpportunityRow = {
  id: string;
  name: string;
  stage: string;
  value: number;
  lastActivityAt: Date | null;
  route: string;
};

export type OverdueTaskRow = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueDate: Date;
  route: string;
};

export async function pipelineByStage(): Promise<PipelineByStageRow[]> {
  const deals = await prisma.deal.findMany({
    select: {
      stage: true,
      value: true,
      probability: true
    }
  });
  const rows = new Map<string, PipelineByStageRow>();

  for (const stage of DEAL_STAGES) {
    rows.set(stage, {
      stage,
      count: 0,
      value: 0,
      weightedValue: 0
    });
  }

  for (const deal of deals) {
    const existing =
      rows.get(deal.stage) ??
      {
        stage: deal.stage,
        count: 0,
        value: 0,
        weightedValue: 0
      };

    existing.count += 1;
    existing.value += deal.value;
    existing.weightedValue += deal.value * (deal.probability / 100);
    rows.set(deal.stage, existing);
  }

  return [...rows.values()].sort((left, right) => stageSortIndex(left.stage) - stageSortIndex(right.stage));
}

export async function leadsBySource(): Promise<LeadsBySourceRow[]> {
  const leads = await prisma.lead.findMany({
    select: {
      source: true
    }
  });
  const counts = new Map<string, number>();

  for (const lead of leads) {
    const source = lead.source?.trim() || "Unknown";
    counts.set(source, (counts.get(source) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([source, count]) => ({
      source,
      count
    }))
    .sort((left, right) => right.count - left.count || left.source.localeCompare(right.source));
}

export async function activityVolumeByDay(
  now = new Date(),
  days = 30
): Promise<ActivityVolumeByDayRow[]> {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  const activities = await prisma.activity.findMany({
    where: {
      createdAt: {
        gte: start,
        lte: now
      }
    },
    select: {
      createdAt: true
    }
  });
  const counts = new Map<string, number>();

  for (let offset = 0; offset < days; offset += 1) {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + offset);
    counts.set(day.toISOString().slice(0, 10), 0);
  }

  for (const activity of activities) {
    const day = activity.createdAt.toISOString().slice(0, 10);
    counts.set(day, (counts.get(day) ?? 0) + 1);
  }

  return [...counts.entries()].map(([day, count]) => ({
    day,
    count
  }));
}

export async function topAccountsByOpportunityValue(
  limit = 5
): Promise<TopAccountByOpportunityValueRow[]> {
  const accounts = await prisma.account.findMany({
    include: {
      deals: {
        select: {
          value: true
        }
      }
    }
  });

  return accounts
    .map((account) => ({
      accountId: account.id,
      accountName: account.name,
      opportunityCount: account.deals.length,
      totalValue: account.deals.reduce((total, deal) => total + deal.value, 0),
      route: ROUTE_REGISTRY.accountDetail(account.id)
    }))
    .filter((account) => account.opportunityCount > 0)
    .sort((left, right) => right.totalValue - left.totalValue || left.accountName.localeCompare(right.accountName))
    .slice(0, limit);
}

export async function staleOpportunities(now = new Date()): Promise<StaleOpportunityRow[]> {
  const deals = await prisma.deal.findMany({
    select: {
      id: true,
      name: true,
      stage: true,
      value: true,
      createdAt: true,
      lastActivityAt: true
    }
  });

  return deals
    .filter((deal) => isStaleDeal(deal, now))
    .sort((left, right) => right.value - left.value)
    .map((deal) => ({
      id: deal.id,
      name: deal.name,
      stage: deal.stage,
      value: deal.value,
      lastActivityAt: deal.lastActivityAt,
      route: ROUTE_REGISTRY.opportunityDetail(deal.id)
    }));
}

export async function overdueTasks(now = new Date()): Promise<OverdueTaskRow[]> {
  const tasks = await prisma.task.findMany({
    where: {
      dueDate: {
        lt: now
      },
      status: {
        notIn: ["done", "cancelled"]
      }
    },
    orderBy: [
      {
        dueDate: "asc"
      },
      {
        priority: "desc"
      }
    ]
  });

  const rows: OverdueTaskRow[] = [];

  for (const task of tasks) {
    if (task.dueDate === null) {
      continue;
    }

    rows.push({
      id: task.id,
      title: task.title,
      status: task.status,
      priority: task.priority,
      dueDate: task.dueDate,
      route: ROUTE_REGISTRY.taskDetail(task.id)
    });
  }

  return rows;
}
