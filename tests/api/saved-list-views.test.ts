import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/prisma";
import {
  buildSavedListViewQuery,
  createSavedListView,
  deleteSavedListView,
  getSavedListView,
  listSavedListViews,
  updateSavedListView
} from "@/lib/services/savedListViews";

const testNamePrefix = "Test saved view";

describe("saved list view service", () => {
  beforeEach(async () => {
    await cleanupSavedListViews();
  });

  afterEach(async () => {
    await cleanupSavedListViews();
  });

  it("creates and lists deterministic saved views for supported list entities", async () => {
    const created = await createSavedListView({
      entity: "contacts",
      name: `${testNamePrefix} contacts`,
      description: "Active contacts with search and custom sorting.",
      filters: {
        status: "active",
        search: "Harbour"
      },
      sortBy: "lastName",
      sortOrder: "desc",
      pageSize: 50
    });
    const persisted = await prisma.savedListView.findUniqueOrThrow({
      where: {
        entity_name: {
          entity: "contacts",
          name: `${testNamePrefix} contacts`
        }
      }
    });
    const listed = await listSavedListViews({ entity: "contacts" });

    expect(created).toMatchObject({
      entity: "contacts",
      name: `${testNamePrefix} contacts`,
      description: "Active contacts with search and custom sorting.",
      filters: {
        search: "Harbour",
        status: "active"
      },
      sortBy: "lastName",
      sortOrder: "desc",
      pageSize: 50
    });
    expect(persisted.filters).toBe('{"search":"Harbour","status":"active"}');
    expect(listed.map((view) => view.id)).toContain(created.id);
  });

  it("preserves the current list query when no saved view is selected", async () => {
    const currentQuery = {
      page: 2,
      pageSize: 20,
      sortBy: "createdAt",
      sortOrder: "desc" as const,
      filters: {
        status: "inactive",
        passthrough: "left for the list adapter"
      }
    };

    await expect(
      buildSavedListViewQuery({
        entity: "contacts",
        query: currentQuery
      })
    ).resolves.toEqual({
      entity: "contacts",
      selectedView: null,
      source: "current-query",
      query: currentQuery
    });
  });

  it("applies saved filters and sort metadata without persisting page state", async () => {
    const savedView = await createSavedListView({
      entity: "tasks",
      name: `${testNamePrefix} urgent tasks`,
      filters: {
        status: "open",
        dueDateFrom: "2099-01-01"
      },
      sortBy: "priority",
      sortOrder: "desc",
      pageSize: 25
    });

    const resolved = await buildSavedListViewQuery({
      entity: "tasks",
      savedViewId: savedView.id,
      query: {
        page: 3,
        pageSize: 10,
        filters: {
          status: "done"
        }
      }
    });

    expect(resolved.source).toBe("saved-view");
    expect(resolved.selectedView?.id).toBe(savedView.id);
    expect(resolved.query).toEqual({
      page: 3,
      pageSize: 25,
      sortBy: "priority",
      sortOrder: "desc",
      filters: {
        dueDateFrom: "2099-01-01T00:00:00.000Z",
        status: "open"
      }
    });
  });

  it("updates, fetches, and deletes saved views by id", async () => {
    const savedView = await createSavedListView({
      entity: "accounts",
      name: `${testNamePrefix} account health`,
      filters: {
        status: "active"
      },
      sortBy: "healthScore",
      sortOrder: "asc"
    });
    const updated = await updateSavedListView(savedView.id, {
      name: `${testNamePrefix} account health high first`,
      sortOrder: "desc",
      filters: {
        status: "paused"
      }
    });
    const fetched = await getSavedListView(savedView.id);
    const deleted = await deleteSavedListView(savedView.id);

    expect(updated).toMatchObject({
      id: savedView.id,
      name: `${testNamePrefix} account health high first`,
      filters: {
        status: "paused"
      },
      sortBy: "healthScore",
      sortOrder: "desc"
    });
    expect(fetched?.name).toBe(`${testNamePrefix} account health high first`);
    expect(deleted.id).toBe(savedView.id);
    await expect(getSavedListView(savedView.id)).resolves.toBeNull();
  });

  it("rejects unsupported entities, filters, enum values, and sort keys without writes", async () => {
    const countBefore = await prisma.savedListView.count();

    await expect(
      createSavedListView({
        entity: "notes",
        name: `${testNamePrefix} notes`
      })
    ).rejects.toThrow("Unsupported entity: 'notes'");
    await expect(
      createSavedListView({
        entity: "contacts",
        name: `${testNamePrefix} bad filter`,
        filters: {
          stage: "won"
        }
      })
    ).rejects.toThrow("Filter 'stage' is not supported");
    await expect(
      createSavedListView({
        entity: "contacts",
        name: `${testNamePrefix} bad status`,
        filters: {
          status: "converted"
        }
      })
    ).rejects.toThrow("Filter 'status' value 'converted' is not supported.");
    await expect(
      createSavedListView({
        entity: "contacts",
        name: `${testNamePrefix} bad sort`,
        sortBy: "stage"
      })
    ).rejects.toThrow("Sort key 'stage' is not supported");

    await expect(prisma.savedListView.count()).resolves.toBe(countBefore);
  });

  it("creates and resolves saved views for leads, including the source filter", async () => {
    const leadView = await createSavedListView({
      entity: "leads",
      name: `${testNamePrefix} incoming web leads`,
      filters: {
        status: "assigned",
        source: "Website"
      },
      sortBy: "lastName",
      sortOrder: "asc",
      pageSize: 15
    });

    const resolved = await buildSavedListViewQuery({
      entity: "leads",
      savedViewId: leadView.id,
      query: {
        page: 1,
        pageSize: 10
      }
    });

    expect(resolved.source).toBe("saved-view");
    expect(resolved.selectedView?.id).toBe(leadView.id);
    expect(resolved.query).toEqual({
      page: 1,
      pageSize: 15,
      sortBy: "lastName",
      sortOrder: "asc",
      filters: {
        status: "assigned",
        source: "Website"
      }
    });
  });

  it("creates and resolves saved views for opportunities (deals) with custom sorting", async () => {
    const dealView = await createSavedListView({
      entity: "opportunities",
      name: `${testNamePrefix} high value pipeline`,
      filters: {
        stage: "qualified"
      },
      sortBy: "value",
      sortOrder: "desc",
      pageSize: 30
    });

    const resolved = await buildSavedListViewQuery({
      entity: "opportunities",
      savedViewId: dealView.id,
      query: {
        page: 2
      }
    });

    expect(resolved.source).toBe("saved-view");
    expect(resolved.selectedView?.id).toBe(dealView.id);
    expect(resolved.query).toEqual({
      page: 2,
      pageSize: 30,
      sortBy: "value",
      sortOrder: "desc",
      filters: {
        stage: "qualified"
      }
    });
  });
});

async function cleanupSavedListViews() {
  await prisma.savedListView.deleteMany({
    where: {
      name: {
        startsWith: testNamePrefix
      }
    }
  });
}
