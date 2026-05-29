import { afterEach, describe, expect, it } from "vitest";
import {
  buildLeadDispositionSnapshot,
  type LeadDispositionActivitySource,
  type LeadDispositionClock,
  type LeadDispositionSource
} from "@/lib/services/leadDispositions";
import {
  buildLeadSlaFollowUpPacket,
  buildLeadSlaFollowUpPacketBatch,
  buildLeadSlaFollowUpPackets,
  getLeadSlaFollowUpPacket,
  LEAD_SLA_FOLLOW_UP_WRITE_SAFETY,
  listLeadSlaFollowUpPacketBatch,
  listLeadSlaFollowUpPackets,
  type LeadSlaFollowUpPacket
} from "@/lib/services/leadSlaFollowUp";
import { prisma } from "@/lib/prisma";

const fixedNow = new Date("2026-05-24T12:00:00.000Z");
const fixedClock: LeadDispositionClock = {
  now: () => fixedNow
};

const dbLeadIds = [
  "lead-sla-follow-up-db-new",
  "lead-sla-follow-up-db-routed",
  "lead-sla-follow-up-db-closed"
] as const;

describe("lead SLA follow-up packets", () => {
  afterEach(async () => {
    await cleanupDbLeads();
  });

  it("classifies stale, unrouted, routed, contacted, closed, and dead situations", () => {
    const packets = buildLeadSlaFollowUpPackets([
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-stale-contacted",
          status: "contacted",
          createdAt: new Date("2026-05-09T12:00:00.000Z"),
          updatedAt: new Date("2026-05-14T12:00:00.000Z")
        })
      ),
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-unrouted",
          createdAt: new Date("2026-05-24T08:00:00.000Z")
        })
      ),
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-routed",
          status: "assigned",
          assignmentReason: "routed",
          assignedOrderId: "order-1",
          activities: [
            activitySource({
              id: "lead-sla-routed-event",
              createdAt: new Date("2026-05-23T12:00:00.000Z")
            })
          ],
          createdAt: new Date("2026-05-23T11:00:00.000Z"),
          updatedAt: new Date("2026-05-23T12:00:00.000Z")
        })
      ),
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-contacted",
          status: "contacted",
          createdAt: new Date("2026-05-24T10:00:00.000Z")
        })
      ),
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-closed",
          status: "closed",
          createdAt: new Date("2026-05-01T12:00:00.000Z")
        })
      ),
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-dead",
          status: "dead",
          createdAt: new Date("2026-05-01T12:00:00.000Z")
        })
      )
    ]);

    expect(packetSummary(packets)).toEqual([
      [
        "stale",
        "stale_contacted_lead",
        "high",
        "review_stale_lead_follow_up"
      ],
      ["unrouted", "unrouted_new_lead", "normal", "review_routing_gap"],
      [
        "routed_uncontacted",
        "routed_uncontacted",
        "high",
        "contact_routed_lead"
      ],
      [
        "contacted",
        "contacted_waiting_outcome",
        "low",
        "monitor_contacted_lead"
      ],
      ["closed", "closed_terminal", "none", "no_follow_up_closed"],
      ["dead", "dead_terminal", "none", "no_follow_up_dead"]
    ]);

    expect(packets[0]!.stale).toMatchObject({
      isStale: true,
      staleAfterDays: 7,
      urgentStaleAfterDays: 14,
      staleAgeDays: 3
    });
    expect(packets[2]!.age.routingEventAgeDays).toBe(1);
    expect(packets.every((packet) => packet.write.readOnly)).toBe(true);
  });

  it("uses clock-injected ages for urgency and suggested action metadata", () => {
    const stale = buildLeadSlaFollowUpPacket(
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-stale-urgent",
          status: "assigned",
          createdAt: new Date("2026-05-04T12:00:00.000Z"),
          updatedAt: new Date("2026-05-09T12:00:00.000Z")
        })
      )
    );
    const unrouted = buildLeadSlaFollowUpPacket(
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-unrouted-urgent",
          createdAt: new Date("2026-05-21T12:00:00.000Z")
        })
      )
    );
    const routed = buildLeadSlaFollowUpPacket(
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-routed-urgent",
          status: "assigned",
          assignmentReason: "routed",
          activities: [
            activitySource({
              id: "lead-sla-routed-urgent-event",
              createdAt: new Date("2026-05-22T12:00:00.000Z")
            })
          ],
          createdAt: new Date("2026-05-22T11:00:00.000Z"),
          updatedAt: new Date("2026-05-22T12:00:00.000Z")
        })
      )
    );

    expect(stale).toMatchObject({
      situation: "stale",
      urgency: "urgent",
      urgencyRank: 4,
      age: {
        createdAgeDays: 20,
        updatedAgeDays: 15
      }
    });
    expect(unrouted).toMatchObject({
      situation: "unrouted",
      urgency: "urgent",
      age: {
        createdAgeDays: 3
      }
    });
    expect(routed).toMatchObject({
      situation: "routed_uncontacted",
      urgency: "urgent",
      age: {
        routingEventAgeDays: 2
      }
    });
    expect(routed.suggestedNextAction.metadata).toEqual({
      requiresHumanReview: true,
      safeForCurrentSprint: true,
      createsTask: false,
      mutatesLead: false,
      sendsNotification: false,
      runsRouting: false,
      callsProvider: false,
      schedulesJob: false
    });
  });

  it("summarizes packet batches with explicit no-write safety", () => {
    const batch = buildLeadSlaFollowUpPacketBatch([
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-batch-stale",
          createdAt: new Date("2026-05-01T12:00:00.000Z"),
          updatedAt: new Date("2026-05-15T12:00:00.000Z")
        })
      ),
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-batch-routed",
          status: "assigned",
          assignmentReason: "routed",
          activities: [
            activitySource({
              id: "lead-sla-batch-routed-event",
              createdAt: new Date("2026-05-23T12:00:00.000Z")
            })
          ],
          createdAt: new Date("2026-05-23T12:00:00.000Z")
        })
      ),
      dispositionSnapshot(
        leadSource({
          id: "lead-sla-batch-dead",
          status: "dead"
        })
      )
    ]);

    expect(batch).toMatchObject({
      packetType: "lead-sla-follow-up-packet-batch",
      packetVersion: 1,
      summary: {
        packetCount: 3,
        staleCount: 1,
        routedUncontactedCount: 1,
        deadCount: 1,
        highCount: 2,
        reviewRecommendedCount: 2
      },
      write: LEAD_SLA_FOLLOW_UP_WRITE_SAFETY
    });
  });

  it("exposes read-only DB-backed packet helpers with bounded output", async () => {
    await prisma.lead.createMany({
      data: [
        dbLead({
          id: "lead-sla-follow-up-db-new",
          createdAt: new Date("2026-05-24T10:00:00.000Z")
        }),
        dbLead({
          id: "lead-sla-follow-up-db-routed",
          status: "assigned",
          assignmentReason: "routed",
          createdAt: new Date("2026-05-22T08:00:00.000Z")
        }),
        dbLead({
          id: "lead-sla-follow-up-db-closed",
          status: "closed",
          createdAt: new Date("2026-05-20T08:00:00.000Z")
        })
      ]
    });

    await prisma.activity.create({
      data: {
        id: "lead-sla-follow-up-routing-event",
        leadId: "lead-sla-follow-up-db-routed",
        type: "routing_event",
        title: "Lead routed",
        createdAt: new Date("2026-05-22T12:00:00.000Z")
      }
    });

    const beforeTaskCount = await prisma.task.count({
      where: leadIdWhere()
    });
    const beforeActivityCount = await prisma.activity.count({
      where: leadIdWhere()
    });

    const single = await getLeadSlaFollowUpPacket(
      "lead-sla-follow-up-db-routed",
      {
        clock: fixedClock
      }
    );
    const listed = await listLeadSlaFollowUpPackets({
      leadIds: dbLeadIds,
      limit: 2,
      clock: fixedClock
    });
    const highPacketBatch = await listLeadSlaFollowUpPacketBatch({
      leadIds: dbLeadIds,
      clock: fixedClock,
      urgency: "high"
    });

    const afterTaskCount = await prisma.task.count({
      where: leadIdWhere()
    });
    const afterActivityCount = await prisma.activity.count({
      where: leadIdWhere()
    });

    expect(single).toMatchObject({
      lead: {
        id: "lead-sla-follow-up-db-routed",
        route: "/leads/lead-sla-follow-up-db-routed"
      },
      situation: "routed_uncontacted",
      urgency: "urgent"
    });
    expect(listed.map((packet) => packet.lead.id)).toEqual([
      "lead-sla-follow-up-db-new",
      "lead-sla-follow-up-db-routed"
    ]);
    expect(highPacketBatch.summary).toMatchObject({
      packetCount: 0,
      highCount: 0
    });
    expect(afterTaskCount).toBe(beforeTaskCount);
    expect(afterActivityCount).toBe(beforeActivityCount);
  });
});

function dispositionSnapshot(source: LeadDispositionSource) {
  return buildLeadDispositionSnapshot(source, fixedClock);
}

function packetSummary(packets: readonly LeadSlaFollowUpPacket[]) {
  return packets.map((packet) => [
    packet.situation,
    packet.reasonCode,
    packet.urgency,
    packet.suggestedNextAction.code
  ]);
}

function leadSource(
  overrides: Partial<LeadDispositionSource> & { id: string }
): LeadDispositionSource {
  const createdAt =
    overrides.createdAt ?? new Date("2026-05-23T12:00:00.000Z");

  return {
    id: overrides.id,
    firstName: overrides.firstName ?? "Lead",
    lastName: overrides.lastName ?? "SLA",
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

function dbLead(overrides: {
  id: string;
  status?: string;
  assignmentReason?: string | null;
  createdAt?: Date;
}) {
  const createdAt =
    overrides.createdAt ?? new Date("2026-05-24T08:00:00.000Z");

  return {
    id: overrides.id,
    firstName: "Lead",
    lastName: "SLA",
    status: overrides.status ?? "new",
    assignmentReason: overrides.assignmentReason ?? null,
    createdAt,
    updatedAt: createdAt
  };
}

function leadIdWhere() {
  return {
    leadId: {
      in: Array.from(dbLeadIds)
    }
  };
}

async function cleanupDbLeads() {
  await prisma.task.deleteMany({
    where: leadIdWhere()
  });
  await prisma.activity.deleteMany({
    where: leadIdWhere()
  });
  await prisma.lead.deleteMany({
    where: {
      id: {
        in: Array.from(dbLeadIds)
      }
    }
  });
}
