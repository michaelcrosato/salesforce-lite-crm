import type { Metadata } from "next";
import { ExcludedRoutePlaceholder } from "@/components/excluded-route-placeholder";

export const metadata: Metadata = {
  title: "Deal Detail (Unavailable)"
};

export default function ExcludedDealDetailPage() {
  return (
    <div
      className="crm-page"
      data-testid="excluded-route-placeholder"
      data-route="/deals/[id]"
    >
      <ExcludedRoutePlaceholder
        route="/deals/[id]"
        reason="Deal detail uses the drawer at /deals?deal=<id>; there is no bracketed deal detail route in this contract."
      />
    </div>
  );
}
