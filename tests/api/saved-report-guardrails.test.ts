import { describe, expect, it } from "vitest";
import { EXCLUDED_ROUTES, FEATURE_FLAGS } from "@/lib/featureFlags";
import { getSavedReportDefinitionCatalog } from "@/lib/server/savedReportDefinitions";
import { runSavedReportPreview } from "@/lib/server/savedReportPreviewRunner";

const noWriteFlags = {
  database: false,
  mutations: false,
  schemas: false,
  routes: false,
  files: false,
  externalServices: false,
  backgroundJobs: false,
  rawSql: false
};

describe("saved report guardrails", () => {
  it("keeps saved reports outside dashboard builder, search, and provider drift", async () => {
    const catalog = getSavedReportDefinitionCatalog();
    const preview = await runSavedReportPreview({
      entity: "accounts",
      fields: ["name"],
      limit: 1
    });
    const sourceValues = [
      catalog.source.definitionModule,
      catalog.source.listFilterCatalogModule,
      catalog.source.listQueryModule,
      catalog.source.reportServicesModule,
      catalog.source.catalogScope,
      ...catalog.entities.flatMap((entity) => [
        entity.entity,
        entity.route,
        entity.sourceSurface,
        entity.sourceModule
      ]),
      preview.source.runnerModule,
      preview.source.definitionModule,
      preview.source.listAdapterModule,
      preview.source.listQueryModule,
      preview.source.executionScope
    ];

    expect(catalog.write).toEqual(noWriteFlags);
    for (const entity of catalog.entities) {
      expect(entity.write).toEqual(noWriteFlags);
    }
    expect(preview.write).toEqual(noWriteFlags);
    expect(sourceValues.some((value) => value.includes("dashboard"))).toBe(false);
    expect(sourceValues.some((value) => value.includes("/search"))).toBe(false);
    expect(sourceValues.some((value) => value.includes("provider"))).toBe(false);
  });

  it("keeps excluded route and search feature flags unchanged", () => {
    expect(EXCLUDED_ROUTES).toEqual(
      expect.arrayContaining(["/deals/[id]", "/search", "/command-palette"])
    );
    expect(FEATURE_FLAGS.dealDetailRoute).toBe(false);
    expect(FEATURE_FLAGS.globalSearchUi).toBe(false);
    expect(FEATURE_FLAGS.commandPalette).toBe(false);
  });
});
