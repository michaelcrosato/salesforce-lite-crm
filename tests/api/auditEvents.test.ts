import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  AUDIT_EVENT_ACTIONS,
  getAuditEventExplorer,
  isAuditActionForCategory,
  listAuditEvents,
  listAuditEventsForEntity,
  recordAuditEvent,
  serializeAuditMetadata
} from "@/lib/services/auditEvents";
import { getAuditHistoryAction } from "@/app/deals/actions";

const actorUserId = "test-audit-user";
const accountEntityId = "test-audit-account";
const leadEntityId = "test-audit-lead";
const taskEntityId = "test-audit-task";
const campaignEntityId = "test-audit-campaign";

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

  it("builds a read-only explorer snapshot with filters, counts, and links", async () => {
    await recordAuditEvent({
      category: "record",
      action: "created",
      actorUserId,
      entityType: "task",
      entityId: taskEntityId,
      summary: "Task created for explorer.",
      occurredAt: new Date("2099-05-22T10:00:00Z")
    });
    await recordAuditEvent({
      category: "workflow",
      action: "campaign_completed",
      actorUserId,
      entityType: "campaign",
      entityId: campaignEntityId,
      summary: "Campaign completed for explorer.",
      occurredAt: new Date("2099-05-23T10:00:00Z")
    });
    const countBefore = await prisma.auditEvent.count({
      where: { actorUserId }
    });

    const snapshot = await getAuditEventExplorer({
      category: "record",
      action: "created",
      entityType: "task",
      pageSize: 5
    });
    const countAfter = await prisma.auditEvent.count({
      where: { actorUserId }
    });

    expect(countAfter).toBe(countBefore);
    expect(snapshot.filters).toEqual({
      category: "record",
      action: "created",
      entityType: "task"
    });
    expect(snapshot.totalEventCount).toBeGreaterThanOrEqual(2);
    expect(snapshot.matchingEventCount).toBeGreaterThanOrEqual(1);
    expect(snapshot.availableCategories).toContain("record");
    expect(snapshot.availableEntityTypes).toContain("task");
    expect(snapshot.availableActions).toContainEqual({
      category: "record",
      action: "created",
      label: "record / created"
    });
    expect(snapshot.categoryCounts).toEqual([
      {
        value: "record",
        label: "record",
        count: snapshot.matchingEventCount
      }
    ]);
    expect(snapshot.actionCounts).toEqual([
      {
        value: "created",
        label: "created",
        count: snapshot.matchingEventCount
      }
    ]);
    expect(snapshot.entityCounts).toEqual([
      {
        value: "task",
        label: "task",
        count: snapshot.matchingEventCount
      }
    ]);
    expect(snapshot.events.length).toBeGreaterThanOrEqual(1);
    expect(snapshot.events[0]).toMatchObject({
      category: "record",
      action: "created",
      entityType: "task",
      entityId: taskEntityId,
      summary: "Task created for explorer.",
      recordLink: {
        href: `/tasks?task=${taskEntityId}`,
        label: "Open task"
      }
    });
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

  it("listAuditEventsForEntity returns events in deterministic order", async () => {
    // Empty history case
    const emptyEvents = await listAuditEventsForEntity("account", "non-existent-id");
    expect(emptyEvents).toEqual([]);

    // Insert events with specific timestamps
    await recordAuditEvent({
      category: "record",
      action: "created",
      entityType: "account",
      entityId: accountEntityId,
      summary: "First account event",
      occurredAt: new Date("2026-05-10T12:00:00Z")
    });

    await recordAuditEvent({
      category: "record",
      action: "updated",
      entityType: "account",
      entityId: accountEntityId,
      summary: "Second account event",
      occurredAt: new Date("2026-05-12T12:00:00Z")
    });

    const events = await listAuditEventsForEntity("account", accountEntityId);
    expect(events.length).toBe(2);
    // Deterministic order check: occurredAt desc, so second event (newest) first!
    expect(events[0]!.summary).toBe("Second account event");
    expect(events[1]!.summary).toBe("First account event");
  });

  it("getAuditHistoryAction server action works correctly", async () => {
    const invalidQuery = await getAuditHistoryAction({ entity: "invalid-entity", entityId: "" });
    expect(invalidQuery.ok).toBe(false);
    expect(invalidQuery.events).toEqual([]);

    const validQuery = await getAuditHistoryAction({ entity: "account", entityId: accountEntityId });
    expect(validQuery.ok).toBe(true);
  });
});

async function cleanupAuditEvents() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { actorUserId },
        {
          entityId: {
            in: [
              accountEntityId,
              leadEntityId,
              taskEntityId,
              campaignEntityId
            ]
          }
        }
      ]
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: actorUserId
    }
  });
}
