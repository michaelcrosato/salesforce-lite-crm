/**
 * 🔮 THE QUOTA PROPHECY ORACLE — FULL YOLO MODE 🔮
 *
 * Gaze into the numbers. Hear the whispers of the mascots.
 * Foretell the fate of every dealer so they may either ascend in glory
 * or be gently roasted by the council before it's too late.
 *
 * All prophecies are 100% deterministic given the same seed.
 * The future is already in the spreadsheet.
 */

import type { Mascot } from "./dealerTrophies";
import { getDealerMascot } from "./dealerTrophies";

export type Fate =
  | "ASCENSION"
  | "RECKONING"
  | "MIRACLE_RUN"
  | "SLOW_BURN"
  | "BLOOD_IN_THE_WATER"
  | "THE_LONG_SLOG"
  | "LLAMA_BLESSED";

export type Prophecy = {
  dealerName: string;
  accountName: string;
  mascot: Mascot;
  fate: Fate;
  text: string;
  severity: "blessing" | "warning" | "doom" | "chaos";
  confidence: number; // 0-100, how "sure" the oracle is (pure math)
};

/** The ancient texts. Do not question them. */
const FATE_TEMPLATES: Record<
  Fate,
  (name: string, mascot: Mascot, pct: number, over: number) => string
> = {
  ASCENSION: (n, m, p) =>
    `${n} walks the golden path. The ${m.name} has chosen them. ${p}% is merely the beginning of the saga.`,
  RECKONING: (n, m) =>
    `The ${m.name} turns its gaze upon ${n}. The numbers do not lie. The reckoning is already in motion.`,
  MIRACLE_RUN: (n, m, p, o) =>
    `${n} has angered the quota gods and lived. +${o} over target. The ${m.name} is both proud and slightly afraid.`,
  SLOW_BURN: (n, m) =>
    `${n} moves like ${m.name} in winter — deliberate, unstoppable, deeply concerning to competitors.`,
  BLOOD_IN_THE_WATER: (n) =>
    `The sharks smell ${n}'s pipeline. It is not yet closed. The water grows redder by the hour.`,
  THE_LONG_SLOG: (n, m, p) =>
    `${n} fights the good fight at ${p}%. The ${m.name} respects the grind, even if the numbers do not yet sing.`,
  LLAMA_BLESSED: (n, m) =>
    `The Turbo Llama has smiled upon ${n}. This is not luck. This is divine, chaotic selection.`
};

/** Derives a deterministic but unhinged fate from performance numbers. */
export function foretellDealerFate(
  dealerName: string,
  accountName: string,
  delivered: number,
  quota: number,
  seed = 0
): Prophecy {
  const pct = quota > 0 ? Math.round((delivered / quota) * 100) : 0;
  const over = Math.max(0, delivered - quota);

  // Deterministic mascot (same as trophies for consistency)
  const mascot = getDealerMascot({ name: dealerName });

  // Pure deterministic fate selection
  let fate: Fate;
  let severity: Prophecy["severity"];

  const chaos = (pct + over + seed + dealerName.length) % 100;

  if (pct >= 140) {
    fate = "MIRACLE_RUN";
    severity = "blessing";
  } else if (pct >= 115) {
    fate = chaos > 50 ? "ASCENSION" : "LLAMA_BLESSED";
    severity = "blessing";
  } else if (pct >= 100) {
    fate = "SLOW_BURN";
    severity = "blessing";
  } else if (pct >= 80) {
    fate = "THE_LONG_SLOG";
    severity = "warning";
  } else if (pct >= 55) {
    fate = chaos > 40 ? "BLOOD_IN_THE_WATER" : "RECKONING";
    severity = "warning";
  } else {
    fate = "RECKONING";
    severity = chaos > 70 ? "chaos" : "doom";
  }

  // Special Turbo Llama override for maximum drama
  if (mascot.name === "Turbo Llama" && pct > 105) {
    fate = "LLAMA_BLESSED";
    severity = "blessing";
  }

  const text = FATE_TEMPLATES[fate](dealerName, mascot, pct, over);
  const confidence = Math.min(
    98,
    Math.max(47, 65 + Math.floor((pct - 70) / 3) + (seed % 7))
  );

  return {
    dealerName,
    accountName,
    mascot,
    fate,
    text,
    severity,
    confidence
  };
}

/** The Council of Prophets speaks for the entire cohort. */
export function summonCouncilOfProphets(
  dealers: ReadonlyArray<{
    name: string;
    accountName: string;
    deliveredThisMonth: number;
    monthlyQuota: number;
  }>
): Prophecy[] {
  return dealers.map((d, idx) =>
    foretellDealerFate(
      d.name,
      d.accountName,
      d.deliveredThisMonth,
      d.monthlyQuota,
      idx * 13 + d.name.charCodeAt(0)
    )
  );
}

/** Returns the single most dramatic prophecy of the month (for dashboard hero banner). */
export function findMostDramaticProphecy(
  prophecies: readonly Prophecy[]
): Prophecy | null {
  if (prophecies.length === 0) return null;

  return [...prophecies].sort((a, b) => {
    const scoreA =
      (a.severity === "doom" ? 100 : a.severity === "chaos" ? 80 : 40) +
      a.confidence;
    const scoreB =
      (b.severity === "doom" ? 100 : b.severity === "chaos" ? 80 : 40) +
      b.confidence;
    return scoreB - scoreA;
  })[0];
}

/** Summarizes the current state of the realm for leadership. */
export function generateRealmReport(prophecies: readonly Prophecy[]) {
  const blessings = prophecies.filter((p) => p.severity === "blessing").length;
  const warnings = prophecies.filter((p) => p.severity === "warning").length;
  const dooms = prophecies.filter(
    (p) => p.severity === "doom" || p.severity === "chaos"
  ).length;

  const dramatic = findMostDramaticProphecy(prophecies);

  let verdict: string;
  if (blessings > warnings + dooms) {
    verdict =
      "The realm is strong. The llamas are pleased. Keep the pressure high.";
  } else if (warnings > dooms) {
    verdict =
      "The wind shifts. Some dealers walk the edge. The council watches closely.";
  } else {
    verdict =
      "The mascots have begun sharpening their shovels. The reckoning approaches.";
  }

  return {
    total: prophecies.length,
    blessings,
    warnings,
    dooms,
    dramatic,
    verdict,
    mascotOfTheMonth: prophecies.length > 0 ? prophecies[0].mascot : null
  };
}
