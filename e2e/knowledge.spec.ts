import { expect, test } from "@playwright/test";

test("knowledge workspace lists articles, filters, and opens drawer context", async ({
  page
}) => {
  await page.goto("/knowledge");

  await expect(
    page.getByRole("heading", { exact: true, name: "Knowledge Articles" })
  ).toBeVisible();
  await expect(page.getByTestId("knowledge-summary-panel")).toContainText("7");
  await expect(page.getByTestId("knowledge-article-table")).toContainText(
    "Resolve billing discrepancy tickets"
  );
  await expect(page.getByTestId("knowledge-article-table")).toContainText(
    "Investigate dealer lead routing feedback"
  );

  await page.getByTestId("knowledge-filter-status").selectOption("published");
  await page.getByTestId("knowledge-filter-audience").selectOption("internal");
  await page
    .getByTestId("knowledge-filter-queue")
    .selectOption("dealer_operations");
  await page.getByTestId("knowledge-filter-search").fill("routing");
  await page.getByTestId("knowledge-filter-submit").click();

  await expect(page).toHaveURL(/status=published/);
  await expect(page).toHaveURL(/audience=internal/);
  await expect(page).toHaveURL(/caseQueueKey=dealer_operations/);
  await expect(page.getByTestId("knowledge-article-table")).toContainText(
    "Investigate dealer lead routing feedback"
  );
  await expect(page.getByTestId("knowledge-article-table")).not.toContainText(
    "Handle password reset loops"
  );

  await page
    .getByRole("link", { name: "Investigate dealer lead routing feedback" })
    .click();
  await expect(page).toHaveURL(/article=knowledge-routing-feedback/);
  await expect(page.getByTestId("knowledge-article-drawer")).toBeVisible();
  await expect(
    page.getByRole("heading", {
      exact: true,
      name: "Investigate dealer lead routing feedback"
    })
  ).toBeVisible();
  await expect(page.getByTestId("knowledge-article-context")).toContainText(
    "Dealer Operations"
  );
  await expect(page.getByTestId("knowledge-article-keywords")).toContainText(
    "routing"
  );
});

test("knowledge bracket detail route remains excluded", async ({ page }) => {
  const response = await page.goto("/knowledge/knowledge-routing-feedback");

  if (response?.status() === 200) {
    await expect(
      page.locator('[data-testid="excluded-route-placeholder"]')
    ).toBeVisible();
  } else {
    expect(response?.status()).toBe(404);
  }
});
