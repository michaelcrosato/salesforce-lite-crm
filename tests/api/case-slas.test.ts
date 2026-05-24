import { afterEach, describe, expect, it } from "vitest";
import {
  buildCaseSlaSnapshot,
  buildCaseSlaSnapshots,
  CASE_SLA_POLICIES,
  getCaseSlaPolicy,
  type CaseSlaClock,
  type CaseSlaSource
} from "@/lib/services/caseSlas";
import {
  getCaseSlaSnapshot,
  listCaseSlaSnapshots
} from "@/lib/services/cases";
import { prisma } from "@/lib/prisma";

const fixedNow = new Date("2026-05-24T12:00:00.000Z");
const fixedClock: CaseSlaClock = {
  now: () => fixedNow
};

describe("case SLA contracts", () => {
  afterEach(async () => {
    await cleanupSlaCases();
  });

  it("calculates priority targets and due-soon state with an injected clock", () => {
    const snapshot = buildCaseSlaSnapshot(
      caseSource({
        id: "case-sla-due-soon",
        priority: "normal",
        createdAt: new Date("2026-05-22T18:00:00.000Z")
      }),
      fixedClock
    );

    expect(snapshot.priority).toBe("normal");
    expect(snapshot.policyLabel).toBe("Normal response");
    expect(snapshot.targetHours).toBe(CASE_SLA_POLICIES.normal.targetHours);
    expect(snapshot.dueAt.toISOString()).toBe("2026-05-24T18:00:00.000Z");
    expect(snapshot.remainingMinutes).toBe(360);
    expect(snapshot.overdueMinutes).toBe(0);
    expect(snapshot.state).toBe("due_soon");
    expect(snapshot.isOverdue).toBe(false);
    expect(snapshot.evaluatedAt.toISOString()).toBe(fixedNow.toISOString());
  });

  it("marks open overdue cases using the policy due time", () => {
    const snapshot = buildCaseSlaSnapshot(
      caseSource({
        id: "case-sla-overdue",
        priority: "urgent",
        createdAt: new Date("2026-05-24T06:30:00.000Z")
      }),
      fixedClock
    );

    expect(snapshot.targetHours).toBe(4);
    expect(snapshot.dueAt.toISOString()).toBe("2026-05-24T10:30:00.000Z");
    expect(snapshot.remainingMinutes).toBe(0);
    expect(snapshot.overdueMinutes).toBe(90);
    expect(snapshot.state).toBe("overdue");
    expect(snapshot.isOverdue).toBe(true);
  });

  it("separates stopped-on-time from stopped-overdue cases", () => {
    const snapshots = buildCaseSlaSnapshots(
      [
        caseSource({
          id: "case-sla-stopped-on-time",
          status: "resolved",
          priority: "urgent",
          createdAt: new Date("2026-05-24T09:00:00.000Z"),
          updatedAt: new Date("2026-05-24T10:00:00.000Z")
        }),
        caseSource({
          id: "case-sla-stopped-overdue",
          status: "closed",
          priority: "high",
          createdAt: new Date("2026-05-23T06:00:00.000Z"),
          updatedAt: new Date("2026-05-24T10:00:00.000Z")
        })
      ],
      fixedClock
    );

    expect(snapshots.map((snapshot) => snapshot.state)).toEqual([
      "stopped_on_time",
      "stopped_overdue"
    ]);
    expect(snapshots.every((snapshot) => snapshot.isStopped)).toBe(true);
    expect(snapshots[0].stoppedAt?.toISOString()).toBe(
      "2026-05-24T10:00:00.000Z"
    );
    expect(snapshots[1].overdueMinutes).toBe(240);
  });

  it("exposes read-only case service SLA snapshots", async () => {
    await prisma.case.createMany({
      data: [
        {
          id: "case-sla-service-due-soon",
          subject: "Case SLA service due soon",
          status: "new",
          priority: "normal",
          createdAt: new Date("2026-05-22T18:00:00.000Z"),
          updatedAt: new Date("2026-05-23T12:00:00.000Z")
        },
        {
          id: "case-sla-service-closed",
          subject: "Case SLA service closed",
          status: "closed",
          priority: "high",
          createdAt: new Date("2026-05-23T06:00:00.000Z"),
          updatedAt: new Date("2026-05-24T10:00:00.000Z")
        }
      ]
    });

    const single = await getCaseSlaSnapshot(
      "case-sla-service-due-soon",
      fixedClock
    );
    const listed = await listCaseSlaSnapshots(
      {
        status: "new"
      },
      fixedClock
    );

    expect(single?.state).toBe("due_soon");
    expect(single?.caseId).toBe("case-sla-service-due-soon");
    expect(
      listed.find((snapshot) => snapshot.caseId === "case-sla-service-due-soon")
        ?.dueAt.toISOString()
    ).toBe("2026-05-24T18:00:00.000Z");
  });

  it("falls back to the normal policy for legacy invalid priority strings", () => {
    expect(getCaseSlaPolicy("legacy-priority")).toEqual(
      CASE_SLA_POLICIES.normal
    );
  });
});

function caseSource(
  overrides: Partial<CaseSlaSource> & { id: string }
): CaseSlaSource {
  const createdAt =
    overrides.createdAt ?? new Date("2026-05-24T08:00:00.000Z");

  return {
    id: overrides.id,
    subject: overrides.subject ?? "Case SLA source",
    status: overrides.status ?? "new",
    priority: overrides.priority ?? "normal",
    queueKey: overrides.queueKey ?? "general_support",
    createdAt,
    updatedAt: overrides.updatedAt ?? createdAt
  };
}

async function cleanupSlaCases() {
  await prisma.case.deleteMany({
    where: {
      id: {
        startsWith: "case-sla-service-"
      }
    }
  });
}
