import Link from "next/link";
import { CampaignsView } from "@/components/campaigns/campaigns-view";
import {
  type CampaignRow
} from "@/components/campaigns/campaigns-table";
import {
  type DrawerCampaign
} from "@/components/campaigns/campaign-detail-drawer";
import { type CampaignOptionItem } from "@/components/campaigns/campaign-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/page-header";
import { Select } from "@/components/ui/select";
import {
  getCampaign,
  listCampaigns
} from "@/lib/crm/crmClient";
import type { CampaignListOptions } from "@/lib/crm/crmClient";
import { prisma } from "@/lib/prisma";
import {
  CAMPAIGN_STATUSES,
  type CampaignStatus
} from "@/lib/crm/registry";

export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<CampaignStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled"
};

type CampaignsSearchParams = {
  campaign?: string;
  status?: string;
  startFrom?: string;
  startTo?: string;
};

function isCampaignStatus(value: string | undefined): value is CampaignStatus {
  if (!value) {
    return false;
  }
  return (CAMPAIGN_STATUSES as readonly string[]).includes(value);
}

export default async function CampaignsPage({
  searchParams
}: {
  searchParams: Promise<CampaignsSearchParams>;
}) {
  const params = await searchParams;
  const statusFilter = isCampaignStatus(params.status) ? params.status : undefined;
  const startDateFrom = params.startFrom?.trim() ? params.startFrom : undefined;
  const startDateTo = params.startTo?.trim() ? params.startTo : undefined;

  const listOptions: CampaignListOptions = {
    status: statusFilter,
    startDateFrom,
    startDateTo,
    take: 100
  };

  const [campaigns, owners] = await Promise.all([
    listCampaigns(listOptions),
    prisma.user.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true }
    })
  ]);

  const ownerById = new Map(owners.map((owner) => [owner.id, owner]));

  const ownerOptions: CampaignOptionItem[] = owners.map((owner) => ({
    id: owner.id,
    label: owner.name
  }));

  const tableRows: CampaignRow[] = campaigns.map((campaign) => ({
    id: campaign.id,
    name: campaign.name,
    status: campaign.status as CampaignStatus,
    startDate: campaign.startDate ? campaign.startDate.toISOString() : null,
    endDate: campaign.endDate ? campaign.endDate.toISOString() : null,
    budget: campaign.budget,
    owner: campaign.ownerId
      ? {
          id: campaign.ownerId,
          name: ownerById.get(campaign.ownerId)?.name ?? "Unassigned"
        }
      : null
  }));

  let drawerCampaign: DrawerCampaign | null = null;
  if (params.campaign) {
    const found = await getCampaign(params.campaign);
    if (found) {
      drawerCampaign = {
        id: found.id,
        name: found.name,
        description: found.description,
        status: found.status as CampaignStatus,
        startDate: found.startDate ? found.startDate.toISOString() : null,
        endDate: found.endDate ? found.endDate.toISOString() : null,
        budget: found.budget,
        ownerId: found.ownerId,
        ownerName: found.ownerId
          ? ownerById.get(found.ownerId)?.name ?? null
          : null,
        createdAt: found.createdAt.toISOString(),
        updatedAt: found.updatedAt.toISOString()
      };
    }
  }

  return (
    <div className="crm-page">
      <PageHeader
        title="Campaigns"
        description="Coordinate outreach programs across leads and contacts."
      >
        <Button asChild>
          <Link href="/campaigns/new">New campaign</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>Filters</CardTitle>
        </CardHeader>
        <CardContent>
          <form action="/campaigns" className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select id="status" name="status" defaultValue={params.status ?? ""}>
                <option value="">All</option>
                {CAMPAIGN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="startFrom">Start from</Label>
              <Input
                id="startFrom"
                name="startFrom"
                type="date"
                defaultValue={params.startFrom ?? ""}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="startTo">Start to</Label>
              <Input
                id="startTo"
                name="startTo"
                type="date"
                defaultValue={params.startTo ?? ""}
              />
            </div>
            <div className="flex items-end gap-3 md:col-span-3">
              <Button type="submit">Apply filters</Button>
              <Button asChild variant="outline">
                <Link href="/campaigns">Reset</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaign list</CardTitle>
        </CardHeader>
        <CardContent>
          <CampaignsView
            campaigns={tableRows}
            drawerCampaign={drawerCampaign}
            owners={ownerOptions}
          />
        </CardContent>
      </Card>
    </div>
  );
}
