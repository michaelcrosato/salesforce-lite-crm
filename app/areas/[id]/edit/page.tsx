import type { Metadata } from "next";
import { ExcludedRoutePlaceholder } from "@/components/excluded-route-placeholder";

export const metadata: Metadata = {
  title: "Edit Area (Unavailable)"
};

export default function ExcludedAreaEditPage() {
  return (
    <div
      className="crm-page"
      data-testid="excluded-route-placeholder"
      data-route="/areas/[id]/edit"
    >
      <ExcludedRoutePlaceholder
        route="/areas/[id]/edit"
        reason="Area edit flows are deferred. View-only coverage lives at /areas."
      />
    </div>
  );
}
