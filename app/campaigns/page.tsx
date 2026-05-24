import type { Metadata } from "next";
import Link from "next/link";
import { CampaignsView } from "@/components/campaigns/campaigns-view";
import {
  type CampaignRow
} from "@/components/campaigns/campaigns-table";
import {
  type DrawerCampaign
} from "@/components/campaigns/campaign-detail-drawer";
import { type CampaignOptionItem } from "@/components/campaigns/campaign-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import {
  SavedListViewControls,
  savedListViewStatus
} from "@/components/saved-list-view-controls";
import { Select } from "@/components/ui/select";
import {
  getCampaign,
  listCampaigns
} from "@/lib/crm/crmClient";
import type { CampaignListOptions } from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";
import {
  CAMPAIGN_STATUSES,
  type CampaignStatus
} from "@/lib/crm/registry";
import { getListFilterSupportEntityCatalog } from "@/lib/server/listFilterSupportCatalog";
import {
  buildSavedListViewQuery,
  listSavedListViews,
  type SavedListViewListQuery,
  type SavedListViewResolvedQuery
} from "@/lib/services/savedListViews";
import type { SortOrder } from "@/lib/services/listQuery";
import { dateQueryParam, nonEmptyQueryParam } from "@/lib/queryParams";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Campaigns"
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled"
};

type CampaignsSearchParams = {
  campaign?: string;
  status?: string;
  ownerId?: string;
  startFrom?: string;
  startTo?: string;
  sortBy?: string;
  sortOrder?: string;
  pageSize?: string;
  view?: string;
  savedViewStatus?: string;
};

const CAMPAIGN_SORT_KEYS = [
  "startDate",
  "createdAt",
  "status",
  "name",
  "budget"
] as const;

type CampaignSortBy = (typeof CAMPAIGN_SORT_KEYS)[number];
const DEFAULT_CAMPAIGN_SORT_BY: CampaignSortBy = "startDate";

function isCampaignStatus(value: string | undefined): value is CampaignStatus {
  if (!value) {
    return false;
  }
  return (CAMPAIGN_STATUSES as readonly string[]).includes(value);
}

function isCampaignSortBy(value: string | undefined): value is CampaignSortBy {
  if (!value) {
    return false;
  }
  return (CAMPAIGN_SORT_KEYS as readonly string[]).includes(value);
}

function sortOrderParam(value: string | undefined): SortOrder | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function stringFilter(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function dateFilterValue(value: unknown): string | undefined {
  const text = stringFilter(value);

  if (!text) {
    return undefined;
  }

  const parsed = new Date(text);
  return Number.isNaN(parsed.getTime())
    ? undefined
    : parsed.toISOString().slice(0, 10);
}

async function resolveCampaignSavedViewQuery(
  savedViewId: string | undefined,
  query: SavedListViewListQuery
): Promise<{ resolved: SavedListViewResolvedQuery; invalidView: boolean }> {
  if (!savedViewId) {
    return {
      invalidView: false,
      resolved: {
        entity: "campaigns",
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
        entity: "campaigns",
        savedViewId,
        query
      })
    };
  } catch {
    return {
      invalidView: true,
      resolved: {
        entity: "campaigns",
        selectedView: null,
        source: "current-query",
        query
      }
    };
  }
}

export default async function CampaignsPage({
  searchParams
}: {
  searchParams: Promise<CampaignsSearchParams>;
}) {
  const params = await searchParams;
  const campaignCatalog = getListFilterSupportEntityCatalog("campaigns");

  if (!campaignCatalog) {
    throw new Error("Campaign saved view support catalog is missing.");
  }

  const currentQuery: SavedListViewListQuery = {
    pageSize: 100,
    sortBy: isCampaignSortBy(params.sortBy)
      ? params.sortBy
      : DEFAULT_CAMPAIGN_SORT_BY,
    sortOrder:
      sortOrderParam(params.sortOrder) ?? campaignCatalog.defaultSortOrder,
    filters: {
      status: isCampaignStatus(params.status) ? params.status : undefined,
      ownerId: nonEmptyQueryParam(params.ownerId),
      startDateFrom: dateQueryParam(params.startFrom),
      startDateTo: dateQueryParam(params.startTo)
    }
  };
  const [savedViews, savedViewState] = await Promise.all([
    listSavedListViews({ entity: "campaigns" }),
    resolveCampaignSavedViewQuery(nonEmptyQueryParam(params.view), currentQuery)
  ]);
  const effectiveFilters = savedViewState.resolved.query.filters ?? {};
  const effectiveStatus = stringFilter(effectiveFilters.status);
  const statusFilter = isCampaignStatus(effectiveStatus)
    ? effectiveStatus
    : undefined;
  const ownerFilter = stringFilter(effectiveFilters.ownerId);
  const startDateFrom = dateFilterValue(effectiveFilters.startDateFrom);
  const startDateTo = dateFilterValue(effectiveFilters.startDateTo);
  const sortBy = isCampaignSortBy(savedViewState.resolved.query.sortBy)
    ? savedViewState.resolved.query.sortBy
    : DEFAULT_CAMPAIGN_SORT_BY;
  const sortOrder =
    savedViewState.resolved.query.sortOrder ?? campaignCatalog.defaultSortOrder;
  const pageSize = savedViewState.resolved.query.pageSize ?? 100;

  const listOptions: CampaignListOptions = {
    pageSize,
    sortBy,
    sortOrder,
    filters: {
      status: statusFilter,
      ownerId: ownerFilter,
      startDateFrom,
      startDateTo
    }
  };

  const [campaigns, owners] = await Promise.all([
    listCampaigns(listOptions),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    })
  ]);

  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));

  const ownerOptions: CampaignOptionItem[] = owners.map((owner) => ({
    id: owner.id,
    label: owner.name
  }));

  const tableRows: CampaignRow[] = campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status as CampaignStatus,
    startDate: campaign.startDate ? campaign.startDate.toISOString() : null,
    endDate: campaign.endDate ? campaign.endDate.toISOString() : null,
    budget: campaign.budget,
    owner: campaign.ownerId
      ? {
          id: campaign.ownerId,
          name: ownerById.get(campaign.ownerId)?.name ?? "Unassigned"
        }
      : null
  }));

  let drawerCampaign: DrawerCampaign | null = null;
  if (params.campaign) {
    const found = await getCampaign(params.campaign);
    if (found) {
      drawerCampaign = {
        id: found.id,
        name: found.name,
        description: found.description,
        status: found.status as CampaignStatus,
        startDate: found.startDate ? found.startDate.toISOString() : null,
        endDate: found.endDate ? found.endDate.toISOString() : null,
        budget: found.budget,
        ownerId: found.ownerId,
        ownerName: found.ownerId
          ? ownerById.get(found.ownerId)?.name ?? null
          : null,
        createdAt: found.createdAt.toISOString(),
        updatedAt: found.updatedAt.toISOString()
      };
    }
  }

  return (
    <div className="crm-page">
      <PageHeader
        title="Campaigns"
        description="Coordinate outreach programs across leads and contacts."
      >
        <Button asChild>
          <Link href="/campaigns/new">New campaign</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/campaigns" className="grid gap-4 lg:grid-cols-6">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={statusFilter ?? ""}>
                <option value="">All</option>
                {CAMPAIGN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="ownerId">Owner</Label>
              <Select id="ownerId" name="ownerId" defaultValue={ownerFilter ?? ""}>
                <option value="">Any owner</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startFrom">Start from</Label>
              <Input
                id="startFrom"
                name="startFrom"
                type="date"
                defaultValue={startDateFrom ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTo">Start to</Label>
              <Input
                id="startTo"
                name="startTo"
                type="date"
                defaultValue={startDateTo ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortBy">Sort by</Label>
              <Select id="sortBy" name="sortBy" defaultValue={sortBy}>
                {campaignCatalog.sortKeys.map((sortKey) => (
                  <option key={sortKey.key} value={sortKey.key}>
                    {sortKey.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="sortOrder">Order</Label>
              <Select id="sortOrder" name="sortOrder" defaultValue={sortOrder}>
                <option value="asc">Ascending</option>
                <option value="desc">Descending</option>
              </Select>
            </div>
            <div className="flex items-end gap-3 lg:col-span-6">
              <Button type="submit">Apply filters</Button>
              <Button asChild variant="outline">
                <Link href="/campaigns">Reset</Link>
              </Button>
            </div>
          </form>
          <div className="mt-5 border-t pt-5">
            <SavedListViewControls
              entity="campaigns"
              route="/campaigns"
              savedViews={savedViews}
              selectedView={savedViewState.resolved.selectedView}
              status={
                savedViewState.invalidView
                  ? "error"
                  : savedListViewStatus(params.savedViewStatus)
              }
              current={{
                filters: {
                  status: statusFilter,
                  ownerId: ownerFilter,
                  startDateFrom,
                  startDateTo
                },
                pageSize,
                sortBy,
                sortOrder
              }}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign List</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignsView
            campaigns={tableRows}
            drawerCampaign={drawerCampaign}
            owners={ownerOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
