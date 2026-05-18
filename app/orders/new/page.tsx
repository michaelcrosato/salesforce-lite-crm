import { ExcludedRoutePlaceholder } from "@/components/excluded-route-placeholder";

export default function ExcludedOrdersNewPage() {
  return (
    <div
      className="crm-page"
      data-testid="excluded-route-placeholder"
      data-route="/orders/new"
    >
      <ExcludedRoutePlaceholder
        route="/orders/new"
        reason="Dealer order creation is deferred. Seeded dealer orders cover the demo flow."
      />
    </div>
  );
}
