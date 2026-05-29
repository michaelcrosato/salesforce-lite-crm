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

test("lead saved views can be saved, applied, updated, and deleted", async ({
  page
}, testInfo) => {
  const viewName = `E2E lead view ${Date.now().toString(36)}-${testInfo.workerIndex}`;

  await page.goto("/leads?status=assigned&sortBy=lastName&sortOrder=asc");
  await expect(page.getByRole("heading", { name: "Lead Inbox", exact: true })).toBeVisible();

  await page.getByTestId("saved-view-save-name").fill(viewName);
  await page.getByTestId("saved-view-save-submit").click();
  await expect(page).toHaveURL(/savedViewStatus=created/);
  await expect(page.getByTestId("saved-view-notice-status")).toHaveText(
    "Saved view created."
  );
  await expect(page.getByLabel("Status")).toHaveValue("assigned");
  await expect(page.getByLabel("Sort by")).toHaveValue("lastName");
  await expect(page.getByLabel("Order", { exact: true })).toHaveValue("asc");

  await page.goto("/leads");
  await page.getByTestId("saved-view-apply-select").selectOption({
    label: viewName
  });
  await page.getByTestId("saved-view-apply-submit").click();
  await expect(page).toHaveURL(/view=/);
  await expect(page.getByLabel("Status")).toHaveValue("assigned");
  await expect(page.getByLabel("Sort by")).toHaveValue("lastName");

  await page.goto("/leads?status=closed&sortBy=createdAt&sortOrder=desc");
  await page.getByTestId("saved-view-update-select").selectOption({
    label: viewName
  });
  await page.getByTestId("saved-view-update-submit").click();
  await expect(page).toHaveURL(/savedViewStatus=updated/);
  await expect(page.getByTestId("saved-view-notice-status")).toHaveText(
    "Saved view updated."
  );
  await expect(page.getByLabel("Status")).toHaveValue("closed");
  await expect(page.getByLabel("Sort by")).toHaveValue("createdAt");

  await page.goto("/leads");
  await page.getByTestId("saved-view-apply-select").selectOption({
    label: viewName
  });
  await page.getByTestId("saved-view-apply-submit").click();
  await expect(page.getByLabel("Status")).toHaveValue("closed");
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

test("deal saved views can be saved, applied, updated, and deleted", async ({
  page
}, testInfo) => {
  const viewName = `E2E deal view ${Date.now().toString(36)}-${testInfo.workerIndex}`;

  await page.goto("/deals?stage=qualified&sortBy=value&sortOrder=desc");
  await expect(page.getByRole("heading", { name: "Deals", exact: true })).toBeVisible();

  await page.getByTestId("saved-view-save-name").fill(viewName);
  await page.getByTestId("saved-view-save-submit").click();
  await expect(page).toHaveURL(/savedViewStatus=created/);
  await expect(page.getByTestId("saved-view-notice-status")).toHaveText(
    "Saved view created."
  );
  await expect(page.getByLabel("Stage", { exact: true })).toHaveValue("qualified");
  await expect(page.getByLabel("Sort by")).toHaveValue("value");
  await expect(page.getByLabel("Order", { exact: true })).toHaveValue("desc");

  await page.goto("/deals");
  await page.getByTestId("saved-view-apply-select").selectOption({
    label: viewName
  });
  await page.getByTestId("saved-view-apply-submit").click();
  await expect(page).toHaveURL(/view=/);
  await expect(page.getByLabel("Stage", { exact: true })).toHaveValue("qualified");
  await expect(page.getByLabel("Sort by")).toHaveValue("value");

  await page.goto("/deals?stage=proposal&sortBy=name&sortOrder=asc");
  await page.getByTestId("saved-view-update-select").selectOption({
    label: viewName
  });
  await page.getByTestId("saved-view-update-submit").click();
  await expect(page).toHaveURL(/savedViewStatus=updated/);
  await expect(page.getByTestId("saved-view-notice-status")).toHaveText(
    "Saved view updated."
  );
  await expect(page.getByLabel("Stage", { exact: true })).toHaveValue("proposal");
  await expect(page.getByLabel("Sort by")).toHaveValue("name");

  await page.goto("/deals");
  await page.getByTestId("saved-view-apply-select").selectOption({
    label: viewName
  });
  await page.getByTestId("saved-view-apply-submit").click();
  await expect(page.getByLabel("Stage", { exact: true })).toHaveValue("proposal");
  await expect(page.getByLabel("Sort by")).toHaveValue("name");

  await page.getByTestId("saved-view-delete-submit").click();
  await expect(page).toHaveURL(/savedViewStatus=deleted/);
  await expect(page.getByTestId("saved-view-notice-status")).toHaveText(
    "Saved view deleted."
  );
  await expect(page.getByTestId("saved-view-apply-select")).not.toContainText(
    viewName
  );
});
