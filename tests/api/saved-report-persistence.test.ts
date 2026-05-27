import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  archiveSavedReportDefinition,
  createSavedReportDefinition,
  deleteSavedReportDefinition,
  getSavedReportDefinition,
  listSavedReportDefinitions,
  updateSavedReportDefinition
} from "@/lib/server/savedReportPersistence";

const testNamePrefix = "Test saved report";

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
  });

  it("rejects unsupported metadata without database writes", async () => {
    const countBefore = await prisma.savedReportDefinition.count();

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

    await expect(prisma.savedReportDefinition.count()).resolves.toBe(
      countBefore
    );
  });
});

async function cleanupSavedReportDefinitions() {
  await prisma.savedReportDefinition.deleteMany({
    where: {
      name: {
        startsWith: testNamePrefix
      }
    }
  });
}
