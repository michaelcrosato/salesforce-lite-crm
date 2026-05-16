import type {
  Account,
  Activity,
  Area,
  Campaign,
  Case,
  Contact,
  DealerOrder,
  Lead,
  Prisma,
  Task
} from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Note, Opportunity } from "@/lib/crm/registry";
import {
  accountCreateSchema,
  accountUpdateSchema,
  activityCreateSchema,
  activityUpdateSchema,
  areaCreateSchema,
  areaUpdateSchema,
  campaignCreateSchema,
  campaignUpdateSchema,
  caseCreateSchema,
  caseUpdateSchema,
  contactCreateSchema,
  contactUpdateSchema,
  dealerOrderCreateSchema,
  dealerOrderUpdateSchema,
  idSchema,
  leadCreateSchema,
  leadUpdateSchema,
  noteCreateSchema,
  noteUpdateSchema,
  opportunityCreateSchema,
  opportunityUpdateSchema,
  taskCreateSchema,
  taskUpdateSchema
} from "@/lib/validation";

export type AccountListOptions = Pick<Prisma.AccountFindManyArgs, "where" | "orderBy" | "skip" | "take">;
export type ContactListOptions = Pick<Prisma.ContactFindManyArgs, "where" | "orderBy" | "skip" | "take">;
export type OpportunityListOptions = Pick<Prisma.DealFindManyArgs, "where" | "orderBy" | "skip" | "take">;
export type LeadListOptions = Pick<Prisma.LeadFindManyArgs, "where" | "orderBy" | "skip" | "take">;
export type ActivityListOptions = Pick<Prisma.ActivityFindManyArgs, "where" | "orderBy" | "skip" | "take">;
export type DealerOrderListOptions = Pick<Prisma.DealerOrderFindManyArgs, "where" | "orderBy" | "skip" | "take">;
export type AreaListOptions = Pick<Prisma.AreaFindManyArgs, "where" | "orderBy" | "skip" | "take">;
export type TaskListOptions = Pick<Prisma.TaskFindManyArgs, "where" | "orderBy" | "skip" | "take">;
export type CaseListOptions = Pick<Prisma.CaseFindManyArgs, "where" | "orderBy" | "skip" | "take">;
export type CampaignListOptions = Pick<Prisma.CampaignFindManyArgs, "where" | "orderBy" | "skip" | "take">;

export type AccountCreateInput = z.input<typeof accountCreateSchema>;
export type AccountUpdateInput = z.input<typeof accountUpdateSchema>;
export type ContactCreateInput = z.input<typeof contactCreateSchema>;
export type ContactUpdateInput = z.input<typeof contactUpdateSchema>;
export type OpportunityCreateInput = z.input<typeof opportunityCreateSchema>;
export type OpportunityUpdateInput = z.input<typeof opportunityUpdateSchema>;
export type LeadCreateInput = z.input<typeof leadCreateSchema>;
export type LeadUpdateInput = z.input<typeof leadUpdateSchema>;
export type ActivityCreateInput = z.input<typeof activityCreateSchema>;
export type ActivityUpdateInput = z.input<typeof activityUpdateSchema>;
export type NoteCreateInput = z.input<typeof noteCreateSchema>;
export type NoteUpdateInput = z.input<typeof noteUpdateSchema>;
export type DealerOrderCreateInput = z.input<typeof dealerOrderCreateSchema>;
export type DealerOrderUpdateInput = z.input<typeof dealerOrderUpdateSchema>;
export type AreaCreateInput = z.input<typeof areaCreateSchema>;
export type AreaUpdateInput = z.input<typeof areaUpdateSchema>;
export type TaskCreateInput = z.input<typeof taskCreateSchema>;
export type TaskUpdateInput = z.input<typeof taskUpdateSchema>;
export type CaseCreateInput = z.input<typeof caseCreateSchema>;
export type CaseUpdateInput = z.input<typeof caseUpdateSchema>;
export type CampaignCreateInput = z.input<typeof campaignCreateSchema>;
export type CampaignUpdateInput = z.input<typeof campaignUpdateSchema>;

function parseId(id: string): string {
  return idSchema.parse(id);
}

function toNote(activity: Activity): Note {
  if (activity.type !== "note") {
    throw new Error("Activity is not a note.");
  }

  return { ...activity, type: "note" };
}

export async function listAccounts(opts: AccountListOptions = {}): Promise<Account[]> {
  return prisma.account.findMany(opts);
}

export async function getAccount(id: string): Promise<Account | null> {
  return prisma.account.findUnique({ where: { id: parseId(id) } });
}

export async function createAccount(input: AccountCreateInput): Promise<Account> {
  const data: Prisma.AccountUncheckedCreateInput = accountCreateSchema.parse(input);
  return prisma.account.create({ data });
}

export async function updateAccount(id: string, input: AccountUpdateInput): Promise<Account> {
  const data: Prisma.AccountUncheckedUpdateInput = accountUpdateSchema.parse(input);
  return prisma.account.update({ where: { id: parseId(id) }, data });
}

export async function deleteAccount(id: string): Promise<Account> {
  return prisma.account.delete({ where: { id: parseId(id) } });
}

export async function listContacts(opts: ContactListOptions = {}): Promise<Contact[]> {
  return prisma.contact.findMany(opts);
}

export async function getContact(id: string): Promise<Contact | null> {
  return prisma.contact.findUnique({ where: { id: parseId(id) } });
}

export async function createContact(input: ContactCreateInput): Promise<Contact> {
  const data: Prisma.ContactUncheckedCreateInput = contactCreateSchema.parse(input);
  return prisma.contact.create({ data });
}

export async function updateContact(id: string, input: ContactUpdateInput): Promise<Contact> {
  const data: Prisma.ContactUncheckedUpdateInput = contactUpdateSchema.parse(input);
  return prisma.contact.update({ where: { id: parseId(id) }, data });
}

export async function deleteContact(id: string): Promise<Contact> {
  return prisma.contact.delete({ where: { id: parseId(id) } });
}

export async function listOpportunities(opts: OpportunityListOptions = {}): Promise<Opportunity[]> {
  return prisma.deal.findMany(opts);
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  return prisma.deal.findUnique({ where: { id: parseId(id) } });
}

export async function createOpportunity(input: OpportunityCreateInput): Promise<Opportunity> {
  const data: Prisma.DealUncheckedCreateInput = opportunityCreateSchema.parse(input);
  return prisma.deal.create({ data });
}

export async function updateOpportunity(id: string, input: OpportunityUpdateInput): Promise<Opportunity> {
  const data: Prisma.DealUncheckedUpdateInput = opportunityUpdateSchema.parse(input);
  return prisma.deal.update({ where: { id: parseId(id) }, data });
}

export async function deleteOpportunity(id: string): Promise<Opportunity> {
  return prisma.deal.delete({ where: { id: parseId(id) } });
}

export async function listLeads(opts: LeadListOptions = {}): Promise<Lead[]> {
  return prisma.lead.findMany(opts);
}

export async function getLead(id: string): Promise<Lead | null> {
  return prisma.lead.findUnique({ where: { id: parseId(id) } });
}

export async function createLead(input: LeadCreateInput): Promise<Lead> {
  const data: Prisma.LeadUncheckedCreateInput = leadCreateSchema.parse(input);
  return prisma.lead.create({ data });
}

export async function updateLead(id: string, input: LeadUpdateInput): Promise<Lead> {
  const data: Prisma.LeadUncheckedUpdateInput = leadUpdateSchema.parse(input);
  return prisma.lead.update({ where: { id: parseId(id) }, data });
}

export async function deleteLead(id: string): Promise<Lead> {
  return prisma.lead.delete({ where: { id: parseId(id) } });
}

export async function listActivities(opts: ActivityListOptions = {}): Promise<Activity[]> {
  return prisma.activity.findMany(opts);
}

export async function getActivity(id: string): Promise<Activity | null> {
  return prisma.activity.findUnique({ where: { id: parseId(id) } });
}

export async function createActivity(input: ActivityCreateInput): Promise<Activity> {
  const data: Prisma.ActivityUncheckedCreateInput = activityCreateSchema.parse(input);
  return prisma.activity.create({ data });
}

export async function updateActivity(id: string, input: ActivityUpdateInput): Promise<Activity> {
  const data: Prisma.ActivityUncheckedUpdateInput = activityUpdateSchema.parse(input);
  return prisma.activity.update({ where: { id: parseId(id) }, data });
}

export async function deleteActivity(id: string): Promise<Activity> {
  return prisma.activity.delete({ where: { id: parseId(id) } });
}

export async function listNotes(opts: ActivityListOptions = {}): Promise<Note[]> {
  const where: Prisma.ActivityWhereInput = { ...opts.where, type: "note" };
  const activities = await prisma.activity.findMany({ ...opts, where });
  return activities.map(toNote);
}

export async function getNote(id: string): Promise<Note | null> {
  const activity = await prisma.activity.findFirst({
    where: { id: parseId(id), type: "note" }
  });

  return activity ? toNote(activity) : null;
}

export async function createNote(input: NoteCreateInput): Promise<Note> {
  const parsed = noteCreateSchema.parse(input);
  const data: Prisma.ActivityUncheckedCreateInput = { ...parsed, type: "note" };
  return toNote(await prisma.activity.create({ data }));
}

export async function updateNote(id: string, input: NoteUpdateInput): Promise<Note | null> {
  const note = await getNote(id);

  if (!note) {
    return null;
  }

  const parsed = noteUpdateSchema.parse(input);
  const data: Prisma.ActivityUncheckedUpdateInput = { ...parsed, type: "note" };
  return toNote(await prisma.activity.update({ where: { id: note.id }, data }));
}

export async function deleteNote(id: string): Promise<Note | null> {
  const note = await getNote(id);

  if (!note) {
    return null;
  }

  return toNote(await prisma.activity.delete({ where: { id: note.id } }));
}

export async function listDealerOrders(opts: DealerOrderListOptions = {}): Promise<DealerOrder[]> {
  return prisma.dealerOrder.findMany(opts);
}

export async function getDealerOrder(id: string): Promise<DealerOrder | null> {
  return prisma.dealerOrder.findUnique({ where: { id: parseId(id) } });
}

export async function createDealerOrder(input: DealerOrderCreateInput): Promise<DealerOrder> {
  const data: Prisma.DealerOrderUncheckedCreateInput = dealerOrderCreateSchema.parse(input);
  return prisma.dealerOrder.create({ data });
}

export async function updateDealerOrder(id: string, input: DealerOrderUpdateInput): Promise<DealerOrder> {
  const data: Prisma.DealerOrderUncheckedUpdateInput = dealerOrderUpdateSchema.parse(input);
  return prisma.dealerOrder.update({ where: { id: parseId(id) }, data });
}

export async function deleteDealerOrder(id: string): Promise<DealerOrder> {
  return prisma.dealerOrder.delete({ where: { id: parseId(id) } });
}

export async function listAreas(opts: AreaListOptions = {}): Promise<Area[]> {
  return prisma.area.findMany(opts);
}

export async function getArea(id: string): Promise<Area | null> {
  return prisma.area.findUnique({ where: { id: parseId(id) } });
}

export async function createArea(input: AreaCreateInput): Promise<Area> {
  const data: Prisma.AreaUncheckedCreateInput = areaCreateSchema.parse(input);
  return prisma.area.create({ data });
}

export async function updateArea(id: string, input: AreaUpdateInput): Promise<Area> {
  const data: Prisma.AreaUncheckedUpdateInput = areaUpdateSchema.parse(input);
  return prisma.area.update({ where: { id: parseId(id) }, data });
}

export async function deleteArea(id: string): Promise<Area> {
  return prisma.area.delete({ where: { id: parseId(id) } });
}

export async function listTasks(opts: TaskListOptions = {}): Promise<Task[]> {
  return prisma.task.findMany(opts);
}

export async function getTask(id: string): Promise<Task | null> {
  return prisma.task.findUnique({ where: { id: parseId(id) } });
}

export async function createTask(input: TaskCreateInput): Promise<Task> {
  const data: Prisma.TaskUncheckedCreateInput = taskCreateSchema.parse(input);
  return prisma.task.create({ data });
}

export async function updateTask(id: string, input: TaskUpdateInput): Promise<Task> {
  const data: Prisma.TaskUncheckedUpdateInput = taskUpdateSchema.parse(input);
  return prisma.task.update({ where: { id: parseId(id) }, data });
}

export async function deleteTask(id: string): Promise<Task> {
  return prisma.task.delete({ where: { id: parseId(id) } });
}

export async function listCases(opts: CaseListOptions = {}): Promise<Case[]> {
  return prisma.case.findMany(opts);
}

export async function getCase(id: string): Promise<Case | null> {
  return prisma.case.findUnique({ where: { id: parseId(id) } });
}

export async function createCase(input: CaseCreateInput): Promise<Case> {
  const data: Prisma.CaseUncheckedCreateInput = caseCreateSchema.parse(input);
  return prisma.case.create({ data });
}

export async function updateCase(id: string, input: CaseUpdateInput): Promise<Case> {
  const data: Prisma.CaseUncheckedUpdateInput = caseUpdateSchema.parse(input);
  return prisma.case.update({ where: { id: parseId(id) }, data });
}

export async function deleteCase(id: string): Promise<Case> {
  return prisma.case.delete({ where: { id: parseId(id) } });
}

export async function listCampaigns(opts: CampaignListOptions = {}): Promise<Campaign[]> {
  return prisma.campaign.findMany(opts);
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  return prisma.campaign.findUnique({ where: { id: parseId(id) } });
}

export async function createCampaign(input: CampaignCreateInput): Promise<Campaign> {
  const { contactIds, leadIds, ownerId, ...parsed } = campaignCreateSchema.parse(input);
  const data: Prisma.CampaignCreateInput = {
    ...parsed,
    owner: ownerId ? { connect: { id: ownerId } } : undefined,
    leads: leadIds ? { connect: leadIds.map((id) => ({ id })) } : undefined,
    contacts: contactIds ? { connect: contactIds.map((id) => ({ id })) } : undefined
  };

  return prisma.campaign.create({ data });
}

export async function updateCampaign(id: string, input: CampaignUpdateInput): Promise<Campaign> {
  const { contactIds, leadIds, ownerId, ...parsed } = campaignUpdateSchema.parse(input);
  const data: Prisma.CampaignUpdateInput = {
    ...parsed,
    owner: ownerId ? { connect: { id: ownerId } } : undefined,
    leads: leadIds ? { set: leadIds.map((leadId) => ({ id: leadId })) } : undefined,
    contacts: contactIds ? { set: contactIds.map((contactId) => ({ id: contactId })) } : undefined
  };

  return prisma.campaign.update({ where: { id: parseId(id) }, data });
}

export async function deleteCampaign(id: string): Promise<Campaign> {
  return prisma.campaign.delete({ where: { id: parseId(id) } });
}
