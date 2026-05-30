import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="crm-page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-72 max-w-full" />
      </div>
      <div className="rounded-lg border bg-card p-6 shadow-soft">
        <div className="space-y-4">
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-2/3" />
          <Skeleton className="h-10 w-32" />
        </div>
      </div>
    </div>
  );
}
