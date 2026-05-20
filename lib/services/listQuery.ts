export type SortOrder = "asc" | "desc";

export type ListQueryInput<
  SortBy extends string,
  Filters extends Record<string, unknown>
> = {
  page?: number;
  pageSize?: number;
  sortBy?: SortBy;
  sortOrder?: SortOrder;
  filters?: Partial<Filters>;
};

export type ListQueryClauses<Where, OrderBy> = {
  where: Where;
  orderBy: OrderBy;
  skip: number;
  take: number;
};

export type ListQueryConfig<
  SortBy extends string,
  Filters extends Record<string, unknown>,
  Where,
  OrderBy
> = {
  defaultSortBy: SortBy;
  defaultSortOrder: SortOrder;
  defaultPageSize?: number;
  maxPageSize?: number;
  emptyWhere: Where;
  andWhere: (clauses: Where[]) => Where;
  sortMap: Record<SortBy, (order: SortOrder) => OrderBy>;
  filterMap: {
    [Key in keyof Filters]?: (
      value: NonNullable<Filters[Key]>
    ) => Where | undefined;
  };
};

function positiveIntegerOrDefault(value: number, fallback: number) {
  const truncated = Math.trunc(value);
  return Number.isFinite(truncated) ? Math.max(1, truncated) : fallback;
}

function isSortOrder(value: unknown): value is SortOrder {
  return value === "asc" || value === "desc";
}

export function buildListQuery<
  SortBy extends string,
  Filters extends Record<string, unknown>,
  Where,
  OrderBy
>(
  input: ListQueryInput<SortBy, Filters>,
  config: ListQueryConfig<SortBy, Filters, Where, OrderBy>
): ListQueryClauses<Where, OrderBy> {
  const defaultPageSize = positiveIntegerOrDefault(config.defaultPageSize ?? 25, 25);
  const maxPageSize = positiveIntegerOrDefault(config.maxPageSize ?? 100, 100);
  const page = positiveIntegerOrDefault(input.page ?? 1, 1);
  const requestedPageSize = positiveIntegerOrDefault(
    input.pageSize ?? defaultPageSize,
    defaultPageSize
  );
  const take = Math.min(requestedPageSize, maxPageSize);
  const sortBy =
    input.sortBy && Object.hasOwn(config.sortMap, input.sortBy)
      ? input.sortBy
      : config.defaultSortBy;
  const sortOrder = isSortOrder(input.sortOrder)
    ? input.sortOrder
    : config.defaultSortOrder;
  const filters: Partial<Filters> = input.filters ?? {};
  const whereClauses: Where[] = [];

  for (const key of Object.keys(config.filterMap) as (keyof Filters)[]) {
    const value = filters[key];
    const mapFilter = config.filterMap[key];

    if (value === undefined || value === null || value === "" || !mapFilter) {
      continue;
    }

    const clause = mapFilter(value as NonNullable<Filters[typeof key]>);

    if (clause) {
      whereClauses.push(clause);
    }
  }

  return {
    where:
      whereClauses.length > 0
        ? config.andWhere(whereClauses)
        : config.emptyWhere,
    orderBy: config.sortMap[sortBy](sortOrder),
    skip: (page - 1) * take,
    take
  };
}
