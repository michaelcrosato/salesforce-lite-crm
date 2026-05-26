import { expect, test } from "@playwright/test";

test("shows seeded campaign performance summaries in list and drawer", async ({
  page
}) => {
  await page.goto("/campaigns");

  const row = page
    .getByRole("row")
    .filter({ hasText: "Spring Fleet Lead Push" });
  await expect(row).toBeVisible();
  await expect(row.getByTestId("campaign-row-performance")).toContainText(
    "7 members"
  );
  await expect(row.getByTestId("campaign-row-performance")).toContainText(
    "$274,000 open pipeline"
  );
  await expect(row.getByTestId("campaign-row-performance")).toContainText(
    "54.8x open / budget"
  );

  await row.getByRole("link", { name: "Spring Fleet Lead Push" }).click();
  await expect(page).toHaveURL(/[?&]campaign=campaign-001/);
  await expect(page.getByTestId("campaign-summary-performance")).toBeVisible();
  await expect(page.getByTestId("campaign-metric-members")).toContainText(
    "7"
  );
  await expect(page.getByTestId("campaign-metric-open-pipeline")).toContainText(
    "$274,000"
  );
  await expect(
    page.getByTestId("campaign-metric-influenced-budget")
  ).toContainText("54.8x");
  await expect(page.getByTestId("campaign-metric-won-budget")).toContainText(
    "-$5,000 net"
  );
  await expect(page.getByTestId("campaign-metric-routed-rate")).toContainText(
    "100%"
  );
  await expect(page.getByTestId("campaign-metric-coverage-rate")).toContainText(
    "67%"
  );
  await expect(
    page.getByTestId("campaign-opportunity-influence").first()
  ).toContainText("Luma patient intake CRM");

  const memberPanel = page.getByTestId("campaign-member-panel-controls");
  await expect(memberPanel).toBeVisible();
  await expect(memberPanel).toContainText("7 members");

  await memberPanel
    .getByTestId("campaign-member-select-add")
    .selectOption("contact:contact-19");
  await memberPanel.getByTestId("campaign-member-button-add").click();
  await expect(
    page.getByText("Campaign member added.", { exact: true })
  ).toBeVisible();
  const addedMemberRow = memberPanel
    .getByTestId("campaign-member-row-current")
    .filter({ hasText: "Amara Scott" });
  await expect(addedMemberRow).toBeVisible();
  await expect(memberPanel).toContainText("8 members");

  await addedMemberRow.getByTestId("campaign-member-button-remove").click();
  await expect(
    page.getByText("Campaign member removed.", { exact: true })
  ).toBeVisible();
  await expect(addedMemberRow).toHaveCount(0);
  await expect(memberPanel).toContainText("7 members");
});

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
