export type ReportSlug =
  | "pipeline-by-stage"
  | "leads-by-source"
  | "activity-volume"
  | "top-accounts"
  | "stale-opportunities"
  | "overdue-tasks";

export type ReportDefinition = {
  slug: ReportSlug;
  title: string;
  description: string;
};

export const REPORT_DEFINITIONS: readonly ReportDefinition[] = [
  {
    slug: "pipeline-by-stage",
    title: "Pipeline by Stage",
    description: "Count, value, and weighted value of opportunities grouped by stage."
  },
  {
    slug: "leads-by-source",
    title: "Leads by Source",
    description: "Where consumer leads come from across the dealer routing model."
  },
  {
    slug: "activity-volume",
    title: "Activity Volume",
    description: "Daily activity counts over the last 30 days."
  },
  {
    slug: "top-accounts",
    title: "Top Accounts by Opportunity Value",
    description: "Accounts ranked by total opportunity value."
  },
  {
    slug: "stale-opportunities",
    title: "Stale Opportunities",
    description: "Open deals with no recent activity to follow up on."
  },
  {
    slug: "overdue-tasks",
    title: "Overdue Tasks",
    description: "Tasks past their due date that are still open."
  }
];

const SLUGS = new Set(REPORT_DEFINITIONS.map((report) => report.slug));

export function isReportSlug(value: string): value is ReportSlug {
  return SLUGS.has(value as ReportSlug);
}

export function getReportDefinition(slug: ReportSlug): ReportDefinition {
  const found = REPORT_DEFINITIONS.find((report) => report.slug === slug);
  if (!found) {
    throw new Error(`Unknown report slug: ${slug}`);
  }
  return found;
}
