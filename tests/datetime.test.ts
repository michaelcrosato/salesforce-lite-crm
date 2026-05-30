import { describe, expect, it } from "vitest";
import {
  isCalendarDate,
  calendarDateStart,
  calendarDateKey
} from "@/lib/datetime";

describe("calendar date utilities", () => {
  describe("isCalendarDate", () => {
    it("returns true for valid standard YYYY-MM-DD dates", () => {
      expect(isCalendarDate("2026-05-30")).toBe(true);
      expect(isCalendarDate("2020-01-01")).toBe(true);
      expect(isCalendarDate("2030-12-31")).toBe(true);
    });

    it("returns false for syntactically invalid strings", () => {
      expect(isCalendarDate("")).toBe(false);
      expect(isCalendarDate("2026/05/30")).toBe(false);
      expect(isCalendarDate("2026-5-30")).toBe(false);
      expect(isCalendarDate("26-05-30")).toBe(false);
      expect(isCalendarDate("abc")).toBe(false);
    });

    it("returns false for non-existent calendar dates", () => {
      expect(isCalendarDate("2026-02-29")).toBe(false); // 2026 is not a leap year
      expect(isCalendarDate("2026-04-31")).toBe(false); // April has 30 days
      expect(isCalendarDate("2026-13-10")).toBe(false); // Invalid month
      expect(isCalendarDate("2026-00-10")).toBe(false); // Invalid month
      expect(isCalendarDate("2026-05-00")).toBe(false); // Invalid day
      expect(isCalendarDate("2026-05-32")).toBe(false); // Invalid day
    });

    it("handles leap years correctly", () => {
      expect(isCalendarDate("2024-02-29")).toBe(true); // 2024 is a leap year
      expect(isCalendarDate("2023-02-29")).toBe(false); // 2023 is not
      expect(isCalendarDate("2000-02-29")).toBe(true); // 2000 is a leap year (divisible by 400)
      expect(isCalendarDate("1900-02-29")).toBe(false); // 1900 is not (divisible by 100 but not 400)
    });
  });

  describe("calendarDateStart", () => {
    it("returns a Date object at UTC midnight for a valid calendar date string", () => {
      const date = calendarDateStart("2026-05-30");
      expect(date).toBeInstanceOf(Date);
      expect(date.getUTCFullYear()).toBe(2026);
      expect(date.getUTCMonth()).toBe(4); // 0-indexed May
      expect(date.getUTCDate()).toBe(30);
      expect(date.getUTCHours()).toBe(0);
      expect(date.getUTCMinutes()).toBe(0);
    });

    it("throws an error for invalid calendar date strings", () => {
      expect(() => calendarDateStart("")).toThrow();
      expect(() => calendarDateStart("2026-05-32")).toThrow();
    });
  });

  describe("calendarDateKey", () => {
    it("returns YYYY-MM-DD string format for a given Date", () => {
      const date = new Date(Date.UTC(2026, 4, 30));
      expect(calendarDateKey(date)).toBe("2026-05-30");
    });
  });
});
