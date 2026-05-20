export default function ContactDetailLoading() {
  return (
    <div className="crm-page">
      <div className="space-y-2">
        <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-80 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-6">
          <div className="h-56 animate-pulse rounded-md bg-muted" />
          <div className="h-72 animate-pulse rounded-md bg-muted" />
          <div className="h-80 animate-pulse rounded-md bg-muted" />
        </div>
        <div className="space-y-6">
          <div className="h-64 animate-pulse rounded-md bg-muted" />
          <div className="h-72 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}
