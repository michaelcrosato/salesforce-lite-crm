import type { Metadata } from "next";
import Link from "next/link";
import {
  CampaignForm,
  type CampaignOptionItem
} from "@/components/campaigns/campaign-form";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/prisma";



export const metadata: Metadata = {
  title: "New Campaign"
};

export default async function NewCampaignPage() {
  const owners = await prisma.user.findMany({
    orderBy: { name: "asc" },
    select: { id: true, name: true }
  });

  const ownerOptions: CampaignOptionItem[] = owners.map((owner) => ({
    id: owner.id,
    label: owner.name
  }));

  return (
    <div className="crm-page">
      <PageHeader
        title="New Campaign"
        description="Plan an outreach program with a budget and target window."
      >
        <Button asChild variant="outline">
          <Link href="/campaigns">Back to campaigns</Link>
        </Button>
      </PageHeader>
      <CampaignForm
        title="Create Campaign"
        submitLabel="Create campaign"
        owners={ownerOptions}
      />
    </div>
  );
}
