import { expect, test } from "@playwright/test";

const responsiveRoutes = [
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
  { path: "/reports", heading: "Reports" },
  { path: "/knowledge", heading: "Knowledge Articles" }
] as const;

const responsiveViewports = [
  { name: "mobile", width: 390, height: 844 },
  { name: "desktop", width: 1440, height: 900 }
] as const;

test.describe("responsive layout", () => {
  for (const viewport of responsiveViewports) {
    test(`current CRM routes stay inside the ${viewport.name} viewport`, async ({
      page
    }) => {
      await page.setViewportSize({
        width: viewport.width,
        height: viewport.height
      });

      for (const route of responsiveRoutes) {
        await page.goto(route.path);
        await expect(
          page.getByRole("heading", { exact: true, name: route.heading })
        ).toBeVisible();

        const metrics = await page.evaluate(() => {
          const scrollingElement =
            document.scrollingElement ?? document.documentElement;
          const originalScrollX = window.scrollX;
          const originalScrollY = window.scrollY;

          window.scrollTo(10000, originalScrollY);
          const probedScrollX = window.scrollX;
          window.scrollTo(originalScrollX, originalScrollY);

          return {
            documentWidth: scrollingElement.scrollWidth,
            horizontalScrollX: probedScrollX,
            viewportWidth: scrollingElement.clientWidth
          };
        });

        expect(
          metrics.horizontalScrollX,
          `${route.path} should not expose horizontal page scrolling`
        ).toBe(0);
        expect(
          metrics.documentWidth,
          `${route.path} should not create document-level horizontal overflow`
        ).toBeLessThanOrEqual(metrics.viewportWidth + 1);
      }
    });
  }
});
