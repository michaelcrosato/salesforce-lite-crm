import { ExcludedRoutePlaceholder } from "@/components/excluded-route-placeholder";

export default function ExcludedSearchPage() {
  return (
    <div
      className="crm-page"
      data-testid="excluded-route-placeholder"
      data-route="/search"
    >
      <ExcludedRoutePlaceholder
        route="/search"
        reason="Global search expansion is out of scope. Use the top search field for contacts."
      />
    </div>
  );
}
