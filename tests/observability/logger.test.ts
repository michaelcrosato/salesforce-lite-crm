import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { logger } from "@/lib/observability/logger";

describe("structured logger", () => {
  const originalLogLevel = process.env.LOG_LEVEL;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    if (originalLogLevel === undefined) {
      delete process.env.LOG_LEVEL;
    } else {
      process.env.LOG_LEVEL = originalLogLevel;
    }
    vi.restoreAllMocks();
  });

  it("emits one JSON line with level, event, and fields to the matching console channel", () => {
    process.env.LOG_LEVEL = "debug";
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});

    logger.info("lead_routing_unrouted", {
      leadId: "lead-1",
      reason: "no_area_match"
    });

    expect(infoSpy).toHaveBeenCalledTimes(1);
    const line = infoSpy.mock.calls[0]?.[0];
    expect(typeof line).toBe("string");
    const parsed = JSON.parse(String(line)) as Record<string, unknown>;
    expect(parsed).toEqual({
      level: "info",
      event: "lead_routing_unrouted",
      leadId: "lead-1",
      reason: "no_area_match"
    });
    // NODE_ENV=test omits the timestamp so asserted snapshots stay stable.
    expect(parsed.time).toBeUndefined();
  });

  it("routes each level to its own console channel", () => {
    process.env.LOG_LEVEL = "debug";
    const debugSpy = vi.spyOn(console, "debug").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    logger.debug("d");
    logger.warn("w");
    logger.error("e");

    expect(debugSpy).toHaveBeenCalledTimes(1);
    expect(warnSpy).toHaveBeenCalledTimes(1);
    expect(errorSpy).toHaveBeenCalledTimes(1);
  });

  it("suppresses all output when LOG_LEVEL=silent", () => {
    process.env.LOG_LEVEL = "silent";
    const errorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logger.error("should_not_emit", { leadId: "lead-2" });
    logger.warn("should_not_emit");

    expect(errorSpy).not.toHaveBeenCalled();
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it("filters messages below the configured threshold", () => {
    process.env.LOG_LEVEL = "warn";
    const infoSpy = vi.spyOn(console, "info").mockImplementation(() => {});
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logger.info("below_threshold");
    logger.warn("at_threshold");

    expect(infoSpy).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalledTimes(1);
  });

  it("defaults to silent under NODE_ENV=test so existing suites stay quiet", () => {
    delete process.env.LOG_LEVEL;
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    logger.warn("default_silent_in_test");

    expect(warnSpy).not.toHaveBeenCalled();
  });
});
