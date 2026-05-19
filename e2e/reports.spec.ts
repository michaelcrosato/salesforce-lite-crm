import { expect, test } from "@playwright/test";

test("reports index lists reports and a report renders", async ({ page }) => {
  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();

  const pipelineLink = page.getByRole("link", { name: /Pipeline by Stage/ });
  await expect(pipelineLink).toBeVisible();
  await pipelineLink.click();

  await expect(
    page.getByRole("heading", { name: "Pipeline by Stage" }).first()
  ).toBeVisible();
  await expect(page.getByRole("columnheader", { name: "Stage" })).toBeVisible();
  await expect(
    page.getByRole("columnheader", { name: "Weighted value" })
  ).toBeVisible();

  await page.getByRole("link", { name: "All reports" }).click();
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
});
