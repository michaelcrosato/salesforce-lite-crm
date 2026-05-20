import type { Metadata } from "next";
import { ExcludedRoutePlaceholder } from "@/components/excluded-route-placeholder";

export const metadata: Metadata = {
  title: "Edit Order (Unavailable)"
};

export default function ExcludedOrderEditPage() {
  return (
    <div
      className="crm-page"
      data-testid="excluded-route-placeholder"
      data-route="/orders/[id]/edit"
    >
      <ExcludedRoutePlaceholder
        route="/orders/[id]/edit"
        reason="Dealer order edit flows are deferred. View-only detail lives at /orders/[id]."
      />
    </div>
  );
}
