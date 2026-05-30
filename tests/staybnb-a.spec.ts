import { expect, test } from "@playwright/test";

test("A variant SPA: user can search, filter, and complete mock checkout", async ({
  page,
}) => {
  await page.goto("/versionA?variant=A&actor=agent&task=complete_checkout");

  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "staybnb",
  );
  await page.getByTestId("location-input").fill("San Francisco");
  await page.getByTestId("checkin-input").fill("2026-06-14");
  await page.getByTestId("checkout-input").fill("2026-06-16");
  await page.getByTestId("guests-button").click();
  await page.getByTestId("adults-increment").click();
  await page.getByTestId("search-submit").click();

  await expect(page).toHaveURL(/\/versionA\?variant=A&actor=agent&task=complete_checkout/);
  await expect(page.getByTestId("spa-search-results")).toBeVisible();
  await expect(page.getByTestId("listing-card-image-sf-002")).toHaveAttribute(
    "src",
    /\/mock-stays\/stay-/,
  );
  await expect(page.getByTestId("spa-results-heading")).toContainText(
    "Stays in San Francisco",
  );

  await page.getByTestId("filters-button").click();
  await expect(page.getByTestId("filters-modal")).toBeVisible();
  await page.getByTestId("pet-friendly-checkbox").check();
  await page.getByTestId("apply-filters-button").click();
  await expect(page.getByTestId("filters-modal")).toBeHidden();

  await page.getByTestId("listing-card-open-sf-002").click();
  await expect(page.getByTestId("listing-detail-page")).toBeVisible();
  await expect(page.getByTestId("detail-title")).toBeVisible();
  await expect(page.getByTestId("detail-gallery-image")).toHaveAttribute(
    "src",
    /\/mock-stays\/stay-/,
  );

  await page.getByTestId("reserve-button").click();
  await expect(page.getByTestId("checkout-page")).toBeVisible();
  await expect(page.getByTestId("checkout-price-breakdown")).toBeVisible();
  await page.getByTestId("confirm-reservation-button").click();
  await expect(page.getByTestId("reservation-success")).toBeVisible();

  const events = await page.evaluate(() =>
    JSON.parse(window.localStorage.getItem("staybnb_ux_events") || "[]"),
  );

  expect(events.some((event: { type: string }) => event.type === "page_view")).toBe(
    true,
  );
  expect(events.some((event: { type: string }) => event.type === "click")).toBe(
    true,
  );
  expect(
    events.some((event: { type: string }) => event.type === "listing_open"),
  ).toBe(true);
  expect(
    events.some((event: { type: string }) => event.type === "checkout_success"),
  ).toBe(true);
});
