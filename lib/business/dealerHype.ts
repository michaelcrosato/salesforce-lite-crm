/**
 * 📣 DEALER HYPE ENGINE — FULL YOLO MODE 📣
 *
 * The most important pure business logic in the entire revenue org:
 * War cries. Roasts. Victory speeches. Psychological warfare via motivational nonsense.
 *
 * If a dealer doesn't feel something after calling getDealerWarCry(),
 * they are already dead inside and should be routed to the Rage Router.
 */

import type { Mascot } from "./dealerTrophies";

export type HypeIntensity = "mild" | "normal" | "unhinged" | "apocalyptic";

export type Roast = {
  target: string;
  text: string;
  severity: "gentle" | "savage" | "nuclear";
  mascot: string;
};

export type WarCry = {
  mascot: string;
  emoji: string;
  text: string;
  intensity: HypeIntensity;
};

/** The sacred war cries. Add more. Never delete. */
const WAR_CRIES: WarCry[] = [
  {
    mascot: "Turbo Llama",
    emoji: "🦙",
    text: "ZOOM ZOOM QUOTA BOOM — THE LLAMA DOES NOT BRAKE FOR MEDIOCRITY",
    intensity: "unhinged"
  },
  {
    mascot: "Pacing Panther",
    emoji: "🐆",
    text: "I do not run. I arrive. On time. Every time. Fear the silence.",
    intensity: "normal"
  },
  {
    mascot: "Golden Shovel",
    emoji: "🏆",
    text: "I was in the hole. Now the hole is in me. I AM THE SHOVEL.",
    intensity: "unhinged"
  },
  {
    mascot: "Quota Crusher",
    emoji: "💥",
    text: "CRUSH. DELIVER. REPEAT. THERE IS NO OTHER PATH.",
    intensity: "apocalyptic"
  },
  {
    mascot: "Disco Dealer",
    emoji: "🪩",
    text: "The only thing that stays alive is my pipeline. AND THE BEAT.",
    intensity: "normal"
  },
  {
    mascot: "Lead Eagle",
    emoji: "🦅",
    text: "I saw the lead before it was born. I claimed it in the egg.",
    intensity: "unhinged"
  },
  {
    mascot: "Maple Moose",
    emoji: "🫎",
    text: "Sorry for delivering so hard, eh? It won't happen again (it will).",
    intensity: "mild"
  },
  {
    mascot: "Rage Router",
    emoji: "😤",
    text: "YOUR LEAD IS MY LEAD. YOUR TERRITORY IS MY TERRITORY. I AM THE MAP.",
    intensity: "apocalyptic"
  },
  {
    mascot: "Neon Narwhal",
    emoji: "🐋",
    text: "I swim in the deep quota. You are still on the surface, sparkling.",
    intensity: "unhinged"
  },
  {
    mascot: "Savage Sloth",
    emoji: "🦥",
    text: "Slow is smooth. Smooth is quota. I arrive exactly when I mean to.",
    intensity: "normal"
  },
  {
    mascot: "Crypto Coyote",
    emoji: "🦴",
    text: "I bought territory at the bottom. You are still FOMOing leads.",
    intensity: "unhinged"
  },
  {
    mascot: "Viking Volvo",
    emoji: "🛡️",
    text: "I do not chase. I conquer. Your region is now my shield wall.",
    intensity: "apocalyptic"
  }
];

/** Friendly but soul-damaging roasts for dealers who need a wake-up call. */
const ROAST_TEMPLATES = [
  (name: string, pct: number) =>
    `${name} is at ${pct}%. The only thing slower is their email response time.`,
  (name: string, pct: number) =>
    `I've seen glaciers move faster than ${name}'s pipeline. At least glaciers are consistent.`,
  (name: string, pct: number) =>
    `${name} hit ${pct}%. In their defense, they also hit every red light on the way to work.`,
  (name: string, pct: number) =>
    `Rumor has it ${name} thinks "quota" is a suggestion. Bold strategy.`,
  (name: string, pct: number) =>
    `${name} is ${100 - pct}% away from greatness. That's also how far their leads are from closed.`
];

/**
 * Returns a war cry for the given mascot at the requested intensity.
 * If the mascot has no exact match, falls back to the closest energy vibe.
 */
export function getDealerWarCry(
  mascot: Mascot,
  intensity: HypeIntensity = "normal"
): WarCry {
  const exact = WAR_CRIES.find(
    (c) => c.mascot === mascot.name && c.intensity === intensity
  );
  if (exact) return exact;

  // Fallback: same mascot any intensity, or random chaos
  const sameMascot = WAR_CRIES.filter((c) => c.mascot === mascot.name);
  if (sameMascot.length > 0) {
    return sameMascot[intensity.length % sameMascot.length];
  }

  // Ultimate fallback — pure chaos
  return WAR_CRIES[Math.floor(Math.random() * WAR_CRIES.length)];
}

/** Delivers a single savage (but loving) roast to a struggling dealer. */
export function roastDealer(
  dealerName: string,
  performancePct: number,
  mascot: Mascot
): Roast {
  const template = ROAST_TEMPLATES[performancePct % ROAST_TEMPLATES.length];
  const severity =
    performancePct < 40 ? "nuclear" : performancePct < 70 ? "savage" : "gentle";

  return {
    target: dealerName,
    text: template(dealerName, performancePct),
    severity,
    mascot: mascot.name
  };
}

/** Builds a full hype speech for a dealer who just won something glorious. */
export function buildVictorySpeech(
  dealerName: string,
  trophyName: string,
  mascot: Mascot,
  score: number
): string {
  const cry = getDealerWarCry(mascot, score > 120 ? "apocalyptic" : "unhinged");
  return [
    `🏆 ${dealerName} has been anointed ${trophyName}!`,
    `${mascot.emoji} ${mascot.catchphrase}`,
    cry.text,
    `Score: ${score}. The council of mascots has spoken. The rest of you... are on notice.`
  ].join(" ");
}

/** Generates a complete hype report for an entire dealer cohort. Pure glory. */
export function buildHypeReport(
  orders: ReadonlyArray<{
    name: string;
    deliveredThisMonth: number;
    monthlyQuota: number;
    mascot: Mascot;
  }>
) {
  if (orders.length === 0) {
    return {
      headline: "The arena is empty. The llamas are disappointed.",
      chants: [],
      roasts: [],
      legends: []
    };
  }

  const withPct = orders.map((o) => ({
    ...o,
    pct:
      o.monthlyQuota > 0
        ? Math.round((o.deliveredThisMonth / o.monthlyQuota) * 100)
        : 0
  }));

  const chants = withPct
    .filter((o) => o.pct >= 100)
    .slice(0, 3)
    .map(
      (o) =>
        getDealerWarCry(o.mascot, o.pct > 130 ? "apocalyptic" : "unhinged").text
    );

  const roasts = withPct
    .filter((o) => o.pct < 75)
    .slice(0, 3)
    .map((o) => roastDealer(o.name, o.pct, o.mascot).text);

  const legends = withPct
    .sort((a, b) => b.pct - a.pct)
    .slice(0, 2)
    .map((o) => `${o.name} — ${o.mascot.emoji} ${o.mascot.name} (${o.pct}%)`);

  const headline =
    chants.length > 0
      ? "THE PACK IS HOWLING. THE LLAMAS ARE ZOOMING. QUOTA WILL BE OURS."
      : roasts.length > 0
        ? "The council has reviewed the numbers. Some of you have explaining to do."
        : "Everyone is exactly average. The mascots are... concerned.";

  return { headline, chants, roasts, legends };
}

/** Returns a random but deterministic "dealer of the day" motivational line. */
export function getDailyDealerAffirmation(seed: number): string {
  const affirmations = [
    "You are not just moving units. You are writing legend.",
    "The lead that got away was never worthy of your pipeline.",
    "Quota is not a number. It is a promise you made to future you.",
    "Every 'no' is just a 'not yet' wearing a cheap disguise.",
    "You are the reason the CRM still has hope.",
    "The Rage Router believes in you. That's terrifying and motivating.",
    "Today you close. Tomorrow you ascend."
  ];
  return affirmations[seed % affirmations.length];
}
