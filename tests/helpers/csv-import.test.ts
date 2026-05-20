import { describe, expect, it } from "vitest";
import { parseCsv, previewRows } from "@/lib/business/csv-import";

describe("csv import preview helper (RFC 4180 tolerant)", () => {
  it("parses well-formed input with commas and quotes", () => {
    const input = 'Name,Email,Notes\nAlice,"a,b@example.com","Said ""hi"""\nBob,bob@example.com,Simple';
    const res = parseCsv(input);
    expect(res.headers).toEqual(["Name", "Email", "Notes"]);
    expect(res.rows).toHaveLength(2);
    expect(res.rows[0][1]).toBe("a,b@example.com");
    expect(res.rows[0][2]).toBe('Said "hi"');
    expect(res.errors).toHaveLength(0);
  });

  it("parses quoted fields containing newlines", () => {
    const input = 'Name,Notes\nAlice,"Line one\nLine two"\nBob,Simple';
    const res = parseCsv(input);

    expect(res.errors).toHaveLength(0);
    expect(res.rows).toEqual([
      ["Alice", "Line one\nLine two"],
      ["Bob", "Simple"]
    ]);
  });

  it("returns errors for malformed unclosed quotes, does not throw", () => {
    const input = 'Name,Email\n"Bad, no close\nGood,good@example.com';
    const res = parseCsv(input);
    expect(res.errors.length).toBeGreaterThan(0);
    expect(res.errors[0]).toContain("Unclosed quote");
    expect(res.rows).toHaveLength(1);
  });

  it("handles empty input and header-only input", () => {
    expect(parseCsv("")).toEqual({ headers: [], rows: [], errors: [] });
    const headerOnly = "Col1,Col2\n";
    const res = parseCsv(headerOnly);
    expect(res.headers).toEqual(["Col1", "Col2"]);
    expect(res.rows).toHaveLength(0);
  });

  it("previewRows limits rows and reports total", () => {
    const input = "H1,H2\nr1\nr2\nr3\nr4\nr5\nr6";
    const preview = previewRows(input, 3);
    expect(preview.headers).toEqual(["H1", "H2"]);
    expect(preview.rows).toHaveLength(3);
    expect(preview.totalRows).toBe(6);
  });

  it("tolerates trailing whitespace on lines", () => {
    const input = "Name,Email  \n Alice , alice@ex.com  \n";
    const res = parseCsv(input);
    expect(res.rows[0]).toEqual(["Alice", "alice@ex.com"]);
  });
});
