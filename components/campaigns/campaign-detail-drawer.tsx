"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  deleteCampaignAction,
  updateCampaignStatusAction
} from "@/app/campaigns/actions";
import {
  CampaignForm,
  type CampaignFormInitialValues,
  type CampaignOptionItem
} from "@/components/campaigns/campaign-form";
import { CampaignPerformanceCard } from "@/components/campaigns/campaign-performance-summary";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { CAMPAIGN_STATUSES, type CampaignStatus } from "@/lib/crm/registry";
import { formatCurrency, formatDate } from "@/lib/formatters";
import type { CampaignInfluenceSummary } from "@/lib/services/campaignInfluence";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger";

export type DrawerCampaign = CampaignFormInitialValues & {
  id: string;
  name: string;
  status: CampaignStatus;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
  influenceSummary: CampaignInfluenceSummary | null;
};

const STATUS_LABELS: Record<CampaignStatus, string> = {
  planned: "Planned",
  active: "Active",
  completed: "Completed",
  cancelled: "Cancelled"
};

const STATUS_VARIANT: Record<CampaignStatus, BadgeVariant> = {
  planned: "secondary",
  active: "default",
  completed: "success",
  cancelled: "outline"
};

export function CampaignDetailDrawer({
  campaign,
  owners,
  onClose
}: {
  campaign: DrawerCampaign | null;
  owners: CampaignOptionItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!campaign) {
    return null;
  }

  const activeCampaignId = campaign.id;

  function moveStatus(status: string) {
    startTransition(() => {
      void (async () => {
        const result = await updateCampaignStatusAction(
          activeCampaignId,
          status
        );
        showToast({
          title: result.ok ? "Campaign updated" : "Campaign not updated",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
        router.refresh();
      })();
    });
  }

  function handleDelete() {
    startTransition(() => {
      void (async () => {
        const result = await deleteCampaignAction(activeCampaignId);
        showToast({
          title: result.ok ? "Campaign deleted" : "Campaign not deleted",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
        if (result.ok) {
          onClose();
        }
        router.refresh();
      })();
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/30"
        aria-label="Close campaign detail"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Campaign Detail
            </p>
            <h2 className="mt-1 text-xl font-semibold">{campaign.name}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          {isEditing ? (
            <CampaignForm
              title="Edit Campaign"
              submitLabel="Save campaign"
              owners={owners}
              initialValues={campaign}
              onSaved={() => setIsEditing(false)}
            />
          ) : (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Fields</CardTitle>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsEditing(true)}
                >
                  Edit
                </Button>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <FieldView
                  label="Status"
                  value={STATUS_LABELS[campaign.status]}
                />
                <FieldView
                  label="Owner"
                  value={campaign.ownerName ?? "Unassigned"}
                />
                <FieldView
                  label="Start date"
                  value={formatDate(campaign.startDate)}
                />
                <FieldView
                  label="End date"
                  value={formatDate(campaign.endDate)}
                />
                <FieldView
                  label="Budget"
                  value={
                    typeof campaign.budget === "number"
                      ? formatCurrency(campaign.budget)
                      : "—"
                  }
                />
                <FieldView
                  label="Updated"
                  value={formatDate(campaign.updatedAt)}
                />
                {campaign.description ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                      Description
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {campaign.description}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          <CampaignPerformanceCard summary={campaign.influenceSummary} />

          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                aria-label={`Move ${campaign.name} status`}
                defaultValue={campaign.status}
                disabled={isPending}
                onChange={(event) => moveStatus(event.currentTarget.value)}
              >
                {CAMPAIGN_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
              <div className="flex flex-wrap gap-2">
                <Badge variant={STATUS_VARIANT[campaign.status]}>
                  {STATUS_LABELS[campaign.status]}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Danger zone</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isPending}
              >
                Delete campaign
              </Button>
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}

function FieldView({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-background p-3">
      <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block text-sm font-medium">{value}</span>
    </div>
  );
}
