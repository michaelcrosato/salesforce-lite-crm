import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { AuditCoverageOperator } from "@/components/reports/audit-coverage-operator";
import { AuditEventExplorer } from "@/components/reports/audit-event-explorer";
import { BulkDryRunReviewOperator } from "@/components/reports/bulk-dry-run-review-operator";
import { CsvExportOperator } from "@/components/reports/csv-export-operator";
import { CsvImportPreviewOperator } from "@/components/reports/csv-import-preview-operator";
import { ListFilterSupportExplorer } from "@/components/reports/list-filter-support-explorer";
import { WorkflowDryRunOperator } from "@/components/reports/workflow-dry-run-operator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  REPORT_DEFINITIONS,
  type ReportDefinition
} from "@/components/reports/report-registry";
import {
  getCsvExportDeliveryPacket,
  isCsvExportDeliveryPacketEntity,
  listCsvExportDeliveryPackets,
  type CsvExportDeliveryPacketEntity
} from "@/lib/server/csvExportDeliveryPackets";
import { listCsvImportTemplates } from "@/lib/server/csvImportTemplates";
import { getAuditCoverageManifest } from "@/lib/server/auditCoverageManifests";
import { getListFilterSupportCatalog } from "@/lib/server/listFilterSupportCatalog";
import { listBulkActionDryRunReviewPacketDefinitions } from "@/lib/server/bulkActionDryRunReviewPackets";
import { getWorkflowRuleExampleCatalog } from "@/lib/server/workflowRuleExamples";
import {
  AUDIT_ENTITY_TYPES,
  AUDIT_EVENT_CATEGORIES,
  getAuditEventExplorer,
  isAuditActionForCategory,
  type AuditEntityType,
  type AuditEventCategory,
  type AuditEventExplorerInput
} from "@/lib/services/auditEvents";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports"
};

type ReportsSearchParams = {
  csvExport?: string | string[];
  auditCategory?: string | string[];
  auditAction?: string | string[];
  auditEntity?: string | string[];
};

const DEFAULT_CSV_EXPORT_ENTITY: CsvExportDeliveryPacketEntity = "accounts";
const CSV_EXPORT_PREVIEW_LIMIT = 5;

export default async function ReportsPage({
  searchParams
}: {
  searchParams?: Promise<ReportsSearchParams>;
}) {
  const resolvedSearchParams = searchParams ? await searchParams : {};
  const selectedCsvEntity = resolveCsvExportEntity(
    resolvedSearchParams.csvExport
  );
  const auditFilters = resolveAuditFilters(resolvedSearchParams);
  const [csvPackets, selectedCsvPacket, auditEventExplorer] = await Promise.all([
    listCsvExportDeliveryPackets({ limit: CSV_EXPORT_PREVIEW_LIMIT }),
    getCsvExportDeliveryPacket(selectedCsvEntity),
    getAuditEventExplorer(auditFilters)
  ]);
  const csvImportTemplates = listCsvImportTemplates();
  const auditCoverageManifest = getAuditCoverageManifest();
  const listFilterSupportCatalog = getListFilterSupportCatalog();
  const bulkDryRunDefinitions = listBulkActionDryRunReviewPacketDefinitions();
  const workflowRuleExampleCatalog = getWorkflowRuleExampleCatalog();
  const bulkDryRunSampleRecordIds = csvPackets.map((packet) => ({
    entity: packet.entity,
    ids: packet.review.preview.rows.flatMap((row) => {
      const value = row.id;

      return typeof value === "string" ? [value] : [];
    })
  }));

  return (
    <div className="crm-page">
      <PageHeader
        title="Reports"
        description="Inspect pipeline, leads, activity, and operational health."
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {REPORT_DEFINITIONS.map((report) => (
          <ReportCard key={report.slug} report={report} />
        ))}
      </div>

      <AuditCoverageOperator manifest={auditCoverageManifest} />

      <AuditEventExplorer snapshot={auditEventExplorer} />

      <ListFilterSupportExplorer catalog={listFilterSupportCatalog} />

      <BulkDryRunReviewOperator
        definitions={bulkDryRunDefinitions}
        sampleRecordIds={bulkDryRunSampleRecordIds}
      />

      <WorkflowDryRunOperator catalog={workflowRuleExampleCatalog} />

      <CsvExportOperator
        packets={csvPackets}
        selectedPacket={selectedCsvPacket}
      />

      <CsvImportPreviewOperator templates={csvImportTemplates} />
    </div>
  );
}

function ReportCard({ report }: { report: ReportDefinition }) {
  return (
    <Link
      href={`/reports/${report.slug}`}
      className="block focus:outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-lg"
    >
      <Card className="h-full transition-colors hover:bg-muted/30">
        <CardHeader>
          <CardTitle>{report.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{report.description}</p>
        </CardContent>
      </Card>
    </Link>
  );
}

function resolveCsvExportEntity(
  value: string | string[] | undefined
): CsvExportDeliveryPacketEntity {
  const candidate = Array.isArray(value) ? value[0] : value;

  if (candidate && isCsvExportDeliveryPacketEntity(candidate)) {
    return candidate;
  }

  return DEFAULT_CSV_EXPORT_ENTITY;
}

function resolveAuditFilters(
  searchParams: ReportsSearchParams
): AuditEventExplorerInput {
  const category = resolveAuditCategory(searchParams.auditCategory);
  const action = resolveAuditAction(searchParams.auditAction, category);
  const entityType = resolveAuditEntityType(searchParams.auditEntity);

  return {
    category,
    action,
    entityType
  };
}

function resolveAuditCategory(
  value: string | string[] | undefined
): AuditEventCategory | undefined {
  const candidate = firstSearchParam(value);

  if (!candidate) {
    return undefined;
  }

  return AUDIT_EVENT_CATEGORIES.find((category) => category === candidate);
}

function resolveAuditAction(
  value: string | string[] | undefined,
  category: AuditEventCategory | undefined
): string | undefined {
  const candidate = firstSearchParam(value);

  if (!candidate) {
    return undefined;
  }

  if (category && !isAuditActionForCategory(category, candidate)) {
    return undefined;
  }

  return candidate;
}

function resolveAuditEntityType(
  value: string | string[] | undefined
): AuditEntityType | undefined {
  const candidate = firstSearchParam(value);

  if (!candidate) {
    return undefined;
  }

  return AUDIT_ENTITY_TYPES.find((entityType) => entityType === candidate);
}

function firstSearchParam(value: string | string[] | undefined): string {
  const candidate = Array.isArray(value) ? value[0] : value;

  return candidate?.trim() ?? "";
}
