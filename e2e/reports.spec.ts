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

  await expect(page.getByTestId("csv-export-operator")).toBeVisible();
  await expect(page.getByTestId("csv-export-summary-supported")).toContainText(
    "10"
  );

  await page.getByTestId("csv-export-entity-contacts").click();
  await expect(page).toHaveURL(/csvExport=contacts/);
  await expect(page.getByTestId("csv-export-selected-panel")).toContainText(
    "Contacts"
  );
  await expect(page.getByTestId("csv-export-preview-table")).toContainText(
    "Contact ID"
  );

  const downloadLink = page.getByTestId("csv-export-download-link");
  await expect(downloadLink).toHaveAttribute("download", "contacts.csv");
  const href = await downloadLink.getAttribute("href");

  expect(href).toContain("data:text/csv;charset=utf-8,");
  expect(decodeURIComponent(href ?? "")).toContain(
    "Contact ID,First Name,Last Name"
  );

  await expect(page.getByTestId("csv-import-preview-operator")).toBeVisible();
  await expect(page.getByTestId("csv-import-summary-supported")).toContainText(
    "2"
  );

  await page.getByTestId("csv-import-input").fill(
    [
      "First Name,Last Name,Email,Status,Phone",
      "Csv,Safe,csv.safe.e2e@example.test,active,604-555-0201",
      "Maya,Singh,MAYA.SINGH@NORTHSTARFREIGHT.EXAMPLE,active,303-555-0101",
      ",Broken,csv.broken.e2e@example.test,active,604-555-0203"
    ].join("\n")
  );
  await page.getByTestId("csv-import-submit").click();

  await expect(page.getByTestId("csv-import-result-panel")).toBeVisible();
  await expect(page.getByTestId("csv-import-summary-safe")).toContainText("1");
  await expect(page.getByTestId("csv-import-summary-watch")).toContainText("1");
  await expect(page.getByTestId("csv-import-summary-block")).toContainText("1");
  await expect(page.getByTestId("csv-import-row-results")).toContainText(
    "Maya Singh"
  );
  await expect(page.getByTestId("csv-import-row-results")).toContainText(
    "watch"
  );
  await expect(page.getByTestId("csv-import-row-results")).toContainText(
    "block"
  );
  await expect(page.getByTestId("csv-import-write-flags")).toContainText(
    "Database off"
  );
  await expect(page.getByTestId("csv-import-write-flags")).toContainText(
    "Import apply off"
  );
});
