import { Skeleton } from "@/components/ui/skeleton";

export default function AccountsLoading() {
  return (
    <div className="crm-page">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-96" />
    </div>
  );
}
