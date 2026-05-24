import { expect, test } from "@playwright/test";

test("task saved views can be saved, applied, updated, and deleted", async ({
  page
}, testInfo) => {
  const viewName = `E2E task view ${Date.now().toString(36)}-${testInfo.workerIndex}`;

  await page.goto("/tasks?status=open&sortBy=priority&sortOrder=desc");
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();

  await page.getByTestId("saved-view-save-name").fill(viewName);
  await page.getByTestId("saved-view-save-submit").click();
  await expect(page).toHaveURL(/savedViewStatus=created/);
  await expect(page.getByTestId("saved-view-notice-status")).toHaveText(
    "Saved view created."
  );
  await expect(page.getByLabel("Status")).toHaveValue("open");
  await expect(page.getByLabel("Sort by")).toHaveValue("priority");
  await expect(page.getByLabel("Order")).toHaveValue("desc");

  await page.goto("/tasks");
  await page.getByTestId("saved-view-apply-select").selectOption({
    label: viewName
  });
  await page.getByTestId("saved-view-apply-submit").click();
  await expect(page).toHaveURL(/view=/);
  await expect(page.getByLabel("Status")).toHaveValue("open");
  await expect(page.getByLabel("Sort by")).toHaveValue("priority");

  await page.goto("/tasks?status=done&sortBy=createdAt&sortOrder=asc");
  await page.getByTestId("saved-view-update-select").selectOption({
    label: viewName
  });
  await page.getByTestId("saved-view-update-submit").click();
  await expect(page).toHaveURL(/savedViewStatus=updated/);
  await expect(page.getByTestId("saved-view-notice-status")).toHaveText(
    "Saved view updated."
  );
  await expect(page.getByLabel("Status")).toHaveValue("done");
  await expect(page.getByLabel("Sort by")).toHaveValue("createdAt");

  await page.goto("/tasks");
  await page.getByTestId("saved-view-apply-select").selectOption({
    label: viewName
  });
  await page.getByTestId("saved-view-apply-submit").click();
  await expect(page.getByLabel("Status")).toHaveValue("done");
  await expect(page.getByLabel("Sort by")).toHaveValue("createdAt");

  await page.getByTestId("saved-view-delete-submit").click();
  await expect(page).toHaveURL(/savedViewStatus=deleted/);
  await expect(page.getByTestId("saved-view-notice-status")).toHaveText(
    "Saved view deleted."
  );
  await expect(page.getByTestId("saved-view-apply-select")).not.toContainText(
    viewName
  );
});
