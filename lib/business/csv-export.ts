export type CsvColumn<T> = {
  key: keyof T;
  label: string;
};

function escapeField(value: unknown): string {
  if (value == null) return "";
  if (value instanceof Date) {
    return value.toISOString();
  }
  const str = String(value);
  // RFC 4180: quote if contains comma, quote, or newline (CR/LF)
  if (/[",\r\n]/.test(str)) {
    const escaped = str.replace(/"/g, '""');
    return `"${escaped}"`;
  }
  return str;
}

export function toCsv<T extends Record<string, unknown>>(
  rows: readonly T[],
  columns: readonly CsvColumn<T>[]
): string {
  if (columns.length === 0) return "";
  const header = columns.map((col) => escapeField(col.label)).join(",");
  if (rows.length === 0) return header + "\n";

  const lines = rows.map((row) =>
    columns.map((col) => escapeField(row[col.key])).join(",")
  );
  return [header, ...lines].join("\n");
}
