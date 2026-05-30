import { expect, test } from "@playwright/test";
import { buildExperimentCases } from "../src/lib/buildExperimentCases";

const requiredVariantTestIds = [
  "variant-label",
  "search-input",
  "search-button",
  "filter-button",
  "listing-card-0",
  "listing-card-1",
  "checkout-button",
  "total-price",
  "cancellation-policy",
  "checkout-summary",
];

for (const variant of ["A", "B"] as const) {
  test(`Variant ${variant} exposes the UserTwin synthetic-user flow`, async ({
    page,
  }) => {
    await page.goto(`/modal-version${variant}`);

    await expect(page.getByTestId("variant-label")).toContainText(
      variant === "A" ? "Variant A" : "Variant B",
    );
    await expect(page.getByTestId("client-ready")).toBeAttached();
    await page.getByTestId("search-input").fill("San Francisco");
    await page.getByTestId("search-button").click();

    await expect(page.getByTestId("listing-card-0")).toBeVisible();
    await expect(page.getByTestId("listing-card-1")).toBeVisible();
    await page.getByTestId("listing-card-0").click();
    await page.getByTestId("checkout-button").click();

    for (const testId of requiredVariantTestIds) {
      await expect(page.getByTestId(testId)).toBeVisible();
    }
  });
}

test("dashboard renders fallback Modal results for the hackathon demo", async ({
  page,
}) => {
  await page.goto("/dashboard");

  await expect(
    page.getByRole("heading", { name: "UserTwin Modal Agent Dashboard" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Run Modal Agent Swarm" }),
  ).toBeVisible();
  await expect(page.getByLabel("Version A URL")).toBeVisible();
  await expect(page.getByLabel("Version B URL")).toBeVisible();

  await page.getByRole("button", { name: "Use fallback demo results" }).click();

  await expect(page.getByTestId("dashboard-status")).toContainText("fallback");
  await expect(page.getByTestId("result-source")).toContainText("fallback");
  await expect(page.getByTestId("total-runs")).toContainText("4");
  await expect(page.getByTestId("variant-summary-A")).toContainText(
    "Variant A",
  );
  await expect(page.getByTestId("variant-summary-B")).toContainText(
    "Variant B",
  );
  await expect(page.getByTestId("raw-runs-table")).toContainText(
    "Budget traveler",
  );
  await expect(page.getByTestId("improvement-cards")).toContainText(
    "Show total price",
  );
});

test("run-agents API returns summarized fallback data without Modal", async ({
  request,
}) => {
  const response = await request.post("/api/modal/run-agents", {
    data: {
      useFallback: true,
    },
  });

  expect(response.ok()).toBe(true);

  const payload = await response.json();

  expect(payload.source).toBe("fallback");
  expect(payload.totalRuns).toBe(4);
  expect(payload.summary.A.runs).toBe(2);
  expect(payload.summary.A.successRate).toBe(0.5);
  expect(payload.summary.B.successRate).toBe(1);
  const topIssues = payload.summary.A.topIssues.map(
    ({ issue }: { issue: string }) => issue,
  );
  expect(topIssues).toContain("pet_friendly_signal_not_visible");
});

test("dashboard exposes concrete operation logs for agent runs", async ({
  page,
}) => {
  await page.goto("/dashboard");
  await page.getByRole("button", { name: "Use fallback demo results" }).click();

  await expect(page.getByTestId("raw-runs-table")).toContainText("Operation log");
  await expect(page.getByTestId("raw-runs-table")).toContainText("open_variant");
  await expect(page.getByTestId("raw-runs-table")).toContainText("search_location");
  await expect(page.getByTestId("raw-runs-table")).toContainText("submit_search");
});

test("experiment cases can target two independent A/B website URLs", () => {
  const cases = buildExperimentCases({
    baseUrl: "https://legacy-root.example",
    variantUrls: {
      A: "https://github-pages.example/version-a",
      B: "https://github-pages.example/version-b",
    },
    personas: [
      {
        id: "budget",
        name: "Budget traveler",
        description: "Looks for transparent pricing.",
        constraints: ["price"],
      },
    ],
    tasks: [
      {
        id: "checkout",
        name: "Complete checkout",
        goal: "Reach checkout.",
        successCriteria: ["checkout reached"],
      },
    ],
    runsPerCase: 1,
  });

  expect(cases).toHaveLength(2);
  expect(cases[0]).toMatchObject({
    run_id: "a_budget_checkout_0",
    variant: "A",
    url: "https://github-pages.example/version-a",
  });
  expect(cases[1]).toMatchObject({
    run_id: "b_budget_checkout_0",
    variant: "B",
    url: "https://github-pages.example/version-b",
  });
});
