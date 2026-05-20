import { describe, expect, it } from "vitest";
import {
  daysSince,
  formatDate,
  formatRelativeDays,
  formatShortDate
} from "@/lib/formatters";

describe("date formatters", () => {
  const now = new Date("2026-05-19T12:00:00Z");

  it("formats valid date values", () => {
    expect(formatDate("2026-05-19T12:00:00Z")).toBe("May 19, 2026");
    expect(formatShortDate("2026-05-19T12:00:00Z")).toBe("May 19");
    expect(daysSince("2026-05-18T12:00:00Z", now)).toBe(1);
  });

  it("handles missing or invalid dates without throwing", () => {
    expect(formatDate("not-a-date")).toBe("No date");
    expect(formatShortDate("not-a-date")).toBe("None");
    expect(daysSince("not-a-date", now)).toBeNull();
    expect(formatRelativeDays("not-a-date", now)).toBe("No activity");
  });
});
