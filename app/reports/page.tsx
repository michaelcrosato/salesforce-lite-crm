import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  REPORT_DEFINITIONS,
  type ReportDefinition
} from "@/components/reports/report-registry";

export const dynamic = "force-dynamic";

export default function ReportsPage() {
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
