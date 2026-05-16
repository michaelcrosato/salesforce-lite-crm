import Link from "next/link";
import { Eye } from "lucide-react";
import { AccountStatusBadge, HealthBadge } from "@/components/account-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import {
  ACCOUNT_STATUSES,
  ACCOUNT_STATUS_LABELS,
  type AccountStatus
} from "@/lib/crm-constants";
import { formatCurrency } from "@/lib/formatters";
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
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Account List</CardTitle>
          <form action="/accounts" className="grid w-full gap-3 sm:max-w-xl sm:grid-cols-[1fr_160px]">
            <Input name="q" defaultValue={query} placeholder="Search accounts" />
            <Select name="status" defaultValue={status}>
              <option value="all">All statuses</option>
              {ACCOUNT_STATUSES.map((accountStatus) => (
                <option key={accountStatus} value={accountStatus}>
                  {ACCOUNT_STATUS_LABELS[accountStatus]}
                </option>
              ))}
            </Select>
          </form>
        </CardHeader>
        <CardContent>
          {accounts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Industry</TableHead>
                  <TableHead>Location</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Health</TableHead>
                  <TableHead>Owner</TableHead>
                  <TableHead>Contacts</TableHead>
                  <TableHead>Open Pipeline</TableHead>
                  <TableHead className="w-16">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {accounts.map((account) => {
                  const openPipeline = account.deals
                    .filter((deal) => isOpenDealStage(deal.stage))
                    .reduce((total, deal) => total + deal.value, 0);

                  return (
                    <TableRow key={account.id}>
                      <TableCell className="font-medium">{account.name}</TableCell>
                      <TableCell>{account.industry ?? "No industry"}</TableCell>
                      <TableCell>
                        {[account.city, account.region].filter(Boolean).join(", ") ||
                          "No location"}
                      </TableCell>
                      <TableCell>
                        <AccountStatusBadge status={account.status} />
                      </TableCell>
                      <TableCell>
                        <HealthBadge value={account.healthScore} />
                      </TableCell>
                      <TableCell>{account.owner?.name ?? "Unassigned"}</TableCell>
                      <TableCell>{account.contacts.length}</TableCell>
                      <TableCell>{formatCurrency(openPipeline)}</TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/accounts/${account.id}`} aria-label="Open account">
                            <Eye className="h-4 w-4" aria-hidden="true" />
                          </Link>
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          ) : (
            <EmptyState
              title="No accounts found"
              description="Adjust search or filter values to find accounts."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
