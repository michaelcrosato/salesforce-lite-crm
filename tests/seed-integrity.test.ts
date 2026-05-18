import { describe, expect, it, beforeAll } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  TASK_STATUSES,
  TASK_PRIORITIES,
  CASE_STATUSES,
  CASE_PRIORITIES,
  CAMPAIGN_STATUSES
} from "@/lib/crm/registry";

describe("seed integrity (post-seed invariants)", () => {
  beforeAll(async () => {
    // ensure some data exists; in real CI e2e runs seed first
  });

  it("Task, Case, Campaign tables have seeded rows", async () => {
    const [taskCount, caseCount, campaignCount] = await Promise.all([
      prisma.task.count(),
      prisma.case.count(),
      prisma.campaign.count()
    ]);
    expect(taskCount).toBeGreaterThanOrEqual(40);
    expect(caseCount).toBeGreaterThanOrEqual(18);
    expect(campaignCount).toBeGreaterThanOrEqual(6);
  });

  it("no orphan Task references (accountId/contactId/dealId/leadId/ownerId)", async () => {
    const tasks = await prisma.task.findMany({
      select: { accountId: true, contactId: true, dealId: true, leadId: true, ownerId: true }
    });
    const accountIds = new Set((await prisma.account.findMany({ select: { id: true } })).map((a) => a.id));
    const contactIds = new Set((await prisma.contact.findMany({ select: { id: true } })).map((c) => c.id));
    const dealIds = new Set((await prisma.deal.findMany({ select: { id: true } })).map((d) => d.id));
    const leadIds = new Set((await prisma.lead.findMany({ select: { id: true } })).map((l) => l.id));
    const userIds = new Set((await prisma.user.findMany({ select: { id: true } })).map((u) => u.id));

    for (const t of tasks) {
      if (t.accountId) expect(accountIds.has(t.accountId)).toBe(true);
      if (t.contactId) expect(contactIds.has(t.contactId)).toBe(true);
      if (t.dealId) expect(dealIds.has(t.dealId)).toBe(true);
      if (t.leadId) expect(leadIds.has(t.leadId)).toBe(true);
      if (t.ownerId) expect(userIds.has(t.ownerId)).toBe(true);
    }
  });

  it("Task/Case/Campaign status and priority fields contain valid enum values", async () => {
    const tasks = await prisma.task.findMany({ select: { status: true, priority: true } });
    for (const t of tasks) {
      expect(TASK_STATUSES).toContain(t.status);
      expect(TASK_PRIORITIES).toContain(t.priority);
    }

    const cases = await prisma.case.findMany({ select: { status: true, priority: true } });
    for (const c of cases) {
      expect(CASE_STATUSES).toContain(c.status);
      expect(CASE_PRIORITIES).toContain(c.priority);
    }

    const campaigns = await prisma.campaign.findMany({ select: { status: true } });
    for (const c of campaigns) {
      expect(CAMPAIGN_STATUSES).toContain(c.status);
    }
  });

  it("date sanity: createdAt <= updatedAt; dueDate within 2020-2030 range where present", async () => {
    const tasks = await prisma.task.findMany({ select: { createdAt: true, updatedAt: true, dueDate: true } });
    const minDate = new Date("2020-01-01");
    const maxDate = new Date("2030-12-31");
    for (const t of tasks) {
      expect(t.createdAt.getTime()).toBeLessThanOrEqual(t.updatedAt.getTime());
      if (t.dueDate) {
        expect(t.dueDate.getTime()).toBeGreaterThanOrEqual(minDate.getTime());
        expect(t.dueDate.getTime()).toBeLessThanOrEqual(maxDate.getTime());
      }
    }

    const cases = await prisma.case.findMany({ select: { createdAt: true, updatedAt: true } });
    for (const c of cases) {
      expect(c.createdAt.getTime()).toBeLessThanOrEqual(c.updatedAt.getTime());
    }
  });

  it("no duplicate IDs across seeded entities", async () => {
    const [tasks, cases, campaigns] = await Promise.all([
      prisma.task.findMany({ select: { id: true } }),
      prisma.case.findMany({ select: { id: true } }),
      prisma.campaign.findMany({ select: { id: true } })
    ]);
    const allIds = [...tasks, ...cases, ...campaigns].map((x) => x.id);
    const unique = new Set(allIds);
    expect(unique.size).toBe(allIds.length);
  });

  it("Lead routing story preserved: routed leads have assignedOrderId + reason=routed; unrouted have reason set", async () => {
    const leads = await prisma.lead.findMany({
      select: { id: true, assignedOrderId: true, assignmentReason: true, status: true }
    });
    const routed = leads.filter((l) => l.assignmentReason === "routed");
    for (const l of routed) {
      expect(l.assignedOrderId).not.toBeNull();
    }
    const unrouted = leads.filter((l) => l.assignmentReason && l.assignmentReason !== "routed");
    for (const l of unrouted) {
      expect(["no_area_match", "no_matching_active_order", "all_orders_at_quota"]).toContain(l.assignmentReason);
      expect(l.assignedOrderId).toBeNull();
    }
    // at least some of each
    expect(routed.length).toBeGreaterThan(5);
    expect(unrouted.length).toBeGreaterThan(3);
  });
});
