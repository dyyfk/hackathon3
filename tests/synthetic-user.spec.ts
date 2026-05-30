import { expect, test } from "@playwright/test";
import { listings } from "../src/data/listings";
import { runSyntheticABTest } from "../src/lib/syntheticOptimization";
import {
  projectSyntheticJourney,
  projectSyntheticUserBehavior,
} from "../src/lib/syntheticUser";

test("synthetic user behavior is projected from profile and task", () => {
  const budgetJourney = projectSyntheticJourney({
    profile: "budget_planner",
    taskId: "find_budget_stay",
    seed: "profile-demo",
  });
  const quickJourney = projectSyntheticJourney({
    profile: "quick_booker",
    taskId: "complete_checkout",
    seed: "profile-demo",
  });

  const budgetActions = budgetJourney.map((decision) => decision.action.id);
  const quickActions = quickJourney.map((decision) => decision.action.id);

  expect(budgetActions).toContain("open_filters");
  expect(budgetActions).toContain("apply_task_filters");
  expect(quickActions).not.toContain("open_filters");
  expect(quickActions).toContain("confirm_reservation");
});

test("synthetic decisions expose score, sampling, and dwell explanations", () => {
  const decision = projectSyntheticUserBehavior({
    profile: "budget_planner",
    taskId: "find_budget_stay",
    screen: "results",
    seed: "explain-demo",
  });

  expect(decision.candidates.length).toBeGreaterThan(1);
  expect(decision.selection.probabilities.length).toBe(decision.candidates.length);
  expect(decision.action.scoreBreakdown.total).toBe(decision.action.score);
  expect(decision.action.scoreBreakdown.experienceAdjustment).toBe(0);
  expect(decision.dwellBreakdown.total).toBe(decision.dwellMs);
  expect(decision.dwellBreakdown.experienceMultiplier).toBe(1);
  expect(decision.dwellBreakdown.subtotalBeforeMultipliers).toBeGreaterThan(0);
});

test("synthetic A/B feedback produces a self-improvement projection", () => {
  const report = runSyntheticABTest({ seedPrefix: "improvement-proof" });

  expect(report.variants.map((variant) => variant.variantId)).toEqual([
    "A",
    "B",
  ]);
  expect(report.sampleSizePerVariant).toBeGreaterThan(0);
  expect(report.recommendations.length).toBeGreaterThan(0);
  expect(report.optimizedVariant.appliedRecommendationIds).toContain(
    report.recommendations[0].id,
  );
  expect(report.optimizedProjection.summary.score).toBeGreaterThanOrEqual(
    report.winner.score,
  );
  expect(report.featureCandidate.title).toBeTruthy();
  expect(report.featureCandidate.mvp.length).toBeGreaterThan(0);
  expect(report.featureCandidate.evidence.length).toBeGreaterThan(0);
});

test("policy-sensitive profile checks cancellation before reserving", () => {
  const seattleListing = listings.find((listing) => listing.location === "Seattle");

  expect(seattleListing).toBeTruthy();

  const beforePolicy = projectSyntheticUserBehavior({
    profile: "policy_checker",
    taskId: "compare_cancellation",
    screen: "detail",
    selectedListing: seattleListing,
    seed: "policy-demo",
  });
  const afterPolicy = projectSyntheticUserBehavior({
    profile: "policy_checker",
    taskId: "compare_cancellation",
    screen: "detail",
    selectedListing: seattleListing,
    history: ["scroll_to_policy"],
    seed: "policy-demo",
  });

  expect(beforePolicy.action.id).toBe("scroll_to_policy");
  expect(afterPolicy.action.id).toBe("reserve_listing");
  expect(beforePolicy.dwellMs).toBeGreaterThan(afterPolicy.dwellMs);
});

test("synthetic inspector renders profile and candidate breakdowns", async ({
  page,
}) => {
  await page.goto("/synthetic");

  await expect(page.getByRole("heading", { name: /Behavior inspector/i })).toBeVisible();
  await expect(page.getByTestId("synthetic-improvement-panel")).toBeVisible();
  await expect(page.getByText("Synthetic A/B feedback")).toBeVisible();
  await expect(page.getByText("Projected self-improvement")).toBeVisible();
  await expect(page.getByTestId("synthetic-feature-candidate")).toBeVisible();
  await expect(page.getByText("Next feature candidate")).toBeVisible();
  await expect(page.getByTestId("synthetic-step-1")).toBeVisible();
  await expect(page.getByText("Candidate actions")).toBeVisible();
  await expect(page.getByText("Dwell breakdown")).toBeVisible();

  await page.getByTestId("synthetic-profile-select").selectOption("quick_booker");
  await page.getByTestId("synthetic-task-select").selectOption("complete_checkout");
  await expect(page.getByRole("heading", { name: "Quick booker" })).toBeVisible();
  await expect(
    page.getByTestId("synthetic-step-4").getByText("confirm_reservation"),
  ).toBeVisible();
});
