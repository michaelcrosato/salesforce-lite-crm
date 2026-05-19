import { describe, expect, it } from "vitest";
import {
  allQueryParam,
  dateQueryParam,
  nonEmptyQueryParam
} from "@/lib/queryParams";

describe("query param helpers", () => {
  it("trims non-empty params and ignores blanks", () => {
    expect(nonEmptyQueryParam("  owner-1  ")).toBe("owner-1");
    expect(nonEmptyQueryParam("   ")).toBeUndefined();
    expect(nonEmptyQueryParam(undefined)).toBeUndefined();
  });

  it("falls back to all for empty filter params", () => {
    expect(allQueryParam("  area-1 ")).toBe("area-1");
    expect(allQueryParam("")).toBe("all");
    expect(allQueryParam(undefined)).toBe("all");
  });

  it("keeps parseable dates and ignores invalid dates", () => {
    expect(dateQueryParam(" 2026-05-19 ")).toBe("2026-05-19");
    expect(dateQueryParam("not-a-date")).toBeUndefined();
    expect(dateQueryParam("")).toBeUndefined();
  });
});
