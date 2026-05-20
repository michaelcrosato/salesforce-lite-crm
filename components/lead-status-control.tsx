"use client";

import { useTransition } from "react";
import { updateLeadStatusAction } from "@/app/leads/actions";
import { Select } from "@/components/ui/select";
import { useToast } from "@/components/ui/toast";
import {
  LEAD_STATUSES,
  LEAD_STATUS_LABELS,
  type LeadStatus
} from "@/lib/crm-constants";

export interface LeadStatusControlProps {
  leadId: string;
  status: LeadStatus;
  "data-testid"?: string;
}

export function LeadStatusControl({
  leadId,
  status,
  "data-testid": testid
}: LeadStatusControlProps) {
  const { showToast } = useToast();
  const [isPending, startTransition] = useTransition();

  function updateStatus(nextStatus: LeadStatus) {
    startTransition(() => {
      void (async () => {
        const result = await updateLeadStatusAction({
          leadId,
          status: nextStatus
        });

        showToast({
          title: result.ok ? "Lead updated" : "Lead not updated",
          description: result.message,
          variant: result.ok ? "success" : "error"
        });
      })();
    });
  }

  return (
    <Select
      aria-label="Update lead status"
      data-testid={testid}
      defaultValue={status}
      disabled={isPending}
      onChange={(event) =>
        updateStatus(event.currentTarget.value as LeadStatus)
      }
    >
      {LEAD_STATUSES.map((leadStatus) => (
        <option key={leadStatus} value={leadStatus}>
          {LEAD_STATUS_LABELS[leadStatus]}
        </option>
      ))}
    </Select>
  );
}
