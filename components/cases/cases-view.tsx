"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import {
  CaseDetailDrawer,
  type DrawerCase
} from "@/components/cases/case-detail-drawer";
import { CasesTable, type CaseRow } from "@/components/cases/cases-table";
import { type CaseOptionItem } from "@/components/cases/case-form";
import { EmptyState } from "@/components/ui/empty-state";

export function CasesView({
  cases,
  drawerCase,
  owners,
  accounts,
  contacts
}: {
  cases: CaseRow[];
  drawerCase: DrawerCase | null;
  owners: CaseOptionItem[];
  accounts: CaseOptionItem[];
  contacts: CaseOptionItem[];
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const closeDrawer = useCallback(() => {
    const next = new URLSearchParams(searchParams.toString());
    next.delete("case");
    const query = next.toString();
    router.replace(query.length > 0 ? `/cases?${query}` : "/cases");
  }, [router, searchParams]);

  if (cases.length === 0) {
    return (
      <>
        <EmptyState
          title="No cases found"
          description="Adjust filters or create a case to capture customer issues."
          actionHref="/cases/new"
          actionLabel="Create case"
        />
        <CaseDetailDrawer
          crmCase={drawerCase}
          owners={owners}
          accounts={accounts}
          contacts={contacts}
          onClose={closeDrawer}
        />
      </>
    );
  }

  return (
    <>
      <CasesTable cases={cases} />
      <CaseDetailDrawer
        crmCase={drawerCase}
        owners={owners}
        accounts={accounts}
        contacts={contacts}
        onClose={closeDrawer}
      />
    </>
  );
}
