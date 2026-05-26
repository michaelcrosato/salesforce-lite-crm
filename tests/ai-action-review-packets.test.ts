import { describe, expect, it } from "vitest";
import {
  AI_ACTION_REVIEW_PACKET_CONTENT_TYPE,
  AI_ACTION_REVIEW_PACKET_VERSION,
  auditAiActionReviewPackets,
  buildAiActionReviewPacket,
  buildAiActionReviewPacketBatch
} from "@/lib/ai/actionReviewPackets";
import {
  AI_ACTION_INTENT_REGISTRY_VERSION,
  AI_ACTION_INTENT_SUPPORTED_IDS
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

describe("AI action review packets", () => {
  it("publishes stable packet metadata and contract audit output", () => {
    const packet = buildAiActionReviewPacket({
      intentId: "task.create",
      target: {
        entity: "Task",
        route: "/tasks"
      },
      payload: {
        title: "Follow up on pacing",
        priority: "high",
        leadId: "lead-review-1"
      },
      rationale: "Operator should review a follow-up task.",
      provenance: [
        {
          kind: "record",
          ref: "lead:lead-review-1"
        }
      ]
    });

    expect(AI_ACTION_REVIEW_PACKET_VERSION).toBe("2026-05-26.s45-f2");
    expect(packet).toMatchObject({
      contentType: AI_ACTION_REVIEW_PACKET_CONTENT_TYPE,
      packetType: "ai-action-review-packet",
      packetVersion: AI_ACTION_REVIEW_PACKET_VERSION,
      source: {
        module: "lib/ai/actionReviewPackets.ts",
        packetScope: "preview-only-ai-action-review-packets",
        registryModule: "lib/ai/actionIntentRegistry.ts",
        registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
        proposalSchema: "aiActionIntentProposalSchema",
        reviewResultSchema: "aiActionIntentReviewResultSchema"
      }
    });
    expect(packet.source.supportedPayloadSchemas.map((schema) => schema.exportName)).toEqual([
      "taskCreateSchema",
      "noteCreateSchema",
      "dealMoveSchema",
      "leadStatusUpdateSchema",
      "caseUpdateSchema",
      "campaignUpdateSchema"
    ]);
    expect(packet.source.routeScope).not.toContain("/search");
    expect(packet.source.routeScope).not.toContain("/command-palette");
    expect(packet.source.routeScope).not.toContain("/deals/[id]");
    expect(auditAiActionReviewPackets()).toEqual({
      ok: true,
      packetVersion: AI_ACTION_REVIEW_PACKET_VERSION,
      registryVersion: AI_ACTION_INTENT_REGISTRY_VERSION,
      supportedIntentIds: AI_ACTION_INTENT_SUPPORTED_IDS,
      payloadSchemaIntentIds: AI_ACTION_INTENT_SUPPORTED_IDS,
      supportedIntentIdsWithoutPayloadSchemas: [],
      payloadSchemaIntentIdsWithoutRegistryEntries: [],
      reviewPacketsWouldWrite: false,
      reviewPacketsWouldExecute: false,
      issues: []
    });
  });

  it("marks valid supported proposals ready for explicit operator review", () => {
    const packet = buildAiActionReviewPacket({
      intentId: "opportunity.stage.update",
      target: {
        entity: "Opportunity",
        recordId: "deal-review-1",
        route: "/deals?deal=deal-review-1"
      },
      payload: {
        dealId: "deal-review-1",
        stage: "proposal"
      },
      rationale: "The opportunity has enough information for proposal review.",
      provenance: [
        {
          kind: "record",
          ref: "opportunity:deal-review-1"
        },
        {
          kind: "activity",
          ref: "activity:review-note"
        }
      ]
    });

    expect(packet.status).toBe("ready_for_review");
    expect(packet.proposal).toEqual({
      intentId: "opportunity.stage.update",
      target: {
        entity: "Opportunity",
        recordId: "deal-review-1",
        route: "/deals?deal=deal-review-1"
      },
      rationale: "The opportunity has enough information for proposal review.",
      provenanceCount: 2,
      payloadKeys: ["dealId", "stage"]
    });
    expect(packet.intent).toMatchObject({
      id: "opportunity.stage.update",
      status: "supported",
      mode: "proposal_only"
    });
    expect(packet.payloadValidation).toMatchObject({
      status: "valid",
      schema: {
        module: "lib/validation.ts",
        exportName: "dealMoveSchema"
      },
      payloadKeyCount: 2,
      payloadKeys: ["dealId", "stage"],
      issueCount: 0,
      issues: []
    });
    expect(packet.reviewResult).toEqual({
      intentId: "opportunity.stage.update",
      status: "ready_for_review",
      approvalRequired: true,
      auditRequiredBeforeExecution: true,
      currentExecutionAllowed: false,
      wouldWriteNow: false,
      issues: []
    });
    expect(packet.approval).toMatchObject({
      approvalRequired: true,
      mode: "explicit_operator_approval",
      actorRequired: true,
      identityRequiredBeforeExecution: true,
      approvalPersistence: false,
      currentExecutionAllowed: false
    });
    expect(packet.audit).toMatchObject({
      category: "ai_action",
      reviewEventAction: "ai_action_review",
      executionEventAction: "ai_action_execute",
      auditRequiredBeforeExecution: true,
      wouldWriteNow: false,
      wouldRecordAuditNow: false
    });
    expect(packet.summary).toMatchObject({
      packetCount: 1,
      readyCount: 1,
      blockedCount: 0,
      deferredCount: 0,
      issueCount: 0,
      approvalRequiredCount: 1,
      auditRequiredBeforeExecutionCount: 1,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    });
    expect(packet.write).toEqual(noWriteFlags);
    expect(packet.safety).toMatchObject({
      deterministic: true,
      readOnly: true,
      proposalOnly: true,
      currentExecutionAllowed: false,
      reviewOnly: true,
      validatesPayload: true,
      execution: false,
      silentWrites: false,
      auditPersistence: false,
      approvalPersistence: false
    });
  });

  it("blocks supported proposals when the payload fails its intent schema", () => {
    const packet = buildAiActionReviewPacket({
      intentId: "task.create",
      target: {
        entity: "Task",
        route: "/tasks"
      },
      payload: {
        title: "",
        priority: "immediate"
      },
      rationale: "Operator should review a task proposal."
    });

    expect(packet.status).toBe("blocked");
    expect(packet.intent?.id).toBe("task.create");
    expect(packet.payloadValidation).toMatchObject({
      status: "invalid",
      schema: {
        exportName: "taskCreateSchema"
      },
      payloadKeyCount: 2,
      payloadKeys: ["priority", "title"],
      issueCount: 2
    });
    expect(packet.payloadValidation.issues.map((issue) => issue.code)).toEqual([
      "payload_invalid",
      "payload_invalid"
    ]);
    expect(packet.reviewResult).toMatchObject({
      intentId: "task.create",
      status: "blocked",
      approvalRequired: true,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    });
    expect(packet.summary).toMatchObject({
      readyCount: 0,
      blockedCount: 1,
      deferredCount: 0,
      issueCount: 2
    });
    expect(packet.write).toEqual(noWriteFlags);
  });

  it("keeps deferred intents reviewable only as blocked promotion guidance", () => {
    const packet = buildAiActionReviewPacket({
      intentId: "email.send",
      target: {
        entity: "Lead",
        recordId: "lead-review-1",
        route: "/leads/lead-review-1"
      },
      payload: {
        subject: "Welcome",
        body: "Please review the dealer order handoff."
      },
      rationale: "Email sending is requested by the model."
    });

    expect(packet.status).toBe("deferred");
    expect(packet.intent).toMatchObject({
      id: "email.send",
      status: "deferred",
      deferral: {
        requiresPlanPromotion: true,
        requiresContractPromotion: true,
        reasons: ["email_provider_excluded", "external_integration_excluded"]
      }
    });
    expect(packet.payloadValidation).toMatchObject({
      status: "skipped",
      schema: {
        module: "lib/ai/actionIntentRegistry.ts",
        exportName: "aiActionIntentProposalSchema"
      },
      payloadKeyCount: 2,
      payloadKeys: ["body", "subject"],
      issueCount: 0
    });
    expect(packet.issues).toEqual([
      {
        code: "intent_deferred",
        severity: "warning",
        path: "intentId",
        message:
          "AI action intent 'email.send' is deferred: Promote a transactional email provider, approval, and audit contract before send intents."
      }
    ]);
    expect(packet.reviewResult).toEqual({
      intentId: "email.send",
      status: "deferred",
      approvalRequired: true,
      auditRequiredBeforeExecution: true,
      currentExecutionAllowed: false,
      wouldWriteNow: false,
      issues: [
        "AI action intent 'email.send' is deferred: Promote a transactional email provider, approval, and audit contract before send intents."
      ]
    });
    expect(packet.audit?.auditRecorderPath).toBeNull();
    expect(packet.write).toEqual(noWriteFlags);
  });

  it("blocks malformed proposals without enabling execution toggles", () => {
    const packet = buildAiActionReviewPacket({
      intentId: "case.status.update",
      target: {
        entity: "Case"
      },
      payload: {
        status: "resolved"
      },
      rationale: "Resolve the service case.",
      executeNow: true
    });

    expect(packet.status).toBe("blocked");
    expect(packet.intent?.id).toBe("case.status.update");
    expect(packet.payloadValidation).toMatchObject({
      status: "skipped",
      schema: {
        exportName: "caseUpdateSchema"
      },
      payloadKeys: ["status"]
    });
    expect(packet.issues).toEqual([
      {
        code: "proposal_invalid",
        severity: "error",
        path: "root",
        message: "Unrecognized key(s) in object: 'executeNow'"
      }
    ]);
    expect(packet.reviewResult).toMatchObject({
      intentId: "case.status.update",
      status: "blocked",
      currentExecutionAllowed: false,
      wouldWriteNow: false
    });
    expect(packet.write).toEqual(noWriteFlags);
    expect(packet.safety.execution).toBe(false);
  });

  it("blocks unknown intents and summarizes mixed batches deterministically", () => {
    const readyProposal = {
      intentId: "lead.status.update",
      target: {
        entity: "Lead",
        recordId: "lead-review-2",
        route: "/leads/lead-review-2"
      },
      payload: {
        leadId: "lead-review-2",
        status: "contacted"
      },
      rationale: "The lead has been contacted."
    };
    const blockedProposal = {
      intentId: "case.reply.send",
      target: {
        entity: "Case"
      },
      payload: {
        body: "Send a reply."
      },
      rationale: "Model proposed an unknown case reply action."
    };
    const deferredProposal = {
      intentId: "lead.routing.assign",
      target: {
        entity: "Lead",
        recordId: "lead-review-3",
        route: "/leads/lead-review-3"
      },
      payload: {
        leadId: "lead-review-3"
      },
      rationale: "Model proposed rerouting a lead."
    };
    const blockedPacket = buildAiActionReviewPacket(blockedProposal);
    const batch = buildAiActionReviewPacketBatch([
      readyProposal,
      blockedProposal,
      deferredProposal
    ]);

    expect(blockedPacket.status).toBe("blocked");
    expect(blockedPacket.intent).toBeNull();
    expect(blockedPacket.reviewResult).toBeNull();
    expect(blockedPacket.issues.map((issue) => issue.code)).toEqual([
      "intent_unknown",
      "proposal_invalid"
    ]);
    expect(batch.packets.map((packet) => packet.status)).toEqual([
      "ready_for_review",
      "blocked",
      "deferred"
    ]);
    expect(batch.summary).toEqual({
      packetCount: 3,
      readyCount: 1,
      blockedCount: 1,
      deferredCount: 1,
      issueCount: 3,
      approvalRequiredCount: 2,
      auditRequiredBeforeExecutionCount: 2,
      currentExecutionAllowed: false,
      wouldWriteNow: false
    });
    expect(batch.write).toEqual(noWriteFlags);
    expect(batch.safety).toMatchObject({
      reviewOnly: true,
      execution: false,
      silentWrites: false
    });
  });
});
