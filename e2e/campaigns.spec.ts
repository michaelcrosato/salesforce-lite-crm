import { expect, test } from "@playwright/test";

test("create campaign, edit dates, and verify in list", async ({ page }) => {
  const campaignName = `E2E Campaign ${Date.now()}`;

  await page.goto("/campaigns/new");
  await expect(
    page.getByRole("heading", { name: "New Campaign" })
  ).toBeVisible();

  await page.getByLabel("Name").fill(campaignName);
  await page
    .getByLabel("Description")
    .fill("Outreach campaign created by e2e spec.");
  await page.getByLabel("Start date").fill("2026-06-01");
  await page.getByLabel("End date").fill("2026-06-30");
  await page.getByLabel("Budget (USD)").fill("12000");
  await page.getByRole("button", { name: "Create campaign" }).click();
  await expect(
    page.getByText("Campaign created.", { exact: true })
  ).toBeVisible();

  await page.goto("/campaigns");
  await expect(page.getByRole("heading", { name: "Campaigns" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: campaignName });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Planned");

  await row.getByRole("link", { name: campaignName }).click();
  await expect(page).toHaveURL(/[?&]campaign=/);
  await expect(
    page.getByRole("button", { name: "Close campaign detail" })
  ).toBeVisible();

  await page.getByRole("button", { name: "Edit" }).click();
  await page.getByLabel("End date").fill("2026-07-15");
  await page.getByRole("button", { name: "Save campaign" }).click();
  await expect(
    page.getByText("Campaign updated.", { exact: true })
  ).toBeVisible();

  await page.getByLabel(`Move ${campaignName} status`).selectOption("active");
  await expect(
    page.getByText("Campaign status updated.", { exact: true })
  ).toBeVisible();

  await page.goto("/campaigns");
  const refreshedRow = page.getByRole("row").filter({ hasText: campaignName });
  await expect(refreshedRow).toContainText("Active");
});
