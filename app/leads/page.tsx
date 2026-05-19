import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { LeadForm } from "@/components/lead-form";
import { PageHeader } from "@/components/page-header";
import { RoutingDecisionDetail } from "@/components/routing-decision-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { getRoutingDecisionForLead } from "@/lib/crm/crmClient";
import {
  ASSIGNMENT_REASON_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type AssignmentReason,
  type LeadStatus
} from "@/lib/crm-constants";
import { formatDate } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { isLeadStatus } from "@/lib/validation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Lead Inbox"
};

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<{ status?: string; area?: string; order?: string; source?: string }>;
}) {
  const params = await searchParams;
  const status = params.status && isLeadStatus(params.status) ? params.status : "all";
  const areaId = params.area ?? "all";
  const orderId = params.order ?? "all";
  const source = params.source ?? "all";
  const [leads, areas, orders, sources] = await Promise.all([
    prisma.lead.findMany({
      where: {
        ...(status !== "all" ? { status } : {}),
        ...(areaId !== "all" ? { areaId } : {}),
        ...(orderId !== "all" ? { assignedOrderId: orderId } : {}),
        ...(source !== "all" ? { source } : {})
      },
      orderBy: {
        createdAt: "desc"
      },
      include: {
        area: {
          select: {
            id: true,
            name: true
          }
        },
        assignedOrder: {
          select: {
            id: true,
            name: true,
            account: {
              select: {
                id: true,
                name: true
              }
            }
          }
        }
      }
    }),
    prisma.area.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    }),
    prisma.dealerOrder.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    }),
    prisma.lead.findMany({
      where: {
        source: {
          not: null
        }
      },
      distinct: ["source"],
      orderBy: {
        source: "asc"
      },
      select: {
        source: true
      }
    })
  ]);

  const routingDecisions = await Promise.all(
    leads.map((lead) => getRoutingDecisionForLead(lead.id))
  );
  const decisionsByLeadId = new Map(
    leads.map((lead, index) => [lead.id, routingDecisions[index] ?? null])
  );

  return (
    <div className="crm-page" data-testid="page-leads">
      <PageHeader
        title="Lead Inbox"
        description="Create postal-code leads and review deterministic dealer routing decisions."
      />

      <div id="create-lead">
        <LeadForm />
      </div>

      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Leads</CardTitle>
          <form action="/leads" className="grid gap-3 md:grid-cols-4">
            <Select name="status" defaultValue={status}>
              <option value="all">All statuses</option>
              {LEAD_STATUSES.map((leadStatus) => (
                <option key={leadStatus} value={leadStatus}>
                  {LEAD_STATUS_LABELS[leadStatus]}
                </option>
              ))}
            </Select>
            <Select name="area" defaultValue={areaId}>
              <option value="all">All areas</option>
              {areas.map((area) => (
                <option key={area.id} value={area.id}>
                  {area.name}
                </option>
              ))}
            </Select>
            <Select name="order" defaultValue={orderId}>
              <option value="all">All orders</option>
              {orders.map((order) => (
                <option key={order.id} value={order.id}>
                  {order.name}
                </option>
              ))}
            </Select>
            <div className="grid grid-cols-[1fr_auto] gap-2">
              <Select name="source" defaultValue={source}>
                <option value="all">All sources</option>
                {sources.map((sourceOption) =>
                  sourceOption.source ? (
                    <option key={sourceOption.source} value={sourceOption.source}>
                      {sourceOption.source}
                    </option>
                  ) : null
                )}
              </Select>
              <Button type="submit" variant="secondary">
                Apply
              </Button>
            </div>
          </form>
        </CardHeader>
        <CardContent>
          {leads.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-xs uppercase text-muted-foreground">
                    <th className="py-3 pr-4 font-medium">Lead</th>
                    <th className="py-3 pr-4 font-medium">Postal</th>
                    <th className="py-3 pr-4 font-medium">Area</th>
                    <th className="py-3 pr-4 font-medium">Assigned dealer</th>
                    <th className="py-3 pr-4 font-medium">Status</th>
                    <th className="py-3 pr-4 font-medium">Reason</th>
                    <th className="py-3 pr-4 font-medium">Created</th>
                  </tr>
                </thead>
                <tbody>
                  {leads.map((lead) => (
                    <Fragment key={lead.id}>
                      <tr className="border-b last:border-0">
                        <td className="py-3 pr-4 font-medium">
                          <Link href={`/leads/${lead.id}`} className="text-primary hover:underline">
                            {lead.firstName} {lead.lastName}
                          </Link>
                        </td>
                        <td className="py-3 pr-4">{lead.postalCode ?? "No postal"}</td>
                        <td className="py-3 pr-4">{lead.area?.name ?? "Unresolved"}</td>
                        <td className="py-3 pr-4">
                          {lead.assignedOrder ? (
                            <Link
                              href={`/orders/${lead.assignedOrder.id}`}
                              className="text-primary hover:underline"
                            >
                              {lead.assignedOrder.account.name}
                            </Link>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <Badge variant={lead.status === "assigned" ? "success" : "secondary"}>
                            {isLeadStatus(lead.status)
                              ? LEAD_STATUS_LABELS[lead.status as LeadStatus]
                              : lead.status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4">
                          {reasonBadge(lead.assignmentReason)}
                        </td>
                        <td className="py-3 pr-4">{formatDate(lead.createdAt)}</td>
                      </tr>
                      <tr className="border-b last:border-0">
                        <td colSpan={7} className="pb-3 pr-4">
                          <RoutingDecisionDetail
                            decision={decisionsByLeadId.get(lead.id) ?? null}
                            testid={`routing-detail-${lead.id}`}
                          />
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <EmptyState
              title="No leads found"
              description="Create a lead or adjust the filters."
              actionHref="#create-lead"
              actionLabel="Create lead"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function reasonBadge(reason: string | null) {
  if (!reason) {
    return <Badge variant="outline">No decision</Badge>;
  }

  const knownReason = reason as AssignmentReason;
  const label = ASSIGNMENT_REASON_LABELS[knownReason] ?? reason;

  return (
    <Badge variant={reason === "routed" ? "success" : "warning"}>
      {label}
    </Badge>
  );
}
