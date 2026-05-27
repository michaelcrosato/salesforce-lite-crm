import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import { serializeAuditMetadata } from "@/lib/services/auditEvents";
import {
  archiveSavedReportDefinition,
  createSavedReportDefinition,
  deleteSavedReportDefinition,
  getSavedReportDefinition,
  listSavedReportDefinitions,
  updateSavedReportDefinition,
  type PersistedSavedReportDefinition
} from "@/lib/server/savedReportPersistence";

const testNamePrefix = "Test saved report";
type ExpectedSavedReportAuditMutation = "create" | "update" | "archive" | "delete";

describe("saved report persistence contracts", () => {
  beforeEach(async () => {
    await cleanupSavedReportDefinitions();
  });

  afterEach(async () => {
    await cleanupSavedReportDefinitions();
  });

  it("creates and lists deterministic persisted definitions", async () => {
    const created = await createSavedReportDefinition({
      entity: "opportunities",
      name: `${testNamePrefix} pipeline`,
      fields: ["name", "stage", "value", "stage"],
      filters: {
        stage: "proposal",
        search: "enterprise"
      },
      groupBy: ["stage", "stage"],
      chart: {
        type: "bar",
        dimensionKey: "stage",
        metricKey: "value.sum"
      },
      previewLimit: 12
    });
    const persisted = await prisma.savedReportDefinition.findUniqueOrThrow({
      where: {
        entity_name: {
          entity: "opportunities",
          name: `${testNamePrefix} pipeline`
        }
      }
    });
    const listed = await listSavedReportDefinitions({
      entity: "opportunities"
    });

    expect(created).toMatchObject({
      entity: "opportunities",
      name: `${testNamePrefix} pipeline`,
      fields: ["name", "stage", "value"],
      filters: {
        search: "enterprise",
        stage: "proposal"
      },
      groupBy: ["stage"],
      chart: {
        type: "bar",
        dimensionKey: "stage",
        metricKey: "value.sum"
      },
      previewLimit: 12,
      archivedAt: null,
      source: {
        persistenceModule: "lib/server/savedReportPersistence.ts",
        definitionModule: "lib/server/savedReportDefinitions.ts",
        executionScope: "persisted-definition-contracts"
      },
      read: {
        metadata: true,
        database: true,
        previewExecution: false,
        adapterInternals: false
      },
      write: {
        database: true,
        mutations: true,
        auditEvents: true,
        schemas: false,
        routes: false,
        files: false,
        externalServices: false,
        backgroundJobs: false,
        rawSql: false,
        previewExecution: false
      }
    });
    expect(persisted.fields).toBe('["name","stage","value"]');
    expect(persisted.filters).toBe('{"search":"enterprise","stage":"proposal"}');
    expect(persisted.groupBy).toBe('["stage"]');
    expect(persisted.chart).toBe(
      '{"type":"bar","dimensionKey":"stage","metricKey":"value.sum"}'
    );
    expect(listed.map((definition) => definition.id)).toContain(created.id);

    const audit = await findSavedReportAudit({
      definitionId: created.id,
      action: "created",
      summary: `Saved report created: ${created.name}.`
    });
    expect(audit.metadata).toBe(
      expectedSavedReportAuditMetadata(created, "create", [
        "entity",
        "name",
        "fields",
        "filters",
        "groupBy",
        "chart",
        "previewLimit"
      ])
    );
  });

  it("updates, fetches, archives, and deletes definitions by id", async () => {
    const savedReport = await createSavedReportDefinition({
      entity: "accounts",
      name: `${testNamePrefix} account health`,
      fields: ["name", "status", "healthScore"],
      filters: {
        status: "active"
      },
      groupBy: ["status"],
      chart: {
        type: "bar",
        dimensionKey: "status",
        metricKey: "healthScore.avg"
      }
    });
    const updated = await updateSavedReportDefinition(savedReport.id, {
      name: `${testNamePrefix} paused accounts`,
      fields: ["name", "status"],
      filters: {
        status: "paused"
      },
      chart: null,
      previewLimit: 40
    });
    const fetched = await getSavedReportDefinition(savedReport.id);
    const archived = await archiveSavedReportDefinition(
      savedReport.id,
      new Date("2026-05-27T12:00:00.000Z")
    );
    const defaultList = await listSavedReportDefinitions({ entity: "accounts" });
    const stringFalseList = await listSavedReportDefinitions({
      entity: "accounts",
      includeArchived: "false"
    });
    const archivedList = await listSavedReportDefinitions({
      entity: "accounts",
      includeArchived: true
    });
    const deleted = await deleteSavedReportDefinition(savedReport.id);

    expect(updated).toMatchObject({
      id: savedReport.id,
      name: `${testNamePrefix} paused accounts`,
      fields: ["name", "status"],
      filters: {
        status: "paused"
      },
      groupBy: ["status"],
      chart: null,
      previewLimit: 40
    });
    expect(fetched?.name).toBe(`${testNamePrefix} paused accounts`);
    expect(archived.archivedAt?.toISOString()).toBe(
      "2026-05-27T12:00:00.000Z"
    );
    expect(defaultList.map((definition) => definition.id)).not.toContain(
      savedReport.id
    );
    expect(stringFalseList.map((definition) => definition.id)).not.toContain(
      savedReport.id
    );
    expect(archivedList.map((definition) => definition.id)).toContain(
      savedReport.id
    );
    expect(deleted.id).toBe(savedReport.id);
    await expect(getSavedReportDefinition(savedReport.id)).resolves.toBeNull();

    const updateAudit = await findSavedReportAudit({
      definitionId: savedReport.id,
      action: "updated",
      summary: `Saved report updated: ${updated.name}.`
    });
    const archiveAudit = await findSavedReportAudit({
      definitionId: savedReport.id,
      action: "updated",
      summary: `Saved report archived: ${archived.name}.`
    });
    const deleteAudit = await findSavedReportAudit({
      definitionId: savedReport.id,
      action: "deleted",
      summary: `Saved report deleted: ${deleted.name}.`
    });

    expect(updateAudit.metadata).toBe(
      expectedSavedReportAuditMetadata(updated, "update", [
        "name",
        "fields",
        "filters",
        "chart",
        "previewLimit"
      ])
    );
    expect(archiveAudit.metadata).toBe(
      expectedSavedReportAuditMetadata(archived, "archive", ["archivedAt"])
    );
    expect(deleteAudit.metadata).toBe(
      expectedSavedReportAuditMetadata(deleted, "delete", [])
    );
  });

  it("rejects unsupported metadata without database writes", async () => {
    const countsBefore = await savedReportPersistenceCounts();

    await expect(
      createSavedReportDefinition({
        entity: "notes",
        name: `${testNamePrefix} notes`,
        fields: ["title"]
      })
    ).rejects.toThrow("Unsupported entity: 'notes'");
    await expect(
      createSavedReportDefinition({
        entity: "contacts",
        name: `${testNamePrefix} bad status`,
        fields: ["lastName"],
        filters: {
          status: "converted"
        }
      })
    ).rejects.toThrow("Filter 'status' value 'converted' is not supported.");
    await expect(
      createSavedReportDefinition({
        entity: "opportunities",
        name: `${testNamePrefix} bad limit`,
        fields: ["name"],
        previewLimit: 101
      })
    ).rejects.toThrow("Preview limit cannot exceed 100.");

    await expect(savedReportPersistenceCounts()).resolves.toEqual(countsBefore);
  });
});

async function cleanupSavedReportDefinitions() {
  await prisma.auditEvent.deleteMany({
    where: {
      entityType: "report",
      summary: {
        contains: testNamePrefix
      }
    }
  });
  await prisma.savedReportDefinition.deleteMany({
    where: {
      name: {
        startsWith: testNamePrefix
      }
    }
  });
}

async function findSavedReportAudit(input: {
  definitionId: string;
  action: string;
  summary: string;
}) {
  return prisma.auditEvent.findFirstOrThrow({
    where: {
      entityType: "report",
      entityId: input.definitionId,
      action: input.action,
      summary: input.summary
    }
  });
}

function expectedSavedReportAuditMetadata(
  definition: PersistedSavedReportDefinition,
  mutation: ExpectedSavedReportAuditMutation,
  changedFields: readonly string[]
): string | null {
  return serializeAuditMetadata({
    source: "saved_report_persistence",
    persistenceModule: "lib/server/savedReportPersistence.ts",
    mutation,
    definitionId: definition.id,
    entity: definition.entity,
    name: definition.name,
    fields: [...definition.fields],
    filters: { ...definition.filters },
    groupBy: [...definition.groupBy],
    chart:
      definition.chart === null
        ? null
        : {
            type: definition.chart.type,
            dimensionKey: definition.chart.dimensionKey,
            metricKey: definition.chart.metricKey
          },
    previewLimit: definition.previewLimit,
    archivedAt: definition.archivedAt?.toISOString() ?? null,
    changedFields: [...changedFields]
  });
}

async function savedReportPersistenceCounts() {
  const [savedReportDefinitions, savedReportAuditEvents] = await Promise.all([
    prisma.savedReportDefinition.count(),
    prisma.auditEvent.count({
      where: {
        entityType: "report",
        summary: {
          contains: testNamePrefix
        }
      }
    })
  ]);

  return {
    savedReportDefinitions,
    savedReportAuditEvents
  };
}
