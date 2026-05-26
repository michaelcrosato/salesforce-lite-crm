import { expect, type Page, test } from "@playwright/test";

const duplicateKeyWarningPattern =
  /Encountered two children with the same key|unique "key" prop|same key/i;

const routeChecks = [
  { path: "/dashboard", heading: "Dashboard" },
  { path: "/leads", heading: "Lead Inbox" },
  { path: "/orders", heading: "Dealer Orders" },
  { path: "/areas", heading: "Areas" },
  { path: "/forecast", heading: "Forecast Simulator" },
  { path: "/accounts", heading: "Accounts" },
  { path: "/contacts", heading: "Contacts" },
  { path: "/deals", heading: "Deals" },
  { path: "/tasks", heading: "Tasks" },
  { path: "/cases", heading: "Cases" },
  { path: "/campaigns", heading: "Campaigns" },
  { path: "/reports/activity-volume", heading: "Activity Volume" },
  { path: "/knowledge", heading: "Knowledge Articles" }
];

test("current CRM surfaces do not emit duplicate React key warnings", async ({
  page
}) => {
  const duplicateKeyWarnings = captureDuplicateKeyWarnings(page);

  for (const route of routeChecks) {
    await page.goto(route.path);
    await expect(
      page.getByRole("heading", { exact: true, name: route.heading }).first()
    ).toBeVisible();

    if (route.path === "/leads") {
      const firstRoutingToggle = page.getByTestId("routing-detail-toggle").first();
      await firstRoutingToggle.click();
      await expect(firstRoutingToggle).toHaveAttribute("aria-expanded", "true");
    }
  }

  await page.goto("/dashboard");
  await page.locator("body").click();
  await page.keyboard.down("Control");
  await page.keyboard.press("KeyK");
  await page.keyboard.up("Control");
  await page.getByLabel("Search CRM").fill("Northstar");
  await expect(
    page.getByTestId("command-palette").getByRole("link", {
      name: /Northstar Freight/
    })
  ).toBeVisible();

  expect(duplicateKeyWarnings).toEqual([]);
});

function captureDuplicateKeyWarnings(page: Page): string[] {
  const warnings: string[] = [];
  page.on("console", (message) => {
    const text = message.text();
    if (duplicateKeyWarningPattern.test(text)) {
      warnings.push(`${message.type()}: ${text}`);
    }
  });
  return warnings;
}
