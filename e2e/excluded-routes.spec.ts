import { expect, test } from "@playwright/test";
import { EXCLUDED_ROUTES } from "@/lib/featureFlags";

test.describe("excluded-route guard rails", () => {
  const excludedRoutes = EXCLUDED_ROUTES.map((path) =>
    path.replaceAll("[id]", "any-id")
  );

  for (const route of excludedRoutes) {
    test(`route ${route} is excluded (returns 404 or placeholder)`, async ({ page }) => {
      const response = await page.goto(route);
      
      // If the page loads, it should show a placeholder.
      // If it doesn't load, it should be a 404.
      if (response?.status() === 200) {
        const placeholder = page.locator('[data-testid="excluded-route-placeholder"]');
        const heading = page.getByRole("heading", { name: /not available|coming soon|placeholder/i });
        
        await expect(
          placeholder.or(heading)
        ).toBeVisible();
      } else {
        expect(response?.status()).toBe(404);
      }
    });
  }

  test("command palette opens from the global shortcut", async ({ page }) => {
    await page.goto("/dashboard");
    await page.locator("body").click();
    await page.keyboard.down("Control");
    await page.keyboard.press("KeyK");
    await page.keyboard.up("Control");

    const searchInput = page.getByLabel("Search CRM");
    await expect(searchInput).toBeVisible();
    await searchInput.fill("Northstar");
    await expect(
      page.getByTestId("command-palette").getByRole("link", { name: /Northstar Freight/ })
    ).toBeVisible();
  });
});
