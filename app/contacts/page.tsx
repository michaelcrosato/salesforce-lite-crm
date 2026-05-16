import Link from "next/link";
import { Eye } from "lucide-react";
import { ContactForm } from "@/components/contact-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { PageHeader } from "@/components/page-header";
import { CONTACT_STATUS_LABELS } from "@/lib/crm-constants";
import { formatRelativeDays } from "@/lib/formatters";
import { prisma } from "@/lib/prisma";
import { isOpenDealStage } from "@/lib/business/deals";

export const dynamic = "force-dynamic";

export default async function ContactsPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const query = resolvedSearchParams.q?.trim() ?? "";
  const [contacts, accounts] = await Promise.all([
    prisma.contact.findMany({
      where: query
        ? {
            OR: [
              {
                firstName: {
                  contains: query
                }
              },
              {
                lastName: {
                  contains: query
                }
              },
              {
                email: {
                  contains: query
                }
              },
              {
                account: {
                  name: {
                    contains: query
                  }
                }
              }
            ]
          }
        : undefined,
      orderBy: [
        {
          lastName: "asc"
        },
        {
          firstName: "asc"
        }
      ],
      include: {
        account: {
          select: {
            id: true,
            name: true
          }
        },
        deals: {
          select: {
            stage: true
          }
        },
        activities: {
          orderBy: {
            createdAt: "desc"
          },
          take: 1,
          select: {
            createdAt: true
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

  return (
    <div className="crm-page">
      <PageHeader
        title="Contacts"
        description="Search contacts, create new stakeholders, and open detail timelines."
      />

      <ContactForm
        title="Create Contact"
        submitLabel="Create contact"
        accounts={accounts}
      />

      <Card>
        <CardHeader className="gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Contact Directory</CardTitle>
          <form action="/contacts" className="w-full sm:max-w-sm">
            <Input name="q" defaultValue={query} placeholder="Search contacts" />
          </form>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Account</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Last Activity</TableHead>
                  <TableHead>Open Deals</TableHead>
                  <TableHead className="w-16">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contacts.map((contact) => {
                  const openDeals = contact.deals.filter((deal) =>
                    isOpenDealStage(deal.stage)
                  ).length;
                  const lastActivity = contact.activities[0]?.createdAt ?? null;

                  return (
                    <TableRow key={contact.id}>
                      <TableCell className="font-medium">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="text-primary hover:underline"
                        >
                          {contact.firstName} {contact.lastName}
                        </Link>
                      </TableCell>
                      <TableCell>
                        {contact.account ? (
                          <Link
                            href={`/accounts/${contact.account.id}`}
                            className="text-primary hover:underline"
                          >
                            {contact.account.name}
                          </Link>
                        ) : (
                          <span className="text-muted-foreground">No account</span>
                        )}
                      </TableCell>
                      <TableCell>{contact.title ?? "No title"}</TableCell>
                      <TableCell>{contact.email ?? "No email"}</TableCell>
                      <TableCell>{contact.phone ?? "No phone"}</TableCell>
                      <TableCell>
                        <Badge
                          variant={contact.status === "active" ? "success" : "outline"}
                        >
                          {contact.status === "active"
                            ? CONTACT_STATUS_LABELS.active
                            : CONTACT_STATUS_LABELS.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell>{formatRelativeDays(lastActivity)}</TableCell>
                      <TableCell>{openDeals}</TableCell>
                      <TableCell>
                        <Button asChild variant="ghost" size="icon">
                          <Link href={`/contacts/${contact.id}`} aria-label="Open contact">
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
              title="No contacts found"
              description="Adjust the search or create a new contact above."
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
