import { expect, test } from "@playwright/test";

test("create task, edit status, and verify in list", async ({ page }) => {
  const taskTitle = `E2E Task ${Date.now()}`;

  await page.goto("/tasks/new");
  await expect(page.getByRole("heading", { name: "New Task" })).toBeVisible();

  await page.getByLabel("Title").fill(taskTitle);
  await page.getByLabel("Description").fill("Created from the tasks e2e spec.");
  await page.getByLabel("Priority").selectOption("high");
  await page.getByRole("button", { name: "Create task" }).click();
  await expect(page.getByText("Task created.", { exact: true })).toBeVisible();

  await page.goto("/tasks");
  await expect(page.getByRole("heading", { name: "Tasks" })).toBeVisible();
  const row = page.getByRole("row").filter({ hasText: taskTitle });
  await expect(row).toBeVisible();
  await expect(row).toContainText("Open");

  await row.getByRole("link", { name: taskTitle }).click();
  await expect(page).toHaveURL(/[?&]task=/);
  await expect(
    page.getByRole("button", { name: "Close task detail" })
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: taskTitle, level: 2 })
  ).toBeVisible();

  await page
    .getByLabel(`Move ${taskTitle} status`)
    .selectOption("in_progress");
  await expect(page.getByText("Task status updated.", { exact: true })).toBeVisible();

  await page.goto("/tasks");
  const refreshedRow = page.getByRole("row").filter({ hasText: taskTitle });
  await expect(refreshedRow).toContainText("In progress");
});
