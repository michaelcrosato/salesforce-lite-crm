import { AccountsTable } from "@/components/accounts-table";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import {
  ACCOUNT_STATUSES,
  ACCOUNT_STATUS_LABELS,
  type AccountStatus
} from "@/lib/crm-constants";
import { prisma } from "@/lib/prisma";
import { isOpenDealStage } from "@/lib/business/deals";

export const dynamic = "force-dynamic";

export default async function AccountsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim() ?? "";
  const status = ACCOUNT_STATUSES.includes(resolvedSearchParams.status as AccountStatus)
    ? (resolvedSearchParams.status as AccountStatus)
    : "all";
  const accounts = await prisma.account.findMany({
    where: {
      AND: [
        query
          ? {
              OR: [
                {
                  name: {
                    contains: query
                  }
                },
                {
                  industry: {
                    contains: query
                  }
                },
                {
                  city: {
                    contains: query
                  }
                }
              ]
            }
          : {},
        status !== "all"
          ? {
              status
            }
          : {}
      ]
    },
    orderBy: {
      name: "asc"
    },
    include: {
      owner: {
        select: {
          name: true
        }
      },
      contacts: {
        select: {
          id: true
        }
      },
      deals: {
        select: {
          stage: true,
          value: true
        }
      }
    }
  });

  return (
    <div className="crm-page">
      <PageHeader
        title="Accounts"
        description="Company-level view of health, ownership, contacts, and pipeline."
      />

      <Card>
        <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Account List</CardTitle>
          <form action="/accounts" className="grid w-full gap-3 sm:max-w-xl sm:grid-cols-[1fr_160px_auto]">
            <Input name="q" defaultValue={query} placeholder="Search accounts" />
            <Select name="status" defaultValue={status}>
              <option value="all">All statuses</option>
              {ACCOUNT_STATUSES.map((accountStatus) => (
                <option key={accountStatus} value={accountStatus}>
                  {ACCOUNT_STATUS_LABELS[accountStatus]}
                </option>
              ))}
            </Select>
            <Button type="submit" variant="secondary">
              Apply
            </Button>
          </form>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <AccountsTable
              accounts={accounts.map((account) => ({
                id: account.id,
                name: account.name,
                industry: account.industry,
                city: account.city,
                region: account.region,
                status: account.status,
                healthScore: account.healthScore,
                ownerName: account.owner?.name ?? null,
                contactsCount: account.contacts.length,
                openPipeline: account.deals
                  .filter((deal) => isOpenDealStage(deal.stage))
                  .reduce((total, deal) => total + deal.value, 0)
              }))}
            />
          ) : (
            <EmptyState
              title="No accounts found"
              description="Adjust search or filter values to find accounts."
              actionHref="/accounts/new"
              actionLabel="Create account"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
