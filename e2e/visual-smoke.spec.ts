import { expect, test } from "@playwright/test";

const visualRoutes = [
  {
    name: "dashboard-desktop",
    path: "/dashboard",
    heading: "Dashboard",
    viewport: { width: 1440, height: 900 }
  },
  {
    name: "areas-desktop",
    path: "/areas",
    heading: "Areas",
    viewport: { width: 1440, height: 900 }
  },
  {
    name: "areas-mobile",
    path: "/areas",
    heading: "Areas",
    viewport: { width: 390, height: 844 }
  }
];

test.describe("visual smoke", () => {
  for (const route of visualRoutes) {
    test(`${route.name} renders a stable viewport`, async ({ page }) => {
      await page.setViewportSize(route.viewport);
      await page.goto(route.path);
      await expect(
        page.getByRole("heading", { exact: true, name: route.heading })
      ).toBeVisible();

      await expect(page).toHaveScreenshot(`${route.name}.png`, {
        animations: "disabled",
        fullPage: false,
        maxDiffPixelRatio: 0.05
      });
    });
  }
});
