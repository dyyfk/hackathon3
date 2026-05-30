import {
  explainSyntheticJourney,
  syntheticUserProfiles,
  type SyntheticActionId,
  type SyntheticExperienceConfig,
  type SyntheticJourneyExplanation,
  type SyntheticScreen,
  type SyntheticTaskId,
} from "@/lib/syntheticUser";

export const syntheticABTaskIds: SyntheticTaskId[] = [
  "find_budget_stay",
  "find_pet_friendly",
  "compare_cancellation",
  "complete_checkout",
];

export const syntheticABSeeds = ["north", "east", "south", "west"];

export const syntheticABVariants: SyntheticExperienceConfig[] = [
  {
    id: "A",
    label: "Variant A baseline",
    description: "Task-first search, filters, listing details, and checkout.",
  },
  {
    id: "B",
    label: "Variant B gallery",
    description: "Image-led browsing with stronger exploration and weaker task cues.",
    actionScoreAdjustments: {
      start_search: -0.25,
      open_filters: -0.85,
      apply_task_filters: -0.3,
      sort_lowest_price: -0.35,
      open_best_listing: 0.55,
      scroll_to_policy: -0.65,
      reserve_listing: -0.35,
      review_price_breakdown: -0.1,
      confirm_reservation: -0.35,
      back_to_results: 0.45,
    },
    screenDwellMultipliers: {
      home: 0.95,
      results: 1.08,
      filters: 1.22,
      detail: 0.96,
      checkout: 1.14,
    },
  },
];

export type SyntheticABFeedbackSummary = {
  filterFrictionRate: number;
  priceFrictionRate: number;
  policyFrictionRate: number;
  backtrackingRate: number;
  checkoutFrictionRate: number;
  totalFrictionRate: number;
};

export type SyntheticABVariantSummary = {
  variantId: string;
  label: string;
  description?: string;
  sessions: number;
  score: number;
  completionRate: number;
  abandonRate: number;
  averageDwellMs: number;
  averageActions: number;
  feedback: SyntheticABFeedbackSummary;
  slowestScreen: {
    screen: SyntheticScreen;
    averageDwellMs: number;
  };
};

export type SyntheticImprovementRecommendation = {
  id: string;
  priority: number;
  title: string;
  rationale: string;
  affectedMetric: keyof SyntheticABFeedbackSummary | "averageDwellMs";
  impact: number;
  confidence: number;
  actionScoreAdjustments?: Partial<Record<SyntheticActionId, number>>;
  screenDwellMultipliers?: Partial<Record<SyntheticScreen, number>>;
};

export type SyntheticImprovedExperienceConfig = SyntheticExperienceConfig & {
  basedOnVariantId: string;
  appliedRecommendationIds: string[];
};

export type SyntheticABTestReport = {
  seedPrefix: string;
  sampleSizePerVariant: number;
  variants: SyntheticABVariantSummary[];
  winner: SyntheticABVariantSummary;
  recommendations: SyntheticImprovementRecommendation[];
  optimizedVariant: SyntheticImprovedExperienceConfig;
  optimizedProjection: {
    summary: SyntheticABVariantSummary;
    scoreUplift: number;
    completionRateUplift: number;
    dwellReductionMs: number;
  };
};

export type SyntheticABTestOptions = {
  variants?: SyntheticExperienceConfig[];
  profileIds?: string[];
  taskIds?: SyntheticTaskId[];
  seeds?: string[];
  seedPrefix?: string;
};

type SyntheticABSessionSignals = {
  filterFriction: boolean;
  priceFriction: boolean;
  policyFriction: boolean;
  backtracking: boolean;
  checkoutFriction: boolean;
};

type SyntheticABSessionResult = {
  completed: boolean;
  abandoned: boolean;
  totalDwellMs: number;
  actionCount: number;
  screenDwell: Record<SyntheticScreen, number>;
  signals: SyntheticABSessionSignals;
};

export function runSyntheticABTest(
  options: SyntheticABTestOptions = {},
): SyntheticABTestReport {
  const variants = options.variants ?? syntheticABVariants;
  const seedPrefix = options.seedPrefix ?? "synthetic-ab";
  const summaries = variants.map((variant) =>
    summarizeVariant(variant, {
      ...options,
      seedPrefix,
    }),
  );
  const ranked = [...summaries].sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const recommendations = buildRecommendations(summaries);
  const winnerVariant =
    variants.find((variant) => variant.id === winner.variantId) ?? variants[0];
  const optimizedVariant = buildOptimizedVariant(
    winnerVariant,
    recommendations,
  );
  const optimizedSummary = summarizeVariant(optimizedVariant, {
    ...options,
    seedPrefix,
  });

  return {
    seedPrefix,
    sampleSizePerVariant: winner.sessions,
    variants: summaries,
    winner,
    recommendations,
    optimizedVariant,
    optimizedProjection: {
      summary: optimizedSummary,
      scoreUplift: round(optimizedSummary.score - winner.score),
      completionRateUplift: round(
        optimizedSummary.completionRate - winner.completionRate,
      ),
      dwellReductionMs: Math.max(
        0,
        Math.round(winner.averageDwellMs - optimizedSummary.averageDwellMs),
      ),
    },
  };
}

function summarizeVariant(
  variant: SyntheticExperienceConfig,
  options: SyntheticABTestOptions & { seedPrefix: string },
): SyntheticABVariantSummary {
  const profileIds =
    options.profileIds ?? syntheticUserProfiles.map((profile) => profile.id);
  const taskIds = options.taskIds ?? syntheticABTaskIds;
  const seeds = options.seeds ?? syntheticABSeeds;
  const sessions: SyntheticABSessionResult[] = [];

  for (const profileId of profileIds) {
    for (const taskId of taskIds) {
      for (const seed of seeds) {
        sessions.push(
          classifyJourney(
            explainSyntheticJourney({
              profile: profileId,
              taskId,
              seed: `${options.seedPrefix}:${variant.id}:${seed}`,
              experience: variant,
            }),
          ),
        );
      }
    }
  }

  return buildVariantSummary(variant, sessions);
}

function classifyJourney(
  journey: SyntheticJourneyExplanation,
): SyntheticABSessionResult {
  const actions = journey.steps.map((step) => step.action.id);
  const screenDwell: Record<SyntheticScreen, number> = {
    home: 0,
    results: 0,
    filters: 0,
    detail: 0,
    checkout: 0,
    success: 0,
  };

  for (const step of journey.steps) {
    screenDwell[step.screen] += step.dwellMs;
  }

  const completed = actions.includes("confirm_reservation");
  const abandoned = actions.includes("abandon_task");
  const filterFriction =
    actions.includes("open_filters") &&
    (screenDwell.filters > 8_000 || !actions.includes("apply_task_filters"));
  const priceFriction =
    actions.includes("review_price_breakdown") || screenDwell.checkout > 9_500;
  const policyFriction =
    journey.taskId === "compare_cancellation" &&
    (actions.includes("scroll_to_policy") || screenDwell.detail > 10_500);
  const backtracking = actions.includes("back_to_results");
  const checkoutFriction = abandoned || screenDwell.checkout > 10_500;

  return {
    completed,
    abandoned,
    totalDwellMs: journey.totals.totalDwellMs,
    actionCount: journey.totals.actionCount,
    screenDwell,
    signals: {
      filterFriction,
      priceFriction,
      policyFriction,
      backtracking,
      checkoutFriction,
    },
  };
}

function buildVariantSummary(
  variant: SyntheticExperienceConfig,
  sessions: SyntheticABSessionResult[],
): SyntheticABVariantSummary {
  const sessionCount = sessions.length || 1;
  const completionRate = rate(
    sessions.filter((session) => session.completed).length,
    sessionCount,
  );
  const abandonRate = rate(
    sessions.filter((session) => session.abandoned).length,
    sessionCount,
  );
  const averageDwellMs = Math.round(
    average(sessions.map((session) => session.totalDwellMs)),
  );
  const averageActions = round(
    average(sessions.map((session) => session.actionCount)),
  );
  const feedback = buildFeedbackSummary(sessions, sessionCount);
  const slowestScreen = findSlowestScreen(sessions);
  const dwellScore = clamp(1 - (averageDwellMs - 18_000) / 55_000, 0, 1);
  const score = round(
    clamp(
      completionRate * 58 +
        (1 - abandonRate) * 18 +
        (1 - feedback.totalFrictionRate) * 12 +
        dwellScore * 12,
      0,
      100,
    ),
  );

  return {
    variantId: variant.id,
    label: variant.label,
    description: variant.description,
    sessions: sessions.length,
    score,
    completionRate,
    abandonRate,
    averageDwellMs,
    averageActions,
    feedback,
    slowestScreen,
  };
}

function buildFeedbackSummary(
  sessions: SyntheticABSessionResult[],
  sessionCount: number,
): SyntheticABFeedbackSummary {
  const totalWithAnySignal = sessions.filter((session) =>
    Object.values(session.signals).some(Boolean),
  ).length;

  return {
    filterFrictionRate: signalRate(sessions, "filterFriction", sessionCount),
    priceFrictionRate: signalRate(sessions, "priceFriction", sessionCount),
    policyFrictionRate: signalRate(sessions, "policyFriction", sessionCount),
    backtrackingRate: signalRate(sessions, "backtracking", sessionCount),
    checkoutFrictionRate: signalRate(sessions, "checkoutFriction", sessionCount),
    totalFrictionRate: rate(totalWithAnySignal, sessionCount),
  };
}

function signalRate(
  sessions: SyntheticABSessionResult[],
  signal: keyof SyntheticABSessionSignals,
  sessionCount: number,
): number {
  return rate(
    sessions.filter((session) => session.signals[signal]).length,
    sessionCount,
  );
}

function findSlowestScreen(sessions: SyntheticABSessionResult[]) {
  const screenTotals: Record<SyntheticScreen, number> = {
    home: 0,
    results: 0,
    filters: 0,
    detail: 0,
    checkout: 0,
    success: 0,
  };

  for (const session of sessions) {
    for (const [screen, dwell] of Object.entries(session.screenDwell)) {
      screenTotals[screen as SyntheticScreen] += dwell;
    }
  }

  const [screen, total] = Object.entries(screenTotals).sort(
    ([, dwellA], [, dwellB]) => dwellB - dwellA,
  )[0] as [SyntheticScreen, number];

  return {
    screen,
    averageDwellMs: Math.round(total / Math.max(1, sessions.length)),
  };
}

function buildRecommendations(
  summaries: SyntheticABVariantSummary[],
): SyntheticImprovementRecommendation[] {
  const ranked = [...summaries].sort((a, b) => b.score - a.score);
  const winner = ranked[0];
  const lagging = ranked[ranked.length - 1] ?? winner;
  const recommendations: Omit<SyntheticImprovementRecommendation, "priority">[] =
    [];

  if (
    lagging.feedback.filterFrictionRate > 0.22 ||
    lagging.feedback.filterFrictionRate >
      winner.feedback.filterFrictionRate + 0.08
  ) {
    recommendations.push({
      id: "streamline_filters",
      title: "Promote task-ready filters",
      rationale: `${lagging.label} produced filter friction in ${formatRate(
        lagging.feedback.filterFrictionRate,
      )} of synthetic sessions.`,
      affectedMetric: "filterFrictionRate",
      impact: impactFromDelta(
        lagging.feedback.filterFrictionRate,
        winner.feedback.filterFrictionRate,
        8,
      ),
      confidence: 0.82,
      actionScoreAdjustments: {
        open_filters: 0.35,
        apply_task_filters: 0.75,
        sort_lowest_price: 0.35,
      },
      screenDwellMultipliers: {
        results: 0.94,
        filters: 0.82,
      },
    });
  }

  if (
    lagging.feedback.priceFrictionRate > 0.18 ||
    lagging.feedback.checkoutFrictionRate > 0.18
  ) {
    recommendations.push({
      id: "clarify_total_price",
      title: "Clarify total price before checkout",
      rationale: `Price or checkout hesitation appeared in ${formatRate(
        Math.max(
          lagging.feedback.priceFrictionRate,
          lagging.feedback.checkoutFrictionRate,
        ),
      )} of synthetic sessions.`,
      affectedMetric:
        lagging.feedback.checkoutFrictionRate > lagging.feedback.priceFrictionRate
          ? "checkoutFrictionRate"
          : "priceFrictionRate",
      impact: impactFromDelta(
        Math.max(
          lagging.feedback.priceFrictionRate,
          lagging.feedback.checkoutFrictionRate,
        ),
        Math.max(
          winner.feedback.priceFrictionRate,
          winner.feedback.checkoutFrictionRate,
        ),
        7,
      ),
      confidence: 0.78,
      actionScoreAdjustments: {
        review_price_breakdown: 0.4,
        confirm_reservation: 0.55,
        abandon_task: -0.85,
      },
      screenDwellMultipliers: {
        checkout: 0.78,
      },
    });
  }

  if (
    lagging.feedback.policyFrictionRate > 0.12 ||
    lagging.feedback.policyFrictionRate >
      winner.feedback.policyFrictionRate + 0.06
  ) {
    recommendations.push({
      id: "surface_policy",
      title: "Surface cancellation policy earlier",
      rationale: `Policy-sensitive journeys slowed down in ${formatRate(
        lagging.feedback.policyFrictionRate,
      )} of synthetic sessions.`,
      affectedMetric: "policyFrictionRate",
      impact: impactFromDelta(
        lagging.feedback.policyFrictionRate,
        winner.feedback.policyFrictionRate,
        6,
      ),
      confidence: 0.74,
      actionScoreAdjustments: {
        scroll_to_policy: 0.45,
        reserve_listing: 0.35,
      },
      screenDwellMultipliers: {
        detail: 0.88,
      },
    });
  }

  if (
    lagging.feedback.backtrackingRate > 0.08 ||
    lagging.feedback.backtrackingRate > winner.feedback.backtrackingRate + 0.04
  ) {
    recommendations.push({
      id: "strengthen_listing_match",
      title: "Strengthen listing match confidence",
      rationale: `Backtracking appeared in ${formatRate(
        lagging.feedback.backtrackingRate,
      )} of synthetic sessions.`,
      affectedMetric: "backtrackingRate",
      impact: impactFromDelta(
        lagging.feedback.backtrackingRate,
        winner.feedback.backtrackingRate,
        5,
      ),
      confidence: 0.7,
      actionScoreAdjustments: {
        open_best_listing: 0.35,
        back_to_results: -0.65,
      },
      screenDwellMultipliers: {
        results: 0.92,
        detail: 0.92,
      },
    });
  }

  recommendations.push(buildSlowScreenRecommendation(lagging, winner));

  return recommendations
    .sort((a, b) => b.impact - a.impact)
    .slice(0, 4)
    .map((recommendation, index) => ({
      ...recommendation,
      priority: index + 1,
    }));
}

function buildSlowScreenRecommendation(
  lagging: SyntheticABVariantSummary,
  winner: SyntheticABVariantSummary,
): Omit<SyntheticImprovementRecommendation, "priority"> {
  const screen =
    lagging.slowestScreen.screen === "success"
      ? winner.slowestScreen.screen
      : lagging.slowestScreen.screen;
  const screenDwellMultipliers: Partial<Record<SyntheticScreen, number>> = {
    [screen]: 0.88,
  };

  return {
    id: `compress_${screen}_dwell`,
    title: `Shorten ${screen} dwell`,
    rationale: `${capitalize(screen)} is the slowest synthetic screen at ${formatMs(
      lagging.slowestScreen.averageDwellMs,
    )} average dwell.`,
    affectedMetric: "averageDwellMs",
    impact: Math.max(
      4,
      round((lagging.averageDwellMs - winner.averageDwellMs) / 1_000),
    ),
    confidence: 0.68,
    screenDwellMultipliers,
  };
}

function buildOptimizedVariant(
  base: SyntheticExperienceConfig,
  recommendations: SyntheticImprovementRecommendation[],
): SyntheticImprovedExperienceConfig {
  const actionScoreAdjustments: Partial<Record<SyntheticActionId, number>> = {
    ...(base.actionScoreAdjustments ?? {}),
  };
  const screenDwellMultipliers: Partial<Record<SyntheticScreen, number>> = {
    ...(base.screenDwellMultipliers ?? {}),
  };

  for (const recommendation of recommendations) {
    mergeActionAdjustments(
      actionScoreAdjustments,
      recommendation.actionScoreAdjustments,
    );
    mergeScreenMultipliers(
      screenDwellMultipliers,
      recommendation.screenDwellMultipliers,
    );
  }

  return {
    ...base,
    id: "self_improved",
    label: "Self-improved projection",
    description: "Winner plus the highest-impact synthetic feedback changes.",
    basedOnVariantId: base.id,
    appliedRecommendationIds: recommendations.map(
      (recommendation) => recommendation.id,
    ),
    actionScoreAdjustments,
    screenDwellMultipliers,
  };
}

function mergeActionAdjustments(
  target: Partial<Record<SyntheticActionId, number>>,
  source: Partial<Record<SyntheticActionId, number>> | undefined,
): void {
  if (!source) return;

  for (const [actionId, adjustment] of Object.entries(source)) {
    const key = actionId as SyntheticActionId;
    target[key] = round((target[key] ?? 0) + (adjustment ?? 0));
  }
}

function mergeScreenMultipliers(
  target: Partial<Record<SyntheticScreen, number>>,
  source: Partial<Record<SyntheticScreen, number>> | undefined,
): void {
  if (!source) return;

  for (const [screen, multiplier] of Object.entries(source)) {
    const key = screen as SyntheticScreen;
    target[key] = round((target[key] ?? 1) * (multiplier ?? 1));
  }
}

function impactFromDelta(
  laggingRate: number,
  winningRate: number,
  minimum: number,
): number {
  return Math.max(minimum, round((laggingRate - winningRate) * 100 + minimum));
}

function rate(count: number, total: number): number {
  return round(count / Math.max(1, total));
}

function average(values: number[]): number {
  if (values.length === 0) {
    return 0;
  }

  return values.reduce((total, value) => total + value, 0) / values.length;
}

function formatRate(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatMs(ms: number): string {
  return ms >= 1_000 ? `${(ms / 1_000).toFixed(1)}s` : `${ms}ms`;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function capitalize(value: string): string {
  return `${value.charAt(0).toUpperCase()}${value.slice(1)}`;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
