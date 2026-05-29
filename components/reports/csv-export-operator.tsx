import { Download, ExternalLink, FileText, ShieldCheck, Table2 } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";
import { cn } from "@/lib/utils";
import type { CsvExportDeliveryPacket } from "@/lib/server/csvExportDeliveryPackets";

type CsvPreviewCell =
  CsvExportDeliveryPacket["review"]["preview"]["rows"][number][string];

type CsvExportOperatorProps = {
  packets: readonly CsvExportDeliveryPacket[];
  selectedPacket: CsvExportDeliveryPacket;
};

const writeFlagLabels = [
  { key: "database", label: "Database" },
  { key: "files", label: "Files" },
  { key: "externalServices", label: "External services" },
  { key: "exportHistory", label: "Export history" },
  { key: "scheduledDelivery", label: "Scheduled delivery" },
  { key: "backgroundJobs", label: "Background jobs" }
] satisfies ReadonlyArray<{
  key: keyof CsvExportDeliveryPacket["write"];
  label: string;
}>;

export function CsvExportOperator({
  packets,
  selectedPacket
}: CsvExportOperatorProps) {
  const totalRows = packets.reduce(
    (sum, packet) => sum + packet.totalAvailableRows,
    0
  );

  return (
    <section className="space-y-4" data-testid="csv-export-operator">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            CSV Export Review
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Review supported CRM export packets and download bounded CSV output.
          </p>
        </div>
        <Button asChild>
          <a
            data-testid="csv-export-download-link"
            download={selectedPacket.filename}
            href={toCsvDataUri(selectedPacket)}
          >
            <Download className="h-4 w-4" aria-hidden="true" />
            Download CSV
          </a>
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <SummaryCard
          icon={FileText}
          label="Supported exports"
          value={String(packets.length)}
          testId="csv-export-summary-supported"
        />
        <SummaryCard
          icon={Table2}
          label="Rows available"
          value={formatNumber(totalRows)}
          testId="csv-export-summary-rows"
        />
        <SummaryCard
          icon={ShieldCheck}
          label="Write surfaces"
          value="None"
          testId="csv-export-summary-writes"
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <div
          className="min-w-0 space-y-2"
          data-testid="csv-export-entity-list"
          aria-label="CSV export entities"
        >
          {packets.map((packet) => (
            <EntityLink
              key={packet.entity}
              packet={packet}
              selected={packet.entity === selectedPacket.entity}
            />
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          <Card data-testid="csv-export-selected-panel">
            <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
              <div className="space-y-1.5">
                <CardTitle>{selectedPacket.label}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedPacket.filename} - {selectedPacket.contentType}
                </p>
              </div>
              <Button asChild variant="outline" size="sm">
                <Link href={selectedPacket.route}>
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                  Open list
                </Link>
              </Button>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="Available" value={formatNumber(selectedPacket.totalAvailableRows)} />
                <Metric label="Download rows" value={formatNumber(selectedPacket.rowCount)} />
                <Metric label="Applied limit" value={formatNumber(selectedPacket.limits.appliedLimit)} />
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={
                    selectedPacket.limits.truncatedByLimit ? "warning" : "success"
                  }
                >
                  {selectedPacket.limits.truncatedByLimit
                    ? "Limited by row cap"
                    : "Within row cap"}
                </Badge>
                <Badge variant="outline">
                  Max {formatNumber(selectedPacket.limits.maxLimit)} rows
                </Badge>
                <Badge variant="outline">
                  {selectedPacket.columns.length} columns
                </Badge>
              </div>

              <div
                className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3"
                data-testid="csv-export-write-flags"
              >
                {writeFlagLabels.map((flag) => (
                  <div
                    key={flag.key}
                    className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
                  >
                    <span className="font-medium">{flag.label}</span>
                    <span className="ml-2 text-muted-foreground">
                      {selectedPacket.write[flag.key] ? "on" : "off"}
                    </span>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold tracking-normal">
                  Operator Notes
                </h3>
                <div className="space-y-2">
                  {selectedPacket.notes.map((note) => (
                    <div
                      key={note.code}
                      className="rounded-md border bg-background px-3 py-2 text-sm"
                    >
                      <Badge
                        className="mb-2"
                        variant={note.severity === "warning" ? "warning" : "outline-solid"}
                      >
                        {note.code}
                      </Badge>
                      <p className="text-muted-foreground">{note.message}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview Rows</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedPacket.review.preview.rows.length === 0 ? (
                <EmptyState
                  title="No preview rows"
                  description="Header-only CSV output is available."
                />
              ) : (
                <Table data-testid="csv-export-preview-table">
                  <TableHeader>
                    <TableRow>
                      {selectedPacket.columns.map((column) => (
                        <TableHead key={column.key}>{column.label}</TableHead>
                      ))}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedPacket.review.preview.rows.map((row, rowIndex) => (
                      <TableRow key={`${selectedPacket.entity}-${rowIndex}`}>
                        {selectedPacket.columns.map((column) => (
                          <TableCell key={column.key}>
                            <span className="block max-w-[16rem] truncate">
                              {formatCell(row[column.key])}
                            </span>
                          </TableCell>
                        ))}
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}

function SummaryCard({
  icon: Icon,
  label,
  value,
  testId
}: {
  icon: typeof FileText;
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

function EntityLink({
  packet,
  selected
}: {
  packet: CsvExportDeliveryPacket;
  selected: boolean;
}) {
  return (
    <Link
      aria-current={selected ? "true" : undefined}
      className={cn(
        "block rounded-md border bg-card px-4 py-3 transition-colors hover:bg-muted/30 focus:outline-hidden focus-visible:ring-2 focus-visible:ring-ring",
        selected && "border-primary bg-primary/5"
      )}
      data-testid={`csv-export-entity-${packet.entity}`}
      href={`/reports?csvExport=${packet.entity}`}
      scroll={false}
    >
      <div className="flex items-center justify-between gap-3">
        <span className="font-medium">{packet.label}</span>
        <Badge variant={packet.totalAvailableRows > 0 ? "success" : "outline-solid"}>
          {formatNumber(packet.totalAvailableRows)}
        </Badge>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">
        {packet.columns.length} columns - {packet.filename}
      </p>
    </Link>
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

function formatCell(value: CsvPreviewCell | undefined): string {
  if (value === null || value === undefined || value === "") {
    return "Not set";
  }

  return String(value);
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

function toCsvDataUri(packet: CsvExportDeliveryPacket): string {
  const mediaType = packet.contentType.replace("; ", ";");
  return `data:${mediaType},${encodeURIComponent(packet.csv)}`;
}
