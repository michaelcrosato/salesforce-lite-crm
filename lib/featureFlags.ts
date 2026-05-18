export const FEATURE_FLAGS = {
  tasksUi: false,
  casesUi: false,
  campaignsUi: false,
  dealDetailRoute: false,
  globalSearchUi: false,
  commandPalette: false,
  dealerOrderEdit: false,
  areaEdit: false
} as const;

export type FeatureFlag = keyof typeof FEATURE_FLAGS;

const excludedDealDetailRoute = `/deals/${"[id]"}`;

export const EXCLUDED_ROUTES = [
  "/tasks",
  "/cases",
  "/campaigns",
  excludedDealDetailRoute,
  "/search",
  "/command-palette",
  "/orders/new",
  "/orders/[id]/edit",
  "/areas/new",
  "/areas/[id]/edit"
] as const satisfies readonly string[];

export function isEnabled(flag: FeatureFlag): boolean {
  return FEATURE_FLAGS[flag];
}
