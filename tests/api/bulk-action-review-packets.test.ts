import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  BULK_ACTION_DRY_RUN_REVIEW_PACKET_ENTITIES,
  getBulkActionDryRunReviewPacket,
  getBulkActionDryRunReviewPacketDefinition,
  listBulkActionDryRunReviewPacketDefinitions
} from "@/lib/server/bulkActionDryRunReviewPackets";

const activeAccountId = "test-bulk-review-account-active";
const pausedAccountId = "test-bulk-review-account-paused";
const contactId = "test-bulk-review-contact";
const missingId = "test-bulk-review-missing";

const noWriteFlags = {
  database: false,
  mutations: false,
  approvals: false,
  auditEvents: false,
  files: false,
  externalServices: false,
  backgroundJobs: false
};

describe("server bulk action dry-run review packets", () => {
  beforeEach(async () => {
    await cleanupBulkActionReviewFixtures();
    await createBulkActionReviewFixtures();
  });

  afterEach(async () => {
    await cleanupBulkActionReviewFixtures();
  });

  it("publishes deterministic packet definitions with action and entity metadata", () => {
    const definitions = listBulkActionDryRunReviewPacketDefinitions();
    const accountDefinition = getBulkActionDryRunReviewPacketDefinition("accounts");

    expect(definitions.map((definition) => definition.entityMetadata.entity)).toEqual(
      BULK_ACTION_DRY_RUN_REVIEW_PACKET_ENTITIES
    );
    expect(accountDefinition).toMatchObject({
      packetType: "bulk-action-dry-run-review-packet",
      entityMetadata: {
        entity: "accounts",
        label: "Accounts",
        route: "/accounts",
        exportFilename: "accounts.csv",
        maxSelectedRecords: 200
      },
      write: noWriteFlags
    });
    expect(accountDefinition.actions).toContainEqual(
      expect.objectContaining({
        action: "status_update",
        label: "Status update",
        supported: true,
        target: {
          field: "targetStatus",
          required: true,
          valueSource: "status_constants",
          allowedValues: ["active", "paused", "churned"]
        },
        previewOnly: true,
        wouldMutate: false,
        requiresApproval: false
      })
    );
    expect(accountDefinition.actions).toContainEqual(
      expect.objectContaining({
        action: "stage_update",
        supported: false,
        target: {
          field: "targetStage",
          required: true,
          valueSource: "unsupported",
          allowedValues: null
        }
      })
    );
  });

  it("wraps dry-run output with rollups, reasons, audit plans, and no writes", async () => {
    const taskCountBefore = await prisma.task.count();
    const auditCountBefore = await prisma.auditEvent.count();
    const packet = await getBulkActionDryRunReviewPacket({
      entity: "accounts",
      action: "status_update",
      recordIds: [activeAccountId, pausedAccountId, missingId, activeAccountId],
      targetStatus: "paused",
      generatedAt: new Date("2026-05-23T12:00:00Z")
    });
    const accounts = await prisma.account.findMany({
      where: {
        id: {
          in: [activeAccountId, pausedAccountId]
        }
      },
      orderBy: { id: "asc" },
      select: { id: true, status: true }
    });

    expect(packet).toMatchObject({
      packetType: "bulk-action-dry-run-review-packet",
      mode: "dry_run_review",
      entityMetadata: {
        entity: "accounts",
        label: "Accounts",
        route: "/accounts",
        exportFilename: "accounts.csv"
      },
      actionMetadata: {
        action: "status_update",
        supported: true,
        previewOnly: true,
        wouldMutate: false,
        requiresApproval: false
      },
      write: noWriteFlags
    });
    expect(packet.dryRun.records.map((record) => [record.id, record.reason])).toEqual([
      [activeAccountId, "eligible"],
      [pausedAccountId, "no_change"],
      [missingId, "not_found"]
    ]);
    expect(packet.rollup).toEqual({
      status: "partial",
      requestedCount: 4,
      uniqueRecordCount: 3,
      duplicateCount: 1,
      missingCount: 1,
      eligibleCount: 1,
      blockedCount: 3,
      wouldMutate: false,
      requiresApproval: false
    });
    expect(
      packet.reasons.map((reason) => ({
        reason: reason.reason,
        count: reason.count,
        eligible: reason.eligible,
        message: reason.message,
        representatives: reason.representativeRecords.map((record) => ({
          id: record.id,
          occurrences: record.occurrences
        }))
      }))
    ).toEqual([
      {
        reason: "eligible",
        count: 1,
        eligible: true,
        message: "Selected record would be eligible for this change.",
        representatives: [{ id: activeAccountId, occurrences: null }]
      },
      {
        reason: "no_change",
        count: 1,
        eligible: false,
        message: "Selected record already has the requested value.",
        representatives: [{ id: pausedAccountId, occurrences: null }]
      },
      {
        reason: "not_found",
        count: 1,
        eligible: false,
        message: "Selected record was not found.",
        representatives: [{ id: missingId, occurrences: null }]
      },
      {
        reason: "duplicate_selection",
        count: 1,
        eligible: false,
        message: "1 duplicate selection ignored after the first occurrence.",
        representatives: [{ id: activeAccountId, occurrences: 2 }]
      }
    ]);
    expect(packet.auditPlan).toMatchObject({
      source: "bulk_action_dry_run",
      packetSource: "bulk_action_dry_run_review_packet",
      summary: "status_update dry run for accounts: 1 eligible, 3 blocked.",
      wouldMutate: false,
      requiresApproval: false,
      wouldRecordAuditEvent: false,
      write: noWriteFlags,
      metadata: {
        source: "bulk_action_dry_run",
        entity: "accounts",
        action: "status_update",
        target: "paused",
        generatedAt: "2026-05-23T12:00:00.000Z",
        wouldMutate: false,
        requiresApproval: false,
        requestedCount: 4,
        uniqueRecordCount: 3,
        duplicateCount: 1,
        missingCount: 1,
        eligibleCount: 1,
        blockedCount: 3
      }
    });
    expect(accounts).toEqual([
      { id: activeAccountId, status: "active" },
      { id: pausedAccountId, status: "paused" }
    ]);
    expect(await prisma.task.count()).toBe(taskCountBefore);
    expect(await prisma.auditEvent.count()).toBe(auditCountBefore);
  });

  it("carries selected-export metadata from the existing CSV contract", async () => {
    const packet = await getBulkActionDryRunReviewPacket({
      entity: "contacts",
      action: "selected_export",
      recordIds: [contactId]
    });

    expect(packet.entityMetadata).toMatchObject({
      entity: "contacts",
      label: "Contacts",
      route: "/contacts",
      exportFilename: "contacts.csv"
    });
    expect(packet.actionMetadata).toMatchObject({
      action: "selected_export",
      supported: true,
      target: {
        field: null,
        required: false,
        valueSource: "csv_export_definition",
        allowedValues: null
      }
    });
    expect(packet.rollup).toMatchObject({
      status: "ready",
      eligibleCount: 1,
      blockedCount: 0,
      wouldMutate: false
    });
    expect(packet.auditPlan.metadata).toMatchObject({
      filename: "contacts.csv",
      contentType: "text/csv; charset=utf-8",
      columnCount: 11,
      route: "/contacts"
    });
  });

  it("rejects unknown packet keys without writing records", async () => {
    const taskCountBefore = await prisma.task.count();

    await expect(
      getBulkActionDryRunReviewPacket({
        entity: "accounts",
        action: "task_creation",
        recordIds: [activeAccountId],
        taskTitle: "Follow up",
        apply: true
      })
    ).rejects.toThrow("Unrecognized key(s) in object: 'apply'");
    expect(await prisma.task.count()).toBe(taskCountBefore);
  });
});

async function createBulkActionReviewFixtures() {
  await prisma.account.createMany({
    data: [
      {
        id: activeAccountId,
        name: "Bulk Review Active Account",
        status: "active",
        healthScore: 80
      },
      {
        id: pausedAccountId,
        name: "Bulk Review Paused Account",
        status: "paused",
        healthScore: 70
      }
    ]
  });
  await prisma.contact.create({
    data: {
      id: contactId,
      accountId: activeAccountId,
      firstName: "Bulk",
      lastName: "Review",
      email: "bulk.review.contact@example.test",
      status: "active"
    }
  });
}

async function cleanupBulkActionReviewFixtures() {
  await prisma.contact.deleteMany({
    where: {
      OR: [{ id: contactId }, { email: "bulk.review.contact@example.test" }]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: {
        in: [activeAccountId, pausedAccountId]
      }
    }
  });
}
