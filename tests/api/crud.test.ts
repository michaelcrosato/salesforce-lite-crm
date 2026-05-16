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
  deleteAccount,
  deleteActivity,
  deleteCampaign,
  deleteCase,
  deleteContact,
  deleteLead,
  deleteOpportunity,
  deleteTask,
  getAccount,
  getActivity,
  getCampaign,
  getCase,
  getContact,
  getLead,
  getOpportunity,
  getTask,
  updateAccount,
  updateActivity,
  updateCampaign,
  updateCase,
  updateContact,
  updateLead,
  updateOpportunity,
  updateTask
} from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";

const ids = {
  account: "test-crud-account",
  contact: "test-crud-contact",
  opportunity: "test-crud-opportunity",
  lead: "test-crud-lead",
  activity: "test-crud-activity",
  task: "test-crud-task",
  case: "test-crud-case",
  campaign: "test-crud-campaign"
};

describe("crmClient CRUD smoke tests", () => {
  beforeEach(async () => {
    await cleanupCrudFixtures();
  });

  afterEach(async () => {
    await cleanupCrudFixtures();
  });

  it("creates, reads, updates, and deletes an account", async () => {
    const account = await createAccount({
      name: "CRUD Account",
      status: "active",
      healthScore: 80
    });
    await prisma.account.update({
      where: {
        id: account.id
      },
      data: {
        id: ids.account
      }
    });

    await updateAccount(ids.account, {
      name: "CRUD Account Updated",
      status: "paused",
      healthScore: 70
    });
    const updated = await getAccount(ids.account);

    expect(updated?.name).toBe("CRUD Account Updated");
    await deleteAccount(ids.account);
    expect(await getAccount(ids.account)).toBeNull();
  });

  it("creates, reads, updates, and deletes a contact", async () => {
    const contact = await createContact({
      firstName: "CRUD",
      lastName: "Contact",
      email: "crud.contact@example.test",
      status: "active"
    });
    await prisma.contact.update({
      where: {
        id: contact.id
      },
      data: {
        id: ids.contact
      }
    });

    await updateContact(ids.contact, {
      firstName: "Updated",
      status: "inactive"
    });
    const updated = await getContact(ids.contact);

    expect(updated?.firstName).toBe("Updated");
    await deleteContact(ids.contact);
    expect(await getContact(ids.contact)).toBeNull();
  });

  it("creates, reads, updates, and deletes an opportunity", async () => {
    const opportunity = await createOpportunity({
      name: "CRUD Opportunity",
      stage: "new",
      value: 10000,
      probability: 10
    });
    await prisma.deal.update({
      where: {
        id: opportunity.id
      },
      data: {
        id: ids.opportunity
      }
    });

    await updateOpportunity(ids.opportunity, {
      name: "CRUD Opportunity Updated",
      stage: "qualified",
      value: 12000,
      probability: 25
    });
    const updated = await getOpportunity(ids.opportunity);

    expect(updated?.stage).toBe("qualified");
    await deleteOpportunity(ids.opportunity);
    expect(await getOpportunity(ids.opportunity)).toBeNull();
  });

  it("creates, reads, updates, and deletes a lead", async () => {
    const lead = await createLead({
      firstName: "CRUD",
      lastName: "Lead",
      email: "crud.lead@example.test"
    });
    await prisma.lead.update({
      where: {
        id: lead.id
      },
      data: {
        id: ids.lead
      }
    });

    await updateLead(ids.lead, {
      status: "contacted",
      source: "crud"
    });
    const updated = await getLead(ids.lead);

    expect(updated?.status).toBe("contacted");
    await deleteLead(ids.lead);
    expect(await getLead(ids.lead)).toBeNull();
  });

  it("creates, reads, updates, and deletes an activity", async () => {
    const activity = await createActivity({
      title: "CRUD Activity",
      type: "call"
    });
    await prisma.activity.update({
      where: {
        id: activity.id
      },
      data: {
        id: ids.activity
      }
    });

    await updateActivity(ids.activity, {
      title: "CRUD Activity Updated",
      summary: "Updated summary."
    });
    const updated = await getActivity(ids.activity);

    expect(updated?.summary).toBe("Updated summary.");
    await deleteActivity(ids.activity);
    expect(await getActivity(ids.activity)).toBeNull();
  });

  it("creates, reads, updates, and deletes a task", async () => {
    const task = await createTask({
      title: "CRUD Task"
    });
    await prisma.task.update({
      where: {
        id: task.id
      },
      data: {
        id: ids.task
      }
    });

    await updateTask(ids.task, {
      title: "CRUD Task Updated",
      status: "in_progress"
    });
    const updated = await getTask(ids.task);

    expect(updated?.status).toBe("in_progress");
    await deleteTask(ids.task);
    expect(await getTask(ids.task)).toBeNull();
  });

  it("creates, reads, updates, and deletes a case", async () => {
    const crmCase = await createCase({
      subject: "CRUD Case"
    });
    await prisma.case.update({
      where: {
        id: crmCase.id
      },
      data: {
        id: ids.case
      }
    });

    await updateCase(ids.case, {
      subject: "CRUD Case Updated",
      status: "waiting"
    });
    const updated = await getCase(ids.case);

    expect(updated?.status).toBe("waiting");
    await deleteCase(ids.case);
    expect(await getCase(ids.case)).toBeNull();
  });

  it("creates, reads, updates, and deletes a campaign", async () => {
    const campaign = await createCampaign({
      name: "CRUD Campaign"
    });
    await prisma.campaign.update({
      where: {
        id: campaign.id
      },
      data: {
        id: ids.campaign
      }
    });

    await updateCampaign(ids.campaign, {
      name: "CRUD Campaign Updated",
      status: "active"
    });
    const updated = await getCampaign(ids.campaign);

    expect(updated?.status).toBe("active");
    await deleteCampaign(ids.campaign);
    expect(await getCampaign(ids.campaign)).toBeNull();
  });
});

async function cleanupCrudFixtures() {
  await prisma.opportunityStageHistory.deleteMany({
    where: {
      dealId: ids.opportunity
    }
  });
  await prisma.activity.deleteMany({
    where: {
      OR: [
        {
          id: ids.activity
        },
        {
          title: "CRUD Activity"
        },
        {
          dealId: ids.opportunity
        }
      ]
    }
  });
  await prisma.campaign.deleteMany({
    where: {
      OR: [
        {
          id: ids.campaign
        },
        {
          name: "CRUD Campaign"
        }
      ]
    }
  });
  await prisma.case.deleteMany({
    where: {
      OR: [
        {
          id: ids.case
        },
        {
          subject: "CRUD Case"
        }
      ]
    }
  });
  await prisma.task.deleteMany({
    where: {
      OR: [
        {
          id: ids.task
        },
        {
          title: "CRUD Task"
        }
      ]
    }
  });
  await prisma.lead.deleteMany({
    where: {
      OR: [
        {
          id: ids.lead
        },
        {
          email: "crud.lead@example.test"
        }
      ]
    }
  });
  await prisma.deal.deleteMany({
    where: {
      OR: [
        {
          id: ids.opportunity
        },
        {
          name: "CRUD Opportunity"
        }
      ]
    }
  });
  await prisma.contact.deleteMany({
    where: {
      OR: [
        {
          id: ids.contact
        },
        {
          email: "crud.contact@example.test"
        }
      ]
    }
  });
  await prisma.account.deleteMany({
    where: {
      OR: [
        {
          id: ids.account
        },
        {
          name: "CRUD Account"
        }
      ]
    }
  });
}
