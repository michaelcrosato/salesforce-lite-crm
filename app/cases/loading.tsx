import { Skeleton } from "@/components/ui/skeleton";

export default function CasesLoading() {
  return (
    <div className="crm-page">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-32" />
      <div className="grid gap-4 lg:grid-cols-[1fr_18rem]">
        <Skeleton className="h-96" />
        <div className="space-y-4" data-testid="case-knowledge-loading">
          <Skeleton className="h-32" />
          <Skeleton className="h-40" />
        </div>
      </div>
    </div>
  );
}
