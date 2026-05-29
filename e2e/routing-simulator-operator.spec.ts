import { expect, test, type Page } from "@playwright/test";
import { EXCLUDED_ROUTES } from "../lib/featureFlags";
import { prisma } from "../lib/prisma";

test("routing simulator preview shows read-only assignment and blocker details", async ({
  page
}) => {
  await page.goto("/reports");

  const panel = page.getByTestId("routing-simulator-operator");
  await expect(panel).toBeVisible();
  await expect(panel).toHaveAttribute("data-hydrated", "true");
  await expect(
    panel.getByTestId("routing-simulator-summary-writes")
  ).toContainText("None");

  await panel.getByTestId("routing-simulator-input").fill(
    JSON.stringify(
      {
        leads: [
          {
            referenceId: "sim-route-vancouver",
            firstName: "Avery",
            lastName: "Chen",
            postalCode: "V5K 0A1",
            country: "CA",
            source: "e2e-routing-simulator"
          },
          {
            referenceId: "sim-no-area",
            firstName: "Jordan",
            lastName: "Lee",
            postalCode: "Z9Z 9Z9",
            country: "CA",
            source: "e2e-routing-simulator"
          }
        ]
      },
      null,
      2
    )
  );
  await panel.getByTestId("routing-simulator-submit").click();

  await expect(panel.getByTestId("routing-simulator-result-panel")).toBeVisible();
  await expect(
    panel.getByTestId("routing-simulator-summary-assigned")
  ).toContainText("1");
  await expect(
    panel.getByTestId("routing-simulator-summary-blocked")
  ).toContainText("1");
  await expect(panel.getByTestId("routing-simulator-summary-rate")).toContainText(
    "50%"
  );

  await expect(panel.getByTestId("routing-simulator-issue-table")).toContainText(
    "no area match"
  );
  await expect(
    panel.getByTestId("routing-simulator-capacity-table")
  ).toContainText("Simulator would add 1 hypothetical lead");
  await expect(panel.getByTestId("routing-simulator-row-table")).toContainText(
    "sim-route-vancouver"
  );
  await expect(panel.getByTestId("routing-simulator-row-table")).toContainText(
    "assigned"
  );
  await expect(panel.getByTestId("routing-simulator-row-table")).toContainText(
    "sim-no-area"
  );
  await expect(panel.getByTestId("routing-simulator-row-table")).toContainText(
    "blocked"
  );
  await expect(panel.getByTestId("routing-simulator-step-table")).toContainText(
    "normalize"
  );
  await expect(panel.getByTestId("routing-simulator-step-table")).toContainText(
    "match area"
  );
  await expect(panel.getByTestId("routing-simulator-step-table")).toContainText(
    "select"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Leads off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Routing events off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Dealer orders off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Scenario persistence off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Simulator runs off"
  );
});

test("routing simulator preview preserves live routing state and excluded routes", async ({
  page
}) => {
  const before = await liveRoutingState();

  await page.goto("/reports");

  const panel = page.getByTestId("routing-simulator-operator");
  await expect(panel).toHaveAttribute("data-hydrated", "true");
  await panel.getByTestId("routing-simulator-input").fill(
    JSON.stringify(
      {
        leads: [
          {
            referenceId: "guard-live-route",
            firstName: "Nia",
            lastName: "Stone",
            postalCode: "V5K 0A1",
            country: "CA",
            source: "e2e-routing-simulator"
          }
        ]
      },
      null,
      2
    )
  );
  await panel.getByTestId("routing-simulator-submit").click();

  await expect(panel.getByTestId("routing-simulator-result-panel")).toBeVisible();
  await expect(
    panel.getByTestId("routing-simulator-summary-assigned")
  ).toContainText("1");
  await expect(panel.getByTestId("routing-simulator-summary-blocked")).toContainText(
    "0"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Leads off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Routing events off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Dealer orders off"
  );

  expect(await liveRoutingState()).toEqual(before);

  for (const route of EXCLUDED_ROUTES) {
    await expectExcludedRoute(page, route.replaceAll("[id]", "sim-preview"));
  }
});

test("routing simulator preview applies hypothetical capacity windows", async ({
  page
}) => {
  const before = await liveRoutingState();
  const capacityDate = todayCalendarDate();

  await page.goto("/reports");

  const panel = page.getByTestId("routing-simulator-operator");
  await expect(panel).toHaveAttribute("data-hydrated", "true");
  await panel.getByTestId("routing-simulator-input").fill(
    JSON.stringify(
      {
        leads: [
          {
            referenceId: "capacity-overflow",
            firstName: "Mara",
            lastName: "Singh",
            postalCode: "V5K 0A1",
            country: "CA",
            source: "e2e-routing-simulator"
          },
          {
            referenceId: "capacity-blocked",
            firstName: "Riley",
            lastName: "Hart",
            postalCode: "V5K 0A1",
            country: "CA",
            source: "e2e-routing-simulator"
          }
        ]
      },
      null,
      2
    )
  );
  await panel.getByTestId("routing-simulator-capacity-input").fill(
    JSON.stringify(
      {
        windows: [
          {
            dealerOrderId: "dealer-order-vancouver-northstar",
            label: "Northstar closed today",
            startsOn: capacityDate,
            endsOn: capacityDate,
            dailyCap: 0
          },
          {
            dealerOrderId: "dealer-order-vancouver-cascade",
            label: "Cascade one lead today",
            startsOn: capacityDate,
            endsOn: capacityDate,
            dailyCap: 1
          }
        ]
      },
      null,
      2
    )
  );
  await panel.getByTestId("routing-simulator-submit").click();

  await expect(panel.getByTestId("routing-simulator-result-panel")).toBeVisible();
  await expect(
    panel.getByTestId("routing-simulator-capacity-summary")
  ).toContainText("Applied");
  await expect(
    panel.getByTestId("routing-simulator-capacity-summary")
  ).toContainText("Windows");
  await expect(
    panel.getByTestId("routing-simulator-capacity-summary")
  ).toContainText("Blocked by capacity");
  await expect(
    panel.getByTestId("routing-simulator-capacity-outcome-table")
  ).toContainText("daily cap reached");
  await expect(
    panel.getByTestId("routing-simulator-capacity-table")
  ).toContainText("Vancouver robotics dealer program");
  await expect(panel.getByTestId("routing-simulator-row-table")).toContainText(
    "capacity-overflow"
  );
  await expect(panel.getByTestId("routing-simulator-row-table")).toContainText(
    "capacity-blocked"
  );
  await expect(panel.getByTestId("routing-simulator-step-table")).toContainText(
    "apply capacity windows"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Leads off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Dealer orders off"
  );
  await expect(panel.getByTestId("routing-simulator-write-flags")).toContainText(
    "Pacing engine off"
  );

  expect(await liveRoutingState()).toEqual(before);
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

function todayCalendarDate() {
  return new Date().toISOString().slice(0, 10);
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
