import { expect, test } from "@playwright/test";
import { readFile } from "node:fs/promises";

test("contacts list exports the selected visible records", async ({ page }) => {
  await page.goto("/contacts");

  const panel = page.getByTestId("contacts-selected-export-panel");
  await expect(panel).toBeVisible();

  await page.getByTestId("contacts-selected-export-clear").click();
  await expect(page.getByTestId("contacts-selected-export-submit")).toBeDisabled();

  const rows = page.getByTestId("contacts-selected-export-row");
  await rows.nth(0).check();
  await rows.nth(1).check();

  const downloadPromise = page.waitForEvent("download");
  await page.getByTestId("contacts-selected-export-submit").click();
  const download = await downloadPromise;
  const path = await download.path();

  expect(download.suggestedFilename()).toBe("contacts.csv");
  expect(path).not.toBeNull();
  if (path === null) {
    throw new Error("Expected Playwright to expose the selected export download path.");
  }

  const csv = await readFile(path, "utf8");
  const lines = csv.trim().split("\n");

  expect(lines[0]).toBe(
    "Contact ID,First Name,Last Name,Email,Phone,Title,Status,Account ID,Account Name,Created At,Updated At"
  );
  expect(lines).toHaveLength(3);
  await expect(page.getByTestId("contacts-selected-export-status")).toContainText(
    "Contacts selected export: 2 exported, 0 blocked."
  );
});
