import { expect, test } from "@playwright/test";

test("lead inbox exposes follow-up readiness packets", async ({ page }) => {
  await page.goto("/leads");

  const panel = page.getByTestId("lead-follow-up-panel");
  await expect(panel).toBeVisible();
  await expect(
    panel.getByRole("heading", { name: "Lead Follow-Up Readiness" })
  ).toBeVisible();

  for (const testid of [
    "lead-follow-up-summary-review",
    "lead-follow-up-summary-urgent",
    "lead-follow-up-summary-high",
    "lead-follow-up-summary-unrouted",
    "lead-follow-up-summary-routed",
    "lead-follow-up-summary-stale"
  ]) {
    await expect(page.getByTestId(testid)).toContainText(/\d/);
  }

  const packetList = page.getByTestId("lead-follow-up-packet-list");
  await expect(packetList).toBeVisible();

  const packetCard = page.getByTestId("lead-follow-up-packet-card").first();
  await expect(packetCard).toBeVisible();
  await expect(packetCard).toContainText(/Review|Contact|Monitor/);
  await expect(packetCard).toContainText(/Urgent|High|Normal|Low/);
  await expect(packetCard).toContainText(/updated \d+d ago/);
  await expect(packetCard).toHaveAttribute("href", /\/leads\/.+/);

  const writeFlags = page.getByTestId("lead-follow-up-write-flags");
  await expect(writeFlags).toContainText("Database off");
  await expect(writeFlags).toContainText("Tasks off");
  await expect(writeFlags).toContainText("Routing off");
  await expect(writeFlags).toContainText("Provider calls off");
});
