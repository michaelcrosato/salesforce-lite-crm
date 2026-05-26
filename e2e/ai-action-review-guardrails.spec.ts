import { expect, test, type Page } from "@playwright/test";

test.describe("AI action review guardrails", () => {
  test("renders all review states without write or execution controls", async ({
    page
  }) => {
    await page.goto("/reports");

    const panel = page.getByTestId("ai-action-review-operator");
    await expect(panel).toBeVisible();
    await expect(
      panel.getByTestId("ai-action-review-summary-ready")
    ).toContainText("1");
    await expect(
      panel.getByTestId("ai-action-review-summary-blocked")
    ).toContainText("3");
    await expect(
      panel.getByTestId("ai-action-review-summary-deferred")
    ).toContainText("1");
    await expect(
      panel.getByTestId("ai-action-review-summary-writes")
    ).toContainText("None");

    const supportedRow = panel.getByTestId(
      "ai-action-review-proposal-supported"
    );
    const blockedRows = panel.getByTestId("ai-action-review-proposal-blocked");
    const malformedRow = panel.getByTestId(
      "ai-action-review-proposal-malformed"
    );
    const deferredRow = panel.getByTestId(
      "ai-action-review-proposal-deferred"
    );

    await expect(supportedRow).toHaveCount(1);
    await expect(supportedRow).toContainText("ready for review");
    await expect(supportedRow).toContainText("valid");
    await expect(supportedRow).toContainText("Execution off / writes off");
    await expect(blockedRows).toHaveCount(2);
    await expect(blockedRows.nth(0)).toContainText("payload invalid");
    await expect(blockedRows.nth(1)).toContainText("intent unknown");
    await expect(malformedRow).toHaveCount(1);
    await expect(malformedRow).toContainText("proposal invalid");
    await expect(deferredRow).toHaveCount(1);
    await expect(deferredRow).toContainText("intent deferred");

    const safetyFlags = panel.getByTestId("ai-action-review-safety-flags");
    await expect(safetyFlags).toContainText("Database off");
    await expect(safetyFlags).toContainText("Audit events off");
    await expect(safetyFlags).toContainText("Product UI off");
    await expect(safetyFlags).toContainText("External services off");
    await expect(safetyFlags).toContainText("Action execution off");
    await expect(safetyFlags).toContainText("Approvals off");

    await expect(panel.getByRole("button")).toHaveCount(0);
    await expect(panel.getByRole("link")).toHaveCount(0);
  });

  for (const route of [
    "/deals/ai-action-review",
    "/search",
    "/command-palette"
  ]) {
    test(`keeps ${route} outside the AI action operator surface`, async ({
      page
    }) => {
      await expectExcludedRoute(page, route);
    });
  }
});

async function expectExcludedRoute(page: Page, route: string) {
  const response = await page.goto(route);

  if (response?.status() === 200) {
    await expect(
      page
        .getByTestId("excluded-route-placeholder")
        .or(
          page.getByRole("heading", {
            name: /not available|coming soon|placeholder/i
          })
        )
    ).toBeVisible();
    return;
  }

  expect(response?.status()).toBe(404);
}
