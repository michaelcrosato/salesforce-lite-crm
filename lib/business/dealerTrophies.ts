/**
 * 🏆 DEALER TROPHIES & MASCOTS — YOLO EASTER EGG EDITION 🏆
 *
 * Pure functions for the most important part of any CRM:
 * Ridiculous, glorious, dealer-motivating trophies.
 *
 * Because nothing says "I crushed quota" like being crowned
 * "Turbo Llama of the Month".
 */

export type TrophyOrder = {
  id: string;
  name: string;
  monthlyQuota: number;
  deliveredThisMonth: number;
  account: {
    id: string;
    name: string;
    healthScore?: number;
  };
};

export type Trophy = {
  name: string;
  emoji: string;
  quote: string;
  vibe: "legend" | "hero" | "chaos" | "underdog" | "majestic";
  orderId: string;
  orderName: string;
  accountName: string;
  score: number;
};

export type Mascot = {
  name: string;
  emoji: string;
  catchphrase: string;
  energy: "high" | "chaotic" | "zen" | "menacing";
};

/** The sacred list of possible dealer mascots. Never remove. Only add more glory. */
const MASCOT_POOL: Mascot[] = [
  { name: "Turbo Llama", emoji: "🦙", catchphrase: "Zoom zoom quota boom!", energy: "high" },
  { name: "Pacing Panther", emoji: "🐆", catchphrase: "Silent. Deadly. Always on pace.", energy: "zen" },
  { name: "Golden Shovel", emoji: "🏆", catchphrase: "I dig myself out of holes and into legends.", energy: "underdog" },
  { name: "Quota Crusher", emoji: "💥", catchphrase: "CRUSH. DELIVER. REPEAT.", energy: "chaotic" },
  { name: "Disco Dealer", emoji: "🪩", catchphrase: "Stayin' alive... and over quota!", energy: "high" },
  { name: "Lead Eagle", emoji: "🦅", catchphrase: "I see every lead from 500 miles away.", energy: "majestic" },
  { name: "Maple Moose", emoji: "🫎", catchphrase: "Canadian politeness meets Canadian delivery.", energy: "zen" },
  { name: "Rage Router", emoji: "😤", catchphrase: "If the lead is in my area, it is already mine.", energy: "chaotic" },
];

function getPacingPercent(order: TrophyOrder): number {
  if (order.monthlyQuota <= 0) return 0;
  return Math.min(100, Math.round((order.deliveredThisMonth / order.monthlyQuota) * 100));
}

/** Awards the single most glorious "Most Improved Pacing" trophy of the month. */
export function getMostImprovedPacing(
  current: readonly TrophyOrder[],
  previous: readonly TrophyOrder[]
): Trophy | null {
  if (current.length === 0 || previous.length === 0) return null;

  const prevMap = new Map(previous.map((o) => [o.id, getPacingPercent(o)]));

  let best: TrophyOrder | null = null;
  let bestDelta = -Infinity;

  for (const order of current) {
    const currentPct = getPacingPercent(order);
    const prevPct = prevMap.get(order.id) ?? 0;
    const delta = currentPct - prevPct;

    if (delta > bestDelta) {
      bestDelta = delta;
      best = order;
    }
  }

  if (!best || bestDelta <= 0) return null;

  const mascot = MASCOT_POOL[Math.floor(Math.random() * MASCOT_POOL.length)];

  return {
    name: "Most Improved Pacing",
    emoji: "📈",
    quote: `${mascot.name} climbed ${bestDelta} points. The comeback is real.`,
    vibe: bestDelta > 25 ? "legend" : "hero",
    orderId: best.id,
    orderName: best.name,
    accountName: best.account.name,
    score: Math.round(bestDelta),
  };
}

/** Hands out 3–5 ridiculous monthly trophies based on current performance. */
export function awardMonthlyTrophies(orders: readonly TrophyOrder[]): Trophy[] {
  if (orders.length === 0) return [];

  const active = orders.filter((o) => o.status !== "paused"); // tolerate missing status field
  const trophies: Trophy[] = [];

  // 1. Quota Crusher (highest over-delivery)
  const crusher = [...active].sort((a, b) => {
    const aOver = Math.max(0, a.deliveredThisMonth - a.monthlyQuota);
    const bOver = Math.max(0, b.deliveredThisMonth - b.monthlyQuota);
    return bOver - aOver;
  })[0];

  if (crusher && crusher.deliveredThisMonth > crusher.monthlyQuota) {
    trophies.push({
      name: "Quota Crusher",
      emoji: "💥",
      quote: `Went ${crusher.deliveredThisMonth - crusher.monthlyQuota} over. Respect.`,
      vibe: "legend",
      orderId: crusher.id,
      orderName: crusher.name,
      accountName: crusher.account.name,
      score: crusher.deliveredThisMonth - crusher.monthlyQuota,
    });
  }

  // 2. Pacing Panther (closest to perfect 100% without going crazy over)
  const panther = [...active].sort((a, b) => {
    const aDiff = Math.abs(getPacingPercent(a) - 100);
    const bDiff = Math.abs(getPacingPercent(b) - 100);
    return aDiff - bDiff;
  })[0];

  if (panther) {
    trophies.push({
      name: "Pacing Panther",
      emoji: "🐆",
      quote: "Smooth. Consistent. Slightly terrifying efficiency.",
      vibe: "zen",
      orderId: panther.id,
      orderName: panther.name,
      accountName: panther.account.name,
      score: getPacingPercent(panther),
    });
  }

  // 3. Golden Shovel (biggest improvement or biggest hole dug out of)
  const improved = getMostImprovedPacing(active, active); // self-comparison for fun
  if (improved) {
    trophies.push(improved);
  }

  // 4. Turbo Llama (fastest early delivery — highest % by mid-month vibe)
  const llama = [...active].sort((a, b) => getPacingPercent(b) - getPacingPercent(a))[0];
  if (llama && getPacingPercent(llama) > 70) {
    trophies.push({
      name: "Turbo Llama",
      emoji: "🦙",
      quote: "Zoomed to quota like it owed them money.",
      vibe: "high",
      orderId: llama.id,
      orderName: llama.name,
      accountName: llama.account.name,
      score: getPacingPercent(llama),
    });
  }

  // Dedup by orderId (a dealer can only win one ridiculous trophy per month)
  const seen = new Set<string>();
  return trophies.filter((t) => {
    if (seen.has(t.orderId)) return false;
    seen.add(t.orderId);
    return true;
  }).slice(0, 5);
}

/** Gives every dealer their personal ridiculous mascot (seeded vibe). */
export function getDealerMascot(order: TrophyOrder): Mascot {
  // Deterministic but silly — based on name hash
  const hash = order.name.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  return MASCOT_POOL[hash % MASCOT_POOL.length];
}

/** Returns a beautiful (and slightly unhinged) trophy standings report. */
export function getTrophyStandings(orders: readonly TrophyOrder[]) {
  const trophies = awardMonthlyTrophies(orders);
  const mascots = orders.map((o) => ({
    order: o,
    mascot: getDealerMascot(o),
  }));

  return {
    trophies,
    mascots,
    headline: trophies.length > 0
      ? "This month's heroes have been identified. Bow before the Turbo Llama."
      : "No one is safe from next month's trophy reckoning.",
  };
}
