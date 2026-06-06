import { expect, test } from "@playwright/test";

test("demo launcher presents five distinct demo modes", async ({ page }) => {
  await page.goto("/demos");

  await expect(
    page.getByRole("heading", {
      name: "Five ways to demo the agentic A/B lab",
    }),
  ).toBeVisible();
  await expect(page.getByTestId("demo-runner-status")).toContainText("5");
  await expect(page.getByTestId("demo-runner-status")).toContainText("500");

  for (const demoId of [
    "iteration-loop",
    "checkout-trust",
    "filter-rail",
    "external-adapter",
    "trace-to-ticket",
  ]) {
    await expect(page.getByTestId(`demo-card-${demoId}`)).toBeVisible();
  }

  await expect(page.getByTestId("demo-detail-iteration-loop")).toContainText(
    "A to E self-improvement cockpit",
  );
  await expect(page.getByTestId("demo-detail-iteration-loop")).toContainText(
    "Score lift",
  );

  await page.getByTestId("demo-card-checkout-trust").click();
  await expect(page.getByTestId("demo-detail-checkout-trust")).toContainText(
    "Checkout trust rescue",
  );
  await expect(page.getByTestId("demo-detail-checkout-trust")).toContainText(
    "Gen A winner",
  );

  await page.getByTestId("demo-card-external-adapter").click();
  await expect(page.getByTestId("demo-detail-external-adapter")).toContainText(
    "External page adapter challenge",
  );
  await expect(page.getByTestId("demo-detail-external-adapter")).toContainText(
    "Adapter agents",
  );

  await page.getByTestId("demo-card-trace-to-ticket").click();
  await expect(page.getByTestId("demo-detail-trace-to-ticket")).toContainText(
    "Agent trace to product ticket",
  );
  await expect(page.getByTestId("demo-detail-trace-to-ticket")).toContainText(
    "Use fallback demo results",
  );
  await expect(page.getByTestId("demo-open-route")).toHaveAttribute(
    "href",
    "/dashboard",
  );
});
