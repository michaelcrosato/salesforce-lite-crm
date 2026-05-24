"use client";

import { CheckSquare, Download, Square, X } from "lucide-react";
import { useMemo, useState } from "react";
import {
  previewListSelectedExportAction,
  type ListSelectedExportActionResult
} from "@/app/list-selected-export-actions";
import { Button } from "@/components/ui/button";
import type { BulkActionSelectedExportPacketEntity } from "@/lib/server/bulkActionSelectedExportPackets";
import { cn } from "@/lib/utils";

export type ListSelectedExportRecord = {
  id: string;
  label: string;
};

export type ListSelectedExportActionProps = {
  entity: BulkActionSelectedExportPacketEntity;
  entityLabel: string;
  records: readonly ListSelectedExportRecord[];
  className?: string;
};

export function ListSelectedExportAction({
  entity,
  entityLabel,
  records,
  className
}: ListSelectedExportActionProps) {
  const visibleRecords = useMemo(() => dedupeRecords(records), [records]);
  const [selectedIds, setSelectedIds] = useState<readonly string[] | null>(null);
  const [result, setResult] = useState<ListSelectedExportActionResult | null>(
    null
  );
  const [isExporting, setIsExporting] = useState(false);

  const visibleRecordIds = useMemo(
    () => visibleRecords.map((record) => record.id),
    [visibleRecords]
  );
  const selectedIdSet = useMemo(
    () => new Set(selectedIds ?? visibleRecordIds),
    [selectedIds, visibleRecordIds]
  );
  const selectedRecords = useMemo(
    () => visibleRecords.filter((record) => selectedIdSet.has(record.id)),
    [selectedIdSet, visibleRecords]
  );
  const testIdPrefix = `${entity}-selected-export`;

  function setAllSelected() {
    setSelectedIds(null);
    setResult(null);
  }

  function clearSelection() {
    setSelectedIds([]);
    setResult(null);
  }

  function toggleRecord(recordId: string) {
    setSelectedIds((current) =>
      (current ?? visibleRecordIds).includes(recordId)
        ? (current ?? visibleRecordIds).filter((id) => id !== recordId)
        : [...(current ?? visibleRecordIds), recordId]
    );
    setResult(null);
  }

  async function exportSelected() {
    const formData = new FormData();
    formData.set("entity", entity);
    selectedRecords.forEach((record) => {
      formData.append("recordIds", record.id);
    });

    setIsExporting(true);

    try {
      const actionResult = await previewListSelectedExportAction(formData);
      setResult(actionResult);

      if (actionResult.ok && actionResult.rowCount > 0) {
        downloadCsv(actionResult);
      }
    } finally {
      setIsExporting(false);
    }
  }

  if (visibleRecords.length === 0) {
    return null;
  }

  return (
    <section
      className={cn("mb-4 rounded-md border bg-muted/30 p-3", className)}
      data-testid={`${testIdPrefix}-panel`}
    >
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-1">
          <h3 className="text-sm font-semibold">Selected export</h3>
          <p className="text-sm text-muted-foreground">
            {selectedRecords.length} of {visibleRecords.length} visible{" "}
            {entityLabel.toLowerCase()} selected.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={setAllSelected}
            data-testid={`${testIdPrefix}-select-all`}
          >
            <CheckSquare className="h-4 w-4" aria-hidden="true" />
            All
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={clearSelection}
            data-testid={`${testIdPrefix}-clear`}
          >
            <Square className="h-4 w-4" aria-hidden="true" />
            None
          </Button>
          <Button
            type="button"
            size="sm"
            loading={isExporting}
            disabled={selectedRecords.length === 0}
            onClick={() => {
              void exportSelected();
            }}
            data-testid={`${testIdPrefix}-submit`}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Export selected
          </Button>
        </div>
      </div>

      <div className="mt-3 max-h-44 overflow-y-auto rounded-md border bg-background p-2">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
          {visibleRecords.map((record) => (
            <label
              key={record.id}
              className="flex min-w-0 items-center gap-2 rounded-md px-2 py-1 text-sm hover:bg-muted"
            >
              <input
                type="checkbox"
                className="h-4 w-4 shrink-0 accent-primary"
                checked={selectedIdSet.has(record.id)}
                onChange={() => toggleRecord(record.id)}
                aria-label={`Select ${record.label} for ${entityLabel} export`}
                data-testid={`${testIdPrefix}-row`}
              />
              <span className="truncate">{record.label}</span>
            </label>
          ))}
        </div>
      </div>

      {result ? (
        <div
          className={cn(
            "mt-3 rounded-md border px-3 py-2 text-sm",
            result.ok
              ? "border-emerald-200 bg-emerald-50 text-emerald-900"
              : "border-destructive/30 bg-destructive/10 text-destructive"
          )}
          data-testid={`${testIdPrefix}-status`}
        >
          <div className="flex items-start gap-2">
            {result.ok ? null : (
              <X className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            )}
            <div className="min-w-0 space-y-1">
              <p className="font-medium">{result.message}</p>
              {result.ok && result.blockedRecords.length > 0 ? (
                <p>
                  Blocked:{" "}
                  {result.blockedRecords
                    .map((record) => record.label ?? record.id)
                    .join(", ")}
                </p>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function dedupeRecords(
  records: readonly ListSelectedExportRecord[]
): ListSelectedExportRecord[] {
  const seen = new Set<string>();
  const output: ListSelectedExportRecord[] = [];

  for (const record of records) {
    if (!seen.has(record.id)) {
      seen.add(record.id);
      output.push(record);
    }
  }

  return output;
}

function downloadCsv(result: Extract<ListSelectedExportActionResult, { ok: true }>) {
  const blob = new Blob([result.csv], { type: result.contentType });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = result.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}
