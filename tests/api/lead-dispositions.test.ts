import { afterEach, describe, expect, it } from "vitest";
import {
  buildLeadDispositionSnapshot,
  buildLeadDispositionSnapshots,
  getLeadDispositionSnapshot,
  listLeadDispositionSnapshots,
  MAX_LEAD_DISPOSITION_LIMIT,
  type LeadDispositionActivitySource,
  type LeadDispositionClock,
  type LeadDispositionSource
} from "@/lib/services/leadDispositions";
import { prisma } from "@/lib/prisma";

const fixedNow = new Date("2026-05-24T12:00:00.000Z");
const fixedClock: LeadDispositionClock = {
  now: () => fixedNow
};

const dbLeadIds = [
  "lead-disposition-db-new",
  "lead-disposition-db-routed",
  "lead-disposition-db-dead"
] as const;

describe("lead disposition contracts", () => {
  afterEach(async () => {
    await cleanupDbLeads();
  });

  it("classifies routed assigned leads with latest routing evidence", () => {
    const snapshot = buildLeadDispositionSnapshot(
      leadSource({
        id: "lead-disposition-routed",
        status: "assigned",
        assignmentReason: "routed",
        assignedOrderId: "dealer-order-1",
        createdAt: new Date("2026-05-20T12:00:00.000Z"),
        updatedAt: new Date("2026-05-22T12:00:00.000Z"),
        activities: [
          activitySource({
            id: "routing-old",
            createdAt: new Date("2026-05-20T12:30:00.000Z")
          }),
          activitySource({
            id: "note-not-routing",
            type: "note",
            createdAt: new Date("2026-05-23T12:00:00.000Z")
          }),
          activitySource({
            id: "routing-new",
            createdAt: new Date("2026-05-21T12:30:00.000Z")
          })
        ]
      }),
      fixedClock
    );

    expect(snapshot).toMatchObject({
      leadId: "lead-disposition-routed",
      leadName: "Lead Disposition",
      knownStatus: "assigned",
      state: "routed_uncontacted",
      reasonCode: "routed_with_event",
      knownAssignmentReason: "routed",
      assignedOrderId: "dealer-order-1",
      createdAgeDays: 4,
      updatedAgeDays: 2,
      hasRoutingEvent: true,
      routingEventId: "routing-new"
    });
    expect(snapshot.evaluatedAt.toISOString()).toBe(fixedNow.toISOString());
    expect(snapshot.routingEventAt?.toISOString()).toBe(
      "2026-05-21T12:30:00.000Z"
    );
  });

  it("prioritizes contacted, closed, and dead lead statuses", () => {
    const snapshots = buildLeadDispositionSnapshots(
      [
        leadSource({
          id: "lead-disposition-contacted",
          status: "contacted",
          assignmentReason: "routed",
          activities: [activitySource({ id: "routing-contacted" })]
        }),
        leadSource({
          id: "lead-disposition-closed",
          status: "closed",
          assignmentReason: "no_area_match"
        }),
        leadSource({
          id: "lead-disposition-dead",
          status: "dead"
        })
      ],
      fixedClock
    );

    expect(
      snapshots.map((snapshot) => [
        snapshot.state,
        snapshot.reasonCode
      ])
    ).toEqual([
      ["contacted", "status_contacted"],
      ["closed", "status_closed"],
      ["dead", "status_dead"]
    ]);
  });

  it("separates routing failures, missing evidence, and unrouted leads", () => {
    const snapshots = buildLeadDispositionSnapshots(
      [
        leadSource({
          id: "lead-disposition-failed",
          assignmentReason: "no_matching_active_order"
        }),
        leadSource({
          id: "lead-disposition-missing-evidence",
          status: "assigned",
          assignmentReason: "routed"
        }),
        leadSource({
          id: "lead-disposition-assigned-no-routing",
          status: "assigned"
        }),
        leadSource({
          id: "lead-disposition-unrouted"
        }),
        leadSource({
          id: "lead-disposition-legacy",
          status: "legacy"
        })
      ],
      fixedClock
    );

    expect(
      snapshots.map((snapshot) => [
        snapshot.state,
        snapshot.reasonCode
      ])
    ).toEqual([
      ["routing_failed", "routing_failed_no_matching_active_order"],
      ["routed_missing_evidence", "routed_missing_event"],
      ["assigned_without_routing", "assigned_without_routing"],
      ["unrouted", "new_unrouted"],
      ["unrouted", "legacy_status_unrouted"]
    ]);
  });

  it("exposes read-only get/list helpers with bounded output", async () => {
    await prisma.lead.createMany({
      data: [
        dbLead({
          id: "lead-disposition-db-new",
          createdAt: new Date("2026-05-20T08:00:00.000Z")
        }),
        dbLead({
          id: "lead-disposition-db-routed",
          status: "assigned",
          assignmentReason: "routed",
          createdAt: new Date("2026-05-21T08:00:00.000Z")
        }),
        dbLead({
          id: "lead-disposition-db-dead",
          status: "dead",
          createdAt: new Date("2026-05-22T08:00:00.000Z")
        })
      ]
    });

    await prisma.activity.create({
      data: {
        id: "lead-disposition-routing-event",
        leadId: "lead-disposition-db-routed",
        type: "routing_event",
        title: "Lead routed",
        createdAt: new Date("2026-05-21T09:00:00.000Z")
      }
    });

    const single = await getLeadDispositionSnapshot(
      "lead-disposition-db-routed",
      fixedClock
    );
    const listed = await listLeadDispositionSnapshots(
      {
        leadIds: dbLeadIds,
        limit: 2
      },
      fixedClock
    );

    expect(single?.state).toBe("routed_uncontacted");
    expect(single?.routingEventId).toBe("lead-disposition-routing-event");
    expect(listed.map((snapshot) => snapshot.leadId)).toEqual([
      "lead-disposition-db-dead",
      "lead-disposition-db-routed"
    ]);
    expect(listed.map((snapshot) => snapshot.state)).toEqual([
      "dead",
      "routed_uncontacted"
    ]);
  });

  it("clamps list limits to the published maximum", async () => {
    await prisma.lead.create({
      data: dbLead({
        id: "lead-disposition-db-new"
      })
    });

    const listed = await listLeadDispositionSnapshots(
      {
        leadIds: dbLeadIds,
        limit: MAX_LEAD_DISPOSITION_LIMIT + 500
      },
      fixedClock
    );

    expect(listed).toHaveLength(1);
  });
});

function leadSource(
  overrides: Partial<LeadDispositionSource> & { id: string }
): LeadDispositionSource {
  const createdAt =
    overrides.createdAt ?? new Date("2026-05-23T12:00:00.000Z");

  return {
    id: overrides.id,
    firstName: overrides.firstName ?? "Lead",
    lastName: overrides.lastName ?? "Disposition",
    status: overrides.status ?? "new",
    assignmentReason: overrides.assignmentReason ?? null,
    assignedOrderId: overrides.assignedOrderId ?? null,
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt,
    activities: overrides.activities ?? []
  };
}

function activitySource(
  overrides: Partial<LeadDispositionActivitySource> & { id: string }
): LeadDispositionActivitySource {
  return {
    id: overrides.id,
    type: overrides.type ?? "routing_event",
    createdAt: overrides.createdAt ?? new Date("2026-05-23T12:00:00.000Z")
  };
}

function dbLead(
  overrides: {
    id: string;
    status?: string;
    assignmentReason?: string | null;
    createdAt?: Date;
  }
) {
  const createdAt =
    overrides.createdAt ?? new Date("2026-05-20T08:00:00.000Z");

  return {
    id: overrides.id,
    firstName: "Lead",
    lastName: "Disposition",
    status: overrides.status ?? "new",
    assignmentReason: overrides.assignmentReason ?? null,
    createdAt,
    updatedAt: createdAt
  };
}

async function cleanupDbLeads() {
  await prisma.activity.deleteMany({
    where: {
      leadId: {
        in: Array.from(dbLeadIds)
      }
    }
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        in: Array.from(dbLeadIds)
      }
    }
  });
}
