export type FilterScalar = string | number | boolean | Date;
export type FilterValue = FilterScalar | null;
export type FilterFieldPath = readonly [string, ...string[]];

type ScalarFilterOperator = "equals" | "contains" | "in" | "gte" | "lte";

type ScalarFilterExpression = {
  kind: "scalar";
  path: FilterFieldPath;
  operator: ScalarFilterOperator;
  value: FilterValue | readonly FilterScalar[];
};

type LogicalFilterExpression = {
  kind: "and" | "or";
  filters: readonly FilterExpression[];
};

export type FilterExpression =
  | ScalarFilterExpression
  | LogicalFilterExpression;

type PrismaFilterObject = Record<string, unknown>;

export function fieldEquals(
  path: FilterFieldPath,
  value: FilterValue
): FilterExpression {
  return { kind: "scalar", path, operator: "equals", value };
}

export function fieldContains(
  path: FilterFieldPath,
  value: string
): FilterExpression {
  return { kind: "scalar", path, operator: "contains", value };
}

export function fieldIn(
  path: FilterFieldPath,
  values: readonly FilterScalar[]
): FilterExpression {
  return { kind: "scalar", path, operator: "in", value: values };
}

export function fieldGte(
  path: FilterFieldPath,
  value: FilterScalar
): FilterExpression {
  return { kind: "scalar", path, operator: "gte", value };
}

export function fieldLte(
  path: FilterFieldPath,
  value: FilterScalar
): FilterExpression {
  return { kind: "scalar", path, operator: "lte", value };
}

export function andFilters(
  filters: readonly FilterExpression[]
): FilterExpression {
  return { kind: "and", filters };
}

export function orFilters(filters: readonly FilterExpression[]): FilterExpression {
  return { kind: "or", filters };
}

export function isFilterExpression(value: unknown): value is FilterExpression {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const kind = (value as { kind?: unknown }).kind;
  return kind === "scalar" || kind === "and" || kind === "or";
}

export function compileFilterExpression<Where>(
  expression: FilterExpression
): Where | undefined {
  const compiled = compileExpression(expression);
  return compiled as Where | undefined;
}

function compileExpression(
  expression: FilterExpression
): PrismaFilterObject | undefined {
  switch (expression.kind) {
    case "and":
    case "or":
      return compileLogicalExpression(expression);
    case "scalar":
      return compileScalarExpression(expression);
  }
}

function compileLogicalExpression(
  expression: LogicalFilterExpression
): PrismaFilterObject | undefined {
  const clauses = expression.filters
    .map(compileExpression)
    .filter((clause): clause is PrismaFilterObject => clause !== undefined);

  if (clauses.length === 0) {
    return undefined;
  }

  return {
    [expression.kind === "and" ? "AND" : "OR"]: clauses
  };
}

function compileScalarExpression(
  expression: ScalarFilterExpression
): PrismaFilterObject | undefined {
  const leaf = scalarLeaf(expression);

  if (leaf === undefined) {
    return undefined;
  }

  return nestPath(expression.path, leaf);
}

function scalarLeaf(expression: ScalarFilterExpression): unknown {
  switch (expression.operator) {
    case "equals":
      return expression.value;
    case "contains":
      return typeof expression.value === "string"
        ? { contains: expression.value }
        : undefined;
    case "in":
      return Array.isArray(expression.value) && expression.value.length > 0
        ? { in: [...expression.value] }
        : undefined;
    case "gte":
      return { gte: expression.value };
    case "lte":
      return { lte: expression.value };
  }
}

function nestPath(path: FilterFieldPath, leaf: unknown): PrismaFilterObject {
  let output = leaf;

  for (const segment of [...path].reverse()) {
    output = { [segment]: output };
  }

  return output as PrismaFilterObject;
}
