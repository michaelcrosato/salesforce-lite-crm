import { afterEach, beforeEach, describe, expect, it } from "vitest";
import {
  createAccount,
  createActivity,
  createCampaign,
  createCase,
  createContact,
  createLead,
  createOpportunity,
  createTask,
  listAccounts,
  listActivities,
  listCampaigns,
  listCases,
  listContacts,
  listLeads,
  listOpportunities,
  listTasks
} from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";

describe("crmClient list functions", () => {
  beforeEach(async () => {
    await cleanupListFixtures();
    await createListFixtures();
  });

  afterEach(async () => {
    await cleanupListFixtures();
  });

  it("lists accounts with search and status filter", async () => {
    const results = await listAccounts({
      filters: { search: "ListMatch", status: "active" }
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.name).toBe("ListMatch Account");
  });

  it("lists contacts with search and account filter", async () => {
    const accounts = await listAccounts({ filters: { search: "ListMatch" } });
    const results = await listContacts({
      filters: { search: "ListMatch", accountId: accounts[0]!.id }
    });
    expect(results).toHaveLength(1);
    expect(results[0]!.firstName).toBe("ListMatch");
  });

  it("lists opportunities with stage filter", async () => {
    const results = await listOpportunities({
      filters: { stage: "proposal" }
    });
    expect(results.some(o => o.name === "ListMatch Opportunity")).toBe(true);
  });

  it("lists leads with search filter", async () => {
    const results = await listLeads({
      filters: { search: "list-test" }
    });
    expect(results.some(l => l.firstName === "ListMatch")).toBe(true);
  });

  it("lists activities with type filter", async () => {
    const results = await listActivities({
      filters: { type: "call" }
    });
    expect(results.some(a => a.title === "ListMatch Activity")).toBe(true);
  });

  it("lists tasks with status filter", async () => {
    const results = await listTasks({
      filters: { status: "open" }
    });
    expect(results.some(t => t.title === "ListMatch Task")).toBe(true);
  });

  it("lists cases with status filter", async () => {
    const results = await listCases({
      filters: { status: "new" }
    });
    expect(results.some(c => c.subject === "ListMatch Case")).toBe(true);
  });

  it("lists campaigns with status filter", async () => {
    const results = await listCampaigns({
      filters: { status: "planned" }
    });
    expect(results.some(c => c.name === "ListMatch Campaign")).toBe(true);
  });
});

async function createListFixtures() {
  const account = await createAccount({
    name: "ListMatch Account",
    status: "active",
    healthScore: 100
  });
  await createContact({
    firstName: "ListMatch",
    lastName: "Contact",
    accountId: account.id,
    status: "active"
  });
  await createOpportunity({
    name: "ListMatch Opportunity",
    stage: "proposal",
    value: 50000,
    probability: 50
  });
  await createLead({
    firstName: "ListMatch",
    lastName: "Lead",
    source: "list-test"
  });
  await createActivity({
    title: "ListMatch Activity",
    type: "call"
  });
  await createTask({
    title: "ListMatch Task",
    priority: "high",
    status: "open"
  });
  await createCase({
    subject: "ListMatch Case",
    status: "new"
  });
  await createCampaign({
    name: "ListMatch Campaign",
    status: "planned"
  });
}

async function cleanupListFixtures() {
  await prisma.opportunityStageHistory.deleteMany({
    where: { deal: { name: "ListMatch Opportunity" } }
  });
  await prisma.activity.deleteMany({
    where: { OR: [
      { title: "ListMatch Activity" },
      { deal: { name: "ListMatch Opportunity" } },
      { title: { startsWith: "Task completed: ListMatch" } }
    ]}
  });
  await prisma.campaign.deleteMany({
    where: { name: "ListMatch Campaign" }
  });
  await prisma.case.deleteMany({
    where: { subject: "ListMatch Case" }
  });
  await prisma.task.deleteMany({
    where: { title: "ListMatch Task" }
  });
  await prisma.lead.deleteMany({
    where: { firstName: "ListMatch" }
  });
  await prisma.deal.deleteMany({
    where: { name: "ListMatch Opportunity" }
  });
  await prisma.contact.deleteMany({
    where: { firstName: "ListMatch" }
  });
  await prisma.account.deleteMany({
    where: { name: "ListMatch Account" }
  });
}
