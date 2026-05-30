import { expect, test } from "@playwright/test";

test("version routes expose both websites", async ({ page }) => {
  await page.goto("/versionA");
  await expect(page.getByRole("heading", { level: 1 })).toContainText(
    "staybnb",
  );
  await expect(page.getByText("Variant A baseline")).toBeVisible();

  await page.goto("/versionB");
  await expect(
    page.getByRole("heading", {
      name: /Homes with character, ready to explore/i,
    }),
  ).toBeVisible();
  await page.getByTestId("category-tab-Cabins").click();
  await expect(page.getByText("Tahoe Glass Cabin")).toBeVisible();
  await page.getByTestId("stayfinder-listing-tahoe-glass-cabin").click();
  await expect(page.getByTestId("stayfinder-detail")).toBeVisible();
  await page.getByTestId("stayfinder-request").click();
  await expect(page.getByTestId("stayfinder-modal")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: /Request sent/i }),
  ).toBeVisible();
  await page.getByTestId("stayfinder-modal-close").click();
  await expect(page.getByTestId("stayfinder-modal")).toBeHidden();

  await page.goto("/eval");
  await expect(
    page.getByRole("heading", {
      name: /Stay with a local when traveling/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /2026 Services/i }).click();
  await expect(
    page.getByRole("heading", { name: /Homes, Experiences, and Services/i }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/eval#\/v\/2026-05-01-services-era/);
});
