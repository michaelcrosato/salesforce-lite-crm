import { expect, test } from "@playwright/test";

test("daily CRM loop smoke test", async ({ page }, testInfo) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await expect(page.getByText("Dealer Ops", { exact: true })).toBeVisible();
  await expect(page.getByText("Leads This Month")).toBeVisible();
  await expect(page.getByText("Analyst Panel")).toBeVisible();

  await page.getByRole("link", { name: "Contacts" }).first().click();
  await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();

  await page.getByRole("link", { name: "Maya Singh" }).click();
  await expect(page.getByRole("heading", { name: "Maya Singh", exact: true })).toBeVisible();

  const noteText =
    "Smoke summary first sentence. Smoke summary second sentence. Hidden raw third sentence asks to follow up next week with pricing.";
  const expectedSummary = "Smoke summary first sentence. Smoke summary second sentence.";
  await page.getByLabel("Raw note").fill(noteText);
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText(expectedSummary)).toBeVisible();

  await page.getByRole("link", { name: "Deals" }).first().click();
  await expect(page.getByRole("heading", { name: "Deals" })).toBeVisible();

  const sourceCard = page.locator('[data-stage="new"] [data-deal-id]').first();
  const targetColumn = page.locator('[data-stage="qualified"]');
  const dealId = await sourceCard.getAttribute("data-deal-id");
  expect(dealId).not.toBeNull();

  const dataTransfer = await page.evaluateHandle(() => new DataTransfer());
  await sourceCard.dispatchEvent("dragstart", { dataTransfer });
  await targetColumn.dispatchEvent("dragover", { dataTransfer });
  await targetColumn.dispatchEvent("drop", { dataTransfer });
  await sourceCard.dispatchEvent("dragend", { dataTransfer });
  await expect(targetColumn.locator(`[data-deal-id="${dealId}"]`)).toBeVisible();
  await expect(page.getByText("Deal moved").first()).toBeVisible();

  await page.getByRole("link", { name: "Leads" }).first().click();
  await expect(page.getByRole("heading", { name: "Lead Inbox" })).toBeVisible();
  const leadSuffix = `${Date.now().toString(36)}-${testInfo.workerIndex}`;
  const leadLastName = `Route ${leadSuffix}`;
  const leadName = `E2E ${leadLastName}`;
  await page.getByLabel("First name").fill("E2E");
  await page.getByLabel("Last name").fill(leadLastName);
  await page.getByLabel("Phone").fill("604-555-9191");
  await page.getByLabel("Email").fill(`e2e.route.${leadSuffix}@dealerlead.example`);
  await page.getByLabel("Postal code").fill("V5K 0A1");
  await page.getByLabel("Province").fill("BC");
  await page.getByLabel("Source").fill("e2e");
  await page.getByRole("button", { name: "Create lead" }).click();

  const leadRow = page.getByRole("row").filter({ hasText: leadName });
  await expect(leadRow).toContainText("Routed");
  const assignedOrderHref = await leadRow.locator('a[href^="/orders/"]').getAttribute("href");
  expect(assignedOrderHref).toBe("/orders/dealer-order-vancouver-northstar");

  await page.getByRole("link", { name: "Orders" }).first().click();
  await expect(page.getByRole("heading", { name: "Dealer Orders" })).toBeVisible();
  const orderRow = page.getByRole("row").filter({
    has: page.locator(`a[href="${assignedOrderHref}"]`)
  });
  await expect(orderRow).toContainText("6");

  await page.goto(assignedOrderHref ?? "/orders");
  await expect(
    page.getByRole("heading", { name: "Vancouver fleet lead package", exact: true })
  ).toBeVisible();
  await expect(page.getByRole("link", { name: leadName, exact: true })).toBeVisible();

  await page.goto("/forecast");
  await expect(page.getByRole("heading", { name: "Forecast Simulator" })).toBeVisible();
  const firstProjection = page.locator("[data-forecast-projected]").first();
  const beforeProjection = await firstProjection.textContent();
  await page.getByLabel("Lead volume multiplier").fill("2");
  await page.getByRole("button", { name: "Apply" }).click();
  await expect(page).toHaveURL(/multiplier=2/);
  await expect(firstProjection).not.toHaveText(beforeProjection ?? "");
});
