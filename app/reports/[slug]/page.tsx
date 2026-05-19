import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import {
  ActivityVolumeTable,
  LeadsBySourceTable,
  OverdueTasksTable,
  PipelineByStageTable,
  StaleOpportunitiesTable,
  TopAccountsTable
} from "@/components/reports/report-tables";
import {
  getReportDefinition,
  isReportSlug,
  type ReportSlug
} from "@/components/reports/report-registry";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  activityVolumeByDay,
  leadsBySource,
  overdueTasks,
  pipelineByStage,
  staleOpportunities,
  topAccountsByOpportunityValue
} from "@/lib/services/reports";

export const dynamic = "force-dynamic";

type ReportParams = { slug: string };

export default async function ReportDetailPage({
  params
}: {
  params: Promise<ReportParams>;
}) {
  const { slug: rawSlug } = await params;

  if (!isReportSlug(rawSlug)) {
    notFound();
  }

  const slug: ReportSlug = rawSlug;
  const definition = getReportDefinition(slug);

  return (
    <div className="crm-page">
      <PageHeader title={definition.title} description={definition.description}>
        <Button asChild variant="outline">
          <Link href="/reports">All reports</Link>
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{definition.title}</CardTitle>
        </CardHeader>
        <CardContent>
          <ReportBody slug={slug} />
        </CardContent>
      </Card>
    </div>
  );
}

async function ReportBody({ slug }: { slug: ReportSlug }) {
  if (slug === "pipeline-by-stage") {
    const rows = await pipelineByStage();
    if (rows.length === 0) {
      return <EmptyState title="No pipeline data" description="No opportunity data found." />;
    }
    return <PipelineByStageTable rows={rows} />;
  }

  if (slug === "leads-by-source") {
    const rows = await leadsBySource();
    if (rows.length === 0) {
      return <EmptyState title="No leads" description="No leads recorded yet." />;
    }
    return <LeadsBySourceTable rows={rows} />;
  }

  if (slug === "activity-volume") {
    const rows = await activityVolumeByDay();
    if (rows.length === 0) {
      return <EmptyState title="No recent activity" description="No activity in the last 30 days." />;
    }
    return <ActivityVolumeTable rows={rows} />;
  }

  if (slug === "top-accounts") {
    const rows = await topAccountsByOpportunityValue();
    if (rows.length === 0) {
      return <EmptyState title="No accounts" description="No accounts with opportunities." />;
    }
    return <TopAccountsTable rows={rows} />;
  }

  if (slug === "stale-opportunities") {
    const rows = await staleOpportunities();
    if (rows.length === 0) {
      return <EmptyState title="No stale opportunities" description="All open opportunities have recent activity." />;
    }
    return <StaleOpportunitiesTable rows={rows} />;
  }

  const rows = await overdueTasks();
  if (rows.length === 0) {
    return <EmptyState title="No overdue tasks" description="Everything on the board is on time." />;
  }
  return <OverdueTasksTable rows={rows} />;
}
