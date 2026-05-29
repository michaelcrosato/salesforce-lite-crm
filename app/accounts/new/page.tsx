import type { Metadata } from "next";
import Link from "next/link";
import { AccountForm } from "@/components/account-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";



export const metadata: Metadata = {
  title: "New Account"
};

export default async function NewAccountPage() {
  const owners = await prisma.user.findMany({
    orderBy: {
      name: "asc"
    },
    select: {
      id: true,
      name: true
    }
  });

  return (
    <div className="crm-page">
      <PageHeader
        title="New Account"
        description="Create an account for contacts, deals, and activities."
      >
        <Button asChild variant="outline">
          <Link href="/accounts">Back to accounts</Link>
        </Button>
      </PageHeader>
      <AccountForm
        title="Create Account"
        submitLabel="Create account"
        owners={owners}
      />
    </div>
  );
}
