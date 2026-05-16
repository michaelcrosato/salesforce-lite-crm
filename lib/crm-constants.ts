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
  "status_change"
] as const;
export type ActivityType = (typeof ACTIVITY_TYPES)[number];

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
  status_change: "Status Change"
};
