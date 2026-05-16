import { DealForm } from "@/components/deal-form";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
        description="Create a pipeline opportunity and log the initial stage."
      />
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
