import { expect, test } from "@playwright/test";

test.describe("excluded-route guard rails", () => {
  const excludedRoutes = [
    { path: "/tasks", name: "Tasks" },
    { path: "/cases", name: "Cases" },
    { path: "/campaigns", name: "Campaigns" },
    { path: "/deals/any-id", name: "Deal Detail Page" },
  ];

  for (const route of excludedRoutes) {
    test(`route ${route.path} is excluded (returns 404 or placeholder)`, async ({ page }) => {
      const response = await page.goto(route.path);
      
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

  test("command palette / global search is not implemented", async ({ page }) => {
    await page.goto("/dashboard");
    // Pressing Cmd+K or Ctrl+K should not open a search modal
    await page.keyboard.press("Control+k");
    await expect(page.getByRole("dialog")).not.toBeVisible();
    
    await page.keyboard.press("Meta+k");
    await expect(page.getByRole("dialog")).not.toBeVisible();
  });
});
