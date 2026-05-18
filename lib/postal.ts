import { z } from "zod";

export const POSTAL_COUNTRIES = ["CA", "US"] as const;
export type PostalCountry = (typeof POSTAL_COUNTRIES)[number];

export type PostalValidationResult =
  | {
      ok: true;
      normalized: string;
      prefix: string;
    }
  | {
      ok: false;
      reason: string;
    };

const canadianPostalPattern = /^[A-Z]\d[A-Z]\d[A-Z]\d$/;
const usZipPattern = /^\d{5}(-\d{4})?$/;

export function normalizePostalCode(input: string, country: PostalCountry): string | null {
  if (country === "CA") {
    const compact = input.replace(/\s+/g, "").toUpperCase();

    if (!canadianPostalPattern.test(compact)) {
      return null;
    }

    return `${compact.slice(0, 3)} ${compact.slice(3)}`;
  }

  const compact = input.replace(/\s+/g, "");
  return usZipPattern.test(compact) ? compact : null;
}

export function extractPostalPrefix(
  normalized: string,
  country: PostalCountry
): string {
  return country === "CA" ? normalized.slice(0, 3) : normalized.slice(0, 5);
}

export function validatePostalCode(
  input: string,
  country: PostalCountry
): PostalValidationResult {
  const normalized = normalizePostalCode(input, country);

  if (!normalized) {
    return {
      ok: false,
      reason:
        country === "CA"
          ? "Postal code must be in the format A1A 1A1"
          : "Not a valid US ZIP"
    };
  }

  return {
    ok: true,
    normalized,
    prefix: extractPostalPrefix(normalized, country)
  };
}

export const postalCodeSchema = z.string().trim().transform((value, ctx) => {
  const result = validatePostalCode(value, "CA");

  if (!result.ok) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: result.reason
    });

    return z.NEVER;
  }

  return result.normalized;
});
