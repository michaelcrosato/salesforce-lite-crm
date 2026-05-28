import { expect, test } from "@playwright/test";

test("routing simulator preview shows read-only assignment and blocker details", async ({
  page
}) => {
  await page.goto("/reports");

  const panel = page.getByTestId("routing-simulator-operator");
  await expect(panel).toBeVisible();
  await expect(
    panel.getByTestId("routing-simulator-summary-writes")
  ).toContainText("None");

  await panel.getByTestId("routing-simulator-input").fill(
    JSON.stringify(
      {
        leads: [
          {
            referenceId: "sim-route-vancouver",
            firstName: "Avery",
            lastName: "Chen",
            postalCode: "V5K 0A1",
            country: "CA",
            source: "e2e-routing-simulator"
          },
          {
            referenceId: "sim-no-area",
            firstName: "Jordan",
            lastName: "Lee",
            postalCode: "Z9Z 9Z9",
            country: "CA",
            source: "e2e-routing-simulator"
          }
        ]
      },
      null,
      2
    )
  );
  await panel.getByTestId("routing-simulator-submit").click();

  await expect(panel.getByTestId("routing-simulator-result-panel")).toBeVisible();
  await expect(
    panel.getByTestId("routing-simulator-summary-assigned")
  ).toContainText("1");
  await expect(
    panel.getByTestId("routing-simulator-summary-blocked")
  ).toContainText("1");
  await expect(panel.getByTestId("routing-simulator-summary-rate")).toContainText(
    "50%"
  );

  await expect(panel.getByTestId("routing-simulator-issue-table")).toContainText(
    "no area match"
  );
  await expect(
    panel.getByTestId("routing-simulator-capacity-table")
  ).toContainText("Simulator would add 1 hypothetical lead");
  await expect(panel.getByTestId("routing-simulator-row-table")).toContainText(
    "sim-route-vancouver"
  );
  await expect(panel.getByTestId("routing-simulator-row-table")).toContainText(
    "assigned"
  );
  await expect(panel.getByTestId("routing-simulator-row-table")).toContainText(
    "sim-no-area"
  );
  await expect(panel.getByTestId("routing-simulator-row-table")).toContainText(
    "blocked"
  );
  await expect(panel.getByTestId("routing-simulator-step-table")).toContainText(
    "normalize"
  );
  await expect(panel.getByTestId("routing-simulator-step-table")).toContainText(
    "match area"
  );
  await expect(panel.getByTestId("routing-simulator-step-table")).toContainText(
    "select"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Leads off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Routing events off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Dealer orders off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Scenario persistence off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Simulator runs off"
  );
});
