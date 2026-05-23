import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  AUDIT_EVENT_ACTIONS,
  isAuditActionForCategory,
  listAuditEvents,
  listAuditEventsForEntity,
  recordAuditEvent,
  serializeAuditMetadata
} from "@/lib/services/auditEvents";

const actorUserId = "test-audit-user";
const accountEntityId = "test-audit-account";
const leadEntityId = "test-audit-lead";

describe("audit event service", () => {
  beforeEach(async () => {
    await cleanupAuditEvents();
    await prisma.user.create({
      data: {
        id: actorUserId,
        name: "Audit User",
        email: `${actorUserId}@example.test`
      }
    });
  });

  afterEach(async () => {
    await cleanupAuditEvents();
  });

  it("publishes taxonomy buckets for CRM safety categories", () => {
    expect(Object.keys(AUDIT_EVENT_ACTIONS)).toEqual([
      "user",
      "record",
      "ai",
      "import",
      "routing",
      "workflow"
    ]);
    expect(isAuditActionForCategory("routing", "lead_routed")).toBe(true);
    expect(isAuditActionForCategory("routing", "profile_updated")).toBe(false);
  });

  it("records audit events with deterministic metadata", async () => {
    const event = await recordAuditEvent({
      category: "record",
      action: "updated",
      actorUserId,
      entityType: "account",
      entityId: accountEntityId,
      summary: "Account status changed.",
      metadata: {
        z: true,
        nested: {
          b: 2,
          a: 1
        },
        list: [
          {
            y: "last",
            x: "first"
          }
        ]
      },
      occurredAt: new Date("2026-05-20T10:00:00Z")
    });

    expect(event).toMatchObject({
      category: "record",
      action: "updated",
      actorUserId,
      entityType: "account",
      entityId: accountEntityId,
      summary: "Account status changed.",
      metadata:
        '{"list":[{"x":"first","y":"last"}],"nested":{"a":1,"b":2},"z":true}'
    });
  });

  it("lists audit events by entity and newest occurrence first", async () => {
    await recordAuditEvent({
      category: "record",
      action: "created",
      entityType: "account",
      entityId: accountEntityId,
      summary: "Account created.",
      occurredAt: new Date("2026-05-19T10:00:00Z")
    });
    await recordAuditEvent({
      category: "record",
      action: "status_changed",
      entityType: "account",
      entityId: accountEntityId,
      summary: "Account paused.",
      occurredAt: new Date("2026-05-21T10:00:00Z")
    });
    await recordAuditEvent({
      category: "routing",
      action: "lead_routed",
      entityType: "lead",
      entityId: leadEntityId,
      summary: "Lead routed.",
      occurredAt: new Date("2026-05-20T10:00:00Z")
    });

    const accountEvents = await listAuditEventsForEntity(
      "account",
      accountEntityId
    );
    const routingEvents = await listAuditEvents({
      category: "routing",
      action: "lead_routed"
    });

    expect(accountEvents.map((event) => event.summary)).toEqual([
      "Account paused.",
      "Account created."
    ]);
    expect(routingEvents).toHaveLength(1);
    expect(routingEvents[0]?.entityId).toBe(leadEntityId);
  });

  it("rejects action values outside the selected category", async () => {
    await expect(
      recordAuditEvent({
        category: "routing",
        action: "profile_updated",
        entityType: "lead",
        entityId: leadEntityId,
        summary: "Invalid routing audit."
      })
    ).rejects.toThrow(
      "Audit action 'profile_updated' is not valid for category 'routing'."
    );
  });

  it("serializes absent metadata as null", () => {
    expect(serializeAuditMetadata(undefined)).toBeNull();
  });
});

async function cleanupAuditEvents() {
  await prisma.auditEvent.deleteMany({
    where: {
      entityId: {
        in: [accountEntityId, leadEntityId]
      }
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: actorUserId
    }
  });
}
