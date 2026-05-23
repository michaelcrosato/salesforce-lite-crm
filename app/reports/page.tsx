import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { AuditCoverageOperator } from "@/components/reports/audit-coverage-operator";
import { CsvExportOperator } from "@/components/reports/csv-export-operator";
import { CsvImportPreviewOperator } from "@/components/reports/csv-import-preview-operator";
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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Reports"
};

type ReportsSearchParams = {
  csvExport?: string | string[];
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
  const [csvPackets, selectedCsvPacket] = await Promise.all([
    listCsvExportDeliveryPackets({ limit: CSV_EXPORT_PREVIEW_LIMIT }),
    getCsvExportDeliveryPacket(selectedCsvEntity)
  ]);
  const csvImportTemplates = listCsvImportTemplates();
  const auditCoverageManifest = getAuditCoverageManifest();

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
