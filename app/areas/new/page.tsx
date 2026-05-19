import type { Metadata } from "next";
import { ExcludedRoutePlaceholder } from "@/components/excluded-route-placeholder";

export const metadata: Metadata = {
  title: "New Area (Unavailable)"
};

export default function ExcludedAreasNewPage() {
  return (
    <div
      className="crm-page"
      data-testid="excluded-route-placeholder"
      data-route="/areas/new"
    >
      <ExcludedRoutePlaceholder
        route="/areas/new"
        reason="Area creation is deferred. Seeded areas cover the routing demo path."
      />
    </div>
  );
}
