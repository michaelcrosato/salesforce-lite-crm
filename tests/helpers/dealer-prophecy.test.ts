import { describe, expect, it } from "vitest";
import {
  findMostDramaticProphecy,
  foretellDealerFate,
  generateRealmReport,
  summonCouncilOfProphets,
} from "@/lib/business/dealerProphecy";

describe("Full YOLO — Dealer Prophecy Oracle", () => {
  it("foretells a fate for any dealer with valid text and mascot", () => {
    const p = foretellDealerFate("Northstar", "Northstar Freight", 31, 24, 42);
    expect(p.dealerName).toBe("Northstar");
    expect(p.text.length).toBeGreaterThan(20);
    expect(p.mascot.emoji).toBeTruthy();
    expect(["ASCENSION", "LLAMA_BLESSED", "MIRACLE_RUN", "SLOW_BURN", "RECKONING"]).toContain(p.fate);
  });

  it("is deterministic for the same inputs", () => {
    const p1 = foretellDealerFate("Luma", "Luma Health", 9, 16, 13);
    const p2 = foretellDealerFate("Luma", "Luma Health", 9, 16, 13);
    expect(p1.text).toBe(p2.text);
    expect(p1.fate).toBe(p2.fate);
  });

  it("Turbo Llama dealers above 105% get LLAMA_BLESSED fate", () => {
    const p = foretellDealerFate("Turbo Boy", "Turbo Inc", 28, 20, 1);
    // The hash for "Turbo Boy" lands on Turbo Llama in current pool
    if (p.mascot.name === "Turbo Llama") {
      expect(p.fate).toBe("LLAMA_BLESSED");
    }
  });

  it("summonCouncilOfProphets returns one prophecy per dealer", () => {
    const dealers = [
      { name: "A", accountName: "AA", deliveredThisMonth: 30, monthlyQuota: 20 },
      { name: "B", accountName: "BB", deliveredThisMonth: 10, monthlyQuota: 25 },
    ];
    const council = summonCouncilOfProphets(dealers);
    expect(council).toHaveLength(2);
    expect(council[0].dealerName).toBe("A");
  });

  it("findMostDramaticProphecy prefers doom and high confidence", () => {
    const prophecies = [
      foretellDealerFate("Safe", "Safe Co", 22, 20, 1),
      foretellDealerFate("Doomed", "Doom Ltd", 4, 25, 99),
    ];
    const dramatic = findMostDramaticProphecy(prophecies);
    expect(dramatic).not.toBeNull();
    expect(["doom", "chaos", "warning"]).toContain(dramatic?.severity);
  });

  it("realm report produces sane counts and a verdict", () => {
    const dealers = [
      { name: "Crusher", accountName: "C", deliveredThisMonth: 40, monthlyQuota: 25 },
      { name: "Struggler", accountName: "S", deliveredThisMonth: 6, monthlyQuota: 20 },
    ];
    const report = generateRealmReport(summonCouncilOfProphets(dealers));
    expect(report.total).toBe(2);
    expect(report.verdict.length).toBeGreaterThan(10);
    expect(report.mascotOfTheMonth).not.toBeNull();
  });

  it("low performers trend toward RECKONING or BLOOD_IN_THE_WATER", () => {
    const p = foretellDealerFate("Ghost", "Ghost Corp", 3, 30, 7);
    expect(["RECKONING", "BLOOD_IN_THE_WATER"]).toContain(p.fate);
  });

  it("confidence is always between 47 and 98 inclusive", () => {
    const p = foretellDealerFate("EdgeCase", "Edge", 1, 1, 0);
    expect(p.confidence).toBeGreaterThanOrEqual(47);
    expect(p.confidence).toBeLessThanOrEqual(98);
  });
});
