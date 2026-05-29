import type { Metadata } from "next";
import { Fragment } from "react";
import Link from "next/link";
import { LeadForm } from "@/components/lead-form";
import { LeadFollowUpReadiness } from "@/components/lead-follow-up-readiness";
import { ListSelectedExportAction } from "@/components/list-selected-export-action";
import { PageHeader } from "@/components/page-header";
import { RoutingDecisionDetail } from "@/components/routing-decision-detail";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  ASSIGNMENT_REASON_LABELS,
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type AssignmentReason,
  type LeadStatus
} from "@/lib/crm-constants";
import { formatDate } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { boundedNumberQueryParam, nonEmptyQueryParam } from "@/lib/queryParams";
import { MAX_LEAD_DISPOSITION_LIMIT } from "@/lib/services/leadDispositions";
import { getRoutingDecisionsForLeads } from "@/lib/services/leads";
import { listLeadSlaFollowUpPacketBatch } from "@/lib/services/leadSlaFollowUp";
import { isLeadStatus } from "@/lib/validation";
import { cacheTag } from "next/cache";
import {
  SavedListViewControls,
  savedListViewStatus
} from "@/components/saved-list-view-controls";
import { getListFilterSupportEntityCatalog } from "@/lib/server/listFilterSupportCatalog";
import {
  buildSavedListViewQuery,
  listSavedListViews,
  type SavedListViewListQuery,
  type SavedListViewResolvedQuery
} from "@/lib/services/savedListViews";
import type { SortOrder } from "@/lib/services/listQuery";

async function getCachedLeads(
  status: string,
  areaId: string,
  orderId: string,
  source: string,
  sortBy: string,
  sortOrder: SortOrder,
  pageSize: number
) {
  "use cache";
  cacheTag("leads");

  return await prisma.lead.findMany({
    where: {
      ...(status !== "all" ? { status } : {}),
      ...(areaId !== "all" ? { areaId } : {}),
      ...(orderId !== "all" ? { assignedOrderId: orderId } : {}),
      ...(source !== "all" ? { source } : {})
    },
    orderBy: {
      [sortBy]: sortOrder
    },
    take: pageSize,
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
  });
}

async function getCachedAreas() {
  "use cache";
  cacheTag("areas");

  return await prisma.area.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true
    }
  });
}

async function getCachedOrders() {
  "use cache";
  cacheTag("orders");

  return await prisma.dealerOrder.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true
    }
  });
}

async function getCachedSources() {
  "use cache";
  cacheTag("leads");

  return await prisma.lead.findMany({
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
  });
}

export const metadata: Metadata = {
  title: "Lead Inbox"
};

type LeadsSearchParams = {
  status?: string;
  area?: string;
  order?: string;
  source?: string;
  view?: string;
  savedViewStatus?: string;
  sortBy?: string;
  sortOrder?: string;
  pageSize?: string;
};

const LEAD_SORT_KEYS = ["lastName", "firstName", "createdAt", "updatedAt"] as const;
type LeadSortBy = (typeof LEAD_SORT_KEYS)[number];
const DEFAULT_LEAD_SORT_BY: LeadSortBy = "createdAt";

function isLeadSortBy(value: string | undefined): value is LeadSortBy {
  if (!value) {
    return false;
  }
  return (LEAD_SORT_KEYS as readonly string[]).includes(value);
}

function sortOrderParam(value: string | undefined): SortOrder | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function stringFilter(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

async function resolveLeadSavedViewQuery(
  savedViewId: string | undefined,
  query: SavedListViewListQuery
): Promise<{ resolved: SavedListViewResolvedQuery; invalidView: boolean }> {
  if (!savedViewId) {
    return {
      invalidView: false,
      resolved: {
        entity: "leads",
        selectedView: null,
        source: "current-query",
        query
      }
    };
  }

  try {
    return {
      invalidView: false,
      resolved: await buildSavedListViewQuery({
        entity: "leads",
        savedViewId,
        query
      })
    };
  } catch {
    return {
      invalidView: true,
      resolved: {
        entity: "leads",
        selectedView: null,
        source: "current-query",
        query
      }
    };
  }
}

export default async function LeadsPage({
  searchParams
}: {
  searchParams: Promise<LeadsSearchParams>;
}) {
  const params = await searchParams;
  const leadCatalog = getListFilterSupportEntityCatalog("leads");
  if (!leadCatalog) {
    throw new Error("Lead saved view support catalog is missing.");
  }

  const currentQuery: SavedListViewListQuery = {
    pageSize: boundedNumberQueryParam(params.pageSize, { min: 1, max: 100 }) ?? 100,
    sortBy: isLeadSortBy(params.sortBy) ? params.sortBy : DEFAULT_LEAD_SORT_BY,
    sortOrder: sortOrderParam(params.sortOrder) ?? leadCatalog.defaultSortOrder,
    filters: {
      status: params.status && isLeadStatus(params.status) ? params.status : undefined,
      areaId: nonEmptyQueryParam(params.area),
      assignedOrderId: nonEmptyQueryParam(params.order),
      source: nonEmptyQueryParam(params.source)
    }
  };

  const [savedViews, savedViewState] = await Promise.all([
    listSavedListViews({ entity: "leads" }),
    resolveLeadSavedViewQuery(nonEmptyQueryParam(params.view), currentQuery)
  ]);

  const effectiveFilters = savedViewState.resolved.query.filters ?? {};
  
  const status = stringFilter(effectiveFilters.status) && isLeadStatus(String(effectiveFilters.status))
    ? String(effectiveFilters.status)
    : "all";
  const areaId = stringFilter(effectiveFilters.areaId) ?? "all";
  const orderId = stringFilter(effectiveFilters.assignedOrderId) ?? "all";
  const source = stringFilter(effectiveFilters.source) ?? "all";

  const sortBy = isLeadSortBy(savedViewState.resolved.query.sortBy)
    ? savedViewState.resolved.query.sortBy
    : DEFAULT_LEAD_SORT_BY;
  const sortOrder =
    savedViewState.resolved.query.sortOrder ?? leadCatalog.defaultSortOrder;
  const pageSize = savedViewState.resolved.query.pageSize ?? 100;

  const [leads, areas, orders, sources] = await Promise.all([
    getCachedLeads(status, areaId, orderId, source, sortBy, sortOrder, pageSize),
    getCachedAreas(),
    getCachedOrders(),
    getCachedSources()
  ]);

  const leadIds = leads.map((lead) => lead.id);
  const [decisionsByLeadId, leadFollowUpBatch] = await Promise.all([
    getRoutingDecisionsForLeads(leadIds),
    listLeadSlaFollowUpPacketBatch({
      leadIds,
      limit: MAX_LEAD_DISPOSITION_LIMIT
    })
  ]);

  return (
    <div className="crm-page" data-testid="page-leads">
      <PageHeader
        title="Lead Inbox"
        description="Create postal-code leads and review deterministic dealer routing decisions."
      />

      <div id="create-lead">
        <LeadForm />
      </div>

      <LeadFollowUpReadiness
        batch={leadFollowUpBatch}
        filteredLeadCount={leads.length}
      />

      <Card>
        <CardHeader className="gap-4">
          <CardTitle>Leads</CardTitle>
          <form action="/leads" className="grid gap-3 md:grid-cols-4 lg:grid-cols-6">
            <div className="space-y-1">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={status}>
                <option value="all">All statuses</option>
                {LEAD_STATUSES.map((leadStatus) => (
                  <option key={leadStatus} value={leadStatus}>
                    {LEAD_STATUS_LABELS[leadStatus]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="area">Area</Label>
              <Select id="area" name="area" defaultValue={areaId}>
                <option value="all">All areas</option>
                {areas.map((area) => (
                  <option key={area.id} value={area.id}>
                    {area.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="order">Dealer Order</Label>
              <Select id="order" name="order" defaultValue={orderId}>
                <option value="all">All orders</option>
                {orders.map((order) => (
                  <option key={order.id} value={order.id}>
                    {order.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="source">Source</Label>
              <Select id="source" name="source" defaultValue={source}>
                <option value="all">All sources</option>
                {sources.map((sourceOption) =>
                  sourceOption.source ? (
                    <option key={sourceOption.source} value={sourceOption.source}>
                      {sourceOption.source}
                    </option>
                  ) : null
                )}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sortBy">Sort by</Label>
              <Select id="sortBy" name="sortBy" defaultValue={sortBy}>
                {leadCatalog.sortKeys.map((sortKey) => (
                  <option key={sortKey.key} value={sortKey.key}>
                    {sortKey.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="sortOrder">Order</Label>
              <Select id="sortOrder" name="sortOrder" defaultValue={sortOrder}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </Select>
            </div>
            <div className="flex items-end gap-3 md:col-span-4 lg:col-span-6">
              <Button type="submit" variant="secondary">
                Apply Filters
              </Button>
              <Button asChild variant="outline">
                <Link href="/leads">Reset</Link>
              </Button>
            </div>
          </form>
          
          <div className="mt-5 border-t pt-5">
            <SavedListViewControls
              entity="leads"
              route="/leads"
              savedViews={savedViews}
              selectedView={savedViewState.resolved.selectedView}
              status={
                savedViewState.invalidView
                  ? "error"
                  : savedListViewStatus(params.savedViewStatus)
              }
              current={{
                filters: {
                  status: status !== "all" ? status : undefined,
                  areaId: areaId !== "all" ? areaId : undefined,
                  assignedOrderId: orderId !== "all" ? orderId : undefined,
                  source: source !== "all" ? source : undefined
                },
                pageSize,
                sortBy,
                sortOrder
              }}
            />
          </div>
        </CardHeader>
        <CardContent>
          {leads.length > 0 ? (
            <div className="overflow-x-auto">
              <ListSelectedExportAction
                entity="leads"
                entityLabel="Leads"
                records={leads.map((lead) => ({
                  id: lead.id,
                  label: `${lead.firstName} ${lead.lastName}`
                }))}
              />
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
