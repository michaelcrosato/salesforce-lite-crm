import type { Metadata } from "next";
import Link from "next/link";
import { DealBoard, type BoardDeal } from "@/components/deal-board";
import { KpiCard } from "@/components/kpi-card";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  calculateWeightedForecast,
  isOpenDealStage,
  isStaleDeal
} from "@/lib/business/deals";
import { DEAL_STAGES, type DealStage } from "@/lib/crm-constants";
import { formatCurrency, formatNumber } from "@/lib/formatters";
import { cacheTag } from "next/cache";
import { prisma } from "@/lib/prisma";
import { boundedNumberQueryParam, nonEmptyQueryParam } from "@/lib/queryParams";
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

async function getCachedDeals(
  stage: string | undefined,
  accountId: string | undefined,
  ownerId: string | undefined,
  search: string | undefined,
  sortBy: string,
  sortOrder: SortOrder,
  pageSize: number
) {
  "use cache";
  cacheTag("deals");

  return await Promise.all([
    prisma.deal.findMany({
      where: {
        ...(stage ? { stage } : {}),
        ...(accountId ? { accountId } : {}),
        ...(ownerId ? { ownerId } : {}),
        ...(search ? { name: { contains: search } } : {})
      },
      orderBy: [
        {
          [sortBy]: sortOrder
        },
        {
          id: "desc" // stable tie-breaker
        }
      ],
      take: pageSize,
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
        owner: {
          select: {
            id: true,
            name: true
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
            }
          }
        }
      }
    }),
    prisma.account.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    }),
    prisma.contact.findMany({
      orderBy: [
        {
          lastName: "asc"
        },
        {
          firstName: "asc"
        }
      ],
      select: {
        id: true,
        accountId: true,
        firstName: true,
        lastName: true
      }
    }),
    prisma.user.findMany({
      orderBy: {
        name: "asc"
      },
      select: {
        id: true,
        name: true
      }
    })
  ]);
}

export const metadata: Metadata = {
  title: "Deals"
};

type DealsSearchParams = {
  deal?: string;
  stage?: string;
  accountId?: string;
  ownerId?: string;
  search?: string;
  sortBy?: string;
  sortOrder?: string;
  pageSize?: string;
  view?: string;
  savedViewStatus?: string;
};

const DEAL_SORT_KEYS = ["name", "stage", "value", "createdAt", "updatedAt"] as const;
type DealSortBy = (typeof DEAL_SORT_KEYS)[number];
const DEFAULT_DEAL_SORT_BY: DealSortBy = "updatedAt";

function isDealSortBy(value: string | undefined): value is DealSortBy {
  if (!value) {
    return false;
  }
  return (DEAL_SORT_KEYS as readonly string[]).includes(value);
}

function isDealStage(value: string | undefined): value is DealStage {
  if (!value) {
    return false;
  }
  return (DEAL_STAGES as readonly string[]).includes(value);
}

function sortOrderParam(value: string | undefined): SortOrder | undefined {
  return value === "asc" || value === "desc" ? value : undefined;
}

function stringFilter(value: unknown): string | undefined {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : undefined;
}

async function resolveDealSavedViewQuery(
  savedViewId: string | undefined,
  query: SavedListViewListQuery
): Promise<{ resolved: SavedListViewResolvedQuery; invalidView: boolean }> {
  if (!savedViewId) {
    return {
      invalidView: false,
      resolved: {
        entity: "opportunities",
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
        entity: "opportunities",
        savedViewId,
        query
      })
    };
  } catch {
    return {
      invalidView: true,
      resolved: {
        entity: "opportunities",
        selectedView: null,
        source: "current-query",
        query
      }
    };
  }
}

export default async function DealsPage({
  searchParams
}: {
  searchParams: Promise<DealsSearchParams>;
}) {
  const params = await searchParams;
  const dealCatalog = getListFilterSupportEntityCatalog("opportunities");
  if (!dealCatalog) {
    throw new Error("Deal saved view support catalog is missing.");
  }

  const currentQuery: SavedListViewListQuery = {
    pageSize: boundedNumberQueryParam(params.pageSize, { min: 1, max: 100 }) ?? 100,
    sortBy: isDealSortBy(params.sortBy) ? params.sortBy : DEFAULT_DEAL_SORT_BY,
    sortOrder: sortOrderParam(params.sortOrder) ?? dealCatalog.defaultSortOrder,
    filters: {
      stage: isDealStage(params.stage) ? params.stage : undefined,
      accountId: nonEmptyQueryParam(params.accountId),
      ownerId: nonEmptyQueryParam(params.ownerId),
      search: nonEmptyQueryParam(params.search)
    }
  };

  const [savedViews, savedViewState] = await Promise.all([
    listSavedListViews({ entity: "opportunities" }),
    resolveDealSavedViewQuery(nonEmptyQueryParam(params.view), currentQuery)
  ]);

  const effectiveFilters = savedViewState.resolved.query.filters ?? {};

  const stage = stringFilter(effectiveFilters.stage) && isDealStage(String(effectiveFilters.stage))
    ? (effectiveFilters.stage as DealStage)
    : undefined;
  const accountId = stringFilter(effectiveFilters.accountId);
  const ownerId = stringFilter(effectiveFilters.ownerId);
  const search = stringFilter(effectiveFilters.search);

  const sortBy = isDealSortBy(savedViewState.resolved.query.sortBy)
    ? savedViewState.resolved.query.sortBy
    : DEFAULT_DEAL_SORT_BY;
  const sortOrder =
    savedViewState.resolved.query.sortOrder ?? dealCatalog.defaultSortOrder;
  const pageSize = savedViewState.resolved.query.pageSize ?? 100;

  const [deals, accounts, contacts, owners] = await getCachedDeals(
    stage,
    accountId,
    ownerId,
    search,
    sortBy,
    sortOrder,
    pageSize
  );

  const openDeals = deals.filter((deal) => isOpenDealStage(deal.stage));
  const wonValue = deals
    .filter((deal) => deal.stage === "won")
    .reduce((total, deal) => total + deal.value, 0);
  const staleDeals = deals.filter((deal) => isStaleDeal(deal)).length;
  
  const boardDeals: BoardDeal[] = deals
    .filter((deal) => DEAL_STAGES.includes(deal.stage as DealStage))
    .map((deal) => ({
      id: deal.id,
      name: deal.name,
      stage: deal.stage as DealStage,
      value: deal.value,
      probability: deal.probability,
      expectedCloseDate: deal.expectedCloseDate?.toISOString() ?? null,
      lastActivityAt: deal.lastActivityAt?.toISOString() ?? null,
      createdAt: deal.createdAt.toISOString(),
      updatedAt: deal.updatedAt.toISOString(),
      stale: isStaleDeal(deal),
      account: deal.account,
      contact: deal.contact,
      owner: deal.owner,
      activities: deal.activities.map((activity) => ({
        ...activity,
        createdAt: activity.createdAt.toISOString()
      }))
    }));

  return (
    <div className="crm-page max-w-[1500px]">
      <PageHeader
        title="Deals"
        description="Drag cards across stages to update probability and log pipeline movement."
      >
        <Button asChild>
          <Link href="/deals/new">New deal</Link>
        </Button>
      </PageHeader>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Open Pipeline"
          value={formatCurrency(
            openDeals.reduce((total, deal) => total + deal.value, 0)
          )}
        />
        <KpiCard
          label="Weighted Forecast"
          value={formatCurrency(calculateWeightedForecast(openDeals))}
        />
        <KpiCard label="Won Value" value={formatCurrency(wonValue)} />
        <KpiCard label="Stale Deals" value={formatNumber(staleDeals)} />
      </div>

      <Card className="my-6">
        <CardHeader className="gap-4">
          <CardTitle>Filters & Saved Views</CardTitle>
          <form action="/deals" className="grid gap-3 md:grid-cols-4 lg:grid-cols-6">
            <div className="space-y-1">
              <Label htmlFor="stage">Stage</Label>
              <Select id="stage" name="stage" defaultValue={stage ?? ""}>
                <option value="">All stages</option>
                {DEAL_STAGES.map((dealStage) => (
                  <option key={dealStage} value={dealStage}>
                    {dealStage.toUpperCase()}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="accountId">Account</Label>
              <Select id="accountId" name="accountId" defaultValue={accountId ?? ""}>
                <option value="">All accounts</option>
                {accounts.map((acc) => (
                  <option key={acc.id} value={acc.id}>
                    {acc.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="ownerId">Owner</Label>
              <Select id="ownerId" name="ownerId" defaultValue={ownerId ?? ""}>
                <option value="">All owners</option>
                {owners.map((owner) => (
                  <option key={owner.id} value={owner.id}>
                    {owner.name}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label htmlFor="search">Search Name</Label>
              <Input
                id="search"
                name="search"
                defaultValue={search ?? ""}
                placeholder="Search deal name..."
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="sortBy">Sort by</Label>
              <Select id="sortBy" name="sortBy" defaultValue={sortBy}>
                {dealCatalog.sortKeys.map((sortKey) => (
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
                <Link href="/deals">Reset</Link>
              </Button>
            </div>
          </form>
          
          <div className="mt-5 border-t pt-5">
            <SavedListViewControls
              entity="opportunities"
              route="/deals"
              savedViews={savedViews}
              selectedView={savedViewState.resolved.selectedView}
              status={
                savedViewState.invalidView
                  ? "error"
                  : savedListViewStatus(params.savedViewStatus)
              }
              current={{
                filters: {
                  stage: stage,
                  accountId: accountId,
                  ownerId: ownerId,
                  search: search
                },
                pageSize,
                sortBy,
                sortOrder
              }}
            />
          </div>
        </CardHeader>
      </Card>

      {boardDeals.length > 0 ? (
        <DealBoard
          deals={boardDeals}
          highlightedDealId={params.deal}
          accounts={accounts}
          contacts={contacts}
          owners={owners}
        />
      ) : (
        <EmptyState
          title="No deals found"
          description="Create a deal to start the pipeline board."
          actionHref="/deals/new"
          actionLabel="Create deal"
        />
      )}
    </div>
  );
}
