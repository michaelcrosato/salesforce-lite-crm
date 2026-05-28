import { expect, test, type Page } from "@playwright/test";
import { EXCLUDED_ROUTES } from "../lib/featureFlags";
import { prisma } from "../lib/prisma";

test("routing fairness review shows read-only issue summaries and metrics", async ({
  page
}) => {
  await page.goto("/reports");

  const panel = page.getByTestId("routing-fairness-operator");
  await expect(panel).toBeVisible();
  await expect(panel.getByTestId("routing-fairness-summary-writes")).toContainText(
    "None"
  );

  await panel.getByTestId("routing-fairness-input").fill(
    JSON.stringify(
      {
        leads: [
          {
            referenceId: "fair-route-vancouver",
            firstName: "Avery",
            lastName: "Chen",
            postalCode: "V5K 0A1",
            country: "CA",
            source: "e2e-routing-fairness"
          },
          {
            referenceId: "fair-thin-context",
            postalCode: "V5K 0A1",
            country: "CA"
          },
          {
            referenceId: "fair-no-area",
            firstName: "Jordan",
            postalCode: "Z9Z 9Z9",
            country: "CA",
            source: "e2e-routing-fairness"
          }
        ]
      },
      null,
      2
    )
  );
  await panel.getByTestId("routing-fairness-submit").click();

  await expect(panel.getByTestId("routing-fairness-result-panel")).toBeVisible();
  await expect(panel.getByTestId("routing-fairness-summary-assigned")).toContainText(
    "2"
  );
  await expect(panel.getByTestId("routing-fairness-summary-blocked")).toContainText(
    "1"
  );
  await expect(panel.getByTestId("routing-fairness-summary-issues")).not.toContainText(
    "0"
  );

  await expect(panel.getByTestId("routing-fairness-issue-table")).toContainText(
    "blocked routing"
  );
  await expect(panel.getByTestId("routing-fairness-issue-table")).toContainText(
    "thin lead quality"
  );
  await expect(panel.getByTestId("routing-fairness-row-table")).toContainText(
    "fair-route-vancouver"
  );
  await expect(panel.getByTestId("routing-fairness-row-table")).toContainText(
    "fair-thin-context"
  );
  await expect(panel.getByTestId("routing-fairness-row-table")).toContainText(
    "fair-no-area"
  );
  await expect(panel.getByTestId("routing-fairness-metric-table")).toContainText(
    "Pace gap"
  );
  await expect(panel.getByTestId("routing-fairness-metric-table")).toContainText(
    "Quota saturation"
  );
  await expect(panel.getByTestId("routing-fairness-metric-table")).toContainText(
    "Lead quality proxy"
  );
  await expect(panel.getByTestId("routing-fairness-metric-table")).toContainText(
    "SLA risk"
  );
  await expect(panel.getByTestId("routing-fairness-write-flags")).toContainText(
    "Leads off"
  );
  await expect(panel.getByTestId("routing-fairness-write-flags")).toContainText(
    "Routing events off"
  );
  await expect(panel.getByTestId("routing-fairness-write-flags")).toContainText(
    "Dealer orders off"
  );
  await expect(panel.getByTestId("routing-fairness-write-flags")).toContainText(
    "Fairness weights off"
  );
  await expect(panel.getByTestId("routing-fairness-write-flags")).toContainText(
    "Review history off"
  );
});

test("routing fairness review preserves live routing state and excluded routes", async ({
  page
}) => {
  const before = await liveRoutingState();

  await page.goto("/reports");

  const panel = page.getByTestId("routing-fairness-operator");
  await panel.getByTestId("routing-fairness-input").fill(
    JSON.stringify(
      {
        leads: [
          {
            referenceId: "fair-guard-live-route",
            firstName: "Nia",
            lastName: "Stone",
            postalCode: "V5K 0A1",
            country: "CA",
            source: "e2e-routing-fairness"
          }
        ]
      },
      null,
      2
    )
  );
  await panel.getByTestId("routing-fairness-submit").click();

  await expect(panel.getByTestId("routing-fairness-result-panel")).toBeVisible();
  await expect(panel.getByTestId("routing-fairness-summary-assigned")).toContainText(
    "1"
  );
  await expect(panel.getByTestId("routing-fairness-summary-blocked")).toContainText(
    "0"
  );
  await expect(panel.getByTestId("routing-fairness-write-flags")).toContainText(
    "Leads off"
  );
  await expect(panel.getByTestId("routing-fairness-write-flags")).toContainText(
    "Routing assignments off"
  );
  await expect(panel.getByTestId("routing-fairness-write-flags")).toContainText(
    "Pacing engine off"
  );

  expect(await liveRoutingState()).toEqual(before);

  for (const route of EXCLUDED_ROUTES) {
    await expectExcludedRoute(page, route.replaceAll("[id]", "fair-preview"));
  }
});

async function liveRoutingState() {
  const [counts, dealerOrders, currentMonthAssignments] = await Promise.all([
    Promise.all([
      prisma.lead.count(),
      prisma.activity.count({
        where: {
          type: "routing_event"
        }
      }),
      prisma.dealerOrder.count(),
      prisma.area.count()
    ]),
    prisma.dealerOrder.findMany({
      select: {
        id: true,
        monthlyQuota: true,
        status: true
      },
      orderBy: {
        id: "asc"
      }
    }),
    prisma.lead.findMany({
      where: {
        assignedOrderId: {
          not: null
        },
        createdAt: currentMonthWhere()
      },
      select: {
        id: true,
        assignedOrderId: true,
        status: true,
        assignmentReason: true
      },
      orderBy: {
        id: "asc"
      }
    })
  ]);
  const [leadCount, routingEventCount, dealerOrderCount, areaCount] = counts;

  return {
    counts: {
      leadCount,
      routingEventCount,
      dealerOrderCount,
      areaCount
    },
    dealerOrders,
    currentMonthAssignments
  };
}

function currentMonthWhere() {
  const now = new Date();

  return {
    gte: new Date(now.getFullYear(), now.getMonth(), 1),
    lt: new Date(now.getFullYear(), now.getMonth() + 1, 1)
  };
}

async function expectExcludedRoute(page: Page, route: string) {
  const response = await page.goto(route);

  if (response?.status() === 200) {
    await expect(
      page.locator('[data-testid="excluded-route-placeholder"]')
    ).toBeVisible();
    return;
  }

  expect(response?.status()).toBe(404);
}
