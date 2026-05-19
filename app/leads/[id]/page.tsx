import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityTimeline } from "@/components/activity-timeline";
import { LeadStatusControl } from "@/components/lead-status-control";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ASSIGNMENT_REASON_LABELS,
  LEAD_STATUS_LABELS,
  type AssignmentReason,
  type LeadStatus
} from "@/lib/crm-constants";
import { formatDate } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { isLeadStatus } from "@/lib/validation";

export const dynamic = "force-dynamic";

export default async function LeadDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const lead = await prisma.lead.findUnique({
    where: {
      id
    },
    include: {
      area: true,
      assignedOrder: {
        include: {
          account: {
            select: {
              id: true,
              name: true
            }
          }
        }
      },
      activities: {
        orderBy: {
          createdAt: "desc"
        },
        include: {
          account: {
            select: {
              id: true,
              name: true
            }
          },
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          },
          deal: {
            select: {
              id: true,
              name: true
            }
          },
          lead: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      }
    }
  });

  if (!lead) {
    notFound();
  }

  const status = isLeadStatus(lead.status) ? lead.status : "new";

  return (
    <div className="crm-page">
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        description="Lead routing details, assignment reason, and routing event timeline."
      />

      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Lead Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2">
              <Summary label="Phone" value={lead.phone ?? "No phone"} />
              <Summary label="Email" value={lead.email ?? "No email"} />
              <Summary
                label="Postal Code"
                value={lead.postalCode ?? "No postal code"}
              />
              <Summary
                label="Province"
                value={lead.province ?? "No province"}
              />
              <Summary label="Source" value={lead.source ?? "No source"} />
              <Summary label="Created" value={formatDate(lead.createdAt)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={lead.activities} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Assignment</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Status
                </p>
                <div className="mt-2">
                  <LeadStatusControl
                    leadId={lead.id}
                    status={status as LeadStatus}
                  />
                </div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Reason
                </p>
                <div className="mt-2">{reasonBadge(lead.assignmentReason)}</div>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Area
                </p>
                <p className="mt-1 font-medium">
                  {lead.area?.name ?? "Unresolved"}
                </p>
              </div>
              <div>
                <p className="text-xs font-medium uppercase text-muted-foreground">
                  Dealer
                </p>
                {lead.assignedOrder ? (
                  <div className="mt-1 space-y-1">
                    <Link
                      href={`/orders/${lead.assignedOrder.id}`}
                      className="block font-medium text-primary hover:underline"
                    >
                      {lead.assignedOrder.name}
                    </Link>
                    <Link
                      href={`/accounts/${lead.assignedOrder.account.id}`}
                      className="block text-muted-foreground hover:text-primary"
                    >
                      {lead.assignedOrder.account.name}
                    </Link>
                  </div>
                ) : (
                  <p className="mt-1 text-muted-foreground">
                    No dealer order assigned
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Summary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <p className="text-xs font-medium uppercase text-muted-foreground">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium">{value}</p>
    </div>
  );
}

function reasonBadge(reason: string | null) {
  if (!reason) {
    return <Badge variant="outline">No decision</Badge>;
  }

  const label = ASSIGNMENT_REASON_LABELS[reason as AssignmentReason] ?? reason;

  return (
    <Badge variant={reason === "routed" ? "success" : "warning"}>{label}</Badge>
  );
}
