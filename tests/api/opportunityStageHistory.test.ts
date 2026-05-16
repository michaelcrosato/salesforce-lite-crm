import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { moveDealAction } from "@/app/deals/actions";
import { prisma } from "@/lib/prisma";
import {
  listOpportunityStageHistory,
  recordOpportunityStageChange,
  recordOpportunityStageChangeIfChanged
} from "@/lib/services/opportunityStageHistory";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn()
}));

const dealId = "test-stage-history-deal";
const actionDealId = "test-stage-history-action-deal";
const userId = "test-stage-history-user";

describe("opportunity stage history service", () => {
  beforeEach(async () => {
    await cleanupStageHistory();
    await prisma.user.create({
      data: {
        id: userId,
        name: "Stage History User",
        email: `${userId}@example.test`
      }
    });
  });

  afterEach(async () => {
    await cleanupStageHistory();
  });

  it("records and lists stage changes", async () => {
    await createDeal(dealId, "new", userId);

    const history = await recordOpportunityStageChange({
      dealId,
      fromStage: "new",
      toStage: "qualified",
      changedAt: new Date("2026-05-16T12:00:00Z"),
      changedByUserId: userId
    });
    const rows = await listOpportunityStageHistory(dealId);

    expect(history.fromStage).toBe("new");
    expect(history.toStage).toBe("qualified");
    expect(history.changedByUserId).toBe(userId);
    expect(rows.map((row) => row.id)).toEqual([history.id]);
  });

  it("does not record when the stage is unchanged", async () => {
    await createDeal(dealId, "new", userId);

    const history = await recordOpportunityStageChangeIfChanged({
      dealId,
      fromStage: "new",
      toStage: "new"
    });
    const rows = await listOpportunityStageHistory(dealId);

    expect(history).toBeNull();
    expect(rows).toHaveLength(0);
  });

  it("records history from moveDealAction without changing existing behavior", async () => {
    await createDeal(actionDealId, "new", userId);

    const result = await moveDealAction({
      dealId: actionDealId,
      stage: "proposal"
    });
    const deal = await prisma.deal.findUniqueOrThrow({
      where: {
        id: actionDealId
      }
    });
    const rows = await listOpportunityStageHistory(actionDealId);
    const activityCount = await prisma.activity.count({
      where: {
        dealId: actionDealId,
        type: "status_change"
      }
    });

    expect(result).toEqual({
      ok: true,
      message: "Deal moved to Proposal."
    });
    expect(deal.stage).toBe("proposal");
    expect(deal.probability).toBe(50);
    expect(activityCount).toBe(1);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.fromStage).toBe("new");
    expect(rows[0]?.toStage).toBe("proposal");
  });
});

async function createDeal(id: string, stage: string, ownerId: string) {
  await prisma.deal.create({
    data: {
      id,
      ownerId,
      name: `${id} deal`,
      stage,
      value: 10000,
      probability: 10
    }
  });
}

async function cleanupStageHistory() {
  await prisma.opportunityStageHistory.deleteMany({
    where: {
      dealId: {
        in: [dealId, actionDealId]
      }
    }
  });
  await prisma.activity.deleteMany({
    where: {
      dealId: {
        in: [dealId, actionDealId]
      }
    }
  });
  await prisma.deal.deleteMany({
    where: {
      id: {
        in: [dealId, actionDealId]
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: userId
    }
  });
}
