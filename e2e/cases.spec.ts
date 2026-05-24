import { expect, test } from "@playwright/test";

test("create case, edit status, and verify in list", async ({ page }) => {
  const caseSubject = `E2E Case ${Date.now()}`;

  await page.goto("/cases/new");
  await expect(page.getByRole("heading", { name: "New Case" })).toBeVisible();

  await page.getByLabel("Subject").fill(caseSubject);
  await page
    .getByLabel("Description")
    .fill("Billing invoice reported from the cases e2e spec.");
  await page.getByLabel("Priority").selectOption("high");
  await page.getByRole("button", { name: "Create case" }).click();
  await expect(page.getByText("Case created.", { exact: true })).toBeVisible();

  await page.goto("/cases");
  await expect(page.getByRole("heading", { name: "Cases" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: caseSubject });
  await expect(row).toBeVisible();
  await expect(row).toContainText("New");
  await expect(row.getByTestId("case-row-queue")).toContainText(
    "Billing Support"
  );
  await expect(row.getByTestId("case-row-sla")).toContainText("On track");

  await row.getByRole("link", { name: caseSubject }).click();
  await expect(page).toHaveURL(/[?&]case=/);
  await expect(
    page.getByRole("button", { name: "Close case detail" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: caseSubject, level: 2 })
  ).toBeVisible();
  await expect(page.getByTestId("case-drawer-queue-context")).toContainText(
    "Billing Support"
  );
  await expect(page.getByTestId("case-drawer-sla-context")).toContainText(
    "High priority response"
  );

  await page
    .getByLabel(`Move ${caseSubject} status`)
    .selectOption("in_progress");
  await expect(
    page.getByText("Case status updated.", { exact: true })
  ).toBeVisible();
  await page
    .getByTestId("case-queue-update-select")
    .selectOption("data_quality");
  await expect(
    page.getByText("Case queue updated.", { exact: true })
  ).toBeVisible();

  await page.goto("/cases");
  const refreshedRow = page.getByRole("row").filter({ hasText: caseSubject });
  await expect(refreshedRow).toContainText("In progress");
  await expect(refreshedRow.getByTestId("case-row-queue")).toContainText(
    "Data Quality"
  );
});
