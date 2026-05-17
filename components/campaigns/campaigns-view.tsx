"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  CampaignDetailDrawer,
  type DrawerCampaign
} from "@/components/campaigns/campaign-detail-drawer";
import {
  CampaignsTable,
  type CampaignRow
} from "@/components/campaigns/campaigns-table";
import { type CampaignOptionItem } from "@/components/campaigns/campaign-form";
import { EmptyState } from "@/components/ui/empty-state";

export function CampaignsView({
  campaigns,
  drawerCampaign,
  owners
}: {
  campaigns: CampaignRow[];
  drawerCampaign: DrawerCampaign | null;
  owners: CampaignOptionItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const closeDrawer = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("campaign");
    const query = next.toString();
    router.replace(query.length > 0 ? `/campaigns?${query}` : "/campaigns");
  }, [router, searchParams]);

  if (campaigns.length === 0) {
    return (
      <>
        <EmptyState
          title="No campaigns found"
          description="Adjust filters or create a campaign to coordinate outreach."
          actionHref="/campaigns/new"
          actionLabel="Create campaign"
        />
        <CampaignDetailDrawer
          campaign={drawerCampaign}
          owners={owners}
          onClose={closeDrawer}
        />
      </>
    );
  }

  return (
    <>
      <CampaignsTable campaigns={campaigns} />
      <CampaignDetailDrawer
        campaign={drawerCampaign}
        owners={owners}
        onClose={closeDrawer}
      />
    </>
  );
}
