"use server";

import { globalSearch, type GlobalSearchResults } from "@/lib/services/search";

export type CrmSearchResults = GlobalSearchResults;

export async function searchCrmAction(
  query: string
): Promise<CrmSearchResults> {
  return globalSearch(query);
}
