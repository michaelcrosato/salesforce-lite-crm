import { expect, test } from "@playwright/test";

test.describe("hardened demo path", () => {
  test("intake -> routing -> analyst -> contact note -> forecast", async ({ page }, testInfo) => {
    // 1. Postal-code lead intake
    await page.goto("/leads");
    const leadSuffix = `${Date.now().toString(36)}-${testInfo.workerIndex}`;
    const leadName = `Demo Lead ${leadSuffix}`;
    await page.getByLabel("First name").fill("Demo");
    await page.getByLabel("Last name").fill(`Lead ${leadSuffix}`);
    await page.getByTestId("lead-form-postal-input").fill("V5K 0A1");
    await page.getByTestId("lead-form-submit").click();
    
    // 2. Routing decision verification
    // Find the routing detail for the lead we just created.
    const leadRow = page.getByRole("row").filter({ hasText: leadName });
    await expect(leadRow).toBeVisible();
    
    // The routing detail is in the next row, so we use a more global selector
    // or we can find it by the lead ID if we extract it.
    const leadLink = leadRow.locator('a[href^="/leads/"]').first();
    const href = await leadLink.getAttribute("href");
    const leadId = href?.split("/").pop();
    
    const routingDetail = page.getByTestId(`routing-detail-${leadId}`);
    await expect(routingDetail.getByTestId("routing-detail-success")).toBeVisible();
    
    await leadRow.getByTestId("routing-detail-link").click();
    await expect(leadRow.getByTestId("lead-status-badge")).toHaveText("Assigned");
    await expect(leadRow.getByTestId("lead-assignment-reason-badge")).toHaveText("Routed");

    // 3. Analyst panel surfaces behind-pace order, stale deals, and low-health accounts
    await page.goto("/dashboard");
    await expect(page.getByTestId("dashboard-analyst-panel")).toBeVisible();
    await expect(page.getByTestId("analyst-item-behind-pace-order").first()).toContainText("Vancouver");
    await expect(page.getByTestId("analyst-item-stale-high-value-deal").first()).toBeVisible();
    await expect(page.getByTestId("analyst-item-low-health-account").first()).toBeVisible();
    await expect(page.getByTestId("analyst-item-action").first()).toBeVisible();

    // 4. Contact note AI summary
    await page.goto("/contacts/contact-1"); // Maya Singh ID from seed
    await page.getByTestId("contact-note-input").fill("Interested in fleet package. Quote by Friday.");
    await page.getByTestId("contact-note-submit").click();
    await expect(page.getByTestId("activity-timeline-summary").first()).toContainText("Interested in fleet package");

    // 5. Forecast updates
    await page.goto("/forecast");
    await page.getByTestId("forecast-multiplier-input").fill("2");
    await page.getByTestId("forecast-apply-button").click();
    await expect(page.getByTestId("forecast-projection-value").first()).not.toHaveText("$0.00");
  });
});
