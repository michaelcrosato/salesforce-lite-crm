import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  CSV_CONTACT_IMPORT_MANUAL_APPLY_CONTENT_TYPE,
  CSV_CONTACT_IMPORT_MANUAL_APPLY_VERSION,
  executeCsvContactImportApply
} from "@/lib/server/csvImportApplyExecutor";

const actorUserId = "test-csv-apply-actor";
const accountId = "test-csv-apply-account";
const createdEmail = "csv.apply.created@example.test";
const duplicateEmail = "csv.apply.duplicate@example.test";
const blockedEmail = "csv.apply.blocked@example.test";
const unapprovedEmail = "csv.apply.unapproved@example.test";

describe("server CSV contact import apply executor", () => {
  beforeEach(async () => {
    await cleanupCsvApplyFixtures();
    await createCsvApplyFixtures();
  });

  afterEach(async () => {
    await cleanupCsvApplyFixtures();
  });

  it("creates approved create-safe contact rows and records audit evidence", async () => {
    const countsBefore = await currentCounts();
    const result = await executeCsvContactImportApply({
      entity: "contacts",
      csv: mixedContactCsv(),
      generatedAt: new Date("2026-05-25T23:00:00Z"),
      approval: {
        approved: true,
        actorUserId,
        approvedAt: new Date("2026-05-25T23:05:00Z"),
        note: "Operator approved the contact create-safe rows."
      }
    });
    const createdContact = await prisma.contact.findUnique({
      where: { email: createdEmail },
      select: {
        accountId: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
        title: true
      }
    });
    const blockedContact = await prisma.contact.findUnique({
      where: { email: blockedEmail },
      select: { id: true }
    });
    const auditEvents = await prisma.auditEvent.findMany({
      where: {
        actorUserId,
        category: "record",
        action: "created",
        entityType: "contact",
        summary: {
          contains: "CSV contact import manual apply"
        }
      },
      orderBy: [{ occurredAt: "asc" }, { id: "asc" }],
      select: {
        action: true,
        actorUserId: true,
        category: true,
        entityId: true,
        entityType: true,
        metadata: true,
        occurredAt: true
      }
    });

    expect(result).toMatchObject({
      contentType: CSV_CONTACT_IMPORT_MANUAL_APPLY_CONTENT_TYPE,
      executionType: "csv-contact-import-manual-apply",
      executionVersion: CSV_CONTACT_IMPORT_MANUAL_APPLY_VERSION,
      generatedAt: "2026-05-25T23:00:00.000Z",
      status: "partial",
      blockReasons: [],
      approval: {
        approved: true,
        actorUserId,
        approvedAt: "2026-05-25T23:05:00.000Z"
      },
      summary: {
        entity: "contacts",
        totalRows: 3,
        createCandidateRows: 1,
        reviewCandidateRows: 1,
        sourceBlockedRows: 1,
        attemptedRows: 1,
        createdRows: 1,
        skippedRows: 1,
        blockedRows: 1,
        failedRows: 0,
        auditEventCount: 1,
        operatorApprovalRequired: true,
        operatorApproved: true,
        didMutate: true
      },
      source: {
        capabilityContentType: "application/json; charset=utf-8",
        capabilityVersion: "2026-05-25.s40-f1",
        manualExecutorPath: "lib/crm/crmClient.ts#createContact",
        routeScope: ["/contacts"]
      },
      write: {
        database: true,
        contacts: true,
        auditEvents: true,
        importApply: true,
        leads: false,
        routingAssignments: false,
        dealerOrders: false,
        pacingEngine: false,
        accounts: false,
        updates: false,
        upserts: false,
        duplicateMerge: false,
        files: false,
        backgroundJobs: false,
        externalServices: false,
        salesforce: false,
        routes: false,
        routeHandlers: false,
        productUi: false,
        schema: false,
        crmContract: false
      },
      safety: {
        deterministic: true,
        readOnly: false,
        contactsOnly: true,
        createsOnly: true,
        manualExecutorOnly: true,
        operatorApprovalRequired: true,
        approvalPersistence: false,
        leadApply: false,
        leadRouting: false,
        routingReassignment: false,
        dealerOrderWrites: false,
        pacingEngineChanges: false,
        accountCreation: false,
        updates: false,
        upserts: false,
        duplicateMerge: false,
        fileStorage: false,
        backgroundJobs: false,
        salesforceIntegration: false,
        externalAi: false,
        network: false,
        externalServices: false,
        routeHandlers: false,
        productUi: false,
        crmContractChanges: false,
        schemaChanges: false
      }
    });
    expect(result.rows.map((row) => row.status)).toEqual([
      "created",
      "skipped",
      "blocked"
    ]);
    expect(result.rows[0]).toMatchObject({
      rowNumber: 2,
      rowAction: "create_candidate",
      readinessStatus: "ready",
      attempted: true,
      created: true,
      blockReasons: [],
      skippedReasons: []
    });
    expect(result.rows[1]).toMatchObject({
      rowNumber: 3,
      rowAction: "review_candidate",
      readinessStatus: "needs_review",
      attempted: false,
      created: false,
      contactId: null,
      auditEventId: null,
      skippedReasons: ["contact_review_candidate_not_create_safe"],
      diagnosticCodes: ["contact_duplicate_email"]
    });
    expect(result.rows[2]).toMatchObject({
      rowNumber: 4,
      rowAction: "blocked",
      readinessStatus: "blocked",
      attempted: false,
      created: false,
      blockReasons: ["contact_row_blocked_by_validation"]
    });
    expect(result.source.routeScope).not.toContain("/search");
    expect(result.source.routeScope).not.toContain("/command-palette");
    expect(result.source.routeScope).not.toContain("/deals/[id]");
    expect(
      result.source.routeScope.some((route) => route.includes("/deals/[id]"))
    ).toBe(false);
    expect(createdContact).toEqual({
      accountId,
      email: createdEmail,
      firstName: "Apply",
      lastName: "Created",
      status: "active",
      title: "Buyer"
    });
    expect(blockedContact).toBeNull();
    expect(auditEvents).toHaveLength(1);
    expect(auditEvents[0]).toMatchObject({
      action: "created",
      actorUserId,
      category: "record",
      entityType: "contact",
      occurredAt: new Date("2026-05-25T23:05:00Z")
    });
    expect(auditEvents[0]?.entityId).toBe(result.rows[0]?.contactId);
    expect(auditEvents[0]?.metadata).toContain(
      '"source":"csv_contact_import_manual_apply_executor"'
    );
    expect(auditEvents[0]?.metadata).toContain('"rowNumber":2');
    expect(auditEvents[0]?.metadata).toContain(
      '"manualExecutorPath":"lib/crm/crmClient.ts#createContact"'
    );
    expect(await currentCounts()).toEqual({
      contacts: countsBefore.contacts + 1,
      leads: countsBefore.leads,
      auditEvents: countsBefore.auditEvents + 1
    });
  });

  it("blocks unapproved create candidates without writes", async () => {
    const countsBefore = await currentCounts();
    const result = await executeCsvContactImportApply({
      entity: "contacts",
      csv: createOnlyCsv(unapprovedEmail),
      approval: {
        approved: false,
        actorUserId
      }
    });

    expect(result.status).toBe("blocked");
    expect(result.blockReasons).toEqual(["operator_approval_required"]);
    expect(result.summary).toMatchObject({
      createCandidateRows: 1,
      attemptedRows: 0,
      createdRows: 0,
      blockedRows: 1,
      auditEventCount: 0,
      operatorApproved: false,
      didMutate: false
    });
    expect(result.rows).toEqual([
      expect.objectContaining({
        rowNumber: 2,
        rowAction: "create_candidate",
        status: "blocked",
        attempted: false,
        created: false,
        contactId: null,
        auditEventId: null,
        blockReasons: ["operator_approval_required"]
      })
    ]);
    expect(await currentCounts()).toEqual(countsBefore);
  });

  it("rejects non-goal entities and unknown apply controls without writes", async () => {
    const countsBefore = await currentCounts();

    await expect(
      executeCsvContactImportApply({
        entity: "leads",
        csv: createOnlyCsv("csv.apply.lead@example.test"),
        approval: {
          approved: true,
          actorUserId
        }
      })
    ).rejects.toThrow("invalid_literal");
    await expect(
      executeCsvContactImportApply({
        entity: "contacts",
        csv: createOnlyCsv("csv.apply.unknown-key@example.test"),
        execute: true,
        approval: {
          approved: true,
          actorUserId
        }
      })
    ).rejects.toThrow("Unrecognized key(s) in object: 'execute'");
    await expect(
      executeCsvContactImportApply({
        entity: "contacts",
        csv: createOnlyCsv("csv.apply.approval-key@example.test"),
        approval: {
          approved: true,
          actorUserId,
          persistApproval: true
        }
      })
    ).rejects.toThrow("Unrecognized key(s) in object: 'persistApproval'");

    expect(await currentCounts()).toEqual(countsBefore);
  });
});

function mixedContactCsv(): string {
  return [
    "First Name,Last Name,Email,Phone,Title,Status,Account ID",
    `Apply,Created,${createdEmail},604-555-0101,Buyer,active,${accountId}`,
    `Existing,Duplicate,${duplicateEmail},604-555-0102,Buyer,active,${accountId}`,
    `,Blocked,${blockedEmail},604-555-0103,Buyer,active,${accountId}`
  ].join("\n");
}

function createOnlyCsv(email: string): string {
  return [
    "First Name,Last Name,Email,Phone,Title,Status,Account ID",
    `Apply,Only,${email},604-555-0111,Buyer,active,${accountId}`
  ].join("\n");
}

async function createCsvApplyFixtures() {
  await prisma.user.create({
    data: {
      id: actorUserId,
      name: "CSV Apply Actor",
      email: "csv.apply.actor@example.test"
    }
  });
  await prisma.account.create({
    data: {
      id: accountId,
      name: "CSV Apply Account",
      status: "active",
      healthScore: 88
    }
  });
  await prisma.contact.create({
    data: {
      accountId,
      firstName: "Existing",
      lastName: "Duplicate",
      email: duplicateEmail,
      phone: "604-555-0102",
      title: "Buyer",
      status: "active"
    }
  });
}

async function cleanupCsvApplyFixtures() {
  await prisma.auditEvent.deleteMany({
    where: {
      OR: [
        { actorUserId },
        { summary: { contains: "CSV contact import manual apply" } },
        { metadata: { contains: "csv_contact_import_manual_apply_executor" } }
      ]
    }
  });
  await prisma.contact.deleteMany({
    where: {
      OR: [
        {
          email: {
            in: [
              createdEmail,
              duplicateEmail,
              blockedEmail,
              unapprovedEmail,
              "csv.apply.lead@example.test",
              "csv.apply.unknown-key@example.test",
              "csv.apply.approval-key@example.test"
            ]
          }
        },
        { firstName: "Apply" },
        { accountId }
      ]
    }
  });
  await prisma.account.deleteMany({
    where: {
      id: accountId
    }
  });
  await prisma.user.deleteMany({
    where: {
      id: actorUserId
    }
  });
}

async function currentCounts() {
  const [contacts, leads, auditEvents] = await Promise.all([
    prisma.contact.count(),
    prisma.lead.count(),
    prisma.auditEvent.count()
  ]);

  return {
    contacts,
    leads,
    auditEvents
  };
}
