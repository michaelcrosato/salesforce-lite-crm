export type DateField<T> = {
  [K in keyof T]: T[K] extends Date | string | null | undefined ? K : never;
}[keyof T];

export type MonthlyComparison = {
  thisMonth: number;
  lastMonth: number;
  deltaPct: number;
};

export function monthlyComparison<T extends Record<string, unknown>>(
  records: readonly T[],
  dateField: keyof T,
  now = new Date()
): MonthlyComparison {
  const thisYear = now.getUTCFullYear();
  const thisMonth = now.getUTCMonth();
  const lastYear = thisMonth === 0 ? thisYear - 1 : thisYear;
  const lastMonth = thisMonth === 0 ? 11 : thisMonth - 1;

  let thisCount = 0;
  let lastCount = 0;

  for (const rec of records) {
    const d = rec[dateField];
    if (d == null) continue;
    const dt = d instanceof Date ? d : new Date(String(d));
    if (Number.isNaN(dt.getTime())) continue;
    const y = dt.getUTCFullYear();
    const m = dt.getUTCMonth();
    if (y === thisYear && m === thisMonth) thisCount += 1;
    if (y === lastYear && m === lastMonth) lastCount += 1;
  }

  let deltaPct = 0;
  if (lastCount > 0) {
    deltaPct = Math.round(((thisCount - lastCount) / lastCount) * 1000) / 10;
  } else if (thisCount > 0) {
    deltaPct = 100;
  }

  return { thisMonth: thisCount, lastMonth: lastCount, deltaPct };
}

export function topNByField<T extends Record<string, unknown>>(
  records: readonly T[],
  field: keyof T,
  n: number
): T[] {
  const sorted = [...records].sort((a, b) => {
    const va = a[field];
    const vb = b[field];
    if (typeof va === "number" && typeof vb === "number") return vb - va;
    if (va != null && vb != null) return String(vb).localeCompare(String(va));
    return 0;
  });
  return sorted.slice(0, Math.max(0, n));
}

export type Bucket = {
  start: Date;
  end: Date;
  label: string;
};

export function bucketByDateRange<T extends Record<string, unknown>>(
  records: readonly T[],
  dateField: keyof T,
  buckets: readonly Bucket[]
): Record<string, T[]> {
  const result: Record<string, T[]> = {};
  for (const b of buckets) {
    result[b.label] = [];
  }

  for (const rec of records) {
    const d = rec[dateField];
    if (d == null) continue;
    const dt = d instanceof Date ? d : new Date(String(d));
    if (Number.isNaN(dt.getTime())) continue;
    const t = dt.getTime();
    for (const b of buckets) {
      if (t >= b.start.getTime() && t <= b.end.getTime()) {
        result[b.label]?.push(rec);
        break;
      }
    }
  }
  return result;
}
