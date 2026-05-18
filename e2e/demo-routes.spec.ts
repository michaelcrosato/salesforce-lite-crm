import { expect, test } from "@playwright/test";

const primaryRoutes = [
  { link: "Dashboard", heading: "Dashboard", path: "/dashboard" },
  { link: "Contacts", heading: "Contacts", path: "/contacts" },
  { link: "Accounts", heading: "Accounts", path: "/accounts" },
  { link: "Deals", heading: "Deals", path: "/deals" },
  { link: "Leads", heading: "Lead Inbox", path: "/leads" },
  { link: "Orders", heading: "Dealer Orders", path: "/orders" },
  { link: "Areas", heading: "Areas", path: "/areas" },
  { link: "Forecast", heading: "Forecast Simulator", path: "/forecast" },
  { link: "Activities", heading: "Activities", path: "/activities" }
];

test("primary navigation reaches every demo-critical route", async ({ page }) => {
  await page.goto("/dashboard");
  const primaryNav = page.getByRole("navigation", { name: "Primary" });

  for (const route of primaryRoutes) {
    await primaryNav.getByRole("link", { name: route.link }).click();
    await expect(page).toHaveURL(route.path);
    await expect(
      page.getByRole("heading", { exact: true, name: route.heading })
    ).toBeVisible();
  }
});

test("deal query opens the detail drawer without a bracket detail route", async ({
  page
}) => {
  await page.goto("/deals?deal=deal-1");

  await expect(page).toHaveURL("/deals?deal=deal-1");
  await expect(page.getByText("Deal Detail", { exact: true })).toBeVisible();
  // The drawer does not expose a named landmark, so scope to the aside shell.
  await expect(
    page
      .locator("aside")
      .getByRole("heading", { exact: true, name: "Northstar dispatch team rollout" })
  ).toBeVisible();
  // Account links repeat in drawer activity history; href scopes the detail link target.
  const drawerAccountLinks = page
    .locator('aside a[href="/accounts/acct-northstar"]')
    .filter({ hasText: "Northstar Freight" });
  await expect(drawerAccountLinks.first()).toBeVisible();
});

test("lead detail status transitions show persisted UI feedback", async ({ page }) => {
  await page.goto("/leads/lead-1");

  await expect(
    page.getByRole("heading", { exact: true, name: "Sarah Walsh" })
  ).toBeVisible();
  await page.getByLabel("Update lead status").selectOption("contacted");

  await expect(page.getByText("Lead updated", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Update lead status")).toHaveValue("contacted");
});
