export const ACCOUNT_STATUSES = ["active", "paused", "churned"] as const;
export type AccountStatus = (typeof ACCOUNT_STATUSES)[number];

export const CONTACT_STATUSES = ["active", "inactive"] as const;
export type ContactStatus = (typeof CONTACT_STATUSES)[number];

export const DEAL_STAGES = [
  "new",
  "qualified",
  "proposal",
  "negotiation",
  "won",
  "lost"
] as const;
export type DealStage = (typeof DEAL_STAGES)[number];

export const OPEN_DEAL_STAGES: DealStage[] = [
  "new",
  "qualified",
  "proposal",
  "negotiation"
];

export const ACTIVITY_TYPES = [
  "note",
  "call",
  "email",
  "meeting",
  "status_change",
  "routing_event"
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

export const LEAD_STATUSES = [
  "new",
  "assigned",
  "contacted",
  "closed",
  "dead"
] as const;
export type LeadStatus = (typeof LEAD_STATUSES)[number];

export const DEALER_ORDER_STATUSES = ["active", "paused", "complete"] as const;
export type DealerOrderStatus = (typeof DEALER_ORDER_STATUSES)[number];

export const ASSIGNMENT_REASONS = [
  "routed",
  "no_area_match",
  "no_matching_active_order",
  "all_orders_at_quota"
] as const;
export type AssignmentReason = (typeof ASSIGNMENT_REASONS)[number];

export const STAGE_LABELS: Record<DealStage, string> = {
  new: "New",
  qualified: "Qualified",
  proposal: "Proposal",
  negotiation: "Negotiation",
  won: "Won",
  lost: "Lost"
};

export const ACCOUNT_STATUS_LABELS: Record<AccountStatus, string> = {
  active: "Active",
  paused: "Paused",
  churned: "Churned"
};

export const CONTACT_STATUS_LABELS: Record<ContactStatus, string> = {
  active: "Active",
  inactive: "Inactive"
};

export const ACTIVITY_TYPE_LABELS: Record<ActivityType, string> = {
  note: "Note",
  call: "Call",
  email: "Email",
  meeting: "Meeting",
  status_change: "Status Change",
  routing_event: "Routing Event"
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  new: "New",
  assigned: "Assigned",
  contacted: "Contacted",
  closed: "Closed",
  dead: "Dead"
};

export const DEALER_ORDER_STATUS_LABELS: Record<DealerOrderStatus, string> = {
  active: "Active",
  paused: "Paused",
  complete: "Complete"
};

export const ASSIGNMENT_REASON_LABELS: Record<AssignmentReason, string> = {
  routed: "Routed",
  no_area_match: "No area match",
  no_matching_active_order: "No active order",
  all_orders_at_quota: "At quota"
};
