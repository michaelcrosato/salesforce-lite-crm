export default function ForecastLoading() {
  return (
    <div className="crm-page">
      <div className="h-8 w-64 animate-pulse rounded-md bg-muted" />
      <div className="h-48 animate-pulse rounded-md bg-muted" />
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-28 animate-pulse rounded-md bg-muted" />
        ))}
      </div>
      <div className="h-96 animate-pulse rounded-md bg-muted" />
    </div>
  );
}
