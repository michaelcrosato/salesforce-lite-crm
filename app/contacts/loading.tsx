import { Skeleton } from "@/components/ui/skeleton";

export default function ContactsLoading() {
  return (
    <div className="crm-page">
      <Skeleton className="h-8 w-44" />
      <Skeleton className="h-80" />
      <Skeleton className="h-96" />
    </div>
  );
}
