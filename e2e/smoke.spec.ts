import { expect, test } from "@playwright/test";

test("daily CRM loop smoke test", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();

  await page.getByRole("link", { name: "Contacts" }).first().click();
  await expect(page.getByRole("heading", { name: "Contacts" })).toBeVisible();

  await page.getByRole("link", { name: "Maya Singh" }).click();
  await expect(page.getByRole("heading", { name: "Maya Singh" })).toBeVisible();

  const noteText =
    "Follow up next week with pricing and decision maker details for smoke test.";
  await page.getByLabel("Raw note").fill(noteText);
  await page.getByRole("button", { name: "Save note" }).click();
  await expect(page.getByText(noteText)).toBeVisible();

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
});
