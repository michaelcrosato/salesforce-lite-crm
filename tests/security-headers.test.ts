import { describe, expect, it } from "vitest";

type HeaderEntry = { key: string; value: string };
type HeaderRule = { source: string; headers: HeaderEntry[] };
type NextConfigModule = {
  default: { headers: () => Promise<HeaderRule[]> };
};

// next.config.mjs is plain ESM outside the TS program (allowJs is false), so it
// is imported through a runtime file URL rather than a statically-resolved
// specifier. The shape is asserted below before use.
const configUrl = new URL("../next.config.mjs", import.meta.url).href;

async function loadHeaderRules(): Promise<HeaderRule[]> {
  const mod = (await import(configUrl)) as NextConfigModule;
  return mod.default.headers();
}

describe("security headers baseline", () => {
  it("applies the baseline header set to every route", async () => {
    const rules = await loadHeaderRules();
    const rule = rules.find((entry) => entry.source === "/:path*");
    if (!rule) {
      throw new Error("expected a headers() rule scoped to /:path*");
    }

    const headers = new Map(rule.headers.map((h) => [h.key, h.value]));
    expect(headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(headers.get("Referrer-Policy")).toBe(
      "strict-origin-when-cross-origin"
    );
    expect(headers.get("X-Frame-Options")).toBe("DENY");
  });

  it("ships a report-only CSP that does not break charts or inline styles", async () => {
    const rules = await loadHeaderRules();
    const rule = rules.find((entry) => entry.source === "/:path*");
    if (!rule) {
      throw new Error("expected a headers() rule scoped to /:path*");
    }

    const csp = rule.headers.find(
      (h) => h.key === "Content-Security-Policy-Report-Only"
    );
    if (!csp) {
      throw new Error("expected a Content-Security-Policy-Report-Only header");
    }

    // Report-only first: observe violations without blocking resources.
    expect(
      rule.headers.some((h) => h.key === "Content-Security-Policy")
    ).toBe(false);
    expect(csp.value).toContain("default-src 'self'");
    expect(csp.value).toContain("frame-ancestors 'none'");
    expect(csp.value).toContain("object-src 'none'");
    // recharts SVG + Tailwind inline styles must stay loadable in report-only.
    expect(csp.value).toContain("style-src 'self' 'unsafe-inline'");
    expect(csp.value).toContain("img-src 'self' data: blob:");
  });
});
