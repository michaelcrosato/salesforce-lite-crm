import { Skeleton } from "@/components/ui/skeleton";

export default function CampaignsLoading() {
  return (
    <div className="crm-page">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-32" />
      <Skeleton className="h-96" />
    </div>
  );
}
