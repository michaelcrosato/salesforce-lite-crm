import type {
  Account,
  Activity,
  Area,
  Campaign,
  Case,
  Contact,
  DealerOrder,
  Lead,
  OpportunityStageHistory,
  Prisma,
  Task
} from "@prisma/client";
import type { z } from "zod";
import { prisma } from "@/lib/prisma";
import type {
  AccountStatus,
  ActivityType,
  ContactStatus,
  DealerOrderStatus,
  DealStage,
  LeadStatus,
  Note,
  Opportunity
} from "@/lib/crm/registry";
import {
  completeCampaign as completeCampaignService,
  createCampaign as createCampaignService,
  deleteCampaign as deleteCampaignService,
  getCampaign as getCampaignService,
  listCampaigns as listCampaignsService,
  updateCampaign as updateCampaignService
} from "@/lib/services/campaigns";
import type { CampaignListInput as CampaignServiceListInput } from "@/lib/services/campaigns";
import {
  createCase as createCaseService,
  deleteCase as deleteCaseService,
  getCase as getCaseService,
  listCases as listCasesService,
  resolveCase as resolveCaseService,
  updateCase as updateCaseService
} from "@/lib/services/cases";
import type { CaseListInput as CaseServiceListInput } from "@/lib/services/cases";
import {
  completeTask as completeTaskService,
  createTask as createTaskService,
  deleteTask as deleteTaskService,
  getTask as getTaskService,
  listTasks as listTasksService,
  updateTask as updateTaskService
} from "@/lib/services/tasks";
import { buildListQuery, type ListQueryInput } from "@/lib/services/listQuery";
import {
  getRoutingDecisionForLead as getRoutingDecisionForLeadService,
  type RoutingDecision
} from "@/lib/services/leads";
import { listOpportunityStageHistory as listOpportunityStageHistoryService } from "@/lib/services/opportunityStageHistory";
import type { TaskListInput as TaskServiceListInput } from "@/lib/services/tasks";
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

type AccountSortBy = "name" | "createdAt" | "updatedAt" | "healthScore";
type AccountFilters = {
  status: AccountStatus;
  ownerId: string;
  search: string;
};
export type AccountListOptions = ListQueryInput<AccountSortBy, AccountFilters>;

type ContactSortBy = "lastName" | "firstName" | "createdAt" | "updatedAt";
type ContactFilters = {
  status: ContactStatus;
  accountId: string;
  search: string;
};
export type ContactListOptions = ListQueryInput<ContactSortBy, ContactFilters>;

type OpportunitySortBy = "name" | "stage" | "value" | "createdAt" | "updatedAt";
type OpportunityFilters = {
  stage: DealStage;
  accountId: string;
  ownerId: string;
  search: string;
};
export type OpportunityListOptions = ListQueryInput<
  OpportunitySortBy,
  OpportunityFilters
>;

type LeadSortBy = "lastName" | "firstName" | "createdAt" | "updatedAt";
type LeadFilters = {
  status: LeadStatus;
  assignedOrderId: string;
  areaId: string;
  search: string;
};
export type LeadListOptions = ListQueryInput<LeadSortBy, LeadFilters>;

type ActivitySortBy = "createdAt" | "type" | "title";
type ActivityFilters = {
  type: ActivityType;
  accountId: string;
  contactId: string;
  dealId: string;
  leadId: string;
  taskId: string;
  caseId: string;
};
export type ActivityListOptions = ListQueryInput<
  ActivitySortBy,
  ActivityFilters
>;

type DealerOrderSortBy = "name" | "status" | "startDate" | "createdAt";
type DealerOrderFilters = {
  status: DealerOrderStatus;
  accountId: string;
};
export type DealerOrderListOptions = ListQueryInput<
  DealerOrderSortBy,
  DealerOrderFilters
>;

type AreaSortBy = "name" | "province" | "createdAt";
type AreaFilters = {
  province: string;
  search: string;
};
export type AreaListOptions = ListQueryInput<AreaSortBy, AreaFilters>;
export type TaskListOptions = TaskServiceListInput;
export type CaseListOptions = CaseServiceListInput;
export type CampaignListOptions = CampaignServiceListInput;

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
export type { RoutingDecision } from "@/lib/services/leads";

function parseId(id: string): string {
  return idSchema.parse(id);
}

function contains(value: string): Prisma.StringFilter {
  return {
    contains: value
  };
}

function accountListQuery(opts: AccountListOptions) {
  return buildListQuery<
    AccountSortBy,
    AccountFilters,
    Prisma.AccountWhereInput,
    Prisma.AccountOrderByWithRelationInput
  >(opts, {
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      name: (order) => ({ name: order }),
      createdAt: (order) => ({ createdAt: order }),
      updatedAt: (order) => ({ updatedAt: order }),
      healthScore: (order) => ({ healthScore: order })
    },
    filterMap: {
      status: (status) => ({ status }),
      ownerId: (ownerId) => ({ ownerId }),
      search: (search) => ({
        OR: [
          { name: contains(search) },
          { domain: contains(search) },
          { industry: contains(search) },
          { city: contains(search) },
          { region: contains(search) }
        ]
      })
    }
  });
}

function contactListQuery(opts: ContactListOptions) {
  return buildListQuery<
    ContactSortBy,
    ContactFilters,
    Prisma.ContactWhereInput,
    Prisma.ContactOrderByWithRelationInput
  >(opts, {
    defaultSortBy: "lastName",
    defaultSortOrder: "asc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      lastName: (order) => ({ lastName: order }),
      firstName: (order) => ({ firstName: order }),
      createdAt: (order) => ({ createdAt: order }),
      updatedAt: (order) => ({ updatedAt: order })
    },
    filterMap: {
      status: (status) => ({ status }),
      accountId: (accountId) => ({ accountId }),
      search: (search) => ({
        OR: [
          { firstName: contains(search) },
          { lastName: contains(search) },
          { email: contains(search) },
          { title: contains(search) }
        ]
      })
    }
  });
}

function opportunityListQuery(opts: OpportunityListOptions) {
  return buildListQuery<
    OpportunitySortBy,
    OpportunityFilters,
    Prisma.DealWhereInput,
    Prisma.DealOrderByWithRelationInput
  >(opts, {
    defaultSortBy: "updatedAt",
    defaultSortOrder: "desc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      name: (order) => ({ name: order }),
      stage: (order) => ({ stage: order }),
      value: (order) => ({ value: order }),
      createdAt: (order) => ({ createdAt: order }),
      updatedAt: (order) => ({ updatedAt: order })
    },
    filterMap: {
      stage: (stage) => ({ stage }),
      accountId: (accountId) => ({ accountId }),
      ownerId: (ownerId) => ({ ownerId }),
      search: (search) => ({ name: contains(search) })
    }
  });
}

function leadListQuery(opts: LeadListOptions) {
  return buildListQuery<
    LeadSortBy,
    LeadFilters,
    Prisma.LeadWhereInput,
    Prisma.LeadOrderByWithRelationInput
  >(opts, {
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      lastName: (order) => ({ lastName: order }),
      firstName: (order) => ({ firstName: order }),
      createdAt: (order) => ({ createdAt: order }),
      updatedAt: (order) => ({ updatedAt: order })
    },
    filterMap: {
      status: (status) => ({ status }),
      assignedOrderId: (assignedOrderId) => ({ assignedOrderId }),
      areaId: (areaId) => ({ areaId }),
      search: (search) => ({
        OR: [
          { firstName: contains(search) },
          { lastName: contains(search) },
          { email: contains(search) },
          { phone: contains(search) },
          { postalCode: contains(search) },
          { source: contains(search) }
        ]
      })
    }
  });
}

function activityListQuery(opts: ActivityListOptions) {
  return buildListQuery<
    ActivitySortBy,
    ActivityFilters,
    Prisma.ActivityWhereInput,
    Prisma.ActivityOrderByWithRelationInput
  >(opts, {
    defaultSortBy: "createdAt",
    defaultSortOrder: "desc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      createdAt: (order) => ({ createdAt: order }),
      type: (order) => ({ type: order }),
      title: (order) => ({ title: order })
    },
    filterMap: {
      type: (type) => ({ type }),
      accountId: (accountId) => ({ accountId }),
      contactId: (contactId) => ({ contactId }),
      dealId: (dealId) => ({ dealId }),
      leadId: (leadId) => ({ leadId }),
      taskId: (taskId) => ({ taskId }),
      caseId: (caseId) => ({ caseId })
    }
  });
}

function dealerOrderListQuery(opts: DealerOrderListOptions) {
  return buildListQuery<
    DealerOrderSortBy,
    DealerOrderFilters,
    Prisma.DealerOrderWhereInput,
    Prisma.DealerOrderOrderByWithRelationInput
  >(opts, {
    defaultSortBy: "startDate",
    defaultSortOrder: "desc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      name: (order) => ({ name: order }),
      status: (order) => ({ status: order }),
      startDate: (order) => ({ startDate: order }),
      createdAt: (order) => ({ createdAt: order })
    },
    filterMap: {
      status: (status) => ({ status }),
      accountId: (accountId) => ({ accountId })
    }
  });
}

function areaListQuery(opts: AreaListOptions) {
  return buildListQuery<
    AreaSortBy,
    AreaFilters,
    Prisma.AreaWhereInput,
    Prisma.AreaOrderByWithRelationInput
  >(opts, {
    defaultSortBy: "name",
    defaultSortOrder: "asc",
    emptyWhere: {},
    andWhere: (clauses) => ({ AND: clauses }),
    sortMap: {
      name: (order) => ({ name: order }),
      province: (order) => ({ province: order }),
      createdAt: (order) => ({ createdAt: order })
    },
    filterMap: {
      province: (province) => ({ province }),
      search: (search) => ({
        OR: [
          { name: contains(search) },
          { province: contains(search) },
          { region: contains(search) },
          { postalPrefixes: contains(search) }
        ]
      })
    }
  });
}

function toNote(activity: Activity): Note {
  if (activity.type !== "note") {
    throw new Error("Activity is not a note.");
  }

  return { ...activity, type: "note" };
}

/** Lists accounts. Supported filter keys: `status`, `ownerId`, `search`. */
export async function listAccounts(
  opts: AccountListOptions = {}
): Promise<Account[]> {
  return prisma.account.findMany(accountListQuery(opts));
}

export async function getAccount(id: string): Promise<Account | null> {
  return prisma.account.findUnique({ where: { id: parseId(id) } });
}

export async function createAccount(
  input: AccountCreateInput
): Promise<Account> {
  const data: Prisma.AccountUncheckedCreateInput =
    accountCreateSchema.parse(input);
  return prisma.account.create({ data });
}

export async function updateAccount(
  id: string,
  input: AccountUpdateInput
): Promise<Account> {
  const data: Prisma.AccountUncheckedUpdateInput =
    accountUpdateSchema.parse(input);
  return prisma.account.update({ where: { id: parseId(id) }, data });
}

export async function deleteAccount(id: string): Promise<Account> {
  return prisma.account.delete({ where: { id: parseId(id) } });
}

/** Lists contacts. Supported filter keys: `status`, `accountId`, `search`. */
export async function listContacts(
  opts: ContactListOptions = {}
): Promise<Contact[]> {
  return prisma.contact.findMany(contactListQuery(opts));
}

export async function getContact(id: string): Promise<Contact | null> {
  return prisma.contact.findUnique({ where: { id: parseId(id) } });
}

export async function createContact(
  input: ContactCreateInput
): Promise<Contact> {
  const data: Prisma.ContactUncheckedCreateInput =
    contactCreateSchema.parse(input);
  return prisma.contact.create({ data });
}

export async function updateContact(
  id: string,
  input: ContactUpdateInput
): Promise<Contact> {
  const data: Prisma.ContactUncheckedUpdateInput =
    contactUpdateSchema.parse(input);
  return prisma.contact.update({ where: { id: parseId(id) }, data });
}

export async function deleteContact(id: string): Promise<Contact> {
  return prisma.contact.delete({ where: { id: parseId(id) } });
}

/** Lists opportunities. Supported filter keys: `stage`, `accountId`, `ownerId`, `search`. */
export async function listOpportunities(
  opts: OpportunityListOptions = {}
): Promise<Opportunity[]> {
  return prisma.deal.findMany(opportunityListQuery(opts));
}

export async function getOpportunity(id: string): Promise<Opportunity | null> {
  return prisma.deal.findUnique({ where: { id: parseId(id) } });
}

export async function createOpportunity(
  input: OpportunityCreateInput
): Promise<Opportunity> {
  const data: Prisma.DealUncheckedCreateInput =
    opportunityCreateSchema.parse(input);
  return prisma.deal.create({ data });
}

export async function updateOpportunity(
  id: string,
  input: OpportunityUpdateInput
): Promise<Opportunity> {
  const opportunityId = parseId(id);
  const parsed = opportunityUpdateSchema.parse(input);
  const data: Prisma.DealUncheckedUpdateInput = parsed;

  const nextStage = parsed.stage;

  if (!nextStage) {
    return prisma.deal.update({ where: { id: opportunityId }, data });
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.deal.findUnique({
      where: {
        id: opportunityId
      }
    });
    const updated = await tx.deal.update({
      where: {
        id: opportunityId
      },
      data
    });

    if (existing && existing.stage !== nextStage) {
      await tx.opportunityStageHistory.create({
        data: {
          dealId: opportunityId,
          fromStage: existing.stage,
          toStage: nextStage,
          changedByUserId: parsed.ownerId ?? existing.ownerId
        }
      });
    }

    return updated;
  });
}

export async function deleteOpportunity(id: string): Promise<Opportunity> {
  return prisma.deal.delete({ where: { id: parseId(id) } });
}

export async function getOpportunityStageHistory(
  dealId: string
): Promise<OpportunityStageHistory[]> {
  return listOpportunityStageHistoryService(dealId);
}

/** Lists leads. Supported filter keys: `status`, `assignedOrderId`, `areaId`, `search`. */
export async function listLeads(opts: LeadListOptions = {}): Promise<Lead[]> {
  return prisma.lead.findMany(leadListQuery(opts));
}

export async function getLead(id: string): Promise<Lead | null> {
  return prisma.lead.findUnique({ where: { id: parseId(id) } });
}

export async function createLead(input: LeadCreateInput): Promise<Lead> {
  const data: Prisma.LeadUncheckedCreateInput = leadCreateSchema.parse(input);
  return prisma.lead.create({ data });
}

export async function updateLead(
  id: string,
  input: LeadUpdateInput
): Promise<Lead> {
  const data: Prisma.LeadUncheckedUpdateInput = leadUpdateSchema.parse(input);
  return prisma.lead.update({ where: { id: parseId(id) }, data });
}

export async function deleteLead(id: string): Promise<Lead> {
  return prisma.lead.delete({ where: { id: parseId(id) } });
}

export async function getRoutingDecisionForLead(
  leadId: string
): Promise<RoutingDecision | null> {
  return getRoutingDecisionForLeadService(leadId);
}

/** Lists activities. Supported filter keys: `type`, `accountId`, `contactId`, `dealId`, `leadId`, `taskId`, `caseId`. */
export async function listActivities(
  opts: ActivityListOptions = {}
): Promise<Activity[]> {
  return prisma.activity.findMany(activityListQuery(opts));
}

export async function getActivity(id: string): Promise<Activity | null> {
  return prisma.activity.findUnique({ where: { id: parseId(id) } });
}

export async function createActivity(
  input: ActivityCreateInput
): Promise<Activity> {
  const data: Prisma.ActivityUncheckedCreateInput =
    activityCreateSchema.parse(input);
  return prisma.activity.create({ data });
}

export async function updateActivity(
  id: string,
  input: ActivityUpdateInput
): Promise<Activity> {
  const data: Prisma.ActivityUncheckedUpdateInput =
    activityUpdateSchema.parse(input);
  return prisma.activity.update({ where: { id: parseId(id) }, data });
}

export async function deleteActivity(id: string): Promise<Activity> {
  return prisma.activity.delete({ where: { id: parseId(id) } });
}

export async function addActivityToTask(
  taskId: string,
  input: ActivityCreateInput
): Promise<Activity> {
  return createActivity({ ...input, taskId: parseId(taskId) });
}

export async function addActivityToCase(
  caseId: string,
  input: ActivityCreateInput
): Promise<Activity> {
  return createActivity({ ...input, caseId: parseId(caseId) });
}

/** Lists notes. Supported filter keys match activities and force `type = "note"`. */
export async function listNotes(
  opts: ActivityListOptions = {}
): Promise<Note[]> {
  const query = activityListQuery(opts);
  const where: Prisma.ActivityWhereInput = {
    AND: [query.where, { type: "note" }]
  };
  const activities = await prisma.activity.findMany({ ...query, where });
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

export async function updateNote(
  id: string,
  input: NoteUpdateInput
): Promise<Note | null> {
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

/** Lists dealer orders. Supported filter keys: `status`, `accountId`. */
export async function listDealerOrders(
  opts: DealerOrderListOptions = {}
): Promise<DealerOrder[]> {
  return prisma.dealerOrder.findMany(dealerOrderListQuery(opts));
}

export async function getDealerOrder(id: string): Promise<DealerOrder | null> {
  return prisma.dealerOrder.findUnique({ where: { id: parseId(id) } });
}

export async function createDealerOrder(
  input: DealerOrderCreateInput
): Promise<DealerOrder> {
  const data: Prisma.DealerOrderUncheckedCreateInput =
    dealerOrderCreateSchema.parse(input);
  return prisma.dealerOrder.create({ data });
}

export async function updateDealerOrder(
  id: string,
  input: DealerOrderUpdateInput
): Promise<DealerOrder> {
  const data: Prisma.DealerOrderUncheckedUpdateInput =
    dealerOrderUpdateSchema.parse(input);
  return prisma.dealerOrder.update({ where: { id: parseId(id) }, data });
}

export async function deleteDealerOrder(id: string): Promise<DealerOrder> {
  return prisma.dealerOrder.delete({ where: { id: parseId(id) } });
}

/** Lists areas. Supported filter keys: `province`, `search`. */
export async function listAreas(opts: AreaListOptions = {}): Promise<Area[]> {
  return prisma.area.findMany(areaListQuery(opts));
}

export async function getArea(id: string): Promise<Area | null> {
  return prisma.area.findUnique({ where: { id: parseId(id) } });
}

export async function createArea(input: AreaCreateInput): Promise<Area> {
  const data: Prisma.AreaUncheckedCreateInput = areaCreateSchema.parse(input);
  return prisma.area.create({ data });
}

export async function updateArea(
  id: string,
  input: AreaUpdateInput
): Promise<Area> {
  const data: Prisma.AreaUncheckedUpdateInput = areaUpdateSchema.parse(input);
  return prisma.area.update({ where: { id: parseId(id) }, data });
}

export async function deleteArea(id: string): Promise<Area> {
  return prisma.area.delete({ where: { id: parseId(id) } });
}

/** Lists tasks. Supported filter keys: `status`, `ownerId`, `dueDateFrom`, `dueDateTo`. */
export async function listTasks(opts: TaskListOptions = {}): Promise<Task[]> {
  return listTasksService(opts);
}

export async function getTask(id: string): Promise<Task | null> {
  return getTaskService(id);
}

export async function createTask(input: TaskCreateInput): Promise<Task> {
  return createTaskService(input);
}

export async function updateTask(
  id: string,
  input: TaskUpdateInput
): Promise<Task> {
  return updateTaskService(id, input);
}

export async function completeTask(id: string): Promise<Task> {
  return completeTaskService(id);
}

export async function deleteTask(id: string): Promise<Task> {
  return deleteTaskService(id);
}

/** Lists cases. Supported filter keys: `status`, `ownerId`, `accountId`, `contactId`. */
export async function listCases(opts: CaseListOptions = {}): Promise<Case[]> {
  return listCasesService(opts);
}

export async function getCase(id: string): Promise<Case | null> {
  return getCaseService(id);
}

export async function createCase(input: CaseCreateInput): Promise<Case> {
  return createCaseService(input);
}

export async function updateCase(
  id: string,
  input: CaseUpdateInput
): Promise<Case> {
  return updateCaseService(id, input);
}

export async function resolveCase(id: string): Promise<Case> {
  return resolveCaseService(id);
}

export async function deleteCase(id: string): Promise<Case> {
  return deleteCaseService(id);
}

/** Lists campaigns. Supported filter keys: `status`, `ownerId`, `startDateFrom`, `startDateTo`. */
export async function listCampaigns(
  opts: CampaignListOptions = {}
): Promise<Campaign[]> {
  return listCampaignsService(opts);
}

export async function getCampaign(id: string): Promise<Campaign | null> {
  return getCampaignService(id);
}

export async function createCampaign(
  input: CampaignCreateInput
): Promise<Campaign> {
  return createCampaignService(input);
}

export async function updateCampaign(
  id: string,
  input: CampaignUpdateInput
): Promise<Campaign> {
  return updateCampaignService(id, input);
}

export async function completeCampaign(id: string): Promise<Campaign> {
  return completeCampaignService(id);
}

export async function deleteCampaign(id: string): Promise<Campaign> {
  return deleteCampaignService(id);
}

export const crmClient = {
  deals: {
    list: listOpportunities,
    get: getOpportunity,
    create: createOpportunity,
    update: updateOpportunity,
    delete: deleteOpportunity,
    getStageHistory: getOpportunityStageHistory
  },
  leads: {
    list: listLeads,
    get: getLead,
    create: createLead,
    update: updateLead,
    delete: deleteLead,
    getRoutingDecision: getRoutingDecisionForLead
  }
} as const;
