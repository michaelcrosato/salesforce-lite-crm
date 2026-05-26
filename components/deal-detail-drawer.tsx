"use client";

import { X } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { moveDealAction } from "@/app/deals/actions";
import {
  ActivityTimeline,
  type TimelineActivity
} from "@/components/activity-timeline";
import { AddNoteForm } from "@/components/add-note-form";
import {
  DealForm,
  type DealAccountOption,
  type DealContactOption,
  type DealOwnerOption
} from "@/components/deal-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import { DEAL_STAGES, STAGE_LABELS, type DealStage } from "@/lib/crm-constants";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatRelativeDays
} from "@/lib/formatters";

export type DrawerDeal = {
  id: string;
  name: string;
  stage: DealStage;
  value: number;
  probability: number;
  expectedCloseDate: string | null;
  lastActivityAt: string | null;
  createdAt: string;
  updatedAt: string;
  stale: boolean;
  account: {
    id: string;
    name: string;
  } | null;
  contact: {
    id: string;
    firstName: string;
    lastName: string;
  } | null;
  owner: {
    id: string;
    name: string;
  } | null;
  activities: TimelineActivity[];
};

export interface DealDetailDrawerProps {
  deal: DrawerDeal | null;
  accounts: DealAccountOption[];
  contacts: DealContactOption[];
  owners: DealOwnerOption[];
  onClose: () => void;
  "data-testid"?: string;
}

export function DealDetailDrawer({
  deal,
  accounts,
  contacts,
  owners,
  onClose,
  "data-testid": testid
}: DealDetailDrawerProps) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const focusedDealId = deal?.id;

  useEffect(() => {
    if (focusedDealId) {
      closeButtonRef.current?.focus();
    }
  }, [focusedDealId]);

  if (!deal) {
    return null;
  }

  const activeDeal = deal;
  const activeDealId = activeDeal.id;
  const drawerTitleId = `deal-detail-title-${activeDealId}`;

  function moveStage(stage: DealStage) {
    startTransition(() => {
      void (async () => {
        const result = await moveDealAction({
          dealId: activeDealId,
          stage
        });
        showToast({
          title: result.ok ? "Deal moved" : "Deal not moved",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
        router.refresh();
      })();
    });
  }

  return (
    <div className="fixed inset-0 z-50" data-testid={testid}>
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
              Deal Detail
            </p>
            <h2 id={drawerTitleId} className="mt-1 text-xl font-semibold">
              {activeDeal.name}
            </h2>
          </div>
          <Button
            ref={closeButtonRef}
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Close deal detail"
            data-testid="deal-drawer-close"
            onClick={onClose}
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          {isEditing ? (
            <DealForm
              title="Edit Deal"
              submitLabel="Save deal"
              accounts={accounts}
              contacts={contacts}
              owners={owners}
              initialValues={{
                id: activeDeal.id,
                accountId: activeDeal.account?.id,
                contactId: activeDeal.contact?.id,
                ownerId: activeDeal.owner?.id,
                name: activeDeal.name,
                stage: activeDeal.stage,
                value: activeDeal.value,
                probability: activeDeal.probability,
                expectedCloseDate: activeDeal.expectedCloseDate
              }}
              onSaved={() => setIsEditing(false)}
            />
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Fields</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 sm:grid-cols-2">
                <EditableField
                  label="Name"
                  value={activeDeal.name}
                  onEdit={() => setIsEditing(true)}
                />
                <EditableField
                  label="Stage"
                  value={STAGE_LABELS[activeDeal.stage]}
                  onEdit={() => setIsEditing(true)}
                />
                <EditableField
                  label="Value"
                  value={formatCurrency(activeDeal.value)}
                  onEdit={() => setIsEditing(true)}
                />
                <EditableField
                  label="Probability"
                  value={formatPercent(activeDeal.probability)}
                  onEdit={() => setIsEditing(true)}
                />
                <EditableField
                  label="Expected Close"
                  value={formatDate(activeDeal.expectedCloseDate)}
                  onEdit={() => setIsEditing(true)}
                />
                <EditableField
                  label="Last Activity"
                  value={formatRelativeDays(
                    activeDeal.lastActivityAt ?? activeDeal.createdAt
                  )}
                  onEdit={() => setIsEditing(true)}
                />
                <EditableField
                  label="Created"
                  value={formatDate(activeDeal.createdAt)}
                  onEdit={() => setIsEditing(true)}
                />
                <EditableField
                  label="Updated"
                  value={formatDate(activeDeal.updatedAt)}
                  onEdit={() => setIsEditing(true)}
                />
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Move Stage</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                aria-label={`Move ${activeDeal.name} stage from drawer`}
                defaultValue={activeDeal.stage}
                disabled={isPending}
                onChange={(event) =>
                  moveStage(event.currentTarget.value as DealStage)
                }
              >
                {DEAL_STAGES.map((stage) => (
                  <option key={stage} value={stage}>
                    {STAGE_LABELS[stage]}
                  </option>
                ))}
              </Select>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary">
                  {formatCurrency(activeDeal.value)}
                </Badge>
                <Badge variant={activeDeal.stale ? "danger" : "outline"}>
                  {activeDeal.stale ? "Stale" : "Current"}
                </Badge>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Links</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-4 text-sm">
              {activeDeal.account ? (
                <Link
                  href={`/accounts/${activeDeal.account.id}`}
                  className="text-primary hover:underline"
                >
                  {activeDeal.account.name}
                </Link>
              ) : (
                <span className="text-muted-foreground">No account</span>
              )}
              {activeDeal.contact ? (
                <Link
                  href={`/contacts/${activeDeal.contact.id}`}
                  className="text-primary hover:underline"
                >
                  {activeDeal.contact.firstName} {activeDeal.contact.lastName}
                </Link>
              ) : (
                <span className="text-muted-foreground">No contact</span>
              )}
              <span className="text-muted-foreground">
                Owner: {activeDeal.owner?.name ?? "Unassigned"}
              </span>
            </CardContent>
          </Card>

          {activeDeal.contact ? (
            <AddNoteForm
              contactId={activeDeal.contact.id}
              deals={[
                {
                  id: activeDeal.id,
                  name: activeDeal.name
                }
              ]}
              defaultDealId={activeDeal.id}
            />
          ) : (
            <Card>
              <CardContent className="p-5 text-sm text-muted-foreground">
                Add a contact to this deal before adding a linked note.
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <ActivityTimeline activities={activeDeal.activities} />
            </CardContent>
          </Card>
        </div>
      </aside>
    </div>
  );
}

function EditableField({
  label,
  value,
  onEdit
}: {
  label: string;
  value: string;
  onEdit: () => void;
}) {
  return (
    <button
      type="button"
      className="rounded-md border bg-background p-3 text-left transition-colors hover:bg-muted/50"
      onClick={onEdit}
    >
      <span className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </span>
      <span className="mt-1 block text-sm font-medium">{value}</span>
    </button>
  );
}
