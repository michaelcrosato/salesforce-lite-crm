import { expect, test, type Page } from "@playwright/test";
import { prisma } from "../lib/prisma";

test.beforeEach(async () => {
  await cleanupE2eDashboardCardReports();
});

test.afterEach(async () => {
  await cleanupE2eDashboardCardReports();
});

test("saved reports can be pinned as dashboard cards on reports and dashboard", async ({
  page
}, testInfo) => {
  const suffix = `${Date.now()}-${testInfo.workerIndex}`;
  const firstName = `E2E dashboard card ${suffix} proposal`;
  const secondName = `E2E dashboard card ${suffix} negotiation`;

  await page.goto("/reports");
  await expect(
    page.getByRole("heading", { name: "Reports", exact: true })
  ).toBeVisible();
  await expect(page.getByTestId("dashboard-card-operator")).toBeVisible();
  await expectSavedReportOperatorReady(page);

  await createOpportunitySavedReport(page, firstName, "proposal");
  await createOpportunitySavedReport(page, secondName, "negotiation");

  const reportsOperator = page.getByTestId("dashboard-card-operator");
  const firstCandidate = reportsOperator.getByRole("row", {
    name: new RegExp(escapeRegex(firstName))
  });
  const secondCandidate = reportsOperator.getByRole("row", {
    name: new RegExp(escapeRegex(secondName))
  });

  await firstCandidate.getByTestId("dashboard-card-pin-reports").click();
  await expect(reportsOperator.getByTestId("dashboard-card-list-active")).toContainText(
    firstName
  );
  await expect(reportsOperator.getByTestId("dashboard-card-audit-log")).toContainText(
    "Dashboard card pinned"
  );
  await expect(reportsOperator.getByTestId("dashboard-card-row-table")).toContainText(
    "proposal"
  );

  await secondCandidate.getByTestId("dashboard-card-pin-reports").click();
  const reportsCards = reportsOperator
    .getByTestId("dashboard-card-list-active")
    .getByTestId("dashboard-card-preview-card");

  await expect(reportsCards).toHaveCount(2);
  await reportsCards
    .filter({ hasText: secondName })
    .getByTestId("dashboard-card-move-up")
    .click();
  await expect(reportsOperator.getByTestId("dashboard-card-audit-log")).toContainText(
    "Dashboard card reordered"
  );
  await expect(reportsCards.nth(0)).toContainText(secondName);

  await reportsCards
    .filter({ hasText: secondName })
    .getByTestId("dashboard-card-archive")
    .click();
  await expect(reportsOperator.getByTestId("dashboard-card-audit-log")).toContainText(
    "Dashboard card archived"
  );
  await expect(page.getByTestId("dashboard-card-archived-list")).toContainText(
    secondName
  );
  await page
    .getByTestId("dashboard-card-archived-list")
    .getByTestId("dashboard-card-delete")
    .click();
  await expect(reportsOperator.getByTestId("dashboard-card-audit-log")).toContainText(
    "Dashboard card deleted"
  );
  await expect(reportsOperator.getByTestId("dashboard-card-audit-row")).toHaveCount(
    5
  );
  await expect(page.getByTestId("dashboard-card-archived-list")).toHaveCount(0);
  await expect(reportsOperator.getByTestId("dashboard-card-summary-active")).toContainText(
    "1"
  );

  await page.goto("/dashboard");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true })
  ).toBeVisible();

  const dashboardOperator = page.getByTestId("dashboard-card-operator");
  await expect(dashboardOperator).toBeVisible();
  await dashboardOperator
    .getByRole("row", { name: new RegExp(escapeRegex(firstName)) })
    .getByTestId("dashboard-card-pin-dashboard")
    .click();

  await expect(
    dashboardOperator.getByTestId("dashboard-card-audit-log")
  ).toContainText("Dashboard card pinned");
  await expect(
    dashboardOperator.getByTestId("dashboard-card-preview-card")
  ).toContainText(firstName);
  await expect(
    dashboardOperator.getByTestId("dashboard-card-row-table")
  ).toContainText("proposal");
});

async function createOpportunitySavedReport(
  page: Page,
  name: string,
  stage: string
) {
  await expectSavedReportOperatorReady(page);
  await page.getByTestId("saved-report-entity-select").selectOption(
    "opportunities"
  );
  await expect(page.getByTestId("saved-report-field-stage")).toBeChecked();
  await expect(
    page
      .getByTestId("saved-report-filter-select")
      .locator("option[value='stage']")
  ).toHaveCount(1);
  await page.getByTestId("saved-report-name-input").fill(name);
  await page.getByTestId("saved-report-filter-select").selectOption("stage");
  await page.getByTestId("saved-report-filter-value").fill(stage);
  await page.getByTestId("saved-report-group-select").selectOption("stage");
  await page.getByTestId("saved-report-chart-type").selectOption("bar");
  await page.getByTestId("saved-report-chart-dimension").selectOption("stage");
  await page.getByTestId("saved-report-chart-metric").selectOption("value.sum");
  await page.getByTestId("saved-report-limit-input").fill("4");
  await page.getByTestId("saved-report-create-submit").click();

  await expect(
    page
      .getByTestId("saved-report-persisted-list")
      .getByRole("row", { name: new RegExp(escapeRegex(name)) })
  ).toBeVisible();
}

async function expectSavedReportOperatorReady(page: Page) {
  await expect(page.getByTestId("saved-report-operator")).toHaveAttribute(
    "data-hydrated",
    "true"
  );
}

async function cleanupE2eDashboardCardReports() {
  await prisma.auditEvent.deleteMany({
    where: {
      entityType: "report",
      summary: {
        contains: "E2E dashboard card"
      }
    }
  });
  await prisma.savedReportDefinition.deleteMany({
    where: {
      name: {
        startsWith: "E2E dashboard card"
      }
    }
  });
}

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
