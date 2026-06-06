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

export type SyntheticFeatureCandidate = {
  title: string;
  problem: string;
  mvp: string[];
  metrics: string[];
  evidence: string[];
  confidence: string;
  source: string;
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
  featureCandidate: SyntheticFeatureCandidate;
};

export type SyntheticABTestOptions = {
  variants?: SyntheticExperienceConfig[];
  profileIds?: string[];
  taskIds?: SyntheticTaskId[];
  seeds?: string[];
  seedPrefix?: string;
  agentCount?: number;
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

type SyntheticFeatureDefinition = Omit<
  SyntheticFeatureCandidate,
  "confidence" | "evidence" | "source"
> & {
  themes: string[];
};

type SyntheticAgentSessionCase = {
  profileId: string;
  taskId: SyntheticTaskId;
  seed: string;
};

export const syntheticIterationGenerationIds = ["A", "B", "C", "D", "E"] as const;

export type SyntheticIterationGenerationId =
  (typeof syntheticIterationGenerationIds)[number];

export type SyntheticIterationCandidate = {
  id: string;
  candidateNumber: number;
  title: string;
  rationale: string;
  score: number;
  scoreDelta: number;
  completionRateDelta: number;
  dwellReductionMs: number;
  config: SyntheticImprovedExperienceConfig;
  appliedRecommendationIds: string[];
};

export type SyntheticIterationGeneration = {
  generationId: SyntheticIterationGenerationId;
  label: string;
  summary: SyntheticABVariantSummary;
  candidatesEvaluated: number;
  topCandidates: SyntheticIterationCandidate[];
  selectedCandidate?: SyntheticIterationCandidate;
  recommendedNextCandidate?: SyntheticIterationCandidate;
};

export type SyntheticIterationLabReport = {
  seedPrefix: string;
  agentCount: number;
  generationCount: number;
  candidatesPerGeneration: number;
  totalCandidatesGenerated: number;
  generations: SyntheticIterationGeneration[];
  bestGeneration: SyntheticIterationGeneration;
  scoreLift: number;
  completionRateLift: number;
  dwellReductionMs: number;
};

export type SyntheticIterationLabOptions = SyntheticABTestOptions & {
  generationCount?: number;
  candidatesPerGeneration?: number;
};

type SyntheticIterationRecipe = {
  id: string;
  title: string;
  rationale: string;
  actionScoreAdjustments?: Partial<Record<SyntheticActionId, number>>;
  screenDwellMultipliers?: Partial<Record<SyntheticScreen, number>>;
};

const syntheticFeatureDefinitions: SyntheticFeatureDefinition[] = [
  {
    themes: ["date_picker_friction", "price_clarity"],
    title: "Smart Date + Price Confidence Guide",
    problem:
      "Synthetic users hesitate when dates require extra work and price confidence arrives too late.",
    mvp: [
      "Offer a flexible-date default before the calendar becomes blocking.",
      "Show total price and likely fees at the comparison moment.",
      "Trigger a contextual helper when date or price hesitation repeats.",
    ],
    metrics: [
      "date selection completion rate",
      "primary CTA click rate",
      "dwell time before first meaningful action",
      "friction rate",
    ],
  },
  {
    themes: ["price_clarity"],
    title: "Upfront Price Confidence Card",
    problem:
      "Users need earlier total-cost context before they commit to a listing or checkout path.",
    mvp: [
      "Expose total price, fees, and value cues on the first comparison surface.",
      "Keep price copy near the primary CTA and listing details.",
      "Log price exposure before every CTA click.",
    ],
    metrics: [
      "click rate",
      "detail open rate",
      "completion rate",
      "price-friction rate",
    ],
  },
  {
    themes: ["date_picker_friction"],
    title: "Flexible Date Assist",
    problem: "Calendar decisions create hesitation before users can compare options.",
    mvp: [
      "Preselect a flexible weekend option for exploratory users.",
      "Label the calendar state clearly after each date interaction.",
      "Suggest nearby dates when users pause or backtrack.",
    ],
    metrics: [
      "date selection completion rate",
      "calendar dwell time",
      "drop-off rate",
      "CTA click rate",
    ],
  },
  {
    themes: ["trust_review_confidence"],
    title: "Decision Trust Strip",
    problem: "Trust and review signals are not close enough to the decision point.",
    mvp: [
      "Move rating, review count, and trust cues next to the primary CTA.",
      "Highlight the strongest confidence cue for each listing.",
      "Measure whether trust exposure happens before detail open or save.",
    ],
    metrics: [
      "detail open rate",
      "like rate",
      "CTA click rate",
      "trust exposure rate",
    ],
  },
  {
    themes: ["wishlist_account_wall"],
    title: "Low-Friction Save Intent",
    problem:
      "Save behavior can feel blocked when account expectations appear too early.",
    mvp: [
      "Let users express save intent before showing account requirements.",
      "Clarify what will be saved and when sign-in is needed.",
      "Track save intent separately from successful account completion.",
    ],
    metrics: [
      "like rate",
      "save intent rate",
      "account-wall drop-off",
      "return intent",
    ],
  },
  {
    themes: ["experiences_discoverability"],
    title: "Search Path Clarifier",
    problem:
      "Adjacent discovery paths compete with the core stay-search task.",
    mvp: [
      "Separate stay search from Experiences and Services in the first viewport.",
      "Use clearer labels for secondary discovery paths.",
      "Measure secondary-path clicks before and after search intent is formed.",
    ],
    metrics: [
      "search start rate",
      "secondary click rate",
      "completion rate",
      "navigation friction rate",
    ],
  },
];

export function runSyntheticABTest(
  options: SyntheticABTestOptions = {},
): SyntheticABTestReport {
  const variants = options.variants ?? syntheticABVariants;
  const seedPrefix = options.seedPrefix ?? "synthetic-ab";
  const agentCount = options.agentCount ?? 50;
  const summaries = variants.map((variant) =>
    summarizeVariant(variant, {
      ...options,
      seedPrefix,
      agentCount,
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

  const report = {
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

  return {
    ...report,
    featureCandidate: buildSyntheticFeatureCandidate(report),
  };
}

export function runSyntheticIterationLab(
  options: SyntheticIterationLabOptions = {},
): SyntheticIterationLabReport {
  const seedPrefix = options.seedPrefix ?? "iteration-lab";
  const agentCount = options.agentCount ?? 50;
  const generationCount = Math.min(
    syntheticIterationGenerationIds.length,
    Math.max(2, options.generationCount ?? syntheticIterationGenerationIds.length),
  );
  const candidatesPerGeneration = Math.max(
    1,
    options.candidatesPerGeneration ?? 100,
  );
  const generationIds = syntheticIterationGenerationIds.slice(0, generationCount);
  const generations: SyntheticIterationGeneration[] = [];
  const initialVariant = options.variants?.[0] ?? syntheticABVariants[0];
  let currentVariant: SyntheticExperienceConfig = relabelIterationVariant(
    initialVariant,
    generationIds[0],
    initialVariant.description ?? "Original task-first booking flow",
  );

  for (const [generationIndex, generationId] of generationIds.entries()) {
    const summary = summarizeVariant(currentVariant, {
      ...options,
      seedPrefix: `${seedPrefix}:${generationId}:eval`,
      agentCount,
    });
    const rankedCandidates = generateIterationCandidates({
      base: currentVariant,
      currentSummary: summary,
      generationId,
      generationIndex,
      count: candidatesPerGeneration,
      options: {
        ...options,
        seedPrefix,
        agentCount,
      },
    });
    const topCandidates = rankedCandidates.slice(0, 5);
    const selectedCandidate =
      generationIndex < generationIds.length - 1 ? topCandidates[0] : undefined;

    generations.push({
      generationId,
      label: currentVariant.label,
      summary,
      candidatesEvaluated: candidatesPerGeneration,
      topCandidates,
      selectedCandidate,
      recommendedNextCandidate: topCandidates[0],
    });

    if (selectedCandidate) {
      const nextGenerationId = generationIds[generationIndex + 1];
      currentVariant = relabelIterationVariant(
        selectedCandidate.config,
        nextGenerationId,
        selectedCandidate.title,
      );
    }
  }

  const bestGeneration = [...generations].sort(
    (left, right) => right.summary.score - left.summary.score,
  )[0];
  const firstGeneration = generations[0];
  const lastGeneration = generations[generations.length - 1];

  return {
    seedPrefix,
    agentCount,
    generationCount,
    candidatesPerGeneration,
    totalCandidatesGenerated: generationCount * candidatesPerGeneration,
    generations,
    bestGeneration,
    scoreLift: round(lastGeneration.summary.score - firstGeneration.summary.score),
    completionRateLift: round(
      lastGeneration.summary.completionRate -
        firstGeneration.summary.completionRate,
    ),
    dwellReductionMs: Math.max(
      0,
      Math.round(
        firstGeneration.summary.averageDwellMs -
          lastGeneration.summary.averageDwellMs,
      ),
    ),
  };
}

function relabelIterationVariant(
  variant: SyntheticExperienceConfig,
  generationId: SyntheticIterationGenerationId,
  description: string,
): SyntheticExperienceConfig {
  return {
    ...variant,
    id: generationId,
    label: `Variant ${generationId}`,
    description,
  };
}

function generateIterationCandidates({
  base,
  currentSummary,
  generationId,
  generationIndex,
  count,
  options,
}: {
  base: SyntheticExperienceConfig;
  currentSummary: SyntheticABVariantSummary;
  generationId: SyntheticIterationGenerationId;
  generationIndex: number;
  count: number;
  options: SyntheticABTestOptions & { seedPrefix: string; agentCount: number };
}): SyntheticIterationCandidate[] {
  const recipes = iterationRecipes(currentSummary);
  const candidates: SyntheticIterationCandidate[] = [];
  const controlConfig: SyntheticImprovedExperienceConfig = clampExperienceConfig({
    ...base,
    id: `${generationId.toLowerCase()}_candidate_000`,
    label: `${base.label} control`,
    basedOnVariantId: base.id,
    appliedRecommendationIds: ["control"],
  });

  candidates.push(
    scoreIterationCandidate({
      candidateNumber: 1,
      title: "Carry forward current winner",
      rationale: "Control candidate used to prove each promotion beats or equals the current generation.",
      config: controlConfig,
      baseline: currentSummary,
      options,
    }),
  );

  for (let index = 1; index < count; index += 1) {
    const primary = recipes[index % recipes.length];
    const secondary =
      index % 3 === 0
        ? recipes[(index + generationIndex + 2) % recipes.length]
        : undefined;
    const tertiary =
      index % 11 === 0
        ? recipes[(index + generationIndex + 5) % recipes.length]
        : undefined;
    const strength = 0.65 + ((index * 37 + generationIndex * 19) % 61) / 100;
    const config = buildCandidateConfig({
      base,
      generationId,
      index,
      strength,
      recipes: [primary, secondary, tertiary].filter(
        Boolean,
      ) as SyntheticIterationRecipe[],
    });

    candidates.push(
      scoreIterationCandidate({
        candidateNumber: index + 1,
        title: candidateTitle([primary, secondary, tertiary], generationId, index),
        rationale: candidateRationale(
          [primary, secondary, tertiary].filter(Boolean) as SyntheticIterationRecipe[],
          currentSummary,
        ),
        config,
        baseline: currentSummary,
        options,
      }),
    );
  }

  return candidates.sort((left, right) => {
    if (right.score !== left.score) return right.score - left.score;
    if (right.completionRateDelta !== left.completionRateDelta) {
      return right.completionRateDelta - left.completionRateDelta;
    }
    return right.dwellReductionMs - left.dwellReductionMs;
  });
}

function iterationRecipes(
  summary: SyntheticABVariantSummary,
): SyntheticIterationRecipe[] {
  const slowScreen: SyntheticScreen = summary.slowestScreen.screen === "success"
    ? "checkout"
    : summary.slowestScreen.screen;

  return [
    {
      id: "upfront_price_confidence",
      title: "Upfront price confidence",
      rationale: "Move total-cost certainty earlier in the comparison and checkout path.",
      actionScoreAdjustments: {
        review_price_breakdown: 0.45,
        confirm_reservation: 0.45,
        abandon_task: -0.55,
      },
      screenDwellMultipliers: {
        results: 0.94,
        checkout: 0.8,
      },
    },
    {
      id: "task_ready_filter_rail",
      title: "Task-ready filter rail",
      rationale: "Expose the most likely filters before users need to open a modal.",
      actionScoreAdjustments: {
        open_filters: 0.32,
        apply_task_filters: 0.72,
        sort_lowest_price: 0.28,
      },
      screenDwellMultipliers: {
        filters: 0.78,
        results: 0.93,
      },
    },
    {
      id: "policy_trust_strip",
      title: "Policy trust strip",
      rationale: "Put cancellation and trust cues near the listing decision point.",
      actionScoreAdjustments: {
        scroll_to_policy: 0.5,
        reserve_listing: 0.35,
        back_to_results: -0.25,
      },
      screenDwellMultipliers: {
        detail: 0.84,
      },
    },
    {
      id: "match_confidence_panel",
      title: "Match confidence panel",
      rationale: "Explain why the selected stay fits the current user task.",
      actionScoreAdjustments: {
        open_best_listing: 0.48,
        reserve_listing: 0.24,
        back_to_results: -0.58,
      },
      screenDwellMultipliers: {
        results: 0.9,
        detail: 0.91,
      },
    },
    {
      id: "fast_start_search",
      title: "Fast-start search defaults",
      rationale: "Preload the likely search intent so the first meaningful action happens sooner.",
      actionScoreAdjustments: {
        start_search: 0.48,
        open_best_listing: 0.18,
      },
      screenDwellMultipliers: {
        home: 0.76,
        results: 0.95,
      },
    },
    {
      id: "checkout_assurance",
      title: "Checkout assurance lane",
      rationale: "Keep review, reserve, and confirmation steps legible for cautious users.",
      actionScoreAdjustments: {
        reserve_listing: 0.32,
        review_price_breakdown: 0.36,
        confirm_reservation: 0.62,
        abandon_task: -0.7,
      },
      screenDwellMultipliers: {
        checkout: 0.74,
        success: 0.92,
      },
    },
    {
      id: `compress_${slowScreen}_screen`,
      title: `Compress ${humanize(slowScreen)} screen`,
      rationale: `The current slowest screen is ${humanize(slowScreen)}, so this candidate removes waiting there.`,
      screenDwellMultipliers: {
        [slowScreen]: 0.72,
      },
    },
  ];
}

function buildCandidateConfig({
  base,
  generationId,
  index,
  strength,
  recipes,
}: {
  base: SyntheticExperienceConfig;
  generationId: SyntheticIterationGenerationId;
  index: number;
  strength: number;
  recipes: SyntheticIterationRecipe[];
}): SyntheticImprovedExperienceConfig {
  const actionScoreAdjustments: Partial<Record<SyntheticActionId, number>> = {
    ...(base.actionScoreAdjustments ?? {}),
  };
  const screenDwellMultipliers: Partial<Record<SyntheticScreen, number>> = {
    ...(base.screenDwellMultipliers ?? {}),
  };
  const appliedRecommendationIds: string[] = [];

  for (const [recipeIndex, recipe] of recipes.entries()) {
    const weightedStrength = recipeIndex === 0 ? strength : strength * 0.55;
    appliedRecommendationIds.push(recipe.id);
    mergeScaledActionAdjustments(
      actionScoreAdjustments,
      recipe.actionScoreAdjustments,
      weightedStrength,
    );
    mergeScaledScreenMultipliers(
      screenDwellMultipliers,
      recipe.screenDwellMultipliers,
      weightedStrength,
    );
  }

  return clampExperienceConfig({
    ...base,
    id: `${generationId.toLowerCase()}_candidate_${String(index).padStart(3, "0")}`,
    label: `${base.label} candidate ${index}`,
    description: recipes.map((recipe) => recipe.title).join(" + "),
    basedOnVariantId: base.id,
    appliedRecommendationIds,
    actionScoreAdjustments,
    screenDwellMultipliers,
  });
}

function scoreIterationCandidate({
  candidateNumber,
  title,
  rationale,
  config,
  baseline,
  options,
}: {
  candidateNumber: number;
  title: string;
  rationale: string;
  config: SyntheticImprovedExperienceConfig;
  baseline: SyntheticABVariantSummary;
  options: SyntheticABTestOptions & { seedPrefix: string; agentCount: number };
}): SyntheticIterationCandidate {
  const summary = summarizeVariant(config, {
    ...options,
    seedPrefix: `${options.seedPrefix}:${config.id}:candidate`,
  });

  return {
    id: config.id,
    candidateNumber,
    title,
    rationale,
    score: summary.score,
    scoreDelta: round(summary.score - baseline.score),
    completionRateDelta: round(summary.completionRate - baseline.completionRate),
    dwellReductionMs: Math.max(
      0,
      Math.round(baseline.averageDwellMs - summary.averageDwellMs),
    ),
    config,
    appliedRecommendationIds: config.appliedRecommendationIds,
  };
}

function candidateTitle(
  recipes: Array<SyntheticIterationRecipe | undefined>,
  generationId: SyntheticIterationGenerationId,
  index: number,
): string {
  const titles = recipes.filter(Boolean).map((recipe) => recipe?.title);
  return `Variant ${generationId} candidate ${index}: ${titles.join(" + ")}`;
}

function candidateRationale(
  recipes: SyntheticIterationRecipe[],
  summary: SyntheticABVariantSummary,
): string {
  const recipeText = recipes.map((recipe) => recipe.rationale).join(" ");
  return `${recipeText} Baseline score ${summary.score}, friction ${formatRate(
    summary.feedback.totalFrictionRate,
  )}, slowest screen ${humanize(summary.slowestScreen.screen)}.`;
}

function mergeScaledActionAdjustments(
  target: Partial<Record<SyntheticActionId, number>>,
  source: Partial<Record<SyntheticActionId, number>> | undefined,
  strength: number,
): void {
  if (!source) return;

  for (const [actionId, adjustment] of Object.entries(source)) {
    const key = actionId as SyntheticActionId;
    target[key] = round(
      clamp((target[key] ?? 0) + (adjustment ?? 0) * strength, -2.6, 2.6),
    );
  }
}

function mergeScaledScreenMultipliers(
  target: Partial<Record<SyntheticScreen, number>>,
  source: Partial<Record<SyntheticScreen, number>> | undefined,
  strength: number,
): void {
  if (!source) return;

  for (const [screen, multiplier] of Object.entries(source)) {
    const key = screen as SyntheticScreen;
    const current = target[key] ?? 1;
    const weightedMultiplier = 1 + ((multiplier ?? 1) - 1) * strength;
    target[key] = round(clamp(current * weightedMultiplier, 0.58, 1.35));
  }
}

function clampExperienceConfig<T extends SyntheticExperienceConfig>(config: T): T {
  const actionScoreAdjustments: Partial<Record<SyntheticActionId, number>> = {};
  const screenDwellMultipliers: Partial<Record<SyntheticScreen, number>> = {};

  for (const [actionId, adjustment] of Object.entries(
    config.actionScoreAdjustments ?? {},
  )) {
    actionScoreAdjustments[actionId as SyntheticActionId] = round(
      clamp(adjustment ?? 0, -2.6, 2.6),
    );
  }

  for (const [screen, multiplier] of Object.entries(
    config.screenDwellMultipliers ?? {},
  )) {
    screenDwellMultipliers[screen as SyntheticScreen] = round(
      clamp(multiplier ?? 1, 0.58, 1.35),
    );
  }

  return {
    ...config,
    actionScoreAdjustments,
    screenDwellMultipliers,
  };
}

export function buildSyntheticFeatureCandidate(
  report: Omit<SyntheticABTestReport, "featureCandidate">,
): SyntheticFeatureCandidate {
  const themes = syntheticFeatureThemeScores(report);
  const picked = pickSyntheticFeature(themes);
  const evidence = syntheticFeatureEvidence(report, themes);

  return {
    title: picked.title,
    problem: picked.problem,
    mvp: picked.mvp,
    metrics: picked.metrics,
    evidence,
    confidence: syntheticFeatureConfidence(themes, evidence),
    source: `Variant ${report.winner.variantId} self-improvement feedback`,
  };
}

function syntheticFeatureThemeScores(
  report: Omit<SyntheticABTestReport, "featureCandidate">,
): Map<string, number> {
  const themes = new Map<string, number>();

  for (const variant of report.variants) {
    addSyntheticFeatureTheme(
      themes,
      "date_picker_friction",
      variant.feedback.filterFrictionRate * 8,
    );
    addSyntheticFeatureTheme(
      themes,
      "price_clarity",
      Math.max(
        variant.feedback.priceFrictionRate,
        variant.feedback.checkoutFrictionRate,
      ) * 10,
    );
    addSyntheticFeatureTheme(
      themes,
      "trust_review_confidence",
      Math.max(
        variant.feedback.policyFrictionRate,
        variant.feedback.backtrackingRate,
      ) * 7,
    );
    addSyntheticFeatureTheme(
      themes,
      "navigation_clarity",
      Math.max(variant.feedback.totalFrictionRate, variant.abandonRate) * 5,
    );
  }

  for (const recommendation of report.recommendations) {
    const weight = Math.max(1, 6 - recommendation.priority) + recommendation.impact / 8;
    addSyntheticFeatureTheme(
      themes,
      themeFromAffectedMetric(recommendation.affectedMetric),
      weight,
    );
    addSyntheticFeatureTheme(
      themes,
      inferSyntheticFeatureTheme(
        `${recommendation.title} ${recommendation.rationale}`,
      ),
      weight / 2,
    );
  }

  return themes;
}

function addSyntheticFeatureTheme(
  themes: Map<string, number>,
  value: string,
  weight: number,
): void {
  const theme = normalizeTheme(value);
  if (!theme || weight <= 0) {
    return;
  }
  themes.set(theme, round((themes.get(theme) ?? 0) + weight));
}

function pickSyntheticFeature(
  themes: Map<string, number>,
): SyntheticFeatureDefinition {
  const ranked = [...syntheticFeatureDefinitions].sort(
    (left, right) =>
      syntheticFeatureScore(right, themes) - syntheticFeatureScore(left, themes),
  );

  if (ranked[0] && syntheticFeatureScore(ranked[0], themes) > 0) {
    return ranked[0];
  }

  return {
    themes: ["navigation_clarity"],
    title: "Next-Step Confidence Guide",
    problem:
      "Users need clearer guidance at the point where hesitation or drop-off begins.",
    mvp: [
      "Identify the highest-friction step from each trajectory.",
      "Add one contextual helper near that step.",
      "Track whether the helper changes CTA, save, and completion behavior.",
    ],
    metrics: ["friction rate", "CTA click rate", "completion rate", "dwell time"],
  };
}

function syntheticFeatureScore(
  feature: SyntheticFeatureDefinition,
  themes: Map<string, number>,
): number {
  return feature.themes.reduce(
    (score, theme) => score + (themes.get(theme) ?? 0),
    0,
  );
}

function syntheticFeatureEvidence(
  report: Omit<SyntheticABTestReport, "featureCandidate">,
  themes: Map<string, number>,
): string[] {
  const items: string[] = [];
  const rankedThemes = [...themes.entries()].sort((left, right) => right[1] - left[1]);

  for (const [theme, count] of rankedThemes.slice(0, 2)) {
    items.push(
      `${humanize(theme)} appeared across ${round(count)} synthetic feedback signals.`,
    );
  }

  items.push(...syntheticFeatureMetricEvidence(report));

  if (report.optimizedProjection.scoreUplift > 0) {
    items.push(
      `Self-improved projection adds ${formatSigned(
        report.optimizedProjection.scoreUplift,
      )} score points.`,
    );
  }

  return items.slice(0, 3);
}

function syntheticFeatureMetricEvidence(
  report: Omit<SyntheticABTestReport, "featureCandidate">,
): string[] {
  const items: string[] = [];
  const variantA = report.variants.find((variant) => variant.variantId === "A");
  const variantB = report.variants.find((variant) => variant.variantId === "B");

  if (variantA && variantB) {
    const completionGap = Math.round(
      (variantB.completionRate - variantA.completionRate) * 100,
    );
    const frictionGap = Math.round(
      (variantB.feedback.totalFrictionRate -
        variantA.feedback.totalFrictionRate) *
        100,
    );

    if (completionGap !== 0) {
      items.push(
        `Variant B completion is ${formatSigned(completionGap)} pts vs A.`,
      );
    }
    if (frictionGap !== 0) {
      items.push(
        `Variant B friction is ${formatSigned(frictionGap)} pts vs A.`,
      );
    }
  }

  if (items.length === 0) {
    items.push(
      `${report.optimizedVariant.appliedRecommendationIds.length} recommendations feed the self-improved projection.`,
    );
  }

  return items;
}

function syntheticFeatureConfidence(
  themes: Map<string, number>,
  evidence: string[],
): string {
  const strongest = Math.max(0, ...themes.values());
  const score = Math.min(0.9, 0.5 + strongest * 0.035 + evidence.length * 0.04);
  return `${Math.round(score * 100)}%`;
}

function themeFromAffectedMetric(
  metric: SyntheticImprovementRecommendation["affectedMetric"],
): string {
  switch (metric) {
    case "filterFrictionRate":
      return "date_picker_friction";
    case "priceFrictionRate":
    case "checkoutFrictionRate":
      return "price_clarity";
    case "policyFrictionRate":
    case "backtrackingRate":
      return "trust_review_confidence";
    case "averageDwellMs":
    case "totalFrictionRate":
      return "navigation_clarity";
  }
}

function inferSyntheticFeatureTheme(text: string): string {
  const value = text.toLowerCase();
  if (
    value.includes("date") ||
    value.includes("calendar") ||
    value.includes("filter")
  ) {
    return "date_picker_friction";
  }
  if (
    value.includes("price") ||
    value.includes("fee") ||
    value.includes("cost") ||
    value.includes("checkout")
  ) {
    return "price_clarity";
  }
  if (
    value.includes("trust") ||
    value.includes("review") ||
    value.includes("rating") ||
    value.includes("policy") ||
    value.includes("confidence") ||
    value.includes("listing match")
  ) {
    return "trust_review_confidence";
  }
  if (
    value.includes("wishlist") ||
    value.includes("save") ||
    value.includes("sign-in") ||
    value.includes("account")
  ) {
    return "wishlist_account_wall";
  }
  if (value.includes("experience") || value.includes("service")) {
    return "experiences_discoverability";
  }
  if (value.includes("navigation") || value.includes("cta")) {
    return "navigation_clarity";
  }
  return text;
}

function summarizeVariant(
  variant: SyntheticExperienceConfig,
  options: SyntheticABTestOptions & { seedPrefix: string },
): SyntheticABVariantSummary {
  const profileIds =
    options.profileIds ?? syntheticUserProfiles.map((profile) => profile.id);
  const taskIds = options.taskIds ?? syntheticABTaskIds;
  const seeds = options.seeds ?? syntheticABSeeds;
  const cases = buildSyntheticAgentSessionCases({
    profileIds,
    taskIds,
    seeds,
    agentCount: options.agentCount ?? 50,
  });
  const sessions: SyntheticABSessionResult[] = [];

  for (const sessionCase of cases) {
    sessions.push(
      classifyJourney(
        explainSyntheticJourney({
          profile: sessionCase.profileId,
          taskId: sessionCase.taskId,
          seed: `${options.seedPrefix}:${variant.id}:${sessionCase.seed}`,
          experience: variant,
        }),
      ),
    );
  }

  return buildVariantSummary(variant, sessions);
}

function buildSyntheticAgentSessionCases({
  profileIds,
  taskIds,
  seeds,
  agentCount,
}: {
  profileIds: string[];
  taskIds: SyntheticTaskId[];
  seeds: string[];
  agentCount: number;
}): SyntheticAgentSessionCase[] {
  const safeProfileIds = profileIds.length > 0
    ? profileIds
    : syntheticUserProfiles.map((profile) => profile.id);
  const safeTaskIds = taskIds.length > 0 ? taskIds : syntheticABTaskIds;
  const safeSeeds = seeds.length > 0 ? seeds : syntheticABSeeds;
  const cases: SyntheticAgentSessionCase[] = [];

  for (let index = 0; index < agentCount; index += 1) {
    const profileId = safeProfileIds[index % safeProfileIds.length];
    const taskId =
      safeTaskIds[Math.floor(index / safeProfileIds.length) % safeTaskIds.length];
    const seed =
      safeSeeds[
        Math.floor(index / (safeProfileIds.length * safeTaskIds.length)) %
          safeSeeds.length
      ];

    cases.push({
      profileId,
      taskId,
      seed: `${seed}:${index}`,
    });
  }

  return cases;
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

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
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

function normalizeTheme(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

function humanize(value: string): string {
  return value.replace(/_/g, " ");
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
