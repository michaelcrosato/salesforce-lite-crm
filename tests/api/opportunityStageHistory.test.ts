import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { moveDealAction, updateDealAction } from "@/app/deals/actions";
import { updateOpportunity } from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";
import {
  listOpportunityStageHistory,
  recordOpportunityStageChange,
  recordOpportunityStageChangeIfChanged
} from "@/lib/services/opportunityStageHistory";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn()
}));

const dealId = "test-stage-history-deal";
const actionDealId = "test-stage-history-action-deal";
const editActionDealId = "test-stage-history-edit-action-deal";
const adapterDealId = "test-stage-history-adapter-deal";
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

  it("records history from the deal edit form action when the stage changes", async () => {
    await createDeal(editActionDealId, "new", userId);

    const result = await updateDealAction(
      editActionDealId,
      formData({
        accountId: "",
        contactId: "",
        ownerId: userId,
        name: "Edited action deal",
        stage: "qualified",
        value: "10000",
        probability: "25",
        expectedCloseDate: ""
      })
    );
    const rows = await listOpportunityStageHistory(editActionDealId);

    expect(result.ok).toBe(true);
    expect(rows).toHaveLength(1);
    expect(rows[0]?.fromStage).toBe("new");
    expect(rows[0]?.toStage).toBe("qualified");
    expect(rows[0]?.changedByUserId).toBe(userId);
  });

  it("records history from the crmClient opportunity adapter when the stage changes", async () => {
    await createDeal(adapterDealId, "new", userId);

    await updateOpportunity(adapterDealId, {
      stage: "negotiation"
    });
    const rows = await listOpportunityStageHistory(adapterDealId);

    expect(rows).toHaveLength(1);
    expect(rows[0]?.fromStage).toBe("new");
    expect(rows[0]?.toStage).toBe("negotiation");
    expect(rows[0]?.changedByUserId).toBe(userId);
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
        in: [dealId, actionDealId, editActionDealId, adapterDealId]
      }
    }
  });
  await prisma.activity.deleteMany({
    where: {
      dealId: {
        in: [dealId, actionDealId, editActionDealId, adapterDealId]
      }
    }
  });
  await prisma.deal.deleteMany({
    where: {
      id: {
        in: [dealId, actionDealId, editActionDealId, adapterDealId]
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: userId
    }
  });
}

function formData(values: Record<string, string>) {
  const form = new FormData();

  for (const [key, value] of Object.entries(values)) {
    form.set(key, value);
  }

  return form;
}
