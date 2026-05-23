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

  await expect(page.getByTestId("audit-coverage-operator")).toBeVisible();
  await expect(page.getByTestId("audit-coverage-summary-entities")).toContainText(
    "3"
  );
  await expect(page.getByTestId("audit-coverage-summary-surfaces")).toContainText(
    "12"
  );
  await expect(page.getByTestId("audit-coverage-summary-gaps")).toContainText(
    "3"
  );
  await expect(page.getByTestId("audit-coverage-category-table")).toContainText(
    "record"
  );
  await expect(page.getByTestId("audit-coverage-source-table")).toContainText(
    "lib/services/tasks.ts#completeTask"
  );
  await expect(page.getByTestId("audit-coverage-known-gaps")).toContainText(
    "deleteCase"
  );
  await expect(page.getByTestId("audit-coverage-known-gaps")).toContainText(
    "Promote audited delete semantics"
  );
  await expect(page.getByTestId("audit-coverage-write-flags")).toContainText(
    "Request logs off"
  );
  await expect(page.getByTestId("audit-coverage-write-flags")).toContainText(
    "External telemetry off"
  );

  await expect(page.getByTestId("list-filter-support-explorer")).toBeVisible();
  await expect(
    page.getByTestId("list-filter-support-summary-entities")
  ).toContainText("10");
  await expect(
    page.getByTestId("list-filter-support-summary-filters")
  ).toContainText("37");
  await expect(
    page.getByTestId("list-filter-support-summary-sorts")
  ).toContainText("42");
  await expect(
    page.getByTestId("list-filter-support-summary-date-ranges")
  ).toContainText("4");
  await expect(
    page.getByTestId("list-filter-support-entity-accounts")
  ).toContainText("listAccounts");
  await expect(
    page.getByTestId("list-filter-support-entity-tasks")
  ).toContainText("skip/take");
  await expect(
    page.getByTestId("list-filter-support-entity-table")
  ).toContainText("lib/crm/crmClient.ts#listAccounts");
  await expect(
    page.getByTestId("list-filter-support-filter-table")
  ).toContainText("Due date from");
  await expect(
    page.getByTestId("list-filter-support-filter-table")
  ).toContainText("or contains");
  await expect(
    page.getByTestId("list-filter-support-sort-table")
  ).toContainText("Health score");
  await expect(
    page.getByTestId("list-filter-support-write-flags")
  ).toContainText("Database off");
  await expect(
    page.getByTestId("list-filter-support-write-flags")
  ).toContainText("Routes off");

  await expect(page.getByTestId("bulk-dry-run-review-operator")).toBeVisible();
  await expect(
    page.getByTestId("bulk-dry-run-summary-entities")
  ).toContainText("10");
  await expect(page.getByTestId("bulk-dry-run-summary-actions")).toContainText(
    "5"
  );
  await expect(
    page.getByTestId("bulk-dry-run-summary-max-records")
  ).toContainText("200");
  await page.getByTestId("bulk-dry-run-target-select").selectOption("paused");
  await page.getByTestId("bulk-dry-run-use-sample-records").click();
  const bulkRecordInput = page.getByTestId("bulk-dry-run-record-input");
  const sampleRecordIds = await bulkRecordInput.inputValue();
  expect(sampleRecordIds).toContain("acct-");
  await bulkRecordInput.fill(
    `${sampleRecordIds}\nmissing-bulk-dry-run-record`
  );
  await page.getByTestId("bulk-dry-run-submit").click();
  await expect(page.getByTestId("bulk-dry-run-result-panel")).toBeVisible();
  await expect(page.getByTestId("bulk-dry-run-rollup-eligible")).toContainText(
    /[1-9]/
  );
  await expect(page.getByTestId("bulk-dry-run-rollup-missing")).toContainText(
    "1"
  );
  await expect(page.getByTestId("bulk-dry-run-reason-table")).toContainText(
    "eligible"
  );
  await expect(page.getByTestId("bulk-dry-run-reason-table")).toContainText(
    "not found"
  );
  await expect(page.getByTestId("bulk-dry-run-audit-plan")).toContainText(
    "bulk_action_dry_run"
  );
  await expect(page.getByTestId("bulk-dry-run-audit-plan")).toContainText(
    "status_update dry run for accounts"
  );
  await expect(page.getByTestId("bulk-dry-run-write-flags")).toContainText(
    "Database off"
  );
  await expect(page.getByTestId("bulk-dry-run-write-flags")).toContainText(
    "Audit events off"
  );

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
