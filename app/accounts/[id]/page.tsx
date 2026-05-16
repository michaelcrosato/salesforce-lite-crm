import Link from "next/link";
import { notFound } from "next/navigation";
import { ActivityTimeline } from "@/components/activity-timeline";
import { PageHeader } from "@/components/page-header";
import { AccountStatusBadge, HealthBadge } from "@/components/account-badges";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { STAGE_LABELS } from "@/lib/crm-constants";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AccountDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const account = await prisma.account.findUnique({
    where: {
      id: resolvedParams.id
    },
    include: {
      owner: {
        select: {
          name: true,
          email: true
        }
      },
      contacts: {
        orderBy: [
          {
            lastName: "asc"
          },
          {
            firstName: "asc"
          }
        ]
      },
      deals: {
        orderBy: {
          updatedAt: "desc"
        },
        include: {
          contact: {
            select: {
              id: true,
              firstName: true,
              lastName: true
            }
          }
        }
      },
      activities: {
        orderBy: {
          createdAt: "desc"
        },
        take: 10,
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
  });

  if (!account) {
    notFound();
  }

  return (
    <div className="crm-page">
      <PageHeader
        title={account.name}
        description="Account health, stakeholders, deals, and recent engagement."
      />

      <Card>
        <CardHeader>
          <CardTitle>Account Summary</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <SummaryItem label="Domain" value={account.domain ?? "No domain"} />
          <SummaryItem label="Industry" value={account.industry ?? "No industry"} />
          <SummaryItem
            label="Location"
            value={[account.city, account.region].filter(Boolean).join(", ") || "No location"}
          />
          <SummaryItem
            label="Status"
            value={<AccountStatusBadge status={account.status} />}
          />
          <SummaryItem label="Health" value={<HealthBadge value={account.healthScore} />} />
          <SummaryItem label="Owner" value={account.owner?.name ?? "Unassigned"} />
          <SummaryItem label="Created" value={formatDate(account.createdAt)} />
          <SummaryItem label="Updated" value={formatDate(account.updatedAt)} />
          <SummaryItem label="Contacts" value={account.contacts.length.toString()} />
          <SummaryItem label="Deals" value={account.deals.length.toString()} />
        </CardContent>
      </Card>

      <div className="grid gap-6 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Related Contacts</CardTitle>
          </CardHeader>
          <CardContent>
            {account.contacts.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {account.contacts.map((contact) => (
                    <TableRow key={contact.id}>
                      <TableCell>
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                      </TableCell>
                      <TableCell>{contact.title ?? "No title"}</TableCell>
                      <TableCell>{contact.email ?? "No email"}</TableCell>
                      <TableCell>
                        <Badge variant={contact.status === "active" ? "success" : "outline"}>
                          {contact.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No contacts are linked.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Related Deals</CardTitle>
          </CardHeader>
          <CardContent>
            {account.deals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Deal</TableHead>
                    <TableHead>Stage</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Probability</TableHead>
                    <TableHead>Contact</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {account.deals.map((deal) => (
                    <TableRow key={deal.id}>
                      <TableCell>
                        <Link
                          href={`/deals?deal=${deal.id}`}
                          className="font-medium text-primary hover:underline"
                        >
                          {deal.name}
                        </Link>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {STAGE_LABELS[deal.stage as keyof typeof STAGE_LABELS]}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatCurrency(deal.value)}</TableCell>
                      <TableCell>{formatPercent(deal.probability)}</TableCell>
                      <TableCell>
                        {deal.contact ? (
                          <Link
                            href={`/contacts/${deal.contact.id}`}
                            className="text-primary hover:underline"
                          >
                            {deal.contact.firstName} {deal.contact.lastName}
                          </Link>
                        ) : (
                          "No contact"
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-sm text-muted-foreground">No deals are linked.</p>
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Activities</CardTitle>
        </CardHeader>
        <CardContent>
          <ActivityTimeline activities={account.activities} />
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({
  label,
  value
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </p>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}
