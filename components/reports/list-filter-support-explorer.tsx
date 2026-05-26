import {
  ArrowDownUp,
  CalendarRange,
  Filter,
  TableProperties,
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
  ListFilterSupportCatalog,
  ListFilterSupportEntityCatalog,
  ListFilterSupportFilter,
  ListFilterSupportSortKey,
  ListFilterSupportWriteFlags
} from "@/lib/server/listFilterSupportCatalog";

type ListFilterSupportExplorerProps = {
  catalog: ListFilterSupportCatalog;
};

const writeFlagLabels = [
  { key: "database", label: "Database" },
  { key: "mutations", label: "Mutations" },
  { key: "schemas", label: "Schemas" },
  { key: "routes", label: "Routes" },
  { key: "files", label: "Files" },
  { key: "externalServices", label: "External services" },
  { key: "backgroundJobs", label: "Background jobs" }
] satisfies ReadonlyArray<{
  key: keyof ListFilterSupportWriteFlags;
  label: string;
}>;

export function ListFilterSupportExplorer({
  catalog
}: ListFilterSupportExplorerProps) {
  const filters = catalog.entities.flatMap((entity) =>
    entity.filters.map((filter) => ({
      entity,
      filter
    }))
  );
  const sortKeys = catalog.entities.flatMap((entity) =>
    entity.sortKeys.map((sort) => ({
      entity,
      sort
    }))
  );
  const hasWriteSurface = writeFlagLabels.some(
    (flag) => catalog.write[flag.key]
  );

  return (
    <section className="space-y-4" data-testid="list-filter-support-explorer">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-xl font-semibold tracking-normal">
            List Filter Support
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Inspect current list filters, sort keys, pagination limits, and
            source adapters.
          </p>
        </div>
        <Badge variant={hasWriteSurface ? "warning" : "success"}>
          {formatToken(catalog.source.catalogScope)}
        </Badge>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <SummaryCard
          icon={TableProperties}
          label="Supported entities"
          value={formatNumber(catalog.entityCount)}
          testId="list-filter-support-summary-entities"
        />
        <SummaryCard
          icon={Filter}
          label="Filter fields"
          value={formatNumber(catalog.filterCount)}
          testId="list-filter-support-summary-filters"
        />
        <SummaryCard
          icon={ArrowDownUp}
          label="Sort keys"
          value={formatNumber(catalog.sortKeyCount)}
          testId="list-filter-support-summary-sorts"
        />
        <SummaryCard
          icon={CalendarRange}
          label="Date range filters"
          value={formatNumber(catalog.dateRangeFilterCount)}
          testId="list-filter-support-summary-date-ranges"
        />
      </div>

      <div className="grid min-w-0 gap-4 xl:grid-cols-[minmax(16rem,22rem)_minmax(0,1fr)]">
        <div className="min-w-0 space-y-3">
          {catalog.entities.map((entity) => (
            <EntityCard key={entity.entity} entity={entity} />
          ))}
        </div>

        <div className="min-w-0 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Entity Capability Matrix</CardTitle>
            </CardHeader>
            <CardContent>
              <Table data-testid="list-filter-support-entity-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Entity</TableHead>
                    <TableHead>Route</TableHead>
                    <TableHead>Default sort</TableHead>
                    <TableHead>Filters</TableHead>
                    <TableHead>Sorts</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {catalog.entities.map((entity) => (
                    <TableRow key={entity.entity}>
                      <TableCell className="font-medium">
                        {entity.label}
                      </TableCell>
                      <TableCell>{entity.route}</TableCell>
                      <TableCell>
                        {entity.defaultSortBy} {entity.defaultSortOrder}
                      </TableCell>
                      <TableCell>{formatNumber(entity.filterCount)}</TableCell>
                      <TableCell>{formatNumber(entity.sortKeyCount)}</TableCell>
                      <TableCell>
                        <span className="block max-w-[18rem] truncate">
                          {entity.sourceSurface}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Filters</CardTitle>
            </CardHeader>
            <CardContent>
              <Table data-testid="list-filter-support-filter-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Filter</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Operators</TableHead>
                    <TableHead>Value type</TableHead>
                    <TableHead>Field paths</TableHead>
                    <TableHead>Allowed values</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filters.map(({ entity, filter }) => (
                    <FilterRow
                      key={`${entity.entity}-${filter.key}`}
                      entity={entity}
                      filter={filter}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Sort Keys</CardTitle>
            </CardHeader>
            <CardContent>
              <Table data-testid="list-filter-support-sort-table">
                <TableHeader>
                  <TableRow>
                    <TableHead>Sort key</TableHead>
                    <TableHead>Entity</TableHead>
                    <TableHead>Field paths</TableHead>
                    <TableHead>Tie breakers</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortKeys.map(({ entity, sort }) => (
                    <SortRow
                      key={`${entity.entity}-${sort.key}`}
                      entity={entity}
                      sort={sort}
                    />
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Catalog Sources</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 lg:grid-cols-3">
            <SourcePill
              label="Adapters"
              value={catalog.source.adapterModule}
            />
            <SourcePill
              label="List query"
              value={catalog.source.listQueryModule}
            />
            <SourcePill
              label="Filter compiler"
              value={catalog.source.filterCompilerModule}
            />
            {catalog.source.serviceListModules.map((source) => (
              <SourcePill key={source} label="Service list" value={source} />
            ))}
          </div>
        </CardContent>
      </Card>

      <div
        className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4"
        data-testid="list-filter-support-write-flags"
      >
        {writeFlagLabels.map((flag) => (
          <div
            key={flag.key}
            className="rounded-md border bg-muted/20 px-3 py-2 text-sm"
          >
            <span className="font-medium">{flag.label}</span>
            {" "}
            <span className="ml-2 text-muted-foreground">
              {catalog.write[flag.key] ? "on" : "off"}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

function EntityCard({ entity }: { entity: ListFilterSupportEntityCatalog }) {
  return (
    <Card data-testid={`list-filter-support-entity-${entity.entity}`}>
      <CardHeader className="gap-3 sm:flex-row sm:items-start sm:justify-between sm:space-y-0">
        <div className="space-y-1.5">
          <CardTitle>{entity.label}</CardTitle>
          <p className="text-sm text-muted-foreground">
            {entity.route} - {entity.adapter}
          </p>
        </div>
        <Badge variant="outline">{formatToken(entity.filterCombination)}</Badge>
      </CardHeader>
      <CardContent>
        <div className="grid gap-2 sm:grid-cols-2">
          <Metric label="Filters" value={formatNumber(entity.filterCount)} />
          <Metric label="Sorts" value={formatNumber(entity.sortKeyCount)} />
          <Metric
            label="Page size"
            value={formatNumber(entity.pagination.pageSize.max)}
          />
          <Metric
            label="Legacy window"
            value={entity.legacyWindowInput.supported ? "skip/take" : "none"}
          />
        </div>
      </CardContent>
    </Card>
  );
}

function FilterRow({
  entity,
  filter
}: {
  entity: ListFilterSupportEntityCatalog;
  filter: ListFilterSupportFilter;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{filter.label}</TableCell>
      <TableCell>{entity.label}</TableCell>
      <TableCell>{formatTokens(filter.operators)}</TableCell>
      <TableCell>{formatToken(filter.valueType)}</TableCell>
      <TableCell>
        <span className="block max-w-[18rem] truncate">
          {formatFieldPaths(filter.fieldPaths)}
        </span>
      </TableCell>
      <TableCell>
        <span className="block max-w-[18rem] truncate">
          {formatAllowedValues(filter)}
        </span>
      </TableCell>
    </TableRow>
  );
}

function SortRow({
  entity,
  sort
}: {
  entity: ListFilterSupportEntityCatalog;
  sort: ListFilterSupportSortKey;
}) {
  return (
    <TableRow>
      <TableCell className="font-medium">{sort.label}</TableCell>
      <TableCell>{entity.label}</TableCell>
      <TableCell>{formatFieldPaths(sort.fieldPaths)}</TableCell>
      <TableCell>
        {sort.tieBreakerFieldPaths.length > 0
          ? formatFieldPaths(sort.tieBreakerFieldPaths)
          : "none"}
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

function SourcePill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border bg-muted/20 px-3 py-2 text-sm">
      <div className="text-xs font-medium uppercase tracking-normal text-muted-foreground">
        {label}
      </div>
      <div className="mt-1 font-medium">{value}</div>
    </div>
  );
}

function formatFieldPaths(fieldPaths: readonly (readonly string[])[]): string {
  return fieldPaths.map((fieldPath) => fieldPath.join(".")).join(", ");
}

function formatAllowedValues(filter: ListFilterSupportFilter): string {
  if (filter.allowedValues === null || filter.allowedValues.length === 0) {
    return "unbounded";
  }

  return filter.allowedValues.join(", ");
}

function formatTokens(values: readonly string[]): string {
  return values.map((value) => formatToken(value)).join(", ");
}

function formatToken(value: string): string {
  return value.replaceAll("_", " ").replaceAll("-", " ");
}

function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}
