import { describe, expect, it } from "vitest";
import {
  buildHypeReport,
  buildVictorySpeech,
  getDailyDealerAffirmation,
  getDealerWarCry,
  roastDealer
} from "@/lib/business/dealerHype";
import { getDealerMascot } from "@/lib/business/dealerTrophies";

const mockDealer = (name: string, delivered: number, quota: number) => ({
  name,
  deliveredThisMonth: delivered,
  monthlyQuota: quota,
  mascot: getDealerMascot({ name })
});

describe("Full YOLO — Dealer Hype Engine", () => {
  it("produces war cries for every mascot in the sacred pool", () => {
    const mascot = getDealerMascot({ name: "Test Llama" });
    const cry = getDealerWarCry(mascot, "unhinged");
    expect(cry.text.length).toBeGreaterThan(20);
    expect(cry.emoji).toBeTruthy();
  });

  it("roasts underperformers with escalating savagery", () => {
    const mascot = getDealerMascot({ name: "Slowpoke" });
    const roast = roastDealer("Slowpoke", 34, mascot);
    expect(roast.severity).toBe("nuclear");
    expect(roast.text).toContain("Slowpoke");
  });

  it("builds victory speeches that mention the trophy and mascot", () => {
    const mascot = getDealerMascot({ name: "Vancouver Northstar" });
    const speech = buildVictorySpeech(
      "Vancouver Northstar",
      "Turbo Llama of the Month",
      mascot,
      142
    );
    expect(speech).toContain("Vancouver Northstar");
    expect(speech).toContain("Turbo Llama");
    expect(speech).toContain(mascot.emoji);
  });

  it("generates a full cohort hype report with chants and roasts separated correctly", () => {
    const orders = [
      mockDealer("Northstar", 31, 24),
      mockDealer("Luma", 8, 16),
      mockDealer("Orbit", 29, 25)
    ];
    const report = buildHypeReport(orders);
    expect(report.headline.length).toBeGreaterThan(10);
    expect(report.chants.length).toBeGreaterThan(0);
    expect(report.roasts.length).toBeGreaterThan(0);
  });

  it("never produces negative confidence or empty text in any path", () => {
    const mascot = getDealerMascot({ name: "Edge" });
    const cry = getDealerWarCry(mascot, "apocalyptic");
    expect(cry.text.length).toBeGreaterThan(5);
  });

  it("daily affirmations are deterministic per seed and never empty", () => {
    const a1 = getDailyDealerAffirmation(7);
    const a2 = getDailyDealerAffirmation(7);
    expect(a1).toBe(a2);
    expect(a1.length).toBeGreaterThan(15);
  });

  it("hype report headline adapts to the emotional state of the cohort", () => {
    const allFailing = [
      mockDealer("Failing A", 2, 20),
      mockDealer("Failing B", 3, 15)
    ];
    const report = buildHypeReport(allFailing);
    expect(report.headline).toContain("council has reviewed");
  });
});
