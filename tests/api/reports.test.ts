import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  activityVolumeByDay,
  leadsBySource,
  overdueTasks,
  pipelineByStage,
  staleOpportunities,
  topAccountsByDealValue,
  topAccountsByOpportunityValue
} from "@/lib/services/reports";

const now = new Date("2026-05-16T12:00:00Z");
const accountId = "test-report-account";
const otherAccountId = "test-report-other-account";
const newDealId = "test-report-new-deal";
const proposalDealId = "test-report-proposal-deal";
const staleDealId = "test-report-stale-deal";
const leadOneId = "test-report-lead-one";
const leadTwoId = "test-report-lead-two";
const activityOneId = "test-report-activity-one";
const activityTwoId = "test-report-activity-two";
const routingActivityId = "test-report-routing-activity";
const overdueTaskId = "test-report-overdue-task";
const doneTaskId = "test-report-done-task";

describe("reports query service", () => {
  beforeEach(async () => {
    await cleanupReportFixtures();
    await createReportFixtures();
  });

  afterEach(async () => {
    await cleanupReportFixtures();
  });

  it("returns pipeline totals by stage", async () => {
    const rows = await pipelineByStage();
    const newStage = rows.find((row) => row.stage === "new");
    const proposalStage = rows.find((row) => row.stage === "proposal");

    expect(newStage?.value).toBeGreaterThanOrEqual(10_000_000);
    expect(newStage?.weightedValue).toBeGreaterThanOrEqual(1_000_000);
    expect(proposalStage?.value).toBeGreaterThanOrEqual(250_000);
  });

  it("returns lead counts by source", async () => {
    const rows = await leadsBySource();
    const row = rows.find((source) => source.source === "report-source");

    expect(row?.count).toBeGreaterThanOrEqual(2);
    expect(row?.rate).toBeCloseTo(0.5);
  });

  it("returns activity volume by day for the last 30 days", async () => {
    const rows = await activityVolumeByDay(now);
    const row = rows.find((day) => day.day === "2026-05-16");

    expect(rows).toHaveLength(30);
    expect(row?.count).toBeGreaterThanOrEqual(2);
  });

  it("returns top accounts by opportunity value", async () => {
    const rows = await topAccountsByOpportunityValue(1);

    expect(rows[0]).toMatchObject({
      accountId,
      accountName: "Report Account",
      opportunityCount: 2,
      route: `/accounts/${accountId}`
    });
    expect(rows[0]?.totalValue).toBe(10_250_000);
  });

  it("returns top accounts by open deal value", async () => {
    const rows = await topAccountsByDealValue(1);

    expect(rows[0]).toEqual({
      accountId,
      accountName: "Report Account",
      totalValue: 10_250_000,
      openDealCount: 2
    });
  });

  it("returns stale opportunities", async () => {
    const rows = await staleOpportunities(now);

    expect(rows).toContainEqual({
      id: staleDealId,
      name: "Report Stale Opportunity",
      stage: "qualified",
      value: 125_000,
      lastActivityAt: new Date("2026-04-15T12:00:00Z"),
      route: `/deals?deal=${staleDealId}`
    });
  });

  it("returns overdue open tasks", async () => {
    const rows = await overdueTasks(now);

    expect(rows).toContainEqual({
      id: overdueTaskId,
      title: "Report overdue task",
      status: "open",
      priority: "high",
      dueDate: new Date("2026-05-01T12:00:00Z"),
      route: `/tasks?task=${overdueTaskId}`
    });
    expect(rows.some((task) => task.id === doneTaskId)).toBe(false);
  });
});

async function createReportFixtures() {
  await prisma.account.createMany({
    data: [
      {
        id: accountId,
        name: "Report Account",
        status: "active",
        healthScore: 90
      },
      {
        id: otherAccountId,
        name: "Report Other Account",
        status: "active",
        healthScore: 80
      }
    ]
  });
  await prisma.deal.createMany({
    data: [
      {
        id: newDealId,
        accountId,
        name: "Report New Opportunity",
        stage: "new",
        value: 10_000_000,
        probability: 10,
        createdAt: new Date("2026-05-15T12:00:00Z")
      },
      {
        id: proposalDealId,
        accountId,
        name: "Report Proposal Opportunity",
        stage: "proposal",
        value: 250_000,
        probability: 50,
        createdAt: new Date("2026-05-10T12:00:00Z")
      },
      {
        id: staleDealId,
        accountId: otherAccountId,
        name: "Report Stale Opportunity",
        stage: "qualified",
        value: 125_000,
        probability: 25,
        createdAt: new Date("2026-04-01T12:00:00Z"),
        lastActivityAt: new Date("2026-04-15T12:00:00Z")
      }
    ]
  });
  await prisma.lead.createMany({
    data: [
      {
        id: leadOneId,
        firstName: "Report",
        lastName: "Lead One",
        source: "report-source",
        status: "assigned",
        assignmentReason: "routed"
      },
      {
        id: leadTwoId,
        firstName: "Report",
        lastName: "Lead Two",
        source: "report-source",
        status: "new"
      }
    ]
  });
  await prisma.activity.createMany({
    data: [
      {
        id: activityOneId,
        title: "Report activity one",
        type: "note",
        createdAt: new Date("2026-05-16T08:00:00Z")
      },
      {
        id: activityTwoId,
        title: "Report activity two",
        type: "call",
        createdAt: new Date("2026-05-16T09:00:00Z")
      },
      {
        id: routingActivityId,
        leadId: leadOneId,
        title: "Report routing activity",
        type: "routing_event",
        createdAt: new Date("2026-05-16T10:00:00Z")
      }
    ]
  });
  await prisma.task.createMany({
    data: [
      {
        id: overdueTaskId,
        title: "Report overdue task",
        status: "open",
        priority: "high",
        dueDate: new Date("2026-05-01T12:00:00Z")
      },
      {
        id: doneTaskId,
        title: "Report done task",
        status: "done",
        priority: "urgent",
        dueDate: new Date("2026-05-01T12:00:00Z")
      }
    ]
  });
}

async function cleanupReportFixtures() {
  await prisma.opportunityStageHistory.deleteMany({
    where: {
      dealId: {
        in: [newDealId, proposalDealId, staleDealId]
      }
    }
  });
  await prisma.activity.deleteMany({
    where: {
      id: {
        in: [activityOneId, activityTwoId, routingActivityId]
      }
    }
  });
  await prisma.task.deleteMany({
    where: {
      id: {
        in: [overdueTaskId, doneTaskId]
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        in: [leadOneId, leadTwoId]
      }
    }
  });
  await prisma.deal.deleteMany({
    where: {
      id: {
        in: [newDealId, proposalDealId, staleDealId]
      }
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: {
        in: [accountId, otherAccountId]
      }
    }
  });
}
