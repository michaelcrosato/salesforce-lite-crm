export function nonEmptyQueryParam(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function allQueryParam(value: string | undefined): string {
  return nonEmptyQueryParam(value) ?? "all";
}

export function boundedNumberQueryParam(
  value: string | undefined,
  options: { max?: number; min?: number } = {}
): number | undefined {
  const param = nonEmptyQueryParam(value);
  if (!param) {
    return undefined;
  }

  const numeric = Number(param);
  if (!Number.isFinite(numeric)) {
    return undefined;
  }

  if (options.min !== undefined && numeric < options.min) {
    return undefined;
  }

  if (options.max !== undefined && numeric > options.max) {
    return undefined;
  }

  return numeric;
}

export function dateQueryParam(value: string | undefined): string | undefined {
  const param = nonEmptyQueryParam(value);
  if (!param) {
    return undefined;
  }

  return Number.isNaN(new Date(param).getTime()) ? undefined : param;
}
