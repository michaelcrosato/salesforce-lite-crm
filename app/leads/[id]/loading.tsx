export default function LeadDetailLoading() {
  return (
    <div className="crm-page">
      <div className="h-8 w-56 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-5 xl:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <div className="h-64 animate-pulse rounded-md bg-muted" />
          <div className="h-96 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="h-80 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}
