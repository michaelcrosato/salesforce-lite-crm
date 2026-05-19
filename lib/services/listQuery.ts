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

export function buildListQuery<
  SortBy extends string,
  Filters extends Record<string, unknown>,
  Where,
  OrderBy
>(
  input: ListQueryInput<SortBy, Filters>,
  config: ListQueryConfig<SortBy, Filters, Where, OrderBy>
): ListQueryClauses<Where, OrderBy> {
  const defaultPageSize = config.defaultPageSize ?? 25;
  const maxPageSize = config.maxPageSize ?? 100;
  const page = Math.max(1, Math.trunc(input.page ?? 1));
  const requestedPageSize = Math.trunc(input.pageSize ?? defaultPageSize);
  const take = Math.min(Math.max(1, requestedPageSize), maxPageSize);
  const sortBy = input.sortBy ?? config.defaultSortBy;
  const sortOrder = input.sortOrder ?? config.defaultSortOrder;
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
