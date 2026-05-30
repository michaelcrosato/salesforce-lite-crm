import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="crm-page">
      <div className="space-y-2">
        <Skeleton className="h-7 w-64" />
        <Skeleton className="h-4 w-96 max-w-full" />
      </div>
      <Skeleton className="h-64" />
    </div>
  );
}
