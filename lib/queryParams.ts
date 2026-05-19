export function nonEmptyQueryParam(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

export function allQueryParam(value: string | undefined): string {
  return nonEmptyQueryParam(value) ?? "all";
}

export function dateQueryParam(value: string | undefined): string | undefined {
  const param = nonEmptyQueryParam(value);
  if (!param) {
    return undefined;
  }

  return Number.isNaN(new Date(param).getTime()) ? undefined : param;
}
