import type { Metadata } from "next";
import { AccountForm } from "@/components/account-form";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
      />
      <AccountForm
        title="Create Account"
        submitLabel="Create account"
        owners={owners}
      />
    </div>
  );
}
