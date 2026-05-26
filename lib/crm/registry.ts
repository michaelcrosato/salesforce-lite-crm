import type {
  Account,
  Activity,
  Area,
  Campaign,
  Case,
  Contact,
  Deal,
  DealerOrder,
  KnowledgeArticle,
  Lead,
  Task
} from "@prisma/client";
import {
  ACCOUNT_STATUSES,
  ACTIVITY_TYPES,
  CONTACT_STATUSES,
  DEALER_ORDER_STATUSES,
  DEAL_STAGES,
  LEAD_STATUSES,
  type AccountStatus,
  type ActivityType,
  type ContactStatus,
  type DealerOrderStatus,
  type DealStage,
  type LeadStatus
} from "@/lib/crm-constants";

export type {
  Account,
  Activity,
  Area,
  Campaign,
  Case,
  Contact,
  Deal,
  DealerOrder,
  KnowledgeArticle,
  Lead,
  Task
};

export type Opportunity = Deal;
export type Note = Activity & { type: "note" };

export {
  ACCOUNT_STATUSES,
  ACTIVITY_TYPES,
  CONTACT_STATUSES,
  DEALER_ORDER_STATUSES,
  DEAL_STAGES,
  LEAD_STATUSES,
  type AccountStatus,
  type ActivityType,
  type ContactStatus,
  type DealerOrderStatus,
  type DealStage,
  type LeadStatus
};

export const TASK_STATUSES = [
  "open",
  "in_progress",
  "done",
  "cancelled"
] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const CASE_STATUSES = [
  "new",
  "in_progress",
  "waiting",
  "resolved",
  "closed"
] as const;
export type CaseStatus = (typeof CASE_STATUSES)[number];

export const CASE_PRIORITIES = ["low", "normal", "high", "urgent"] as const;
export type CasePriority = (typeof CASE_PRIORITIES)[number];

export const CASE_QUEUE_KEYS = [
  "critical_support",
  "billing_support",
  "dealer_operations",
  "data_quality",
  "customer_success",
  "general_support"
] as const;
export type CaseQueueKey = (typeof CASE_QUEUE_KEYS)[number];

export const KNOWLEDGE_ARTICLE_STATUSES = [
  "draft",
  "published",
  "archived"
] as const;
export type KnowledgeArticleStatus =
  (typeof KNOWLEDGE_ARTICLE_STATUSES)[number];

export const KNOWLEDGE_ARTICLE_AUDIENCES = [
  "internal",
  "customer"
] as const;
export type KnowledgeArticleAudience =
  (typeof KNOWLEDGE_ARTICLE_AUDIENCES)[number];

export const CAMPAIGN_STATUSES = [
  "planned",
  "active",
  "completed",
  "cancelled"
] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export type CrmEntityName =
  | "Account"
  | "Contact"
  | "Opportunity"
  | "Lead"
  | "Activity"
  | "Note"
  | "DealerOrder"
  | "Area"
  | "Task"
  | "Case"
  | "KnowledgeArticle"
  | "Campaign";

export type CrmEntityDefinition = {
  name: CrmEntityName;
  route: string;
  iconName: string;
  listLabel: string;
  singularLabel: string;
};

export const ENTITY_REGISTRY: readonly CrmEntityDefinition[] = [
  {
    name: "Account",
    route: "/accounts",
    iconName: "Building2",
    listLabel: "Accounts",
    singularLabel: "Account"
  },
  {
    name: "Contact",
    route: "/contacts",
    iconName: "Contact",
    listLabel: "Contacts",
    singularLabel: "Contact"
  },
  {
    name: "Opportunity",
    route: "/deals",
    iconName: "BadgeDollarSign",
    listLabel: "Opportunities",
    singularLabel: "Opportunity"
  },
  {
    name: "Lead",
    route: "/leads",
    iconName: "MapPinned",
    listLabel: "Leads",
    singularLabel: "Lead"
  },
  {
    name: "Activity",
    route: "/activities",
    iconName: "Activity",
    listLabel: "Activities",
    singularLabel: "Activity"
  },
  {
    name: "Note",
    route: "/activities?type=note",
    iconName: "NotebookText",
    listLabel: "Notes",
    singularLabel: "Note"
  },
  {
    name: "DealerOrder",
    route: "/orders",
    iconName: "ClipboardList",
    listLabel: "Dealer Orders",
    singularLabel: "Dealer Order"
  },
  {
    name: "Area",
    route: "/areas",
    iconName: "Map",
    listLabel: "Areas",
    singularLabel: "Area"
  },
  {
    name: "Task",
    route: "/tasks",
    iconName: "ListTodo",
    listLabel: "Tasks",
    singularLabel: "Task"
  },
  {
    name: "Case",
    route: "/cases",
    iconName: "LifeBuoy",
    listLabel: "Cases",
    singularLabel: "Case"
  },
  {
    name: "KnowledgeArticle",
    route: "/knowledge",
    iconName: "BookOpenText",
    listLabel: "Knowledge Articles",
    singularLabel: "Knowledge Article"
  },
  {
    name: "Campaign",
    route: "/campaigns",
    iconName: "Megaphone",
    listLabel: "Campaigns",
    singularLabel: "Campaign"
  }
] as const;

export const ROUTE_REGISTRY = {
  accounts: "/accounts",
  accountDetail: (id: string) => `/accounts/${encodeURIComponent(id)}`,
  contacts: "/contacts",
  contactDetail: (id: string) => `/contacts/${encodeURIComponent(id)}`,
  opportunities: "/deals",
  opportunityDetail: (id: string) => `/deals?deal=${encodeURIComponent(id)}`,
  leads: "/leads",
  leadDetail: (id: string) => `/leads/${encodeURIComponent(id)}`,
  activities: "/activities",
  notes: "/activities?type=note",
  dealerOrders: "/orders",
  dealerOrderDetail: (id: string) => `/orders/${encodeURIComponent(id)}`,
  areas: "/areas",
  tasks: "/tasks",
  taskDetail: (id: string) => `/tasks?task=${encodeURIComponent(id)}`,
  cases: "/cases",
  caseDetail: (id: string) => `/cases?case=${encodeURIComponent(id)}`,
  knowledgeArticles: "/knowledge",
  knowledgeArticleDetail: (id: string) =>
    `/knowledge?article=${encodeURIComponent(id)}`,
  campaigns: "/campaigns",
  campaignDetail: (id: string) =>
    `/campaigns?campaign=${encodeURIComponent(id)}`
} as const;
