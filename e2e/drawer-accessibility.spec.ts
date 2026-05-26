import { expect, test } from "@playwright/test";

const drawerChecks = [
  {
    route: "/deals",
    openerRole: "button",
    openerName: /Northstar dispatch team rollout/,
    dialogName: "Northstar dispatch team rollout",
    closeName: "Close deal detail"
  },
  {
    route: "/tasks",
    openerRole: "link",
    openerName: "Follow up on proposal pricing #1",
    dialogName: "Follow up on proposal pricing #1",
    closeName: "Close task detail"
  },
  {
    route: "/cases",
    openerRole: "link",
    openerName: "Billing discrepancy on last invoice #1",
    dialogName: "Billing discrepancy on last invoice #1",
    closeName: "Close case detail"
  },
  {
    route: "/campaigns",
    openerRole: "link",
    openerName: "Spring Fleet Lead Push",
    dialogName: "Spring Fleet Lead Push",
    closeName: "Close campaign detail"
  },
  {
    route: "/knowledge",
    openerRole: "link",
    openerName: "Resolve billing discrepancy tickets",
    dialogName: "Resolve billing discrepancy tickets",
    closeName: "Close knowledge article detail"
  }
] as const;

for (const check of drawerChecks) {
  test(`${check.route} drawer exposes modal semantics and keyboard close focus`, async ({
    page
  }) => {
    await page.goto(check.route);

    const opener = page.getByRole(check.openerRole, {
      name: check.openerName
    }).first();
    await expect(opener).toBeVisible();
    await opener.focus();
    await expect(opener).toBeFocused();
    await page.keyboard.press("Enter");

    const dialog = page.getByRole("dialog", { name: check.dialogName });
    await expect(dialog).toBeVisible();
    await expect(dialog).toHaveAttribute("aria-modal", "true");

    const closeButton = dialog.getByRole("button", { name: check.closeName });
    await expect(closeButton).toBeFocused();

    await page.keyboard.press("Enter");
    await expect(dialog).toHaveCount(0);
  });
}
