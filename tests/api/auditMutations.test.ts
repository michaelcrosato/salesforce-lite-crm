import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { prisma } from "@/lib/prisma";
import { createAccountAction, updateAccountAction } from "@/app/accounts/actions";
import { createContactAction, updateContactAction } from "@/app/contacts/actions";
import { createDealAction, moveDealAction } from "@/app/deals/actions";
import { createLeadAction, updateLeadStatusAction } from "@/app/leads/actions";
import { createCampaignAction, deleteCampaignAction, updateCampaignStatusAction } from "@/app/campaigns/actions";
import { createCaseAction, deleteCaseAction, updateCaseStatusAction } from "@/app/cases/actions";
import { createTaskAction, deleteTaskAction, updateTaskStatusAction } from "@/app/tasks/actions";

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
  updateTag: vi.fn()
}));

const TEST_PREFIX = "audit-test-";
let testUserId: string;

describe("CRM mutating actions audit logging", () => {
  beforeEach(async () => {
    // Ensure we have a valid user to assign as owner where needed
    const user = await prisma.user.findFirst();
    if (user) {
      testUserId = user.id;
    } else {
      const created = await prisma.user.create({
        data: {
          name: "Test Audit Owner",
          email: "audit.owner@example.test",
          role: "sales"
        }
      });
      testUserId = created.id;
    }
  });

  afterEach(async () => {
    // Clean up created audit events and records
    await prisma.auditEvent.deleteMany({
      where: {
        OR: [
          { summary: { startsWith: "Account created: " + TEST_PREFIX } },
          { summary: { startsWith: "Account updated: " + TEST_PREFIX } },
          { summary: { startsWith: "Contact created: " + TEST_PREFIX } },
          { summary: { startsWith: "Contact updated: " + TEST_PREFIX } },
          { summary: { startsWith: "Opportunity created: " + TEST_PREFIX } },
          { summary: { startsWith: "Opportunity updated: " + TEST_PREFIX } },
          { summary: { startsWith: "Lead created: " + TEST_PREFIX } },
          { summary: { startsWith: "Lead updated: " + TEST_PREFIX } },
          { summary: { startsWith: "Lead status changed from" } },
          { summary: { startsWith: "Account status changed from" } },
          { summary: { startsWith: "Contact status changed from" } },
          { summary: { startsWith: "Opportunity stage changed from" } },
          { summary: { startsWith: "Campaign created: " + TEST_PREFIX } },
          { summary: { startsWith: "Campaign updated: " + TEST_PREFIX } },
          { summary: { startsWith: "Campaign completed: " + TEST_PREFIX } },
          { summary: { startsWith: "Campaign deleted: " + TEST_PREFIX } },
          { summary: { startsWith: "Case created: " + TEST_PREFIX } },
          { summary: { startsWith: "Case updated: " + TEST_PREFIX } },
          { summary: { startsWith: "Case resolved: " + TEST_PREFIX } },
          { summary: { startsWith: "Case deleted: " + TEST_PREFIX } },
          { summary: { startsWith: "Task created: " + TEST_PREFIX } },
          { summary: { startsWith: "Task updated: " + TEST_PREFIX } },
          { summary: { startsWith: "Task completed: " + TEST_PREFIX } },
          { summary: { startsWith: "Task deleted: " + TEST_PREFIX } },
          { summary: { contains: "pace gap" } },
          { summary: { contains: "was not routed" } }
        ]
      }
    });

    await prisma.deal.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } }
    });

    await prisma.contact.deleteMany({
      where: { firstName: { startsWith: TEST_PREFIX } }
    });

    await prisma.account.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } }
    });

    await prisma.lead.deleteMany({
      where: { firstName: { startsWith: TEST_PREFIX } }
    });

    await prisma.campaign.deleteMany({
      where: { name: { startsWith: TEST_PREFIX } }
    });

    await prisma.case.deleteMany({
      where: { subject: { startsWith: TEST_PREFIX } }
    });

    await prisma.task.deleteMany({
      where: { title: { startsWith: TEST_PREFIX } }
    });

    await prisma.activity.deleteMany({
      where: {
        OR: [
          { title: { contains: TEST_PREFIX } },
          { summary: { contains: TEST_PREFIX } }
        ]
      }
    });

    await prisma.opportunityStageHistory.deleteMany({
      where: {
        fromStage: { not: "" }
      }
    });
  });

  it("audits account creation and status changes", async () => {
    const createForm = new FormData();
    const accountName = `${TEST_PREFIX}Acme`;
    createForm.append("name", accountName);
    createForm.append("domain", "acme.test");
    createForm.append("industry", "Manufacturing");
    createForm.append("city", "Chicago");
    createForm.append("region", "IL");
    createForm.append("status", "active");
    createForm.append("ownerId", testUserId);
    createForm.append("healthScore", "85");

    const createRes = await createAccountAction(createForm);
    expect(createRes.ok).toBe(true);

    const account = await prisma.account.findFirstOrThrow({
      where: { name: accountName }
    });

    // Verify creation audit event
    const createEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "created",
        entityType: "account",
        entityId: account.id
      }
    });
    expect(createEvent.summary).toBe(`Account created: ${accountName}.`);
    const createMetadata = JSON.parse(createEvent.metadata || "{}");
    expect(createMetadata).toMatchObject({
      name: accountName,
      domain: "acme.test",
      industry: "Manufacturing",
      status: "active"
    });

    // Update account status to trigger status_changed audit
    const updateForm = new FormData();
    updateForm.append("name", accountName);
    updateForm.append("domain", "acme.test");
    updateForm.append("industry", "Manufacturing");
    updateForm.append("city", "Chicago");
    updateForm.append("region", "IL");
    updateForm.append("status", "paused"); // changed status
    updateForm.append("ownerId", testUserId);
    updateForm.append("healthScore", "85");

    const updateRes = await updateAccountAction(account.id, updateForm);
    expect(updateRes.ok).toBe(true);

    const updateEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "status_changed",
        entityType: "account",
        entityId: account.id
      }
    });
    expect(updateEvent.summary).toBe(`Account status changed from active to paused.`);
    const updateMetadata = JSON.parse(updateEvent.metadata || "{}");
    expect(updateMetadata).toMatchObject({
      status: "paused",
      previousStatus: "active"
    });
  });

  it("audits contact creation and updates", async () => {
    const createForm = new FormData();
    const contactFirstName = TEST_PREFIX + "John";
    createForm.append("firstName", contactFirstName);
    createForm.append("lastName", "Doe");
    createForm.append("email", "john.doe@example.test");
    createForm.append("phone", "555-0199");
    createForm.append("title", "Manager");
    createForm.append("status", "active");

    const createRes = await createContactAction(createForm);
    expect(createRes.ok).toBe(true);

    const contact = await prisma.contact.findFirstOrThrow({
      where: { firstName: contactFirstName }
    });

    // Verify contact creation audit
    const createEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "created",
        entityType: "contact",
        entityId: contact.id
      }
    });
    expect(createEvent.summary).toBe(`Contact created: ${contactFirstName} Doe.`);

    // Verify update audit
    const updateForm = new FormData();
    updateForm.append("firstName", contactFirstName);
    updateForm.append("lastName", "Smith"); // change lastName
    updateForm.append("email", "john.doe@example.test");
    updateForm.append("phone", "555-0199");
    updateForm.append("title", "VP"); // change title
    updateForm.append("status", "active");

    const updateRes = await updateContactAction(contact.id, updateForm);
    expect(updateRes.ok).toBe(true);

    const updateEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "updated",
        entityType: "contact",
        entityId: contact.id
      }
    });
    expect(updateEvent.summary).toBe(`Contact updated: ${contactFirstName} Smith.`);
  });

  it("audits deal creation, updates, and drag-and-drop stage changes", async () => {
    const createForm = new FormData();
    const dealName = `${TEST_PREFIX}BigDeal`;
    createForm.append("name", dealName);
    createForm.append("stage", "qualified");
    createForm.append("value", "100000");
    createForm.append("probability", "20");
    createForm.append("expectedCloseDate", "2026-12-31");
    createForm.append("ownerId", testUserId);

    const createRes = await createDealAction(createForm);
    expect(createRes.ok).toBe(true);

    const deal = await prisma.deal.findFirstOrThrow({
      where: { name: dealName }
    });

    // Verify creation audit (opportunity entityType)
    const createEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "created",
        entityType: "opportunity",
        entityId: deal.id
      }
    });
    expect(createEvent.summary).toBe(`Opportunity created: ${dealName}.`);

    // Verify moveDealAction stage change audit
    const moveRes = await moveDealAction({ dealId: deal.id, stage: "proposal" });
    expect(moveRes.ok).toBe(true);

    const moveEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "stage_changed",
        entityType: "opportunity",
        entityId: deal.id
      }
    });
    expect(moveEvent.summary).toBe(`Opportunity stage changed from qualified to proposal.`);
    const moveMetadata = JSON.parse(moveEvent.metadata || "{}");
    expect(moveMetadata).toMatchObject({
      stage: "proposal",
      previousStatus: "qualified"
    });
  });

  it("audits lead creation, routing, and status changes", async () => {
    const createForm = new FormData();
    const leadFirstName = TEST_PREFIX + "Lead";
    createForm.append("firstName", leadFirstName);
    createForm.append("lastName", "Test");
    createForm.append("phone", "555-0100");
    createForm.append("email", "lead@example.test");
    createForm.append("postalCode", "V6B 2T4"); // Canadian postal code
    createForm.append("province", "BC");
    createForm.append("source", "Web");

    const createRes = await createLeadAction(createForm);
    expect(createRes.ok).toBe(true);

    const lead = await prisma.lead.findFirstOrThrow({
      where: { firstName: leadFirstName }
    });

    // Verify lead creation audit
    const createEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "created",
        entityType: "lead",
        entityId: lead.id
      }
    });
    expect(createEvent.summary).toBe(`Lead created: ${leadFirstName} Test.`);

    // Verify lead routing audit event (category: routing, action: lead_routed or lead_unrouted)
    const routingEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "routing",
        action: { in: ["lead_routed", "lead_unrouted"] },
        entityType: "lead",
        entityId: lead.id
      }
    });
    expect(routingEvent.summary).toBeDefined();

    // Verify updateLeadStatusAction status changed audit
    const statusRes = await updateLeadStatusAction({
      leadId: lead.id,
      status: "closed"
    });
    expect(statusRes.ok).toBe(true);

    const statusEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "status_changed",
        entityType: "lead",
        entityId: lead.id
      }
    });
    expect(statusEvent.summary).toBe(`Lead status changed from assigned to closed.`);
  });

  it("audits campaign creation, status changes, and deletion", async () => {
    const createForm = new FormData();
    const campaignName = `${TEST_PREFIX}Marketing`;
    createForm.append("name", campaignName);
    createForm.append("description", "Marketing campaign");
    createForm.append("status", "planned");
    createForm.append("startDate", "2026-06-01");
    createForm.append("endDate", "2026-06-30");
    createForm.append("budget", "10000");
    createForm.append("ownerId", testUserId);

    const createRes = await createCampaignAction(createForm);
    expect(createRes.ok).toBe(true);

    const campaign = await prisma.campaign.findFirstOrThrow({
      where: { name: campaignName }
    });

    // Verify creation audit event
    const createEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "created",
        entityType: "campaign",
        entityId: campaign.id
      }
    });
    expect(createEvent.summary).toBe(`Campaign created: ${campaignName}.`);

    // Verify updateCampaignStatusAction to completed
    const statusRes = await updateCampaignStatusAction(campaign.id, "completed");
    expect(statusRes.ok).toBe(true);

    const statusEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "workflow",
        action: "campaign_completed",
        entityType: "campaign",
        entityId: campaign.id
      }
    });
    expect(statusEvent.summary).toBe(`Campaign completed: ${campaignName}.`);

    // Verify deletion audit event
    const deleteRes = await deleteCampaignAction(campaign.id);
    expect(deleteRes.ok).toBe(true);

    const deleteEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "deleted",
        entityType: "campaign",
        entityId: campaign.id
      }
    });
    expect(deleteEvent.summary).toBe(`Campaign deleted: ${campaignName}.`);
  });

  it("audits case creation, resolution, and deletion", async () => {
    const createForm = new FormData();
    const caseSubject = `${TEST_PREFIX}BrokenWidget`;
    createForm.append("subject", caseSubject);
    createForm.append("description", "A broken widget was delivered.");
    createForm.append("status", "new");
    createForm.append("priority", "high");
    createForm.append("ownerId", testUserId);

    const createRes = await createCaseAction(createForm);
    expect(createRes.ok).toBe(true);

    const crmCase = await prisma.case.findFirstOrThrow({
      where: { subject: caseSubject }
    });

    // Verify creation audit event
    const createEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "created",
        entityType: "case",
        entityId: crmCase.id
      }
    });
    expect(createEvent.summary).toBe(`Case created: ${caseSubject}.`);

    // Verify resolution audit event
    const resolveRes = await updateCaseStatusAction(crmCase.id, "resolved");
    expect(resolveRes.ok).toBe(true);

    const resolveEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "workflow",
        action: "case_resolved",
        entityType: "case",
        entityId: crmCase.id
      }
    });
    expect(resolveEvent.summary).toBe(`Case resolved: ${caseSubject}.`);

    // Verify deletion audit event
    const deleteRes = await deleteCaseAction(crmCase.id);
    expect(deleteRes.ok).toBe(true);

    const deleteEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "deleted",
        entityType: "case",
        entityId: crmCase.id
      }
    });
    expect(deleteEvent.summary).toBe(`Case deleted: ${caseSubject}.`);
  });

  it("audits task creation, completion, and deletion", async () => {
    const createForm = new FormData();
    const taskTitle = `${TEST_PREFIX}FollowUp`;
    createForm.append("title", taskTitle);
    createForm.append("description", "Follow up with customer.");
    createForm.append("dueDate", "2026-06-15");
    createForm.append("status", "open");
    createForm.append("priority", "normal");
    createForm.append("ownerId", testUserId);

    const createRes = await createTaskAction(createForm);
    expect(createRes.ok).toBe(true);

    const task = await prisma.task.findFirstOrThrow({
      where: { title: taskTitle }
    });

    // Verify creation audit event
    const createEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "created",
        entityType: "task",
        entityId: task.id
      }
    });
    expect(createEvent.summary).toBe(`Task created: ${taskTitle}.`);

    // Verify completion audit event
    const completeRes = await updateTaskStatusAction(task.id, "done");
    expect(completeRes.ok).toBe(true);

    const completeEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "workflow",
        action: "task_completed",
        entityType: "task",
        entityId: task.id
      }
    });
    expect(completeEvent.summary).toBe(`Task completed: ${taskTitle}.`);

    // Verify deletion audit event
    const deleteRes = await deleteTaskAction(task.id);
    expect(deleteRes.ok).toBe(true);

    const deleteEvent = await prisma.auditEvent.findFirstOrThrow({
      where: {
        category: "record",
        action: "deleted",
        entityType: "task",
        entityId: task.id
      }
    });
    expect(deleteEvent.summary).toBe(`Task deleted: ${taskTitle}.`);
  });
});
