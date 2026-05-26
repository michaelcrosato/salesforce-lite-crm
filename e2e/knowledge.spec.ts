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

test("knowledge workspace creates, edits, publishes, and archives articles", async ({
  page
}) => {
  await page.goto("/knowledge");

  const title = "Playwright lifecycle article";
  const updatedTitle = "Playwright lifecycle article updated";
  const createForm = page.getByTestId("knowledge-create-form");

  await createForm.getByTestId("knowledge-field-title").fill(title);
  await createForm
    .getByTestId("knowledge-field-summary")
    .fill("Lifecycle article summary");
  await createForm
    .getByTestId("knowledge-field-body")
    .fill("Lifecycle article body for local service workflows.");
  await createForm.getByTestId("knowledge-field-category").fill("Lifecycle");
  await createForm
    .getByTestId("knowledge-field-keywords")
    .fill("lifecycle,playwright");
  await createForm
    .getByTestId("knowledge-field-queue")
    .selectOption("general_support");
  await createForm.getByTestId("knowledge-button-submit").click();

  await expect(
    page.getByRole("status").filter({ hasText: "Article created." })
  ).toBeVisible();
  await expect(page.getByTestId("knowledge-article-table")).toContainText(
    title
  );

  await page.getByRole("link", { exact: true, name: title }).click();
  await expect(page.getByTestId("knowledge-article-drawer")).toBeVisible();
  await page.getByTestId("knowledge-button-edit").click();

  const editForm = page.getByTestId("knowledge-edit-form");
  await editForm.getByTestId("knowledge-field-title").fill(updatedTitle);
  await editForm
    .getByTestId("knowledge-field-summary")
    .fill("Updated lifecycle summary");
  await editForm
    .getByTestId("knowledge-field-body")
    .fill("Updated lifecycle body for local service workflows.");
  await editForm.getByTestId("knowledge-field-audience").selectOption("customer");
  await editForm.getByTestId("knowledge-button-submit").click();

  await expect(
    page.getByRole("status").filter({ hasText: "Article updated." })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { exact: true, name: updatedTitle })
  ).toBeVisible();

  await page.getByTestId("knowledge-button-publish").click();
  await expect(
    page.getByRole("status").filter({ hasText: "Article published." })
  ).toBeVisible();
  await expect(page.getByTestId("knowledge-lifecycle-panel")).toContainText(
    "Published"
  );

  await page.getByTestId("knowledge-button-archive").click();
  await expect(
    page.getByRole("status").filter({ hasText: "Article archived." })
  ).toBeVisible();
  await expect(page.getByTestId("knowledge-lifecycle-panel")).toContainText(
    "Archived"
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
