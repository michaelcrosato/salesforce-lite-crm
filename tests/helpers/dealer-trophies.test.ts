import { describe, expect, it } from "vitest";
import {
  awardMonthlyTrophies,
  forgeLegendaryDealerTitle,
  getDealerMascot,
  getMostImprovedPacing,
  type TrophyOrder
} from "@/lib/business/dealerTrophies";

const mockOrders: TrophyOrder[] = [
  {
    id: "d1",
    name: "Vancouver Northstar",
    monthlyQuota: 28,
    deliveredThisMonth: 31,
    account: { id: "a1", name: "Northstar Freight" }
  },
  {
    id: "d2",
    name: "Calgary Luma",
    monthlyQuota: 16,
    deliveredThisMonth: 9,
    account: { id: "a2", name: "Luma Health" }
  },
  {
    id: "d3",
    name: "Toronto Orbit",
    monthlyQuota: 24,
    deliveredThisMonth: 27,
    account: { id: "a3", name: "Orbit Retail" }
  },
  {
    id: "d4",
    name: "Edmonton Apex",
    monthlyQuota: 15,
    deliveredThisMonth: 4,
    account: { id: "a4", name: "Apex Cloud" }
  }
];

describe("YOLO Dealer Trophies & Mascots", () => {
  it("awards at least one ridiculous trophy when someone is over quota", () => {
    const trophies = awardMonthlyTrophies(mockOrders);
    expect(trophies.length).toBeGreaterThan(0);
    expect(
      trophies.some(
        (t) => t.emoji === "💥" || t.emoji === "🐆" || t.emoji === "🦙"
      )
    ).toBe(true);
  });

  it("gives every dealer a personal ridiculous mascot", () => {
    const mascot = getDealerMascot(mockOrders[0]);
    expect(mascot.name).toBeTruthy();
    expect(mascot.emoji).toBeTruthy();
    const validMascots = [
      "Turbo Llama",
      "Pacing Panther",
      "Golden Shovel",
      "Quota Crusher",
      "Disco Dealer",
      "Lead Eagle",
      "Maple Moose",
      "Rage Router"
    ];
    expect(validMascots).toContain(mascot.name);
  });

  it("detects most improved pacing between two periods", () => {
    const previous: TrophyOrder[] = mockOrders.map((o) => ({
      ...o,
      deliveredThisMonth: Math.floor(o.deliveredThisMonth * 0.6)
    }));
    const improved = getMostImprovedPacing(mockOrders, previous);
    expect(improved).not.toBeNull();
    expect(improved?.name).toBe("Most Improved Pacing");
    expect(improved?.emoji).toBe("📈");
  });

  it("never lets a dealer win more than one trophy (dedup logic)", () => {
    const trophies = awardMonthlyTrophies(mockOrders);
    const ids = trophies.map((t) => t.orderId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });

  it("Turbo Llama only appears when someone is actually crushing it", () => {
    const sadOrders = mockOrders.map((o) => ({ ...o, deliveredThisMonth: 1 }));
    const trophies = awardMonthlyTrophies(sadOrders);
    expect(trophies.find((t) => t.name === "Turbo Llama")).toBeUndefined();
  });

  it("forgeLegendaryDealerTitle returns gloriously unhinged titles for over-performers", () => {
    const highOrder: TrophyOrder = { ...mockOrders[0], deliveredThisMonth: 42 };
    const title = forgeLegendaryDealerTitle(highOrder, 150);
    expect(title.length).toBeGreaterThan(15);
    expect(title).toMatch(
      /Arch-|Grand-|Mythic-|Omega-|Ultra-|Blood-|Neon-|Storm-/
    );
  });

  it("new sacred mascots (Narwhal, Sloth, Coyote, Volvo) are selectable", () => {
    const names = Array.from(
      { length: 30 },
      (_, i) => getDealerMascot({ name: `Dealer${i}` }).name
    );
    const newOnes = [
      "Neon Narwhal",
      "Savage Sloth",
      "Crypto Coyote",
      "Viking Volvo"
    ];
    const found = newOnes.some((n) => names.includes(n));
    expect(found).toBe(true);
  });
});
