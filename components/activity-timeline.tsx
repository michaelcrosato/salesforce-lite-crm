import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { ACTIVITY_TYPE_LABELS, type ActivityType } from "@/lib/crm-constants";
import { formatDate } from "@/lib/formatters";
import { isActivityType } from "@/lib/validation";

export type TimelineActivity = {
  id: string;
  type: string;
  title: string;
  summary: string | null;
  nextStep: string | null;
  rawText: string | null;
  createdAt: Date | string;
  account?: {
    id: string;
    name: string;
  } | null;
  contact?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  deal?: {
    id: string;
    name: string;
  } | null;
  lead?: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
};

export function ActivityTimeline({ activities }: { activities: TimelineActivity[] }) {
  if (activities.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
        No activity yet. Add a note to start the timeline.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activities.map((activity) => {
        const label = isActivityType(activity.type)
          ? ACTIVITY_TYPE_LABELS[activity.type as ActivityType]
          : activity.type;

        return (
          <article key={activity.id} className="rounded-md border bg-card p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={activity.type === "status_change" ? "warning" : "secondary"}>
                {label}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {formatDate(activity.createdAt)}
              </span>
            </div>
            <h3 className="mt-3 text-sm font-semibold">{activity.title}</h3>
            {activity.summary ? (
              <p className="mt-2 text-sm text-muted-foreground" data-testid="activity-timeline-summary">{activity.summary}</p>
            ) : activity.rawText ? (
              <p className="mt-2 text-sm text-muted-foreground" data-testid="activity-timeline-summary">{activity.rawText}</p>
            ) : null}
            {activity.nextStep ? (
              <p className="mt-3 rounded-md bg-accent px-3 py-2 text-sm font-medium text-accent-foreground">
                Next: {activity.nextStep}
              </p>
            ) : null}
            <div className="mt-3 flex flex-wrap gap-3 text-xs text-muted-foreground">
              {activity.account ? (
                <Link href={`/accounts/${activity.account.id}`} className="hover:text-primary">
                  {activity.account.name}
                </Link>
              ) : null}
              {activity.contact ? (
                <Link href={`/contacts/${activity.contact.id}`} className="hover:text-primary">
                  {activity.contact.firstName} {activity.contact.lastName}
                </Link>
              ) : null}
              {activity.deal ? (
                <Link href={`/deals?deal=${activity.deal.id}`} className="hover:text-primary">
                  {activity.deal.name}
                </Link>
              ) : null}
              {activity.lead ? (
                <Link href={`/leads/${activity.lead.id}`} className="hover:text-primary">
                  {activity.lead.firstName} {activity.lead.lastName}
                </Link>
              ) : null}
            </div>
          </article>
        );
      })}
    </div>
  );
}
