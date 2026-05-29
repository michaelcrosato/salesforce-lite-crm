import { expect, test } from "@playwright/test";

test("reports index lists reports and a report renders", async ({ page }) => {
  const auditTaskTitle = `Reports Audit Task ${Date.now()}`;

  await page.goto("/tasks/new");
  await expect(page.getByRole("heading", { name: "New Task" })).toBeVisible();
  await page.getByLabel("Title").fill(auditTaskTitle);
  await page
    .getByLabel("Description")
    .fill("Created from the reports audit explorer spec.");
  await page.getByLabel("Priority").selectOption("normal");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Task created.", { exact: true })).toBeVisible();

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

  await expect(page.getByTestId("audit-event-explorer")).toBeVisible();
  await expect(page.getByTestId("audit-event-summary-total")).toContainText(
    /[1-9]/
  );
  await expect(page.getByTestId("audit-event-summary-matching")).toContainText(
    /[1-9]/
  );
  await expect(page.getByTestId("audit-event-recent-table")).toContainText(
    auditTaskTitle
  );
  await expect(page.getByTestId("audit-event-recent-table")).toContainText(
    "created"
  );
  await expect(
    page
      .getByTestId("audit-event-recent-table")
      .getByRole("link", { name: "Open task" })
      .first()
  ).toHaveAttribute("href", /\/tasks\?task=/);

  await page.getByTestId("audit-event-filter-category").selectOption("record");
  await page.getByTestId("audit-event-filter-action").selectOption("created");
  await page.getByTestId("audit-event-filter-entity").selectOption("task");
  await page.getByTestId("audit-event-filter-submit").click();
  await expect(page).toHaveURL(/auditCategory=record/);
  await expect(page).toHaveURL(/auditAction=created/);
  await expect(page).toHaveURL(/auditEntity=task/);
  await expect(page.getByTestId("audit-event-recent-table")).toContainText(
    auditTaskTitle
  );
  await expect(page.getByTestId("audit-event-category-counts")).toContainText(
    "record"
  );
  await expect(page.getByTestId("audit-event-action-counts")).toContainText(
    "created"
  );
  await expect(page.getByTestId("audit-event-entity-counts")).toContainText(
    "task"
  );

  await expect(page.getByTestId("list-filter-support-explorer")).toBeVisible();
  await expect(
    page.getByTestId("list-filter-support-summary-entities")
  ).toContainText("10");
  await expect(
    page.getByTestId("list-filter-support-summary-filters")
  ).toContainText("38");
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

  await expect(page.getByTestId("saved-report-operator")).toBeVisible();
  await expect(page.getByTestId("saved-report-operator")).toHaveAttribute(
    "data-hydrated",
    "true"
  );
  await expect(page.getByTestId("saved-report-summary-entities")).toContainText(
    "10"
  );
  await expect(page.getByTestId("saved-report-summary-fields")).toContainText(
    /\d+/
  );
  await expect(page.getByTestId("saved-report-summary-charts")).toContainText(
    /\d+/
  );
  await expect(page.getByTestId("saved-report-definition-table")).toContainText(
    "Opportunities"
  );
  await page.getByTestId("saved-report-entity-select").selectOption(
    "opportunities"
  );
  await expect(page.getByTestId("saved-report-field-name")).toBeChecked();
  await expect(page.getByTestId("saved-report-field-stage")).toBeChecked();
  await expect(page.getByTestId("saved-report-field-value")).toBeChecked();
  await page.getByTestId("saved-report-filter-select").selectOption("stage");
  await page.getByTestId("saved-report-filter-value").fill("proposal");
  await page.getByTestId("saved-report-group-select").selectOption("stage");
  await page.getByTestId("saved-report-chart-type").selectOption("bar");
  await page.getByTestId("saved-report-chart-dimension").selectOption("stage");
  await page.getByTestId("saved-report-chart-metric").selectOption("value.sum");
  await page.getByTestId("saved-report-limit-input").fill("4");
  await page.getByTestId("saved-report-preview-submit").click();
  await expect(page.getByTestId("saved-report-result-panel")).toBeVisible();
  await expect(page.getByTestId("saved-report-result-rows")).toContainText(
    /[1-9]/
  );
  await expect(page.getByTestId("saved-report-row-table")).toContainText(
    "proposal"
  );
  await expect(page.getByTestId("saved-report-aggregate-table")).toContainText(
    "Total Value"
  );
  await expect(page.getByTestId("saved-report-chart-table")).toContainText(
    "proposal"
  );
  await expect(page.getByTestId("saved-report-write-flags")).toContainText(
    "Database off"
  );
  await expect(page.getByTestId("saved-report-write-flags")).toContainText(
    "Routes off"
  );
  await expect(page.getByTestId("saved-report-write-flags")).toContainText(
    "Raw SQL off"
  );

  await expect(page.getByTestId("bulk-dry-run-review-operator")).toBeVisible();
  await expect(
    page.getByTestId("bulk-dry-run-summary-entities")
  ).toContainText("10");
  await expect(page.getByTestId("bulk-dry-run-summary-actions")).toContainText("6");
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
  await expect(
    page.getByTestId("bulk-execution-confirmation-panel")
  ).toBeVisible();
  await expect(page.getByTestId("bulk-execution-submit")).toBeDisabled();
  await page.getByTestId("bulk-execution-confirm-checkbox").check();
  await expect(page.getByTestId("bulk-execution-submit")).toBeEnabled();
  await page.getByTestId("bulk-execution-submit").click();
  await expect(page.getByTestId("bulk-execution-result-panel")).toBeVisible();
  await expect(
    page.getByTestId("bulk-execution-rollup-executed")
  ).toContainText(/[1-9]/);
  await expect(
    page.getByTestId("bulk-execution-rollup-skipped")
  ).toContainText(/[1-9]/);
  await expect(page.getByTestId("bulk-execution-rollup-failed")).toContainText(
    "0"
  );
  await expect(page.getByTestId("bulk-execution-record-table")).toContainText(
    "executed"
  );
  await expect(page.getByTestId("bulk-execution-record-table")).toContainText(
    "skipped"
  );
  await expect(page.getByTestId("bulk-execution-write-flags")).toContainText(
    "Database on"
  );
  await expect(page.getByTestId("bulk-execution-write-flags")).toContainText(
    "Audit events on"
  );

  await expect(page.getByTestId("workflow-dry-run-operator")).toBeVisible();
  await expect(
    page.getByTestId("workflow-dry-run-summary-examples")
  ).toContainText("7");
  await expect(
    page.getByTestId("workflow-dry-run-summary-entities")
  ).toContainText("7");
  await expect(
    page.getByTestId("workflow-dry-run-summary-actions")
  ).toContainText("3");
  await page.getByTestId("workflow-dry-run-submit").click();
  await expect(page.getByTestId("workflow-dry-run-result-panel")).toBeVisible();
  await expect(page.getByTestId("workflow-dry-run-rollup-matched")).toContainText(
    /\d+/
  );
  await expect(page.getByTestId("workflow-dry-run-rollup-returned")).toContainText(
    /\d+/
  );
  await expect(page.getByTestId("workflow-dry-run-rollup-warnings")).toContainText(
    /[1-9]/
  );
  await expect(page.getByTestId("workflow-dry-run-rollup-actions")).toContainText(
    "3"
  );
  await expect(page.getByTestId("workflow-dry-run-action-table")).toContainText(
    "Draft task"
  );
  await expect(page.getByTestId("workflow-dry-run-action-table")).toContainText(
    "no records matched"
  );
  await expect(page.getByTestId("workflow-dry-run-warning-list")).toContainText(
    "preview only"
  );
  await expect(page.getByTestId("workflow-dry-run-warning-list")).toContainText(
    "action execution disabled"
  );
  await expect(page.getByTestId("workflow-dry-run-record-table")).toContainText(
    /matched|No records matched/
  );
  await expect(page.getByTestId("workflow-dry-run-write-flags")).toContainText(
    "Database off"
  );
  await expect(page.getByTestId("workflow-dry-run-write-flags")).toContainText(
    "Action execution off"
  );
  await expect(
    page.getByTestId("workflow-execution-confirmation-panel")
  ).toBeVisible();
  await expect(page.getByTestId("workflow-execution-submit")).toBeDisabled();
  await page.getByTestId("workflow-execution-confirm-checkbox").check();
  await expect(page.getByTestId("workflow-execution-submit")).toBeEnabled();
  await page.getByTestId("workflow-execution-submit").click();
  await expect(page.getByTestId("workflow-execution-result-panel")).toBeVisible();
  await expect(
    page.getByTestId("workflow-execution-rollup-executed")
  ).toContainText("0");
  await expect(
    page.getByTestId("workflow-execution-rollup-blocked")
  ).toContainText("3");
  await expect(page.getByTestId("workflow-execution-rollup-failed")).toContainText(
    "0"
  );
  await expect(
    page.getByTestId("workflow-execution-rollup-audit-events")
  ).toContainText("0");
  await expect(page.getByTestId("workflow-execution-action-table")).toContainText(
    "blocked"
  );
  await expect(page.getByTestId("workflow-execution-record-table")).toContainText(
    "No record actions were attempted."
  );
  await expect(page.getByTestId("workflow-execution-write-flags")).toContainText(
    "Database on"
  );
  await expect(page.getByTestId("workflow-execution-write-flags")).toContainText(
    "Audit events on"
  );

  await expect(page.getByTestId("ai-action-review-operator")).toBeVisible();
  await expect(page.getByTestId("ai-action-review-summary-ready")).toContainText(
    "1"
  );
  await expect(
    page.getByTestId("ai-action-review-summary-blocked")
  ).toContainText("3");
  await expect(
    page.getByTestId("ai-action-review-summary-deferred")
  ).toContainText("1");
  await expect(page.getByTestId("ai-action-review-summary-writes")).toContainText(
    "None"
  );
  await expect(page.getByTestId("ai-action-review-source-table")).toContainText(
    "AI action intent registry"
  );
  await expect(page.getByTestId("ai-action-review-source-table")).toContainText(
    "AI action eval fixture audit"
  );
  await expect(
    page.getByTestId("ai-action-review-proposal-supported")
  ).toContainText("ready for review");
  await expect(page.getByTestId("ai-action-review-proposal-blocked").first()).toContainText(
    "payload invalid"
  );
  await expect(
    page.getByTestId("ai-action-review-proposal-malformed")
  ).toContainText("proposal invalid");
  await expect(
    page.getByTestId("ai-action-review-proposal-deferred")
  ).toContainText("intent deferred");
  await expect(page.getByTestId("ai-action-review-proposal-table")).toContainText(
    "Approval required"
  );
  await expect(page.getByTestId("ai-action-review-proposal-table")).toContainText(
    "Audit required before execution"
  );
  await expect(page.getByTestId("ai-action-review-safety-flags")).toContainText(
    "Database off"
  );
  await expect(page.getByTestId("ai-action-review-safety-flags")).toContainText(
    "Action execution off"
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

  const csvApplyEmail = `csv.safe.${Date.now()}@e2e.example.test`;
  await page.getByTestId("csv-import-input").fill(
    [
      "First Name,Last Name,Email,Status,Phone",
      `Csv,Safe,${csvApplyEmail},active,604-555-0201`,
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
  await expect(
    page.getByTestId("csv-import-apply-confirmation-panel")
  ).toBeVisible();
  await expect(page.getByTestId("csv-import-apply-submit")).toBeDisabled();
  await page.getByTestId("csv-import-apply-confirm-checkbox").check();
  await expect(page.getByTestId("csv-import-apply-submit")).toBeEnabled();
  await page.getByTestId("csv-import-apply-submit").click();
  await expect(page.getByTestId("csv-import-apply-result-panel")).toBeVisible();
  await expect(
    page.getByTestId("csv-import-apply-rollup-created")
  ).toContainText("1");
  await expect(
    page.getByTestId("csv-import-apply-rollup-skipped")
  ).toContainText("1");
  await expect(
    page.getByTestId("csv-import-apply-rollup-blocked")
  ).toContainText("1");
  await expect(
    page.getByTestId("csv-import-apply-rollup-audit-events")
  ).toContainText("1");
  await expect(page.getByTestId("csv-import-apply-row-results")).toContainText(
    "Csv Safe"
  );
  await expect(page.getByTestId("csv-import-apply-row-results")).toContainText(
    "created"
  );
  await expect(page.getByTestId("csv-import-apply-row-results")).toContainText(
    "skipped"
  );
  await expect(page.getByTestId("csv-import-apply-row-results")).toContainText(
    "blocked"
  );
  await expect(page.getByTestId("csv-import-apply-write-flags")).toContainText(
    "Database on"
  );
  await expect(page.getByTestId("csv-import-apply-write-flags")).toContainText(
    "Audit events on"
  );
  await expect(page.getByTestId("csv-import-apply-write-flags")).toContainText(
    "Leads off"
  );
  await expect(page.getByTestId("csv-import-apply-write-flags")).toContainText(
    "Routing assignments off"
  );
});

