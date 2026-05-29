import { toCsv, type CsvColumn } from "@/lib/business/csv-export";
import { prisma } from "@/lib/prisma";

export const CSV_EXPORT_ENTITIES = [
  "accounts",
  "contacts",
  "opportunities",
  "leads",
  "activities",
  "dealer-orders",
  "areas",
  "tasks",
  "cases",
  "campaigns"
] as const;

export const CSV_EXPORT_CONTENT_TYPE = "text/csv; charset=utf-8" as const;
export const CSV_EXPORT_DEFAULT_LIMIT = 1000;
export const CSV_EXPORT_MAX_LIMIT = 5000;
export const CSV_EXPORT_PREVIEW_DEFAULT_LIMIT = 5;
export const CSV_EXPORT_PREVIEW_MAX_LIMIT = 25;

export type CsvExportEntity = (typeof CSV_EXPORT_ENTITIES)[number];

const csvExportEntitySet: ReadonlySet<string> = new Set(CSV_EXPORT_ENTITIES);

export type CsvExportColumnContract = {
  key: string;
  label: string;
};

export type CsvExportDefinition = {
  entity: CsvExportEntity;
  label: string;
  route: string;
  filename: string;
  columns: readonly CsvExportColumnContract[];
};

export type CsvExportOptions = {
  limit?: number;
};

export type CsvSelectedExportOptions = {
  recordIds: readonly string[];
};

export type CsvExportResult = CsvExportDefinition & {
  contentType: typeof CSV_EXPORT_CONTENT_TYPE;
  rowCount: number;
  csv: string;
};

export type CsvSelectedExportResult = CsvExportResult & {
  requestedRecordCount: number;
  selectedRecordIds: readonly string[];
  missingRecordIds: readonly string[];
};

export type CsvExportPreflightSummary = CsvExportDefinition & {
  contentType: typeof CSV_EXPORT_CONTENT_TYPE;
  canonicalHeaders: readonly string[];
  defaultLimit: typeof CSV_EXPORT_DEFAULT_LIMIT;
  maxLimit: typeof CSV_EXPORT_MAX_LIMIT;
  rowCount: number;
};

export type CsvExportPreviewOptions = {
  limit?: number;
  includeCsv?: boolean;
};

export type CsvExportPreviewCell = string | number | null;
export type CsvExportPreviewRow = Record<string, CsvExportPreviewCell>;

export type CsvExportPreview = CsvExportDefinition & {
  contentType: typeof CSV_EXPORT_CONTENT_TYPE;
  canonicalHeaders: readonly string[];
  defaultLimit: typeof CSV_EXPORT_PREVIEW_DEFAULT_LIMIT;
  maxLimit: typeof CSV_EXPORT_PREVIEW_MAX_LIMIT;
  previewLimit: number;
  totalRowCount: number;
  previewRowCount: number;
  hasMoreRows: boolean;
  rows: readonly CsvExportPreviewRow[];
  csvSnippet: string | null;
};

type CsvCell = string | number | Date | null;
type CsvRow = Record<string, CsvCell> & { id: string };

type InternalCsvExportDefinition<Row extends CsvRow> = {
  entity: CsvExportEntity;
  label: string;
  route: string;
  filename: string;
  columns: readonly CsvColumn<Row>[];
  loadRows: (take: number) => Promise<Row[]>;
  loadRowsByIds: (ids: readonly string[]) => Promise<Row[]>;
  countRows: () => Promise<number>;
};

type AccountCsvRow = {
  id: string;
  name: string;
  domain: string | null;
  industry: string | null;
  city: string | null;
  region: string | null;
  status: string;
  healthScore: number;
  ownerId: string | null;
  ownerName: string | null;
  ownerEmail: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ContactCsvRow = {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  title: string | null;
  status: string;
  accountId: string | null;
  accountName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type OpportunityCsvRow = {
  id: string;
  name: string;
  stage: string;
  value: number;
  probability: number;
  accountId: string | null;
  accountName: string | null;
  contactId: string | null;
  contactName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  expectedCloseDate: Date | null;
  lastActivityAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type LeadCsvRow = {
  id: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  email: string | null;
  postalCode: string | null;
  province: string | null;
  source: string | null;
  status: string;
  areaId: string | null;
  areaName: string | null;
  assignedOrderId: string | null;
  assignedOrderName: string | null;
  assignmentReason: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type ActivityCsvRow = {
  id: string;
  type: string;
  title: string;
  summary: string | null;
  nextStep: string | null;
  accountId: string | null;
  accountName: string | null;
  contactId: string | null;
  contactName: string | null;
  dealId: string | null;
  dealName: string | null;
  leadId: string | null;
  leadName: string | null;
  taskId: string | null;
  taskTitle: string | null;
  caseId: string | null;
  caseSubject: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: Date;
};

type DealerOrderCsvRow = {
  id: string;
  name: string;
  status: string;
  monthlyQuota: number;
  accountId: string;
  accountName: string | null;
  startDate: Date;
  endDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
};

type AreaCsvRow = {
  id: string;
  name: string;
  province: string | null;
  region: string | null;
  postalPrefixes: string;
  createdAt: Date;
  updatedAt: Date;
};

type TaskCsvRow = {
  id: string;
  title: string;
  description: string | null;
  dueDate: Date | null;
  status: string;
  priority: string;
  ownerId: string | null;
  ownerName: string | null;
  accountId: string | null;
  accountName: string | null;
  contactId: string | null;
  contactName: string | null;
  dealId: string | null;
  dealName: string | null;
  leadId: string | null;
  leadName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CaseCsvRow = {
  id: string;
  subject: string;
  description: string | null;
  status: string;
  priority: string;
  ownerId: string | null;
  ownerName: string | null;
  accountId: string | null;
  accountName: string | null;
  contactId: string | null;
  contactName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

type CampaignCsvRow = {
  id: string;
  name: string;
  description: string | null;
  status: string;
  startDate: Date | null;
  endDate: Date | null;
  budget: number | null;
  ownerId: string | null;
  ownerName: string | null;
  createdAt: Date;
  updatedAt: Date;
};

function fullName(person: { firstName: string; lastName: string } | null): string | null {
  return person ? `${person.firstName} ${person.lastName}` : null;
}

function normalizeBoundedLimit(
  limit: number | undefined,
  defaultLimit: number,
  maxLimit: number
): number {
  if (limit === undefined) {
    return defaultLimit;
  }

  const truncated = Math.trunc(limit);

  if (!Number.isFinite(truncated)) {
    return defaultLimit;
  }

  return Math.min(Math.max(truncated, 0), maxLimit);
}

function normalizeLimit(limit: number | undefined): number {
  return normalizeBoundedLimit(limit, CSV_EXPORT_DEFAULT_LIMIT, CSV_EXPORT_MAX_LIMIT);
}

function normalizePreviewLimit(limit: number | undefined): number {
  return normalizeBoundedLimit(
    limit,
    CSV_EXPORT_PREVIEW_DEFAULT_LIMIT,
    CSV_EXPORT_PREVIEW_MAX_LIMIT
  );
}

function toPublicDefinition<Row extends CsvRow>(
  definition: InternalCsvExportDefinition<Row>
): CsvExportDefinition {
  return {
    entity: definition.entity,
    label: definition.label,
    route: definition.route,
    filename: definition.filename,
    columns: definition.columns.map((column) => ({
      key: String(column.key),
      label: column.label
    }))
  };
}

async function buildCsvExport<Row extends CsvRow>(
  definition: InternalCsvExportDefinition<Row>,
  options: CsvExportOptions = {}
): Promise<CsvExportResult> {
  const take = normalizeLimit(options.limit);
  const rows = take === 0 ? [] : await definition.loadRows(take);
  return {
    ...toPublicDefinition(definition),
    contentType: CSV_EXPORT_CONTENT_TYPE,
    rowCount: rows.length,
    csv: toCsv(rows, definition.columns)
  };
}

function uniqueRecordIds(recordIds: readonly string[]): string[] {
  const seen = new Set<string>();
  const output: string[] = [];

  for (const id of recordIds) {
    if (!seen.has(id)) {
      seen.add(id);
      output.push(id);
    }
  }

  return output;
}

function orderRowsByIds<Row extends CsvRow>(
  ids: readonly string[],
  rows: readonly Row[]
): Row[] {
  const rowsById = new Map(rows.map((row) => [row.id, row]));
  const orderedRows: Row[] = [];

  for (const id of ids) {
    const row = rowsById.get(id);

    if (row) {
      orderedRows.push(row);
    }
  }

  return orderedRows;
}

async function buildSelectedCsvExport<Row extends CsvRow>(
  definition: InternalCsvExportDefinition<Row>,
  options: CsvSelectedExportOptions
): Promise<CsvSelectedExportResult> {
  const uniqueIds = uniqueRecordIds(options.recordIds);
  const rows =
    uniqueIds.length === 0 ? [] : await definition.loadRowsByIds(uniqueIds);
  const exportedIds = new Set(rows.map((row) => row.id));

  return {
    ...toPublicDefinition(definition),
    contentType: CSV_EXPORT_CONTENT_TYPE,
    rowCount: rows.length,
    csv: toCsv(rows, definition.columns),
    requestedRecordCount: options.recordIds.length,
    selectedRecordIds: rows.map((row) => row.id),
    missingRecordIds: uniqueIds.filter((id) => !exportedIds.has(id))
  };
}

async function buildCsvExportPreflightSummary<Row extends CsvRow>(
  definition: InternalCsvExportDefinition<Row>
): Promise<CsvExportPreflightSummary> {
  const publicDefinition = toPublicDefinition(definition);
  return {
    ...publicDefinition,
    contentType: CSV_EXPORT_CONTENT_TYPE,
    canonicalHeaders: publicDefinition.columns.map((column) => column.label),
    defaultLimit: CSV_EXPORT_DEFAULT_LIMIT,
    maxLimit: CSV_EXPORT_MAX_LIMIT,
    rowCount: await definition.countRows()
  };
}

function toPreviewCell(value: CsvCell): CsvExportPreviewCell {
  if (value instanceof Date) {
    return value.toISOString();
  }

  return value;
}

function buildCsvExportPreviewRows<Row extends CsvRow>(
  rows: readonly Row[],
  columns: readonly CsvColumn<Row>[]
): CsvExportPreviewRow[] {
  return rows.map((row) => {
    const previewRow: CsvExportPreviewRow = {};

    for (const column of columns) {
      previewRow[String(column.key)] = toPreviewCell(row[column.key] ?? null);
    }

    return previewRow;
  });
}

async function buildCsvExportPreview<Row extends CsvRow>(
  definition: InternalCsvExportDefinition<Row>,
  options: CsvExportPreviewOptions = {}
): Promise<CsvExportPreview> {
  const previewLimit = normalizePreviewLimit(options.limit);
  const rows = previewLimit === 0 ? [] : await definition.loadRows(previewLimit);
  const publicDefinition = toPublicDefinition(definition);
  const totalRowCount = await definition.countRows();

  return {
    ...publicDefinition,
    contentType: CSV_EXPORT_CONTENT_TYPE,
    canonicalHeaders: publicDefinition.columns.map((column) => column.label),
    defaultLimit: CSV_EXPORT_PREVIEW_DEFAULT_LIMIT,
    maxLimit: CSV_EXPORT_PREVIEW_MAX_LIMIT,
    previewLimit,
    totalRowCount,
    previewRowCount: rows.length,
    hasMoreRows: totalRowCount > rows.length,
    rows: buildCsvExportPreviewRows(rows, definition.columns),
    csvSnippet: options.includeCsv === true ? toCsv(rows, definition.columns) : null
  };
}

const accountColumns: readonly CsvColumn<AccountCsvRow>[] = [
  { key: "id", label: "Account ID" },
  { key: "name", label: "Name" },
  { key: "domain", label: "Domain" },
  { key: "industry", label: "Industry" },
  { key: "city", label: "City" },
  { key: "region", label: "Region" },
  { key: "status", label: "Status" },
  { key: "healthScore", label: "Health Score" },
  { key: "ownerId", label: "Owner ID" },
  { key: "ownerName", label: "Owner Name" },
  { key: "ownerEmail", label: "Owner Email" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" }
];

const contactColumns: readonly CsvColumn<ContactCsvRow>[] = [
  { key: "id", label: "Contact ID" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "title", label: "Title" },
  { key: "status", label: "Status" },
  { key: "accountId", label: "Account ID" },
  { key: "accountName", label: "Account Name" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" }
];

const opportunityColumns: readonly CsvColumn<OpportunityCsvRow>[] = [
  { key: "id", label: "Opportunity ID" },
  { key: "name", label: "Name" },
  { key: "stage", label: "Stage" },
  { key: "value", label: "Value" },
  { key: "probability", label: "Probability" },
  { key: "accountId", label: "Account ID" },
  { key: "accountName", label: "Account Name" },
  { key: "contactId", label: "Contact ID" },
  { key: "contactName", label: "Contact Name" },
  { key: "ownerId", label: "Owner ID" },
  { key: "ownerName", label: "Owner Name" },
  { key: "expectedCloseDate", label: "Expected Close Date" },
  { key: "lastActivityAt", label: "Last Activity At" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" }
];

const leadColumns: readonly CsvColumn<LeadCsvRow>[] = [
  { key: "id", label: "Lead ID" },
  { key: "firstName", label: "First Name" },
  { key: "lastName", label: "Last Name" },
  { key: "phone", label: "Phone" },
  { key: "email", label: "Email" },
  { key: "postalCode", label: "Postal Code" },
  { key: "province", label: "Province" },
  { key: "source", label: "Source" },
  { key: "status", label: "Status" },
  { key: "areaId", label: "Area ID" },
  { key: "areaName", label: "Area Name" },
  { key: "assignedOrderId", label: "Assigned Order ID" },
  { key: "assignedOrderName", label: "Assigned Order Name" },
  { key: "assignmentReason", label: "Assignment Reason" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" }
];

const activityColumns: readonly CsvColumn<ActivityCsvRow>[] = [
  { key: "id", label: "Activity ID" },
  { key: "type", label: "Type" },
  { key: "title", label: "Title" },
  { key: "summary", label: "Summary" },
  { key: "nextStep", label: "Next Step" },
  { key: "accountId", label: "Account ID" },
  { key: "accountName", label: "Account Name" },
  { key: "contactId", label: "Contact ID" },
  { key: "contactName", label: "Contact Name" },
  { key: "dealId", label: "Opportunity ID" },
  { key: "dealName", label: "Opportunity Name" },
  { key: "leadId", label: "Lead ID" },
  { key: "leadName", label: "Lead Name" },
  { key: "taskId", label: "Task ID" },
  { key: "taskTitle", label: "Task Title" },
  { key: "caseId", label: "Case ID" },
  { key: "caseSubject", label: "Case Subject" },
  { key: "userId", label: "User ID" },
  { key: "userName", label: "User Name" },
  { key: "createdAt", label: "Created At" }
];

const dealerOrderColumns: readonly CsvColumn<DealerOrderCsvRow>[] = [
  { key: "id", label: "Dealer Order ID" },
  { key: "name", label: "Name" },
  { key: "status", label: "Status" },
  { key: "monthlyQuota", label: "Monthly Quota" },
  { key: "accountId", label: "Account ID" },
  { key: "accountName", label: "Account Name" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" }
];

const areaColumns: readonly CsvColumn<AreaCsvRow>[] = [
  { key: "id", label: "Area ID" },
  { key: "name", label: "Name" },
  { key: "province", label: "Province" },
  { key: "region", label: "Region" },
  { key: "postalPrefixes", label: "Postal Prefixes" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" }
];

const taskColumns: readonly CsvColumn<TaskCsvRow>[] = [
  { key: "id", label: "Task ID" },
  { key: "title", label: "Title" },
  { key: "description", label: "Description" },
  { key: "dueDate", label: "Due Date" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "ownerId", label: "Owner ID" },
  { key: "ownerName", label: "Owner Name" },
  { key: "accountId", label: "Account ID" },
  { key: "accountName", label: "Account Name" },
  { key: "contactId", label: "Contact ID" },
  { key: "contactName", label: "Contact Name" },
  { key: "dealId", label: "Opportunity ID" },
  { key: "dealName", label: "Opportunity Name" },
  { key: "leadId", label: "Lead ID" },
  { key: "leadName", label: "Lead Name" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" }
];

const caseColumns: readonly CsvColumn<CaseCsvRow>[] = [
  { key: "id", label: "Case ID" },
  { key: "subject", label: "Subject" },
  { key: "description", label: "Description" },
  { key: "status", label: "Status" },
  { key: "priority", label: "Priority" },
  { key: "ownerId", label: "Owner ID" },
  { key: "ownerName", label: "Owner Name" },
  { key: "accountId", label: "Account ID" },
  { key: "accountName", label: "Account Name" },
  { key: "contactId", label: "Contact ID" },
  { key: "contactName", label: "Contact Name" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" }
];

const campaignColumns: readonly CsvColumn<CampaignCsvRow>[] = [
  { key: "id", label: "Campaign ID" },
  { key: "name", label: "Name" },
  { key: "description", label: "Description" },
  { key: "status", label: "Status" },
  { key: "startDate", label: "Start Date" },
  { key: "endDate", label: "End Date" },
  { key: "budget", label: "Budget" },
  { key: "ownerId", label: "Owner ID" },
  { key: "ownerName", label: "Owner Name" },
  { key: "createdAt", label: "Created At" },
  { key: "updatedAt", label: "Updated At" }
];

async function loadAccountRows(take: number): Promise<AccountCsvRow[]> {
  const accounts = await prisma.account.findMany({
    take,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      domain: true,
      industry: true,
      city: true,
      region: true,
      status: true,
      healthScore: true,
      ownerId: true,
      owner: { select: { name: true, email: true } },
      createdAt: true,
      updatedAt: true
    }
  });

  return accounts.map((account) => ({
    id: account.id,
    name: account.name,
    domain: account.domain,
    industry: account.industry,
    city: account.city,
    region: account.region,
    status: account.status,
    healthScore: account.healthScore,
    ownerId: account.ownerId,
    ownerName: account.owner?.name ?? null,
    ownerEmail: account.owner?.email ?? null,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt
  }));
}

async function loadContactRows(take: number): Promise<ContactCsvRow[]> {
  const contacts = await prisma.contact.findMany({
    take,
    orderBy: [{ lastName: "asc" }, { firstName: "asc" }, { id: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      title: true,
      status: true,
      accountId: true,
      account: { select: { name: true } },
      createdAt: true,
      updatedAt: true
    }
  });

  return contacts.map((contact) => ({
    id: contact.id,
    firstName: contact.firstName,
    lastName: contact.lastName,
    email: contact.email,
    phone: contact.phone,
    title: contact.title,
    status: contact.status,
    accountId: contact.accountId,
    accountName: contact.account?.name ?? null,
    createdAt: contact.createdAt,
    updatedAt: contact.updatedAt
  }));
}

async function loadOpportunityRows(take: number): Promise<OpportunityCsvRow[]> {
  const opportunities = await prisma.deal.findMany({
    take,
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      stage: true,
      value: true,
      probability: true,
      accountId: true,
      account: { select: { name: true } },
      contactId: true,
      contact: { select: { firstName: true, lastName: true } },
      ownerId: true,
      owner: { select: { name: true } },
      expectedCloseDate: true,
      lastActivityAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return opportunities.map((opportunity) => ({
    id: opportunity.id,
    name: opportunity.name,
    stage: opportunity.stage,
    value: opportunity.value,
    probability: opportunity.probability,
    accountId: opportunity.accountId,
    accountName: opportunity.account?.name ?? null,
    contactId: opportunity.contactId,
    contactName: fullName(opportunity.contact),
    ownerId: opportunity.ownerId,
    ownerName: opportunity.owner?.name ?? null,
    expectedCloseDate: opportunity.expectedCloseDate,
    lastActivityAt: opportunity.lastActivityAt,
    createdAt: opportunity.createdAt,
    updatedAt: opportunity.updatedAt
  }));
}

async function loadLeadRows(take: number): Promise<LeadCsvRow[]> {
  const leads = await prisma.lead.findMany({
    take,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      postalCode: true,
      province: true,
      source: true,
      status: true,
      areaId: true,
      area: { select: { name: true } },
      assignedOrderId: true,
      assignedOrder: { select: { name: true } },
      assignmentReason: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return leads.map((lead) => ({
    id: lead.id,
    firstName: lead.firstName,
    lastName: lead.lastName,
    phone: lead.phone,
    email: lead.email,
    postalCode: lead.postalCode,
    province: lead.province,
    source: lead.source,
    status: lead.status,
    areaId: lead.areaId,
    areaName: lead.area?.name ?? null,
    assignedOrderId: lead.assignedOrderId,
    assignedOrderName: lead.assignedOrder?.name ?? null,
    assignmentReason: lead.assignmentReason,
    createdAt: lead.createdAt,
    updatedAt: lead.updatedAt
  }));
}

async function loadActivityRows(take: number): Promise<ActivityCsvRow[]> {
  const activities = await prisma.activity.findMany({
    take,
    orderBy: [{ createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      type: true,
      title: true,
      summary: true,
      nextStep: true,
      accountId: true,
      account: { select: { name: true } },
      contactId: true,
      contact: { select: { firstName: true, lastName: true } },
      dealId: true,
      deal: { select: { name: true } },
      leadId: true,
      lead: { select: { firstName: true, lastName: true } },
      taskId: true,
      task: { select: { title: true } },
      caseId: true,
      case: { select: { subject: true } },
      userId: true,
      user: { select: { name: true } },
      createdAt: true
    }
  });

  return activities.map((activity) => ({
    id: activity.id,
    type: activity.type,
    title: activity.title,
    summary: activity.summary,
    nextStep: activity.nextStep,
    accountId: activity.accountId,
    accountName: activity.account?.name ?? null,
    contactId: activity.contactId,
    contactName: fullName(activity.contact),
    dealId: activity.dealId,
    dealName: activity.deal?.name ?? null,
    leadId: activity.leadId,
    leadName: fullName(activity.lead),
    taskId: activity.taskId,
    taskTitle: activity.task?.title ?? null,
    caseId: activity.caseId,
    caseSubject: activity.case?.subject ?? null,
    userId: activity.userId,
    userName: activity.user?.name ?? null,
    createdAt: activity.createdAt
  }));
}

async function loadDealerOrderRows(take: number): Promise<DealerOrderCsvRow[]> {
  const dealerOrders = await prisma.dealerOrder.findMany({
    take,
    orderBy: [{ startDate: "desc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      status: true,
      monthlyQuota: true,
      accountId: true,
      account: { select: { name: true } },
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return dealerOrders.map((dealerOrder) => ({
    id: dealerOrder.id,
    name: dealerOrder.name,
    status: dealerOrder.status,
    monthlyQuota: dealerOrder.monthlyQuota,
    accountId: dealerOrder.accountId,
    accountName: dealerOrder.account?.name ?? null,
    startDate: dealerOrder.startDate,
    endDate: dealerOrder.endDate,
    createdAt: dealerOrder.createdAt,
    updatedAt: dealerOrder.updatedAt
  }));
}

async function loadAreaRows(take: number): Promise<AreaCsvRow[]> {
  const areas = await prisma.area.findMany({
    take,
    orderBy: [{ name: "asc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      province: true,
      region: true,
      postalPrefixes: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return areas.map((area) => ({
    id: area.id,
    name: area.name,
    province: area.province,
    region: area.region,
    postalPrefixes: area.postalPrefixes,
    createdAt: area.createdAt,
    updatedAt: area.updatedAt
  }));
}

async function loadTaskRows(take: number): Promise<TaskCsvRow[]> {
  const tasks = await prisma.task.findMany({
    take,
    orderBy: [{ dueDate: { sort: "asc", nulls: "last" } }, { createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      status: true,
      priority: true,
      ownerId: true,
      owner: { select: { name: true } },
      accountId: true,
      account: { select: { name: true } },
      contactId: true,
      contact: { select: { firstName: true, lastName: true } },
      dealId: true,
      deal: { select: { name: true } },
      leadId: true,
      lead: { select: { firstName: true, lastName: true } },
      createdAt: true,
      updatedAt: true
    }
  });

  return tasks.map((task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    priority: task.priority,
    ownerId: task.ownerId,
    ownerName: task.owner?.name ?? null,
    accountId: task.accountId,
    accountName: task.account?.name ?? null,
    contactId: task.contactId,
    contactName: fullName(task.contact),
    dealId: task.dealId,
    dealName: task.deal?.name ?? null,
    leadId: task.leadId,
    leadName: fullName(task.lead),
    createdAt: task.createdAt,
    updatedAt: task.updatedAt
  }));
}

async function loadCaseRows(take: number): Promise<CaseCsvRow[]> {
  const cases = await prisma.case.findMany({
    take,
    orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      subject: true,
      description: true,
      status: true,
      priority: true,
      ownerId: true,
      owner: { select: { name: true } },
      accountId: true,
      account: { select: { name: true } },
      contactId: true,
      contact: { select: { firstName: true, lastName: true } },
      createdAt: true,
      updatedAt: true
    }
  });

  return cases.map((crmCase) => ({
    id: crmCase.id,
    subject: crmCase.subject,
    description: crmCase.description,
    status: crmCase.status,
    priority: crmCase.priority,
    ownerId: crmCase.ownerId,
    ownerName: crmCase.owner?.name ?? null,
    accountId: crmCase.accountId,
    accountName: crmCase.account?.name ?? null,
    contactId: crmCase.contactId,
    contactName: fullName(crmCase.contact),
    createdAt: crmCase.createdAt,
    updatedAt: crmCase.updatedAt
  }));
}

async function loadCampaignRows(take: number): Promise<CampaignCsvRow[]> {
  const campaigns = await prisma.campaign.findMany({
    take,
    orderBy: [{ startDate: "asc" }, { createdAt: "desc" }, { id: "asc" }],
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      budget: true,
      ownerId: true,
      owner: { select: { name: true } },
      createdAt: true,
      updatedAt: true
    }
  });

  return campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    description: campaign.description,
    status: campaign.status,
    startDate: campaign.startDate,
    endDate: campaign.endDate,
    budget: campaign.budget,
    ownerId: campaign.ownerId,
    ownerName: campaign.owner?.name ?? null,
    createdAt: campaign.createdAt,
    updatedAt: campaign.updatedAt
  }));
}

async function loadAccountRowsByIds(
  ids: readonly string[]
): Promise<AccountCsvRow[]> {
  const accounts = await prisma.account.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      name: true,
      domain: true,
      industry: true,
      city: true,
      region: true,
      status: true,
      healthScore: true,
      ownerId: true,
      owner: { select: { name: true, email: true } },
      createdAt: true,
      updatedAt: true
    }
  });

  return orderRowsByIds(
    ids,
    accounts.map((account) => ({
      id: account.id,
      name: account.name,
      domain: account.domain,
      industry: account.industry,
      city: account.city,
      region: account.region,
      status: account.status,
      healthScore: account.healthScore,
      ownerId: account.ownerId,
      ownerName: account.owner?.name ?? null,
      ownerEmail: account.owner?.email ?? null,
      createdAt: account.createdAt,
      updatedAt: account.updatedAt
    }))
  );
}

async function loadContactRowsByIds(
  ids: readonly string[]
): Promise<ContactCsvRow[]> {
  const contacts = await prisma.contact.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      email: true,
      phone: true,
      title: true,
      status: true,
      accountId: true,
      account: { select: { name: true } },
      createdAt: true,
      updatedAt: true
    }
  });

  return orderRowsByIds(
    ids,
    contacts.map((contact) => ({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      email: contact.email,
      phone: contact.phone,
      title: contact.title,
      status: contact.status,
      accountId: contact.accountId,
      accountName: contact.account?.name ?? null,
      createdAt: contact.createdAt,
      updatedAt: contact.updatedAt
    }))
  );
}

async function loadOpportunityRowsByIds(
  ids: readonly string[]
): Promise<OpportunityCsvRow[]> {
  const opportunities = await prisma.deal.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      name: true,
      stage: true,
      value: true,
      probability: true,
      accountId: true,
      account: { select: { name: true } },
      contactId: true,
      contact: { select: { firstName: true, lastName: true } },
      ownerId: true,
      owner: { select: { name: true } },
      expectedCloseDate: true,
      lastActivityAt: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return orderRowsByIds(
    ids,
    opportunities.map((opportunity) => ({
      id: opportunity.id,
      name: opportunity.name,
      stage: opportunity.stage,
      value: opportunity.value,
      probability: opportunity.probability,
      accountId: opportunity.accountId,
      accountName: opportunity.account?.name ?? null,
      contactId: opportunity.contactId,
      contactName: fullName(opportunity.contact),
      ownerId: opportunity.ownerId,
      ownerName: opportunity.owner?.name ?? null,
      expectedCloseDate: opportunity.expectedCloseDate,
      lastActivityAt: opportunity.lastActivityAt,
      createdAt: opportunity.createdAt,
      updatedAt: opportunity.updatedAt
    }))
  );
}

async function loadLeadRowsByIds(ids: readonly string[]): Promise<LeadCsvRow[]> {
  const leads = await prisma.lead.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      firstName: true,
      lastName: true,
      phone: true,
      email: true,
      postalCode: true,
      province: true,
      source: true,
      status: true,
      areaId: true,
      area: { select: { name: true } },
      assignedOrderId: true,
      assignedOrder: { select: { name: true } },
      assignmentReason: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return orderRowsByIds(
    ids,
    leads.map((lead) => ({
      id: lead.id,
      firstName: lead.firstName,
      lastName: lead.lastName,
      phone: lead.phone,
      email: lead.email,
      postalCode: lead.postalCode,
      province: lead.province,
      source: lead.source,
      status: lead.status,
      areaId: lead.areaId,
      areaName: lead.area?.name ?? null,
      assignedOrderId: lead.assignedOrderId,
      assignedOrderName: lead.assignedOrder?.name ?? null,
      assignmentReason: lead.assignmentReason,
      createdAt: lead.createdAt,
      updatedAt: lead.updatedAt
    }))
  );
}

async function loadActivityRowsByIds(
  ids: readonly string[]
): Promise<ActivityCsvRow[]> {
  const activities = await prisma.activity.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      type: true,
      title: true,
      summary: true,
      nextStep: true,
      accountId: true,
      account: { select: { name: true } },
      contactId: true,
      contact: { select: { firstName: true, lastName: true } },
      dealId: true,
      deal: { select: { name: true } },
      leadId: true,
      lead: { select: { firstName: true, lastName: true } },
      taskId: true,
      task: { select: { title: true } },
      caseId: true,
      case: { select: { subject: true } },
      userId: true,
      user: { select: { name: true } },
      createdAt: true
    }
  });

  return orderRowsByIds(
    ids,
    activities.map((activity) => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      summary: activity.summary,
      nextStep: activity.nextStep,
      accountId: activity.accountId,
      accountName: activity.account?.name ?? null,
      contactId: activity.contactId,
      contactName: fullName(activity.contact),
      dealId: activity.dealId,
      dealName: activity.deal?.name ?? null,
      leadId: activity.leadId,
      leadName: fullName(activity.lead),
      taskId: activity.taskId,
      taskTitle: activity.task?.title ?? null,
      caseId: activity.caseId,
      caseSubject: activity.case?.subject ?? null,
      userId: activity.userId,
      userName: activity.user?.name ?? null,
      createdAt: activity.createdAt
    }))
  );
}

async function loadDealerOrderRowsByIds(
  ids: readonly string[]
): Promise<DealerOrderCsvRow[]> {
  const dealerOrders = await prisma.dealerOrder.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      name: true,
      status: true,
      monthlyQuota: true,
      accountId: true,
      account: { select: { name: true } },
      startDate: true,
      endDate: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return orderRowsByIds(
    ids,
    dealerOrders.map((dealerOrder) => ({
      id: dealerOrder.id,
      name: dealerOrder.name,
      status: dealerOrder.status,
      monthlyQuota: dealerOrder.monthlyQuota,
      accountId: dealerOrder.accountId,
      accountName: dealerOrder.account?.name ?? null,
      startDate: dealerOrder.startDate,
      endDate: dealerOrder.endDate,
      createdAt: dealerOrder.createdAt,
      updatedAt: dealerOrder.updatedAt
    }))
  );
}

async function loadAreaRowsByIds(ids: readonly string[]): Promise<AreaCsvRow[]> {
  const areas = await prisma.area.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      name: true,
      province: true,
      region: true,
      postalPrefixes: true,
      createdAt: true,
      updatedAt: true
    }
  });

  return orderRowsByIds(
    ids,
    areas.map((area) => ({
      id: area.id,
      name: area.name,
      province: area.province,
      region: area.region,
      postalPrefixes: area.postalPrefixes,
      createdAt: area.createdAt,
      updatedAt: area.updatedAt
    }))
  );
}

async function loadTaskRowsByIds(ids: readonly string[]): Promise<TaskCsvRow[]> {
  const tasks = await prisma.task.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      title: true,
      description: true,
      dueDate: true,
      status: true,
      priority: true,
      ownerId: true,
      owner: { select: { name: true } },
      accountId: true,
      account: { select: { name: true } },
      contactId: true,
      contact: { select: { firstName: true, lastName: true } },
      dealId: true,
      deal: { select: { name: true } },
      leadId: true,
      lead: { select: { firstName: true, lastName: true } },
      createdAt: true,
      updatedAt: true
    }
  });

  return orderRowsByIds(
    ids,
    tasks.map((task) => ({
      id: task.id,
      title: task.title,
      description: task.description,
      dueDate: task.dueDate,
      status: task.status,
      priority: task.priority,
      ownerId: task.ownerId,
      ownerName: task.owner?.name ?? null,
      accountId: task.accountId,
      accountName: task.account?.name ?? null,
      contactId: task.contactId,
      contactName: fullName(task.contact),
      dealId: task.dealId,
      dealName: task.deal?.name ?? null,
      leadId: task.leadId,
      leadName: fullName(task.lead),
      createdAt: task.createdAt,
      updatedAt: task.updatedAt
    }))
  );
}

async function loadCaseRowsByIds(ids: readonly string[]): Promise<CaseCsvRow[]> {
  const cases = await prisma.case.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      subject: true,
      description: true,
      status: true,
      priority: true,
      ownerId: true,
      owner: { select: { name: true } },
      accountId: true,
      account: { select: { name: true } },
      contactId: true,
      contact: { select: { firstName: true, lastName: true } },
      createdAt: true,
      updatedAt: true
    }
  });

  return orderRowsByIds(
    ids,
    cases.map((crmCase) => ({
      id: crmCase.id,
      subject: crmCase.subject,
      description: crmCase.description,
      status: crmCase.status,
      priority: crmCase.priority,
      ownerId: crmCase.ownerId,
      ownerName: crmCase.owner?.name ?? null,
      accountId: crmCase.accountId,
      accountName: crmCase.account?.name ?? null,
      contactId: crmCase.contactId,
      contactName: fullName(crmCase.contact),
      createdAt: crmCase.createdAt,
      updatedAt: crmCase.updatedAt
    }))
  );
}

async function loadCampaignRowsByIds(
  ids: readonly string[]
): Promise<CampaignCsvRow[]> {
  const campaigns = await prisma.campaign.findMany({
    where: { id: { in: [...ids] } },
    select: {
      id: true,
      name: true,
      description: true,
      status: true,
      startDate: true,
      endDate: true,
      budget: true,
      ownerId: true,
      owner: { select: { name: true } },
      createdAt: true,
      updatedAt: true
    }
  });

  return orderRowsByIds(
    ids,
    campaigns.map((campaign) => ({
      id: campaign.id,
      name: campaign.name,
      description: campaign.description,
      status: campaign.status,
      startDate: campaign.startDate,
      endDate: campaign.endDate,
      budget: campaign.budget,
      ownerId: campaign.ownerId,
      ownerName: campaign.owner?.name ?? null,
      createdAt: campaign.createdAt,
      updatedAt: campaign.updatedAt
    }))
  );
}

const accountExportDefinition: InternalCsvExportDefinition<AccountCsvRow> = {
  entity: "accounts",
  label: "Accounts",
  route: "/accounts",
  filename: "accounts.csv",
  columns: accountColumns,
  loadRows: loadAccountRows,
  loadRowsByIds: loadAccountRowsByIds,
  countRows: () => prisma.account.count()
};

const contactExportDefinition: InternalCsvExportDefinition<ContactCsvRow> = {
  entity: "contacts",
  label: "Contacts",
  route: "/contacts",
  filename: "contacts.csv",
  columns: contactColumns,
  loadRows: loadContactRows,
  loadRowsByIds: loadContactRowsByIds,
  countRows: () => prisma.contact.count()
};

const opportunityExportDefinition: InternalCsvExportDefinition<OpportunityCsvRow> = {
  entity: "opportunities",
  label: "Opportunities",
  route: "/deals",
  filename: "opportunities.csv",
  columns: opportunityColumns,
  loadRows: loadOpportunityRows,
  loadRowsByIds: loadOpportunityRowsByIds,
  countRows: () => prisma.deal.count()
};

const leadExportDefinition: InternalCsvExportDefinition<LeadCsvRow> = {
  entity: "leads",
  label: "Leads",
  route: "/leads",
  filename: "leads.csv",
  columns: leadColumns,
  loadRows: loadLeadRows,
  loadRowsByIds: loadLeadRowsByIds,
  countRows: () => prisma.lead.count()
};

const activityExportDefinition: InternalCsvExportDefinition<ActivityCsvRow> = {
  entity: "activities",
  label: "Activities",
  route: "/activities",
  filename: "activities.csv",
  columns: activityColumns,
  loadRows: loadActivityRows,
  loadRowsByIds: loadActivityRowsByIds,
  countRows: () => prisma.activity.count()
};

const dealerOrderExportDefinition: InternalCsvExportDefinition<DealerOrderCsvRow> = {
  entity: "dealer-orders",
  label: "Dealer Orders",
  route: "/orders",
  filename: "dealer-orders.csv",
  columns: dealerOrderColumns,
  loadRows: loadDealerOrderRows,
  loadRowsByIds: loadDealerOrderRowsByIds,
  countRows: () => prisma.dealerOrder.count()
};

const areaExportDefinition: InternalCsvExportDefinition<AreaCsvRow> = {
  entity: "areas",
  label: "Areas",
  route: "/areas",
  filename: "areas.csv",
  columns: areaColumns,
  loadRows: loadAreaRows,
  loadRowsByIds: loadAreaRowsByIds,
  countRows: () => prisma.area.count()
};

const taskExportDefinition: InternalCsvExportDefinition<TaskCsvRow> = {
  entity: "tasks",
  label: "Tasks",
  route: "/tasks",
  filename: "tasks.csv",
  columns: taskColumns,
  loadRows: loadTaskRows,
  loadRowsByIds: loadTaskRowsByIds,
  countRows: () => prisma.task.count()
};

const caseExportDefinition: InternalCsvExportDefinition<CaseCsvRow> = {
  entity: "cases",
  label: "Cases",
  route: "/cases",
  filename: "cases.csv",
  columns: caseColumns,
  loadRows: loadCaseRows,
  loadRowsByIds: loadCaseRowsByIds,
  countRows: () => prisma.case.count()
};

const campaignExportDefinition: InternalCsvExportDefinition<CampaignCsvRow> = {
  entity: "campaigns",
  label: "Campaigns",
  route: "/campaigns",
  filename: "campaigns.csv",
  columns: campaignColumns,
  loadRows: loadCampaignRows,
  loadRowsByIds: loadCampaignRowsByIds,
  countRows: () => prisma.campaign.count()
};

export function isCsvExportEntity(value: string): value is CsvExportEntity {
  return csvExportEntitySet.has(value);
}

export function listCsvExportDefinitions(): CsvExportDefinition[] {
  return [
    toPublicDefinition(accountExportDefinition),
    toPublicDefinition(contactExportDefinition),
    toPublicDefinition(opportunityExportDefinition),
    toPublicDefinition(leadExportDefinition),
    toPublicDefinition(activityExportDefinition),
    toPublicDefinition(dealerOrderExportDefinition),
    toPublicDefinition(areaExportDefinition),
    toPublicDefinition(taskExportDefinition),
    toPublicDefinition(caseExportDefinition),
    toPublicDefinition(campaignExportDefinition)
  ];
}

export function getCsvExportDefinition(entity: CsvExportEntity): CsvExportDefinition {
  switch (entity) {
    case "accounts":
      return toPublicDefinition(accountExportDefinition);
    case "contacts":
      return toPublicDefinition(contactExportDefinition);
    case "opportunities":
      return toPublicDefinition(opportunityExportDefinition);
    case "leads":
      return toPublicDefinition(leadExportDefinition);
    case "activities":
      return toPublicDefinition(activityExportDefinition);
    case "dealer-orders":
      return toPublicDefinition(dealerOrderExportDefinition);
    case "areas":
      return toPublicDefinition(areaExportDefinition);
    case "tasks":
      return toPublicDefinition(taskExportDefinition);
    case "cases":
      return toPublicDefinition(caseExportDefinition);
    case "campaigns":
      return toPublicDefinition(campaignExportDefinition);
  }
}

export async function listCsvExportPreflightSummaries(): Promise<CsvExportPreflightSummary[]> {
  return Promise.all([
    buildCsvExportPreflightSummary(accountExportDefinition),
    buildCsvExportPreflightSummary(contactExportDefinition),
    buildCsvExportPreflightSummary(opportunityExportDefinition),
    buildCsvExportPreflightSummary(leadExportDefinition),
    buildCsvExportPreflightSummary(activityExportDefinition),
    buildCsvExportPreflightSummary(dealerOrderExportDefinition),
    buildCsvExportPreflightSummary(areaExportDefinition),
    buildCsvExportPreflightSummary(taskExportDefinition),
    buildCsvExportPreflightSummary(caseExportDefinition),
    buildCsvExportPreflightSummary(campaignExportDefinition)
  ]);
}

export async function getCsvExportPreflightSummary(
  entity: CsvExportEntity
): Promise<CsvExportPreflightSummary> {
  switch (entity) {
    case "accounts":
      return buildCsvExportPreflightSummary(accountExportDefinition);
    case "contacts":
      return buildCsvExportPreflightSummary(contactExportDefinition);
    case "opportunities":
      return buildCsvExportPreflightSummary(opportunityExportDefinition);
    case "leads":
      return buildCsvExportPreflightSummary(leadExportDefinition);
    case "activities":
      return buildCsvExportPreflightSummary(activityExportDefinition);
    case "dealer-orders":
      return buildCsvExportPreflightSummary(dealerOrderExportDefinition);
    case "areas":
      return buildCsvExportPreflightSummary(areaExportDefinition);
    case "tasks":
      return buildCsvExportPreflightSummary(taskExportDefinition);
    case "cases":
      return buildCsvExportPreflightSummary(caseExportDefinition);
    case "campaigns":
      return buildCsvExportPreflightSummary(campaignExportDefinition);
  }
}

export async function listCsvExportPreviews(
  options: CsvExportPreviewOptions = {}
): Promise<CsvExportPreview[]> {
  return Promise.all([
    buildCsvExportPreview(accountExportDefinition, options),
    buildCsvExportPreview(contactExportDefinition, options),
    buildCsvExportPreview(opportunityExportDefinition, options),
    buildCsvExportPreview(leadExportDefinition, options),
    buildCsvExportPreview(activityExportDefinition, options),
    buildCsvExportPreview(dealerOrderExportDefinition, options),
    buildCsvExportPreview(areaExportDefinition, options),
    buildCsvExportPreview(taskExportDefinition, options),
    buildCsvExportPreview(caseExportDefinition, options),
    buildCsvExportPreview(campaignExportDefinition, options)
  ]);
}

export async function getCsvExportPreview(
  entity: CsvExportEntity,
  options: CsvExportPreviewOptions = {}
): Promise<CsvExportPreview> {
  switch (entity) {
    case "accounts":
      return buildCsvExportPreview(accountExportDefinition, options);
    case "contacts":
      return buildCsvExportPreview(contactExportDefinition, options);
    case "opportunities":
      return buildCsvExportPreview(opportunityExportDefinition, options);
    case "leads":
      return buildCsvExportPreview(leadExportDefinition, options);
    case "activities":
      return buildCsvExportPreview(activityExportDefinition, options);
    case "dealer-orders":
      return buildCsvExportPreview(dealerOrderExportDefinition, options);
    case "areas":
      return buildCsvExportPreview(areaExportDefinition, options);
    case "tasks":
      return buildCsvExportPreview(taskExportDefinition, options);
    case "cases":
      return buildCsvExportPreview(caseExportDefinition, options);
    case "campaigns":
      return buildCsvExportPreview(campaignExportDefinition, options);
  }
}

export async function exportCrmListCsv(
  entity: CsvExportEntity,
  options: CsvExportOptions = {}
): Promise<CsvExportResult> {
  switch (entity) {
    case "accounts":
      return buildCsvExport(accountExportDefinition, options);
    case "contacts":
      return buildCsvExport(contactExportDefinition, options);
    case "opportunities":
      return buildCsvExport(opportunityExportDefinition, options);
    case "leads":
      return buildCsvExport(leadExportDefinition, options);
    case "activities":
      return buildCsvExport(activityExportDefinition, options);
    case "dealer-orders":
      return buildCsvExport(dealerOrderExportDefinition, options);
    case "areas":
      return buildCsvExport(areaExportDefinition, options);
    case "tasks":
      return buildCsvExport(taskExportDefinition, options);
    case "cases":
      return buildCsvExport(caseExportDefinition, options);
    case "campaigns":
      return buildCsvExport(campaignExportDefinition, options);
  }
}

export async function exportSelectedCrmListCsv(
  entity: CsvExportEntity,
  options: CsvSelectedExportOptions
): Promise<CsvSelectedExportResult> {
  switch (entity) {
    case "accounts":
      return buildSelectedCsvExport(accountExportDefinition, options);
    case "contacts":
      return buildSelectedCsvExport(contactExportDefinition, options);
    case "opportunities":
      return buildSelectedCsvExport(opportunityExportDefinition, options);
    case "leads":
      return buildSelectedCsvExport(leadExportDefinition, options);
    case "activities":
      return buildSelectedCsvExport(activityExportDefinition, options);
    case "dealer-orders":
      return buildSelectedCsvExport(dealerOrderExportDefinition, options);
    case "areas":
      return buildSelectedCsvExport(areaExportDefinition, options);
    case "tasks":
      return buildSelectedCsvExport(taskExportDefinition, options);
    case "cases":
      return buildSelectedCsvExport(caseExportDefinition, options);
    case "campaigns":
      return buildSelectedCsvExport(campaignExportDefinition, options);
  }
}
