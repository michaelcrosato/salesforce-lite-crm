import { expect, test } from "@playwright/test";

test.describe("hardened demo path", () => {
  test.skip("intake -> routing -> analyst -> contact note -> forecast", async ({ page }) => {
    // 1. Postal-code lead intake
    await page.goto("/leads");
    await page.getByTestId("lead-form-postal-input").fill("V5K 0A1");
    await page.getByTestId("lead-form-submit").click();
    
    // 2. Routing decision verification
    await expect(page.getByTestId("routing-detail-success")).toBeVisible();
    await page.getByTestId("routing-detail-link").click();
    await expect(page.getByTestId("lead-status-badge")).toHaveText("Routed");

    // 3. Analyst panel surfaces behind-pace order
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-analyst-panel")).toBeVisible();
    await expect(page.getByTestId("analyst-item-behind-pace-order")).toContainText("Vancouver");

    // 4. Contact note AI summary
    await page.goto("/contacts/maya-singh-id"); // Assume ID or use data-testid link
    await page.getByTestId("contact-note-input").fill("Interested in fleet package. Quote by Friday.");
    await page.getByTestId("contact-note-submit").click();
    await expect(page.getByTestId("activity-timeline-summary").first()).toContainText("Interested in fleet package");

    // 5. Forecast updates
    await page.goto("/forecast");
    await page.getByTestId("forecast-multiplier-input").fill("2");
    await page.getByTestId("forecast-apply-button").click();
    await expect(page.getByTestId("forecast-projection-value")).not.toHaveText("$0.00");
  });
});
