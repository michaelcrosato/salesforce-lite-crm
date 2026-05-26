import { Skeleton } from "@/components/ui/skeleton";

export default function KnowledgeLoading() {
  return (
    <div className="crm-page">
      <Skeleton className="h-8 w-56" />
      <Skeleton className="h-28" />
      <Skeleton className="h-32" />
      <Skeleton className="h-96" />
    </div>
  );
}
