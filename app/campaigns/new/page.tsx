import {
  CampaignForm,
  type CampaignOptionItem
} from "@/components/campaigns/campaign-form";
import { PageHeader } from "@/components/page-header";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
      />
      <CampaignForm
        title="Create Campaign"
        submitLabel="Create campaign"
        owners={ownerOptions}
      />
    </div>
  );
}
