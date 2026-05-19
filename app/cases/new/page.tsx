import type { Metadata } from "next";
import Link from "next/link";
import { CaseForm, type CaseOptionItem } from "@/components/cases/case-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { listAccounts, listContacts } from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "New Case"
};

export default async function NewCasePage() {
  const [owners, accounts, contacts] = await Promise.all([
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    }),
    listAccounts({ pageSize: 100 }),
    listContacts({ pageSize: 100 })
  ]);

  const ownerOptions: CaseOptionItem[] = owners.map((owner) => ({
    id: owner.id,
    label: owner.name
  }));
  const accountOptions: CaseOptionItem[] = accounts.map((account) => ({
    id: account.id,
    label: account.name
  }));
  const contactOptions: CaseOptionItem[] = contacts.map((contact) => ({
    id: contact.id,
    label: `${contact.firstName} ${contact.lastName}`
  }));

  return (
    <div className="crm-page">
      <PageHeader
        title="New Case"
        description="Capture a customer issue and assign it to an owner."
      >
        <Button asChild variant="outline">
          <Link href="/cases">Back to cases</Link>
        </Button>
      </PageHeader>
      <CaseForm
        title="Create Case"
        submitLabel="Create case"
        owners={ownerOptions}
        accounts={accountOptions}
        contacts={contactOptions}
      />
    </div>
  );
}
