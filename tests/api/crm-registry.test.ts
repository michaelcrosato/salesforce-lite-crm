import { describe, expect, it } from "vitest";
import { ENTITY_REGISTRY, ROUTE_REGISTRY } from "@/lib/crm/registry";
import { EXCLUDED_ROUTES, FEATURE_FLAGS } from "@/lib/featureFlags";

describe("CRM registry route contracts", () => {
  it("publishes knowledge article list and drawer route metadata", () => {
    const knowledgeEntity = ENTITY_REGISTRY.find(
      (entity) => entity.name === "KnowledgeArticle"
    );

    expect(knowledgeEntity).toEqual({
      name: "KnowledgeArticle",
      route: "/knowledge",
      iconName: "BookOpenText",
      listLabel: "Knowledge Articles",
      singularLabel: "Knowledge Article"
    });
    expect(ROUTE_REGISTRY.knowledgeArticles).toBe("/knowledge");
    expect(ROUTE_REGISTRY.knowledgeArticleDetail("article/id 1")).toBe(
      "/knowledge?article=article%2Fid%201"
    );
  });

  it("keeps standalone knowledge article detail routes excluded", () => {
    expect(FEATURE_FLAGS.knowledgeArticleDetailRoute).toBe(false);
    expect(EXCLUDED_ROUTES).not.toContain("/knowledge");
    expect(EXCLUDED_ROUTES).toContain("/knowledge/[id]");
  });
});
