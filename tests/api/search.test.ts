import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { globalSearch } from "@/lib/services/search";

const ids = {
  account: "test-search-account",
  caseFoldAccount: "test-search-case-fold-account",
  contact: "test-search-contact",
  opportunity: "test-search-opportunity",
  lead: "test-search-lead",
  task: "test-search-task",
  soloTask: "test-search-solo-task",
  case: "test-search-case",
  campaign: "test-search-campaign"
};

describe("global search service", () => {
  beforeEach(async () => {
    await cleanupSearchFixtures();
  });

  afterEach(async () => {
    await cleanupSearchFixtures();
  });

  it("returns empty arrays for an empty query", async () => {
    await expect(globalSearch("  ")).resolves.toEqual({
      accounts: [],
      contacts: [],
      opportunities: [],
      leads: [],
      tasks: [],
      cases: [],
      campaigns: []
    });
  });

  it("returns a single-entity match", async () => {
    await prisma.task.create({
      data: {
        id: ids.soloTask,
        title: "SoloTaskNeedle follow-up",
        status: "open",
        priority: "normal"
      }
    });

    const results = await globalSearch("solotaskneedle");

    expect(results.tasks).toEqual([
      {
        id: ids.soloTask,
        label: "SoloTaskNeedle follow-up",
        route: `/tasks?task=${ids.soloTask}`
      }
    ]);
    expect(results.accounts).toHaveLength(0);
    expect(results.opportunities).toHaveLength(0);
  });

  it("matches mixed-case terms regardless of query casing", async () => {
    await prisma.account.create({
      data: {
        id: ids.caseFoldAccount,
        name: "Acme Insulation Co",
        status: "active",
        healthScore: 70
      }
    });

    const expected = {
      id: ids.caseFoldAccount,
      label: "Acme Insulation Co",
      route: `/accounts/${ids.caseFoldAccount}`
    };

    for (const term of ["ACME", "acme", "AcMe"]) {
      const results = await globalSearch(term);
      expect(results.accounts).toContainEqual(expected);
    }
  });

  it("returns cross-entity matches with route-safe result links", async () => {
    await createCrossEntitySearchFixtures();

    const results = await globalSearch("omnifind");

    expect(results.accounts).toContainEqual({
      id: ids.account,
      label: "OmniFind Account",
      route: `/accounts/${ids.account}`
    });
    expect(results.contacts).toContainEqual({
      id: ids.contact,
      label: "OmniFind Contact",
      route: `/contacts/${ids.contact}`
    });
    expect(results.opportunities).toContainEqual({
      id: ids.opportunity,
      label: "OmniFind Opportunity",
      route: `/deals?deal=${ids.opportunity}`
    });
    expect(results.leads).toContainEqual({
      id: ids.lead,
      label: "OmniFind Lead",
      route: `/leads/${ids.lead}`
    });
    expect(results.tasks).toContainEqual({
      id: ids.task,
      label: "OmniFind Task",
      route: `/tasks?task=${ids.task}`
    });
    expect(results.cases).toContainEqual({
      id: ids.case,
      label: "OmniFind Case",
      route: `/cases?case=${ids.case}`
    });
    expect(results.campaigns).toContainEqual({
      id: ids.campaign,
      label: "OmniFind Campaign",
      route: `/campaigns?campaign=${ids.campaign}`
    });
  });
});

async function createCrossEntitySearchFixtures() {
  await prisma.account.create({
    data: {
      id: ids.account,
      name: "OmniFind Account",
      status: "active",
      healthScore: 80
    }
  });
  await prisma.contact.create({
    data: {
      id: ids.contact,
      firstName: "OmniFind",
      lastName: "Contact",
      email: "omnifind.contact@example.test",
      status: "active"
    }
  });
  await prisma.deal.create({
    data: {
      id: ids.opportunity,
      name: "OmniFind Opportunity",
      stage: "new",
      value: 10000,
      probability: 10
    }
  });
  await prisma.lead.create({
    data: {
      id: ids.lead,
      firstName: "OmniFind",
      lastName: "Lead",
      email: "omnifind.lead@example.test",
      status: "new"
    }
  });
  await prisma.task.create({
    data: {
      id: ids.task,
      title: "OmniFind Task",
      status: "open",
      priority: "normal"
    }
  });
  await prisma.case.create({
    data: {
      id: ids.case,
      subject: "OmniFind Case",
      status: "new",
      priority: "normal"
    }
  });
  await prisma.campaign.create({
    data: {
      id: ids.campaign,
      name: "OmniFind Campaign",
      status: "planned"
    }
  });
}

async function cleanupSearchFixtures() {
  await prisma.opportunityStageHistory.deleteMany({
    where: {
      dealId: ids.opportunity
    }
  });
  await prisma.activity.deleteMany({
    where: {
      dealId: ids.opportunity
    }
  });
  await prisma.campaign.deleteMany({
    where: {
      id: ids.campaign
    }
  });
  await prisma.case.deleteMany({
    where: {
      id: ids.case
    }
  });
  await prisma.task.deleteMany({
    where: {
      id: {
        in: [ids.task, ids.soloTask]
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: ids.lead
    }
  });
  await prisma.deal.deleteMany({
    where: {
      id: ids.opportunity
    }
  });
  await prisma.contact.deleteMany({
    where: {
      id: ids.contact
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: {
        in: [ids.account, ids.caseFoldAccount]
      }
    }
  });
}
