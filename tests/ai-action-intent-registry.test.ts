import { describe, expect, it } from "vitest";
import {
  AI_ACTION_INTENT_DEFERRED_IDS,
  AI_ACTION_INTENT_FORBIDDEN_CAPABILITIES,
  AI_ACTION_INTENT_IDS,
  AI_ACTION_INTENT_REGISTRY_VERSION,
  AI_ACTION_INTENT_SUPPORTED_IDS,
  aiActionIntentProposalSchema,
  aiActionIntentReviewResultSchema,
  auditAiActionIntentRegistry,
  getAiActionIntent,
  getAiActionIntentRegistry,
  isAiActionIntentId,
  isSupportedAiActionIntentId,
  listAiActionIntents,
  listAiActionIntentsByObject,
  listDeferredAiActionIntents,
  listSupportedAiActionIntents,
  type AiActionIntentRegistryEntry
} from "@/lib/ai/actionIntentRegistry";

const noWriteFlags = {
  database: false,
  crmRecords: false,
  auditEvents: false,
  tasks: false,
  activities: false,
  opportunities: false,
  leads: false,
  cases: false,
  campaigns: false,
  routes: false,
  routeHandlers: false,
  productUi: false,
  files: false,
  externalServices: false,
  backgroundJobs: false,
  actionExecution: false,
  approvals: false
};

describe("AI action intent registry", () => {
  it("publishes stable supported and deferred intent metadata", () => {
    const registry = getAiActionIntentRegistry();

    expect(AI_ACTION_INTENT_REGISTRY_VERSION).toBe("2026-05-26.s45-f1");
    expect(registry).toMatchObject({
      registryType: "ai-action-intent-registry",
      registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
      supportedIntentCount: AI_ACTION_INTENT_SUPPORTED_IDS.length,
      deferredIntentCount: AI_ACTION_INTENT_DEFERRED_IDS.length,
      intentCount: AI_ACTION_INTENT_IDS.length,
      supportedIntentIds: AI_ACTION_INTENT_SUPPORTED_IDS,
      deferredIntentIds: AI_ACTION_INTENT_DEFERRED_IDS,
      source: {
        module: "lib/ai/actionIntentRegistry.ts",
        registryScope: "preview-only-ai-action-safety-contracts"
      }
    });
    expect(listAiActionIntents().map((entry) => entry.id)).toEqual(
      AI_ACTION_INTENT_IDS
    );
    expect(listSupportedAiActionIntents().map((entry) => entry.id)).toEqual(
      AI_ACTION_INTENT_SUPPORTED_IDS
    );
    expect(listDeferredAiActionIntents().map((entry) => entry.id)).toEqual(
      AI_ACTION_INTENT_DEFERRED_IDS
    );
    expect(new Set(AI_ACTION_INTENT_IDS).size).toBe(
      AI_ACTION_INTENT_IDS.length
    );
  });

  it("describes supported CRM action intents as proposal-only and no-write", () => {
    expect(getAiActionIntent("task.create")).toMatchObject({
      status: "supported",
      label: "Create task",
      inputSchema: {
        kind: "zod",
        module: "lib/validation.ts",
        exportName: "taskCreateSchema"
      },
      outputSchema: {
        kind: "zod",
        module: "lib/ai/actionIntentRegistry.ts",
        exportName: "aiActionIntentReviewResultSchema"
      }
    });
    expect(getAiActionIntent("activity.note.create")).toMatchObject({
      inputSchema: {
        exportName: "noteCreateSchema"
      },
      crmObjectScope: [
        {
          object: "Activity",
          route: "/activities?type=note",
          operation: "create"
        }
      ]
    });
    expect(getAiActionIntent("opportunity.stage.update")).toMatchObject({
      inputSchema: {
        exportName: "dealMoveSchema"
      },
      crmObjectScope: [
        {
          object: "Opportunity",
          modelName: "Deal",
          route: "/deals",
          detailRoute: "/deals?deal=<id>",
          operation: "update"
        }
      ]
    });

    for (const entry of listSupportedAiActionIntents()) {
      expectSupportedNoWriteIntent(entry);
      expect(entry.audit.auditRecorderPath).toBe(
        "lib/services/auditEvents.ts#recordAuditEvent"
      );
      expect(entry.deferral).toBeNull();
    }
  });

  it("keeps non-promoted action intents deferred with safe next actions", () => {
    expect(getAiActionIntent("lead.routing.assign")).toMatchObject({
      status: "deferred",
      deferral: {
        requiresPlanPromotion: true,
        requiresContractPromotion: true,
        reasons: ["routing_execution_excluded"]
      }
    });
    expect(getAiActionIntent("dealer-order.create-or-edit")).toMatchObject({
      status: "deferred",
      deferral: {
        reasons: ["dealer_order_crud_excluded"]
      }
    });
    expect(getAiActionIntent("area.create-or-edit")).toMatchObject({
      status: "deferred",
      deferral: {
        reasons: ["area_crud_excluded"]
      }
    });
    expect(getAiActionIntent("external-provider.request")).toMatchObject({
      status: "deferred",
      deferral: {
        reasons: ["external_ai_provider_excluded"]
      }
    });

    for (const entry of listDeferredAiActionIntents()) {
      expect(entry.mode).toBe("proposal_only");
      expect(entry.inputSchema).toMatchObject({
        module: "lib/ai/actionIntentRegistry.ts",
        exportName: "aiActionIntentProposalSchema"
      });
      expect(entry.audit.auditRecorderPath).toBeNull();
      expect(entry.deferral?.safeNextStep.length).toBeGreaterThan(0);
      expectSupportedNoWriteIntent(entry);
    }
  });

  it("exposes strict proposal and review schemas without execution toggles", () => {
    const proposal = aiActionIntentProposalSchema.parse({
      intentId: "task.create",
      target: {
        entity: "Task",
        route: "/tasks"
      },
      payload: {
        title: "Follow up on dealer order pacing"
      },
      rationale: "The operator needs a follow-up reminder.",
      provenance: [
        {
          kind: "record",
          ref: "task:demo"
        }
      ]
    });

    expect(proposal.intentId).toBe("task.create");
    expect(
      aiActionIntentProposalSchema.safeParse({
        intentId: "task.create",
        target: {
          entity: "Task"
        },
        rationale: "Create a task.",
        executeNow: true
      }).success
    ).toBe(false);
    expect(
      aiActionIntentProposalSchema.safeParse({
        intentId: "unknown.intent",
        target: {
          entity: "Task"
        },
        rationale: "Create a task."
      }).success
    ).toBe(false);

    expect(
      aiActionIntentReviewResultSchema.parse({
        intentId: "task.create",
        status: "ready_for_review",
        approvalRequired: true,
        auditRequiredBeforeExecution: true,
        currentExecutionAllowed: false,
        wouldWriteNow: false,
        issues: []
      })
    ).toMatchObject({
      intentId: "task.create",
      currentExecutionAllowed: false,
      wouldWriteNow: false
    });
  });

  it("supports lookups and audits without widening product scope", () => {
    const registry = getAiActionIntentRegistry();

    expect(isAiActionIntentId("case.status.update")).toBe(true);
    expect(isAiActionIntentId("case.reply.send")).toBe(false);
    expect(isSupportedAiActionIntentId("case.status.update")).toBe(true);
    expect(isSupportedAiActionIntentId("email.send")).toBe(false);
    expect(getAiActionIntent("missing.intent")).toBeNull();
    expect(listAiActionIntentsByObject("Lead").map((entry) => entry.id)).toEqual(
      ["lead.status.update", "email.draft", "email.send", "lead.routing.assign"]
    );
    expect(() => getAiActionIntentRegistry({ execute: true })).toThrow(
      "Unrecognized key(s) in object: 'execute'"
    );
    expect(registry.source.routeScope).not.toContain("/search");
    expect(registry.source.routeScope).not.toContain("/command-palette");
    expect(registry.source.routeScope).not.toContain("/deals/[id]");
    expect(registry.source.routeScope).not.toContain("/orders/new");
    expect(registry.source.routeScope).not.toContain("/areas/new");
    expect(auditAiActionIntentRegistry()).toEqual({
      ok: true,
      registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
      supportedIntentIds: AI_ACTION_INTENT_SUPPORTED_IDS,
      deferredIntentIds: AI_ACTION_INTENT_DEFERRED_IDS,
      registryIntentIds: AI_ACTION_INTENT_IDS,
      duplicateIntentIds: [],
      missingSupportedIntentIds: [],
      missingDeferredIntentIds: [],
      supportedIntentIdsWithoutApproval: [],
      supportedIntentIdsWithoutAuditPath: [],
      intentsMissingForbiddenCapabilities: [],
      intentsWithExecutionEnabled: [],
      intentsWithWritesEnabled: [],
      intentsWithExcludedRoutes: [],
      issues: []
    });
  });
});

function expectSupportedNoWriteIntent(entry: AiActionIntentRegistryEntry) {
  expect(entry.approval).toMatchObject({
    required: true,
    mode: "explicit_operator_approval",
    actorRequired: true,
    identityRequiredBeforeExecution: true,
    approvalPersistence: false
  });
  expect(entry.audit).toMatchObject({
    category: "ai_action",
    reviewEventAction: "ai_action_review",
    executionEventAction: "ai_action_execute",
    reviewRequired: true,
    executionAuditRequired: true,
    wouldWriteNow: false
  });
  expect(entry.write).toEqual(noWriteFlags);
  expect(entry.safety).toEqual({
    deterministic: true,
    metadataOnly: true,
    readOnly: true,
    proposalOnly: true,
    currentExecutionAllowed: false,
    externalProvider: false,
    network: false,
    rag: false,
    routeChanges: false,
    productUi: false,
    routingExecution: false,
    dealerOrderAreaCrud: false,
    backgroundJobs: false
  });
  expect(entry.forbiddenCapabilities).toEqual(
    AI_ACTION_INTENT_FORBIDDEN_CAPABILITIES
  );
  expect(entry.crmObjectScope.length).toBeGreaterThan(0);
}
