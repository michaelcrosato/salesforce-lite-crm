"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import {
  addCampaignMemberAction,
  deleteCampaignAction,
  removeCampaignMemberAction,
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
import type {
  CampaignMember,
  CampaignMemberCounts
} from "@/lib/services/campaignMembers";

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
  members: CampaignMember[];
  availableMembers: CampaignMember[];
  availableMemberCounts: CampaignMemberCounts;
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

const EMPTY_CAMPAIGN_MEMBERS: CampaignMember[] = [];

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
  const [selectedAvailableMember, setSelectedAvailableMember] = useState("");
  const [isPending, startTransition] = useTransition();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const availableMembers = campaign?.availableMembers ?? EMPTY_CAMPAIGN_MEMBERS;
  const availableOptions = useMemo(
    () =>
      availableMembers.map((member) => ({
        label: memberOptionLabel(member),
        value: memberOptionValue(member)
      })),
    [availableMembers]
  );
  const firstAvailableOption = availableOptions[0]?.value ?? "";
  const activeSelectedAvailableMember = availableOptions.some(
    (option) => option.value === selectedAvailableMember
  )
    ? selectedAvailableMember
    : firstAvailableOption;
  const focusedCampaignId = campaign?.id;

  useEffect(() => {
    if (focusedCampaignId) {
      closeButtonRef.current?.focus();
    }
  }, [focusedCampaignId]);

  if (!campaign) {
    return null;
  }

  const activeCampaignId = campaign.id;
  const drawerTitleId = `campaign-detail-title-${activeCampaignId}`;
  const currentMemberCounts = countCampaignMembers(campaign.members);

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

  function handleAddMember() {
    if (!activeSelectedAvailableMember) {
      showToast({
        title: "Campaign member not added",
        description: "Select a contact or lead to add.",
        variant: "error"
      });
      return;
    }

    startTransition(() => {
      void (async () => {
        const result = await addCampaignMemberAction(
          activeCampaignId,
          activeSelectedAvailableMember
        );
        showToast({
          title: result.ok ? "Campaign member added" : "Campaign member not added",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
        router.refresh();
      })();
    });
  }

  function handleRemoveMember(member: CampaignMember) {
    startTransition(() => {
      void (async () => {
        const result = await removeCampaignMemberAction(
          activeCampaignId,
          member.memberType,
          member.memberId
        );
        showToast({
          title: result.ok
            ? "Campaign member removed"
            : "Campaign member not removed",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
        router.refresh();
      })();
    });
  }

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-slate-950/30"
        aria-hidden="true"
        tabIndex={-1}
        onClick={onClose}
      />
      <aside
        role="dialog"
        aria-modal="true"
        aria-labelledby={drawerTitleId}
        className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l bg-background shadow-2xl"
      >
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Campaign Detail
            </p>
            <h2 id={drawerTitleId} className="mt-1 text-xl font-semibold">
              {campaign.name}
            </h2>
          </div>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close campaign detail"
            data-testid="campaign-drawer-close"
            onClick={onClose}
          >
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

          <Card data-testid="campaign-member-panel-controls">
            <CardHeader>
              <CardTitle>Campaign members</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <FieldView
                  label="Current"
                  value={`${currentMemberCounts.total} members`}
                />
                <FieldView
                  label="Contacts"
                  value={String(currentMemberCounts.contacts)}
                />
                <FieldView
                  label="Leads"
                  value={String(currentMemberCounts.leads)}
                />
              </div>

              <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                <Select
                  aria-label={`Add member to ${campaign.name}`}
                  data-testid="campaign-member-select-add"
                  value={activeSelectedAvailableMember}
                  disabled={isPending || availableOptions.length === 0}
                  onChange={(event) =>
                    setSelectedAvailableMember(event.currentTarget.value)
                  }
                >
                  {availableOptions.length === 0 ? (
                    <option value="">No available contacts or leads</option>
                  ) : null}
                  {availableOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </Select>
                <Button
                  type="button"
                  data-testid="campaign-member-button-add"
                  disabled={isPending || !activeSelectedAvailableMember}
                  onClick={handleAddMember}
                >
                  Add member
                </Button>
              </div>

              <p className="text-xs text-muted-foreground">
                {campaign.availableMemberCounts.total} available existing
                contacts and leads.
              </p>

              {campaign.members.length === 0 ? (
                <p className="rounded-md border bg-muted/30 p-3 text-sm text-muted-foreground">
                  No campaign members are linked yet.
                </p>
              ) : (
                <div
                  className="divide-y rounded-md border"
                  data-testid="campaign-member-list-current"
                >
                  {campaign.members.map((member) => (
                    <div
                      key={`${member.memberType}-${member.memberId}`}
                      className="flex flex-col gap-3 p-3 sm:flex-row sm:items-center sm:justify-between"
                      data-testid="campaign-member-row-current"
                    >
                      <div className="min-w-0 space-y-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant="outline">
                            {member.memberType === "contact"
                              ? "Contact"
                              : "Lead"}
                          </Badge>
                          <Link
                            href={member.route}
                            className="truncate text-sm font-medium text-primary hover:underline"
                          >
                            {member.displayName}
                          </Link>
                        </div>
                        <p className="truncate text-xs text-muted-foreground">
                          {member.email ?? "No email"} - {member.status}
                          {member.source ? ` - ${member.source}` : ""}
                        </p>
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        data-testid="campaign-member-button-remove"
                        disabled={isPending}
                        onClick={() => handleRemoveMember(member)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

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

function countCampaignMembers(members: CampaignMember[]): CampaignMemberCounts {
  const contacts = members.filter((member) => member.memberType === "contact")
    .length;
  const leads = members.filter((member) => member.memberType === "lead").length;

  return {
    contacts,
    leads,
    total: contacts + leads
  };
}

function memberOptionValue(member: CampaignMember): string {
  return `${member.memberType}:${member.memberId}`;
}

function memberOptionLabel(member: CampaignMember): string {
  const memberType = member.memberType === "contact" ? "Contact" : "Lead";
  const details = [member.email, member.source, member.status]
    .filter((value) => value && value.length > 0)
    .join(" / ");

  return details.length > 0
    ? `${memberType}: ${member.displayName} (${details})`
    : `${memberType}: ${member.displayName}`;
}
