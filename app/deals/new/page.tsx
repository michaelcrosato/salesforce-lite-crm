import type { Metadata } from "next";
import Link from "next/link";
import { DealForm } from "@/components/deal-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Deal"
};

export default async function NewDealPage() {
  const [accounts, contacts, owners] = await Promise.all([
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

  return (
    <div className="crm-page">
      <PageHeader
        title="New Deal"
        description="Create a deal and log the initial pipeline stage."
      >
        <Button asChild variant="outline">
          <Link href="/deals">Back to deals</Link>
        </Button>
      </PageHeader>
      <DealForm
        title="Create Deal"
        submitLabel="Create deal"
        accounts={accounts}
        contacts={contacts}
        owners={owners}
      />
    </div>
  );
}
