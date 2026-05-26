"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  KnowledgeArticleDetailDrawer,
  type DrawerKnowledgeArticle
} from "@/components/knowledge/knowledge-article-detail-drawer";
import { type KnowledgeArticleOwnerOption } from "@/components/knowledge/knowledge-lifecycle-panel";
import {
  KnowledgeArticlesTable,
  type KnowledgeArticleRow
} from "@/components/knowledge/knowledge-articles-table";
import { EmptyState } from "@/components/ui/empty-state";

export function KnowledgeArticlesView({
  articles,
  drawerArticle,
  owners
}: {
  articles: KnowledgeArticleRow[];
  drawerArticle: DrawerKnowledgeArticle | null;
  owners: KnowledgeArticleOwnerOption[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const closeDrawer = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("article");
    const query = next.toString();
    router.replace(query.length > 0 ? `/knowledge?${query}` : "/knowledge");
  }, [router, searchParams]);

  if (articles.length === 0) {
    return (
      <>
        <EmptyState
          title="No knowledge articles found"
          description="Adjust filters to review local case-assist knowledge articles."
          data-testid="knowledge-view-empty"
        />
        <KnowledgeArticleDetailDrawer
          article={drawerArticle}
          owners={owners}
          onClose={closeDrawer}
        />
      </>
    );
  }

  return (
    <>
      <KnowledgeArticlesTable articles={articles} />
      <KnowledgeArticleDetailDrawer
        article={drawerArticle}
        owners={owners}
        onClose={closeDrawer}
      />
    </>
  );
}
