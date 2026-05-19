import { describe, expect, it } from "vitest";
import {
  monthlyComparison,
  topNByField,
  bucketByDateRange,
  type Bucket
} from "@/lib/business/reports-extra";

describe("reports-extra pure helpers", () => {
  const now = new Date("2026-05-15T12:00:00Z");
  const records = [
    { id: "r1", createdAt: "2026-05-10", value: 100 },
    { id: "r2", createdAt: "2026-05-12", value: 200 },
    { id: "r3", createdAt: "2026-04-20", value: 50 },
    { id: "r4", createdAt: "2026-04-28", value: 75 },
    { id: "r5", createdAt: "2026-05-01", value: 300 },
    { id: "r6", createdAt: null, value: 10 }
  ];

  it("monthlyComparison counts this/last month and computes delta", () => {
    const cmp = monthlyComparison(records, "createdAt", now);
    expect(cmp.thisMonth).toBe(3);
    expect(cmp.lastMonth).toBe(2);
    expect(cmp.deltaPct).toBeGreaterThan(0);
  });

  it("topNByField sorts numeric desc and limits", () => {
    const top = topNByField(records, "value", 2);
    expect(top.map((r) => r.id)).toEqual(["r5", "r2"]);
  });

  it("bucketByDateRange assigns to correct buckets", () => {
    const buckets: Bucket[] = [
      {
        start: new Date("2026-04-01"),
        end: new Date("2026-04-30"),
        label: "apr"
      },
      {
        start: new Date("2026-05-01"),
        end: new Date("2026-05-31"),
        label: "may"
      }
    ];
    const b = bucketByDateRange(records, "createdAt", buckets);
    expect(b.apr.map((r) => r.id)).toEqual(["r3", "r4"]);
    expect(b.may.map((r) => r.id)).toEqual(["r1", "r2", "r5"]);
  });

  it("handles empty and missing dates gracefully", () => {
    const emptyCmp = monthlyComparison<Record<string, unknown>>(
      [],
      "createdAt",
      now
    );
    expect(emptyCmp.thisMonth).toBe(0);
    const top = topNByField<Record<string, unknown>>([], "value", 5);
    expect(top).toHaveLength(0);
  });

  it("topNByField falls back to string compare when non-numeric", () => {
    const names = [{ n: "Zoe" }, { n: "Adam" }, { n: "Bob" }];
    const top = topNByField(names, "n", 2);
    expect(top.map((x) => x.n)).toEqual(["Zoe", "Bob"]);
  });
});
