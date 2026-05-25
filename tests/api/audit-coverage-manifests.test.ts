import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  AUDIT_ENTITY_TYPES,
  AUDIT_EVENT_ACTIONS
} from "@/lib/services/auditEvents";
import {
  AUDIT_COVERAGE_ENTITIES,
  AUDIT_COVERAGE_MANIFEST_CONTENT_TYPE,
  getAuditCoverageEntityManifest,
  getAuditCoverageManifest,
  isAuditCoverageEntity,
  listAuditCoverageEntities,
  type AuditCoverageActionCoverage
} from "@/lib/server/auditCoverageManifests";

describe("server audit coverage manifests", () => {
  it("publishes deterministic taxonomy and source-surface metadata", () => {
    const manifest = getAuditCoverageManifest();
    const recordCategory = manifest.categories.find(
      (category) => category.category === "record"
    );
    const workflowCategory = manifest.categories.find(
      (category) => category.category === "workflow"
    );

    expect(listAuditCoverageEntities()).toEqual(AUDIT_COVERAGE_ENTITIES);
    expect(manifest).toMatchObject({
      contentType: AUDIT_COVERAGE_MANIFEST_CONTENT_TYPE,
      manifestType: "audit-coverage-manifest",
      entityCount: 3,
      sourceSurfaceCount: 12,
      coveredActionCount: 12,
      knownGapCount: 3,
      source: {
        taxonomyModule: "lib/services/auditEvents.ts",
        auditedMutationModules: [
          "lib/services/tasks.ts",
          "lib/services/cases.ts",
          "lib/services/campaigns.ts"
        ],
        auditedMutationScope: "core-productivity-services"
      },
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(manifest.taxonomy).toMatchObject({
      categoryCount: Object.keys(AUDIT_EVENT_ACTIONS).length,
      actionCount: Object.values(AUDIT_EVENT_ACTIONS).reduce(
        (total, actions) => total + actions.length,
        0
      ),
      entityTypeCount: AUDIT_ENTITY_TYPES.length,
      entityTypes: AUDIT_ENTITY_TYPES
    });
    expect(manifest.taxonomy.categories.map((category) => category.category)).toEqual(
      ["user", "record", "ai", "import", "routing", "workflow"]
    );
    expect(manifest.entities.map((entity) => entity.entity)).toEqual([
      "task",
      "case",
      "campaign"
    ]);
    expect(recordCategory).toMatchObject({
      category: "record",
      status: "known_gap",
      actionCount: 5,
      coveredActionCount: 9,
      knownGapCount: 3,
      entityCount: 3,
      write: noWrites()
    });
    expect(workflowCategory).toMatchObject({
      category: "workflow",
      status: "covered",
      actionCount: 4,
      coveredActionCount: 3,
      knownGapCount: 0,
      entityCount: 3
    });
  });

  it("groups task coverage by entity action and audited service surface", () => {
    const taskManifest = getAuditCoverageEntityManifest("task");

    if (taskManifest === null) {
      throw new Error("Expected task audit coverage manifest");
    }

    const completedSurface = taskManifest.sourceSurfaces.find(
      (surface) => surface.operation === "completeTask"
    );
    const deletedAction = findActionCoverage(
      taskManifest.actionCoverage,
      "record",
      "deleted"
    );
    const stageChangedAction = findActionCoverage(
      taskManifest.actionCoverage,
      "record",
      "stage_changed"
    );

    expect(taskManifest).toMatchObject({
      entity: "task",
      entityType: "task",
      label: "Tasks",
      route: "/tasks",
      status: "known_gap",
      sourceSurfaceCount: 4,
      coveredActionCount: 4,
      knownGapCount: 1,
      read: metadataOnlyReads(),
      write: noWrites()
    });
    expect(taskManifest.sourceSurfaces.map((surface) => surface.id)).toEqual([
      "task:record.created:createTask",
      "task:record.updated:updateTask",
      "task:record.status_changed:updateTask",
      "task:workflow.task_completed:completeTask"
    ]);
    expect(completedSurface).toMatchObject({
      category: "workflow",
      action: "task_completed",
      sourceSurface: "lib/services/tasks.ts#completeTask",
      serviceModule: "lib/services/tasks.ts",
      transaction: true,
      activitySideEffect: true,
      metadataFields: expect.arrayContaining([
        "activityCreated",
        "previousStatus",
        "title"
      ]),
      write: noWrites()
    });
    expect(deletedAction).toEqual({
      category: "record",
      action: "deleted",
      status: "known_gap",
      coveredCount: 0,
      knownGapCount: 1,
      entityCount: 1,
      sourceSurfaceIds: [],
      knownGapIds: ["task:record.deleted:deleteTask"],
      entities: ["task"]
    });
    expect(stageChangedAction).toMatchObject({
      category: "record",
      action: "stage_changed",
      status: "taxonomy_only",
      coveredCount: 0,
      knownGapCount: 0,
      entities: []
    });
  });

  it("groups category rollups and known gaps without inventing runtime coverage", () => {
    const manifest = getAuditCoverageManifest();
    const recordCategory = findCategory(manifest.categories, "record");
    const routingCategory = findCategory(manifest.categories, "routing");
    const createdAction = findActionCoverage(
      recordCategory.actions,
      "record",
      "created"
    );
    const deletedAction = findActionCoverage(
      recordCategory.actions,
      "record",
      "deleted"
    );
    const stageChangedAction = findActionCoverage(
      recordCategory.actions,
      "record",
      "stage_changed"
    );

    expect(createdAction).toMatchObject({
      status: "covered",
      coveredCount: 3,
      knownGapCount: 0,
      entities: ["campaign", "case", "task"]
    });
    expect(deletedAction).toMatchObject({
      status: "known_gap",
      coveredCount: 0,
      knownGapCount: 3,
      knownGapIds: [
        "campaign:record.deleted:deleteCampaign",
        "case:record.deleted:deleteCase",
        "task:record.deleted:deleteTask"
      ],
      entities: ["campaign", "case", "task"]
    });
    expect(stageChangedAction).toMatchObject({
      status: "taxonomy_only",
      coveredCount: 0,
      knownGapCount: 0
    });
    expect(routingCategory).toMatchObject({
      category: "routing",
      status: "taxonomy_only",
      coveredActionCount: 0,
      knownGapCount: 0,
      entityCount: 0
    });
    expect(manifest.knownGaps.map((gap) => gap.operation)).toEqual([
      "deleteTask",
      "deleteCase",
      "deleteCampaign"
    ]);
    expect(manifest.knownGaps).toContainEqual(
      expect.objectContaining({
        id: "case:record.deleted:deleteCase",
        sourceSurface: "lib/services/cases.ts#deleteCase",
        reason:
          "The current delete service removes the record without recording an AuditEvent.",
        safeNextAction:
          "Promote audited delete semantics before marking delete coverage complete.",
        write: noWrites()
      })
    );
  });

  it("keeps manifest construction strict and no-write", async () => {
    const countsBefore = await currentCounts();

    expect(isAuditCoverageEntity("task")).toBe(true);
    expect(isAuditCoverageEntity("account")).toBe(false);
    expect(getAuditCoverageEntityManifest("account")).toBeNull();
    expect(() =>
      getAuditCoverageManifest({ includeTelemetry: true })
    ).toThrow("Unrecognized key(s) in object: 'includeTelemetry'");
    expect(await currentCounts()).toEqual(countsBefore);
  });
});

function metadataOnlyReads() {
  return {
    metadata: true,
    database: false,
    runtimeEvents: false,
    requestLogs: false,
    telemetry: false
  };
}

function noWrites() {
  return {
    database: false,
    mutations: false,
    auditEvents: false,
    requestLogs: false,
    externalTelemetry: false,
    externalServices: false,
    backgroundJobs: false
  };
}

function findCategory<
  Category extends { category: string }
>(categories: readonly Category[], category: string): Category {
  const found = categories.find((candidate) => candidate.category === category);

  if (found === undefined) {
    throw new Error(`Expected category ${category}`);
  }

  return found;
}

function findActionCoverage(
  actions: readonly AuditCoverageActionCoverage[],
  category: string,
  action: string
): AuditCoverageActionCoverage {
  const found = actions.find(
    (candidate) => candidate.category === category && candidate.action === action
  );

  if (found === undefined) {
    throw new Error(`Expected action ${category}.${action}`);
  }

  return found;
}

async function currentCounts() {
  const [auditEvents, tasks, cases, campaigns] = await Promise.all([
    prisma.auditEvent.count(),
    prisma.task.count(),
    prisma.case.count(),
    prisma.campaign.count()
  ]);

  return {
    auditEvents,
    tasks,
    cases,
    campaigns
  };
}
