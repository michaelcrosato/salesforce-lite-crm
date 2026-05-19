export default function AccountDetailLoading() {
  return (
    <div className="crm-page">
      <div className="space-y-2">
        <div className="h-8 w-72 animate-pulse rounded-md bg-muted" />
        <div className="h-4 w-96 max-w-full animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-6 xl:grid-cols-2">
        <div className="h-80 animate-pulse rounded-md bg-muted" />
        <div className="h-80 animate-pulse rounded-md bg-muted" />
      </div>
      <div className="h-72 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
