import { describe, expect, it } from "vitest";
import { toCsv, type CsvColumn } from "@/lib/business/csv-export";

describe("csv export helper (RFC 4180)", () => {
  type Row = { name: string; email: string | null; notes: string; created: Date };

  const cols: CsvColumn<Row>[] = [
    { key: "name", label: "Name" },
    { key: "email", label: "Email" },
    { key: "notes", label: "Notes" },
    { key: "created", label: "Created At" }
  ];

  it("exports header + rows with null as empty, Date as ISO", () => {
    const rows: Row[] = [
      { name: "Alice", email: "alice@example.com", notes: "ok", created: new Date("2026-05-01T00:00:00Z") },
      { name: "Bob", email: null, notes: "none", created: new Date("2026-05-02T12:30:00Z") }
    ];
    const csv = toCsv(rows, cols);
    expect(csv).toContain("Name,Email,Notes,Created At");
    expect(csv).toContain("Alice,alice@example.com,ok,2026-05-01T00:00:00.000Z");
    expect(csv).toContain("Bob,,none,2026-05-02T12:30:00.000Z");
  });

  it("quotes fields containing comma, quote, or newline", () => {
    const rows = [
      { name: 'Smith, Jr.', email: 's@example.com', notes: 'Said "hello"', created: new Date("2026-01-01") },
      { name: "Multi", email: null, notes: "Line1\nLine2", created: new Date("2026-01-01") }
    ];
    const csv = toCsv(rows, cols);
    expect(csv).toContain('"Smith, Jr."');
    expect(csv).toContain('"Said ""hello"""');
    expect(csv).toContain('"Line1\nLine2"');
  });

  it("returns only header for empty rows array", () => {
    const csv = toCsv([], cols);
    expect(csv).toBe("Name,Email,Notes,Created At\n");
  });

  it("handles empty columns (returns empty string)", () => {
    const csv = toCsv<{ a: number }>([{ a: 1 }], []);
    expect(csv).toBe("");
  });
});
