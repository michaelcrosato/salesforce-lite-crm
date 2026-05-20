import type { Metadata } from "next";
import { ContactsTable } from "@/components/contacts-table";
import { ContactForm } from "@/components/contact-form";
import { EmptyState } from "@/components/ui/empty-state";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";
import { isOpenDealStage } from "@/lib/business/deals";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contacts"
};

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
        description="Search contacts, create new ones, and open detail timelines."
      />

      <div id="create-contact">
        <ContactForm
          title="Create Contact"
          submitLabel="Create contact"
          accounts={accounts}
        />
      </div>

      <Card>
        <CardHeader className="gap-4 sm:flex sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Contact Directory</CardTitle>
          <form action="/contacts" className="w-full sm:max-w-sm">
            <Input name="q" defaultValue={query} placeholder="Search contacts" />
          </form>
        </CardHeader>
        <CardContent>
          {contacts.length > 0 ? (
            <ContactsTable
              contacts={contacts.map((contact) => ({
                id: contact.id,
                firstName: contact.firstName,
                lastName: contact.lastName,
                account: contact.account,
                title: contact.title,
                email: contact.email,
                phone: contact.phone,
                status: contact.status,
                lastActivityAt: contact.activities[0]?.createdAt.toISOString() ?? null,
                openDeals: contact.deals.filter((deal) => isOpenDealStage(deal.stage))
                  .length
              }))}
            />
          ) : (
            <EmptyState
              title="No contacts found"
              description="Adjust the search or create a new contact above."
              actionHref="#create-contact"
              actionLabel="Create contact"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
