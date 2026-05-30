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
      name: /Stay with a local when traveling/i,
    }),
  ).toBeVisible();
  await page.getByRole("button", { name: /2026 Services/i }).click();
  await expect(
    page.getByRole("heading", { name: /Homes, Experiences, and Services/i }),
  ).toBeVisible();
  await expect(page).toHaveURL(/\/versionB#\/v\/2026-05-01-services-era/);
});
