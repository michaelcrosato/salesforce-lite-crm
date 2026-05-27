import { expect, test, type Page } from "@playwright/test";

test.describe("approval readiness reports surface", () => {
  test("renders approval readiness without decision or mutation controls", async ({
    page
  }) => {
    await page.goto("/reports");

    const panel = page.getByTestId("approval-readiness-operator");
    await expect(panel).toBeVisible();
    await expect(
      panel.getByTestId("approval-readiness-summary-supported")
    ).toContainText("4");
    await expect(
      panel.getByTestId("approval-readiness-summary-blocked")
    ).toContainText("6");
    await expect(
      panel.getByTestId("approval-readiness-summary-approval-needed")
    ).toContainText("4");
    await expect(
      panel.getByTestId("approval-readiness-summary-writes")
    ).toContainText("None");

    const registryTable = panel.getByTestId("approval-readiness-registry-table");
    await expect(registryTable).toContainText("AI action proposal approval");
    await expect(registryTable).toContainText("Bulk action execution approval");
    await expect(registryTable).toContainText("Approval policy execution");
    await expect(
      panel.getByTestId("approval-readiness-subject-supported")
    ).toHaveCount(4);
    await expect(
      panel.getByTestId("approval-readiness-subject-blocked")
    ).toHaveCount(6);

    const packetTable = panel.getByTestId("approval-readiness-packet-table");
    await expect(packetTable).toContainText("AI task creation proposal");
    await expect(packetTable).toContainText("External AI provider request");
    await expect(
      panel.getByTestId("approval-readiness-packet-approval-needed")
    ).toHaveCount(4);
    await expect(
      panel.getByTestId("approval-readiness-packet-not-needed")
    ).toHaveCount(1);
    await expect(
      panel.getByTestId("approval-readiness-packet-blocked")
    ).toHaveCount(1);
    await expect(packetTable).toContainText("Approval required");
    await expect(packetTable).toContainText("Execution off / writes off");
    await expect(packetTable).toContainText("subject blocked");

    const guardrails = panel.getByTestId("approval-readiness-guardrails");
    await expect(guardrails).toContainText("Decision controls absent");
    await expect(guardrails).toContainText("Execution disabled");
    await expect(guardrails).toContainText("Provider scope blocked");
    await expect(guardrails).toContainText("Route scope unchanged");

    const writeFlags = panel.getByTestId("approval-readiness-write-flags");
    await expect(writeFlags).toContainText("Database off");
    await expect(writeFlags).toContainText("Approval decisions off");
    await expect(writeFlags).toContainText("Approvals off");
    await expect(writeFlags).toContainText("Action execution off");
    await expect(writeFlags).toContainText("External services off");

    await expect(panel.getByRole("button")).toHaveCount(0);
    await expect(panel.getByRole("link")).toHaveCount(0);
  });

  for (const route of ["/approval-readiness", "/reports/approval-readiness"]) {
    test(`keeps ${route} outside the approval readiness surface`, async ({
      page
    }) => {
      await expectUnavailableRoute(page, route);
    });
  }
});

async function expectUnavailableRoute(page: Page, route: string) {
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
