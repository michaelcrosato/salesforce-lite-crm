"use client";

import { X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteCaseAction, updateCaseStatusAction } from "@/app/cases/actions";
import {
  CaseForm,
  type CaseFormInitialValues,
  type CaseOptionItem
} from "@/components/cases/case-form";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  CASE_STATUSES,
  type CasePriority,
  type CaseStatus
} from "@/lib/crm/registry";
import { formatDate } from "@/lib/formatters";

type BadgeVariant =
  | "default"
  | "secondary"
  | "outline"
  | "success"
  | "warning"
  | "danger";

export type DrawerCase = CaseFormInitialValues & {
  id: string;
  subject: string;
  status: CaseStatus;
  priority: CasePriority;
  ownerName: string | null;
  createdAt: string;
  updatedAt: string;
};

const STATUS_LABELS: Record<CaseStatus, string> = {
  new: "New",
  in_progress: "In progress",
  waiting: "Waiting",
  resolved: "Resolved",
  closed: "Closed"
};

const STATUS_VARIANT: Record<CaseStatus, BadgeVariant> = {
  new: "default",
  in_progress: "warning",
  waiting: "secondary",
  resolved: "success",
  closed: "outline"
};

export function CaseDetailDrawer({
  crmCase,
  owners,
  accounts,
  contacts,
  onClose
}: {
  crmCase: DrawerCase | null;
  owners: CaseOptionItem[];
  accounts: CaseOptionItem[];
  contacts: CaseOptionItem[];
  onClose: () => void;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isPending, startTransition] = useTransition();

  if (!crmCase) {
    return null;
  }

  const activeCaseId = crmCase.id;

  function moveStatus(status: string) {
    startTransition(() => {
      void (async () => {
        const result = await updateCaseStatusAction(activeCaseId, status);
        showToast({
          title: result.ok ? "Case updated" : "Case not updated",
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
        const result = await deleteCaseAction(activeCaseId);
        showToast({
          title: result.ok ? "Case deleted" : "Case not deleted",
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
        aria-label="Close case detail"
        onClick={onClose}
      />
      <aside className="absolute right-0 top-0 flex h-full w-full max-w-2xl flex-col overflow-y-auto border-l bg-background shadow-2xl">
        <div className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b bg-background p-5">
          <div>
            <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
              Case Detail
            </p>
            <h2 className="mt-1 text-xl font-semibold">{crmCase.subject}</h2>
          </div>
          <Button type="button" variant="ghost" size="icon" onClick={onClose}>
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="space-y-5 p-5">
          {isEditing ? (
            <CaseForm
              title="Edit Case"
              submitLabel="Save case"
              owners={owners}
              accounts={accounts}
              contacts={contacts}
              initialValues={crmCase}
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
                  value={STATUS_LABELS[crmCase.status]}
                />
                <FieldView label="Priority" value={crmCase.priority} />
                <FieldView
                  label="Owner"
                  value={crmCase.ownerName ?? "Unassigned"}
                />
                <FieldView
                  label="Created"
                  value={formatDate(crmCase.createdAt)}
                />
                <FieldView
                  label="Updated"
                  value={formatDate(crmCase.updatedAt)}
                />
                {crmCase.description ? (
                  <div className="sm:col-span-2">
                    <p className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
                      Description
                    </p>
                    <p className="mt-1 whitespace-pre-wrap text-sm">
                      {crmCase.description}
                    </p>
                  </div>
                ) : null}
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>Update status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Select
                aria-label={`Move ${crmCase.subject} status`}
                defaultValue={crmCase.status}
                disabled={isPending}
                onChange={(event) => moveStatus(event.currentTarget.value)}
              >
                {CASE_STATUSES.map((status) => (
                  <option key={status} value={status}>
                    {STATUS_LABELS[status]}
                  </option>
                ))}
              </Select>
              <div className="flex flex-wrap gap-2">
                <Badge variant={STATUS_VARIANT[crmCase.status]}>
                  {STATUS_LABELS[crmCase.status]}
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
                Delete case
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
