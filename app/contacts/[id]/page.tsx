import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddNoteForm } from "@/components/add-note-form";
import { ActivityTimeline } from "@/components/activity-timeline";
import { ContactForm } from "@/components/contact-form";
import { PageHeader } from "@/components/page-header";
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
import { CONTACT_STATUS_LABELS, STAGE_LABELS } from "@/lib/crm-constants";
import { formatCurrency, formatDate, formatPercent } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const contact = await prisma.contact.findUnique({
    where: { id },
    select: { firstName: true, lastName: true }
  });
  if (!contact) {
    return { title: "Contact not found" };
  }
  return { title: `${contact.firstName} ${contact.lastName}` };
}

export default async function ContactDetailPage({
  params
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const [contact, accounts] = await Promise.all([
    prisma.contact.findUnique({
      where: {
        id: resolvedParams.id
      },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            status: true,
            healthScore: true
          }
        },
        deals: {
          orderBy: {
            updatedAt: "desc"
          },
          include: {
            account: {
              select: {
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
    })
  ]);

  if (!contact) {
    notFound();
  }

  return (
    <div className="crm-page">
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        description="Contact summary, related pipeline, and activity timeline."
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Contact Summary</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SummaryItem label="Title" value={contact.title ?? "No title"} />
              <SummaryItem
                label="Account"
                value={
                  contact.account ? (
                    <Link
                      href={`/accounts/${contact.account.id}`}
                      className="text-primary hover:underline"
                    >
                      {contact.account.name}
                    </Link>
                  ) : (
                    "No account"
                  )
                }
              />
              <SummaryItem label="Email" value={contact.email ?? "No email"} />
              <SummaryItem label="Phone" value={contact.phone ?? "No phone"} />
              <SummaryItem
                label="Status"
                value={
                  <Badge
                    variant={
                      contact.status === "active" ? "success" : "outline"
                    }
                  >
                    {contact.status === "active"
                      ? CONTACT_STATUS_LABELS.active
                      : CONTACT_STATUS_LABELS.inactive}
                  </Badge>
                }
              />
              <SummaryItem
                label="Account Health"
                value={
                  contact.account
                    ? `${contact.account.healthScore}/100`
                    : "No account"
                }
              />
              <SummaryItem
                label="Created"
                value={formatDate(contact.createdAt)}
              />
              <SummaryItem
                label="Updated"
                value={formatDate(contact.updatedAt)}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Related Deals</CardTitle>
            </CardHeader>
            <CardContent>
              {contact.deals.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Deal</TableHead>
                      <TableHead>Stage</TableHead>
                      <TableHead>Value</TableHead>
                      <TableHead>Probability</TableHead>
                      <TableHead>Expected Close</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contact.deals.map((deal) => (
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
                            {
                              STAGE_LABELS[
                                deal.stage as keyof typeof STAGE_LABELS
                              ]
                            }
                          </Badge>
                        </TableCell>
                        <TableCell>{formatCurrency(deal.value)}</TableCell>
                        <TableCell>{formatPercent(deal.probability)}</TableCell>
                        <TableCell>
                          {formatDate(deal.expectedCloseDate)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No deals are linked yet.
                </p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Activity Timeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={contact.activities} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <ContactForm
            title="Edit Contact"
            submitLabel="Save contact"
            accounts={accounts}
            initialValues={{
              id: contact.id,
              accountId: contact.accountId,
              firstName: contact.firstName,
              lastName: contact.lastName,
              email: contact.email,
              phone: contact.phone,
              title: contact.title,
              status: contact.status
            }}
          />
          <AddNoteForm
            contactId={contact.id}
            deals={contact.deals.map((deal) => ({
              id: deal.id,
              name: deal.name
            }))}
          />
        </div>
      </div>
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
