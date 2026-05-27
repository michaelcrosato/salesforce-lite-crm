import { expect, test } from "@playwright/test";
import { prisma } from "../lib/prisma";

test.beforeEach(async () => {
  await cleanupE2eSavedReports();
});

test.afterEach(async () => {
  await cleanupE2eSavedReports();
});

test("saved report definitions can be managed from reports", async ({ page }) => {
  const baseName = `E2E saved report ${Date.now()}`;
  const updatedName = `${baseName} updated`;
  const archiveName = `${baseName} archive`;

  await page.goto("/reports");
  await expect(page.getByRole("heading", { name: "Reports" })).toBeVisible();
  await expect(page.getByTestId("saved-report-operator")).toBeVisible();

  await page.getByTestId("saved-report-entity-select").selectOption(
    "opportunities"
  );
  await page.getByTestId("saved-report-name-input").fill(baseName);
  await page.getByTestId("saved-report-filter-select").selectOption("stage");
  await page.getByTestId("saved-report-filter-value").fill("proposal");
  await page.getByTestId("saved-report-group-select").selectOption("stage");
  await page.getByTestId("saved-report-chart-type").selectOption("bar");
  await page.getByTestId("saved-report-chart-dimension").selectOption("stage");
  await page.getByTestId("saved-report-chart-metric").selectOption("value.sum");
  await page.getByTestId("saved-report-limit-input").fill("4");
  await page.getByTestId("saved-report-create-submit").click();

  const savedList = page.getByTestId("saved-report-persisted-list");
  const createdRow = savedList.getByRole("row", {
    name: new RegExp(escapeRegex(baseName))
  });

  await expect(createdRow).toBeVisible();
  await expect(createdRow).toContainText("Opportunities");

  await createdRow.getByTestId("saved-report-saved-preview").click();
  await expect(page.getByTestId("saved-report-result-panel")).toBeVisible();
  await expect(page.getByTestId("saved-report-result-panel")).toContainText(
    baseName
  );
  await expect(page.getByTestId("saved-report-row-table")).toContainText(
    "proposal"
  );

  await createdRow.getByTestId("saved-report-saved-load").click();
  await expect(page.getByTestId("saved-report-name-input")).toHaveValue(
    baseName
  );
  await expect(page.getByTestId("saved-report-update-submit")).toBeEnabled();

  await page.getByTestId("saved-report-name-input").fill(updatedName);
  await page.getByTestId("saved-report-update-submit").click();

  const updatedRow = savedList.getByRole("row", {
    name: new RegExp(escapeRegex(updatedName))
  });

  await expect(updatedRow).toBeVisible();
  await updatedRow.getByTestId("saved-report-saved-delete").click();
  await expect(updatedRow).toHaveCount(0);

  await page.getByTestId("saved-report-name-input").fill(archiveName);
  await page.getByTestId("saved-report-create-submit").click();

  const archiveRow = savedList.getByRole("row", {
    name: new RegExp(escapeRegex(archiveName))
  });

  await expect(archiveRow).toBeVisible();
  await archiveRow.getByTestId("saved-report-saved-archive").click();
  await expect(archiveRow).toHaveCount(0);
});

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function cleanupE2eSavedReports() {
  await prisma.savedReportDefinition.deleteMany({
    where: {
      name: {
        startsWith: "E2E saved report"
      }
    }
  });
}
