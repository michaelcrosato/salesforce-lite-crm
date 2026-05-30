import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { previewWorkflowRuleDryRunAction } from "@/app/reports/actions";
import { logger } from "@/lib/observability/logger";
import * as reviewPackets from "@/lib/server/workflowRuleReviewPackets";

describe("reports actions error logging", () => {
  let loggerErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    loggerErrorSpy = vi.spyOn(logger, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("logs action_error when previewWorkflowRuleDryRunAction throws", async () => {
    vi.spyOn(reviewPackets, "getWorkflowRuleReviewPacket").mockRejectedValue(
      new Error("Simulated system failure in review packet building")
    );

    const formData = new FormData();
    formData.append("exampleEntity", "contacts");

    const result = await previewWorkflowRuleDryRunAction(formData);

    expect(result.ok).toBe(false);
    expect(result.message).toBe("The workflow dry-run review packet could not be built.");
    
    expect(loggerErrorSpy).toHaveBeenCalled();
    const calls = loggerErrorSpy.mock.calls;
    const actionErrorCall = calls.find((call: unknown[]) => call[0] === "action_error");
    
    expect(actionErrorCall).toBeDefined();
    expect(actionErrorCall![1]).toMatchObject({
      action: "previewWorkflowRuleDryRunAction",
      entity: "workflowRule",
      message: "Simulated system failure in review packet building"
    });
  });
});
