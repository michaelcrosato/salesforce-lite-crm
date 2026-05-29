import {
  AlertTriangle,
  FileText,
  ShieldCheck,
  Table2,
  type LucideIcon
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import type {
  AuditCoverageManifest,
  AuditCoverageStatus,
  AuditCoverageWriteFlags
} from "@/lib/server/auditCoverageManifests";

type AuditCoverageOperatorProps = {
  manifest: AuditCoverageManifest;
};

type SourceSurface =
  AuditCoverageManifest["entities"][number]["sourceSurfaces"][number];

const writeFlagLabels = [
  { key: "database", label: "Database" },
  { key: "mutations", label: "Mutations" },
  { key: "auditEvents", label: "Audit events" },
  { key: "requestLogs", label: "Request logs" },
  { key: "externalTelemetry", label: "External telemetry" },
  { key: "externalServices", label: "External services" },
  { key: "backgroundJobs", label: "Background jobs" }
] satisfies ReadonlyArray<{
  key: keyof AuditCoverageWriteFlags;
  label: string;
}>;

export function AuditCoverageOperator({
  manifest
}: AuditCoverageOperatorProps) {
  const sourceSurfaces = manifest.entities.flatMap(
    (entity) => entity.sourceSurfaces
  );
  const hasWriteSurface = writeFlagLabels.some(
    (flag) => manifest.write[flag.key]
  );

  return (
    <section className="space-y-4" data-testid="audit-coverage-operator">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            Audit Coverage
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review audited productivity mutations, source surfaces, and known
            delete gaps.
          </p>
        </div>
        <Badge variant={hasWriteSurface ? "warning" : "success"}>
          {manifest.source.auditedMutationScope}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={FileText}
          label="Audited entities"
          value={formatNumber(manifest.entityCount)}
          testId="audit-coverage-summary-entities"
        />
        <SummaryCard
          icon={Table2}
          label="Source surfaces"
          value={formatNumber(manifest.sourceSurfaceCount)}
          testId="audit-coverage-summary-surfaces"
        />
        <SummaryCard
          icon={AlertTriangle}
          label="Known gaps"
          value={formatNumber(manifest.knownGapCount)}
          testId="audit-coverage-summary-gaps"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value={hasWriteSurface ? "Review" : "None"}
          testId="audit-coverage-summary-writes"
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          {manifest.entities.map((entity) => (
            <Card
              key={entity.entity}
              data-testid={`audit-coverage-entity-${entity.entity}`}
            >
              <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
                <div className="space-y-1.5">
                  <CardTitle>{entity.label}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {entity.route} - {formatNumber(entity.sourceSurfaceCount)}{" "}
                    source surfaces
                  </p>
                </div>
                <Badge variant={statusVariant(entity.status)}>
                  {formatToken(entity.status)}
                </Badge>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Metric
                    label="Covered"
                    value={formatNumber(entity.coveredActionCount)}
                  />
                  <Metric
                    label="Gaps"
                    value={formatNumber(entity.knownGapCount)}
                  />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Category Rollup</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table data-testid="audit-coverage-category-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Category</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                      <TableHead>Covered</TableHead>
                      <TableHead>Gaps</TableHead>
                      <TableHead>Entities</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {manifest.categories.map((category) => (
                      <TableRow
                        key={category.category}
                        data-testid={`audit-coverage-category-${category.category}`}
                      >
                        <TableCell className="font-medium">
                          {formatToken(category.category)}
                        </TableCell>
                        <TableCell>
                          <Badge variant={statusVariant(category.status)}>
                            {formatToken(category.status)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {formatNumber(category.actionCount)}
                        </TableCell>
                        <TableCell>
                          {formatNumber(category.coveredActionCount)}
                        </TableCell>
                        <TableCell>
                          {formatNumber(category.knownGapCount)}
                        </TableCell>
                        <TableCell>
                          {formatNumber(category.entityCount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Source Surfaces</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table data-testid="audit-coverage-source-table">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Operation</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Audit action</TableHead>
                      <TableHead>Source</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sourceSurfaces.map((surface) => (
                      <SourceSurfaceRow key={surface.id} surface={surface} />
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card data-testid="audit-coverage-known-gaps">
        <CardHeader>
          <CardTitle>Known Gaps And Safe Next Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-3">
            {manifest.knownGaps.map((gap) => (
              <div
                key={gap.id}
                className="rounded-md border bg-muted/20 px-3 py-3 text-sm"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{gap.operation}</span>
                  <Badge variant="warning">{gap.severity}</Badge>
                </div>
                <p className="mt-2 text-muted-foreground">{gap.reason}</p>
                <p className="mt-2 font-medium">{gap.safeNextAction}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="audit-coverage-write-flags"
      >
        {writeFlagLabels.map((flag) => (
          <div
            key={flag.key}
            className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
          >
            <span className="font-medium">{flag.label}</span>
            {" "}
            <span className="ml-2 text-muted-foreground">
              {manifest.write[flag.key] ? "on" : "off"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function SourceSurfaceRow({ surface }: { surface: SourceSurface }) {
  return (
    <TableRow>
      <TableCell className="font-medium">{surface.operation}</TableCell>
      <TableCell>{surface.label}</TableCell>
      <TableCell>
        {formatToken(surface.category)}.{formatToken(surface.action)}
      </TableCell>
      <TableCell>
        <span className="block max-w-88 truncate">
          {surface.sourceSurface}
        </span>
      </TableCell>
    </TableRow>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  testId
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  testId: string;
}) {
  return (
    <Card data-testid={testId}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-sm text-muted-foreground">
          <Icon className="h-4 w-4" aria-hidden="true" />
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-normal">{value}</div>
      </CardContent>
    </Card>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2">
      <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 text-lg font-semibold tracking-normal">{value}</div>
    </div>
  );
}

function statusVariant(status: AuditCoverageStatus) {
  switch (status) {
    case "covered":
      return "success";
    case "known_gap":
      return "warning";
    case "taxonomy_only":
      return "outline-solid";
  }
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
