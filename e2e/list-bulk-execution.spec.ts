import { expect, test } from "@playwright/test";

test("contacts list dry-runs and executes a selected status update", async ({
  page
}) => {
  await page.goto("/contacts");

  await expect(page.getByTestId("contacts-bulk-execution-panel")).toBeVisible();
  await page.getByTestId("contacts-selected-export-clear").click();
  await expect(page.getByTestId("contacts-bulk-execution-preview")).toBeDisabled();

  await page.getByTestId("contacts-selected-export-row").nth(0).check();
  await page
    .getByTestId("contacts-bulk-execution-action")
    .selectOption("status_update");
  await page
    .getByTestId("contacts-bulk-execution-target")
    .selectOption("inactive");

  await page.getByTestId("contacts-bulk-execution-preview").click();
  await expect(page.getByTestId("contacts-bulk-execution-dry-run")).toContainText(
    "1 eligible"
  );
  await expect(page.getByTestId("contacts-bulk-execution-submit")).toBeDisabled();

  await page.getByTestId("contacts-bulk-execution-confirm").check();
  await page.getByTestId("contacts-bulk-execution-submit").click();

  await expect(page.getByTestId("contacts-bulk-execution-result")).toContainText(
    "1 executed"
  );
  await expect(page.getByTestId("contacts-bulk-execution-records")).toContainText(
    "executed"
  );
  await expect(page.getByTestId("contacts-bulk-execution-audit")).toContainText(
    "Audit events:"
  );
});
