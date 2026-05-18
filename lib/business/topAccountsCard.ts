import type { TopAccountByDealValueRow } from "@/lib/services/reports";

export interface TopAccountCardRow {
  accountId: string;
  accountName: string;
  totalValue: number;
  openDealCount: number;
  formattedValue: string;
}

export interface TopAccountsCardData {
  rows: TopAccountCardRow[];
  hasMore: boolean;
  totalShown: number;
}

const CURRENCY_FORMATTER = new Intl.NumberFormat("en-CA", {
  style: "currency",
  currency: "CAD",
  maximumFractionDigits: 0
});

export function topAccountsCard(
  rows: TopAccountByDealValueRow[],
  limit = 8
): TopAccountsCardData {
  const sorted = [...rows].sort((a, b) => b.totalValue - a.totalValue);
  const top = sorted.slice(0, limit);

  const data: TopAccountCardRow[] = top.map((r) => ({
    accountId: r.accountId,
    accountName: r.accountName,
    totalValue: r.totalValue,
    openDealCount: r.openDealCount,
    formattedValue: CURRENCY_FORMATTER.format(r.totalValue)
  }));

  return {
    rows: data,
    hasMore: sorted.length > limit,
    totalShown: data.length
  };
}
