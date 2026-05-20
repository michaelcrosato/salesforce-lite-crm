import { ExcludedRoutePlaceholder } from "@/components/excluded-route-placeholder";

export default function ExcludedCommandPalettePage() {
  return (
    <div
      className="crm-page"
      data-testid="excluded-route-placeholder"
      data-route="/command-palette"
    >
      <ExcludedRoutePlaceholder
        route="/command-palette"
        reason="The command palette is excluded by the current contract and has no live UI surface."
      />
    </div>
  );
}
