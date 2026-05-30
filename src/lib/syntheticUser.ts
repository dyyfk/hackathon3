import type { Listing } from "@/data/listings";
import { listings as defaultListings } from "@/data/listings";
import { filterListings, type ListingFilters } from "@/lib/listings";
import { calculatePrice } from "@/lib/pricing";
import type { SearchState } from "@/lib/urlState";

export type SyntheticTaskId =
  | "find_budget_stay"
  | "find_pet_friendly"
  | "compare_cancellation"
  | "complete_checkout";

export type SyntheticScreen =
  | "home"
  | "results"
  | "filters"
  | "detail"
  | "checkout"
  | "success";

export type SyntheticActionId =
  | "start_search"
  | "open_filters"
  | "apply_task_filters"
  | "sort_lowest_price"
  | "open_best_listing"
  | "scroll_to_policy"
  | "reserve_listing"
  | "review_price_breakdown"
  | "confirm_reservation"
  | "back_to_results"
  | "abandon_task";

export type SyntheticUserProfile = {
  id: string;
  label: string;
  description: string;
  patience: number;
  speed: number;
  exploration: number;
  priceSensitivity: number;
  policySensitivity: number;
  qualitySensitivity: number;
  filterAffinity: number;
  checkoutConfidence: number;
  maxBudgetTotal?: number;
  prefersPetFriendly?: boolean;
  wantsParking?: boolean;
};

export type SyntheticScoreBreakdown = {
  base: number;
  taskRelevance: number;
  preferenceMatch: number;
  effortPenalty: number;
  riskPenalty: number;
  experienceAdjustment: number;
  total: number;
};

export type SyntheticActionCandidate = {
  id: SyntheticActionId;
  label: string;
  targetTestId?: string;
  metadata?: Record<string, unknown>;
  score: number;
  scoreBreakdown: SyntheticScoreBreakdown;
};

export type SyntheticCandidateProbability = {
  id: SyntheticActionId;
  score: number;
  weight: number;
  probability: number;
  cumulativeProbability: number;
};

export type SyntheticCandidateSelection = {
  seed: string;
  temperature: number;
  draw: number;
  totalWeight: number;
  selectedRangeStart: number;
  selectedRangeEnd: number;
  probabilities: SyntheticCandidateProbability[];
};

export type SyntheticDwellBreakdown = {
  base: number;
  resultComplexity: number;
  formComplexity: number;
  policyPressure: number;
  pricePressure: number;
  actionUncertainty: number;
  subtotalBeforeMultipliers: number;
  patienceMultiplier: number;
  speedMultiplier: number;
  jitter: number;
  experienceMultiplier: number;
  total: number;
};

export type SyntheticDecision = {
  profileId: string;
  taskId: SyntheticTaskId;
  screen: SyntheticScreen;
  dwellMs: number;
  dwellBreakdown: SyntheticDwellBreakdown;
  action: SyntheticActionCandidate;
  candidates: SyntheticActionCandidate[];
  selection: SyntheticCandidateSelection;
};

export type SyntheticBehaviorContext = {
  profile: SyntheticUserProfile | string;
  taskId: SyntheticTaskId;
  screen: SyntheticScreen;
  experience?: SyntheticExperienceConfig;
  searchState?: SearchState;
  selectedListing?: Listing;
  filters?: ListingFilters;
  history?: SyntheticActionId[];
  listings?: Listing[];
  seed?: string;
};

export type SyntheticExperienceConfig = {
  id: string;
  label: string;
  description?: string;
  actionScoreAdjustments?: Partial<Record<SyntheticActionId, number>>;
  screenDwellMultipliers?: Partial<Record<SyntheticScreen, number>>;
  actionDwellMultipliers?: Partial<Record<SyntheticActionId, number>>;
};

export type SyntheticJourneyStep = SyntheticDecision & {
  stepIndex: number;
  stateBefore: SyntheticJourneyState;
  stateAfter: SyntheticJourneyState;
};

export type SyntheticJourneyState = {
  screen: SyntheticScreen;
  history: SyntheticActionId[];
  filters: ListingFilters;
  selectedListingId?: string;
};

export type SyntheticJourneyExplanation = {
  profile: SyntheticUserProfile;
  taskId: SyntheticTaskId;
  seed: string;
  searchState: SearchState;
  steps: SyntheticJourneyStep[];
  totals: {
    totalDwellMs: number;
    actionCount: number;
    finalScreen: SyntheticScreen;
  };
};

const defaultSearchState: SearchState = {
  location: "San Francisco",
  checkin: "2026-06-14",
  checkout: "2026-06-16",
  adults: 1,
  children: 0,
  pets: 0,
};

export const syntheticUserProfiles: SyntheticUserProfile[] = [
  {
    id: "budget_planner",
    label: "Budget planner",
    description:
      "Compares totals carefully, uses filters, and hesitates around checkout fees.",
    patience: 0.78,
    speed: 0.82,
    exploration: 0.2,
    priceSensitivity: 0.96,
    policySensitivity: 0.45,
    qualitySensitivity: 0.58,
    filterAffinity: 0.82,
    checkoutConfidence: 0.58,
    maxBudgetTotal: 450,
  },
  {
    id: "pet_parking_guest",
    label: "Pet and parking guest",
    description:
      "Optimizes for practical constraints before comparing listing quality.",
    patience: 0.7,
    speed: 0.9,
    exploration: 0.22,
    priceSensitivity: 0.52,
    policySensitivity: 0.42,
    qualitySensitivity: 0.62,
    filterAffinity: 0.96,
    checkoutConfidence: 0.66,
    prefersPetFriendly: true,
    wantsParking: true,
  },
  {
    id: "policy_checker",
    label: "Policy checker",
    description:
      "Looks for cancellation terms before feeling safe enough to reserve.",
    patience: 0.84,
    speed: 0.76,
    exploration: 0.28,
    priceSensitivity: 0.46,
    policySensitivity: 0.97,
    qualitySensitivity: 0.68,
    filterAffinity: 0.58,
    checkoutConfidence: 0.54,
  },
  {
    id: "quick_booker",
    label: "Quick booker",
    description:
      "Trusts high-rated listings, avoids filters, and moves through checkout quickly.",
    patience: 0.42,
    speed: 1.28,
    exploration: 0.1,
    priceSensitivity: 0.34,
    policySensitivity: 0.28,
    qualitySensitivity: 0.88,
    filterAffinity: 0.18,
    checkoutConfidence: 0.92,
  },
];

const taskDefaults: Record<
  SyntheticTaskId,
  Pick<SearchState, "location" | "adults" | "children" | "pets">
> = {
  find_budget_stay: {
    location: "San Francisco",
    adults: 2,
    children: 0,
    pets: 0,
  },
  find_pet_friendly: {
    location: "Los Angeles",
    adults: 1,
    children: 0,
    pets: 1,
  },
  compare_cancellation: {
    location: "Seattle",
    adults: 1,
    children: 0,
    pets: 0,
  },
  complete_checkout: {
    location: "New York",
    adults: 2,
    children: 0,
    pets: 0,
  },
};

const baseDwellByScreen: Record<SyntheticScreen, number> = {
  home: 2_200,
  results: 5_400,
  filters: 7_600,
  detail: 8_100,
  checkout: 7_200,
  success: 1_600,
};

export function getSyntheticUserProfile(id: string): SyntheticUserProfile {
  const profile = syntheticUserProfiles.find((item) => item.id === id);
  if (!profile) {
    throw new Error(`Unknown synthetic user profile: ${id}`);
  }

  return profile;
}

export function resolveTaskSearchState(
  taskId: SyntheticTaskId,
  state: SearchState = defaultSearchState,
): SearchState {
  return {
    ...state,
    ...taskDefaults[taskId],
  };
}

export function projectSyntheticUserBehavior(
  context: SyntheticBehaviorContext,
): SyntheticDecision {
  const profile =
    typeof context.profile === "string"
      ? getSyntheticUserProfile(context.profile)
      : context.profile;
  const searchState = resolveTaskSearchState(context.taskId, context.searchState);
  const history = context.history ?? [];
  const listings = context.listings ?? defaultListings;
  const candidates = buildActionCandidates({
    ...context,
    profile,
    searchState,
    history,
    listings,
  })
    .map((candidate) =>
      applyExperienceToCandidate(candidate, context.experience),
    )
    .sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    throw new Error(`No synthetic actions available for screen: ${context.screen}`);
  }

  const choice = chooseActionCandidate({
    candidates,
    exploration: profile.exploration,
    seed: `${context.seed ?? "synthetic"}:${profile.id}:${context.taskId}:${context.screen}:${history.join(",")}`,
  });
  const dwellBreakdown = applyExperienceToDwell(
    explainDwell({
      profile,
      taskId: context.taskId,
      screen: context.screen,
      action: choice.action,
      searchState,
      selectedListing: context.selectedListing,
      resultCount: visibleListings(searchState, context.filters, listings).length,
      seed: `${context.seed ?? "synthetic"}:dwell:${history.length}`,
    }),
    context.experience,
    context.screen,
    choice.action.id,
  );

  return {
    profileId: profile.id,
    taskId: context.taskId,
    screen: context.screen,
    dwellMs: dwellBreakdown.total,
    dwellBreakdown,
    action: choice.action,
    candidates,
    selection: choice.selection,
  };
}

export function projectSyntheticJourney(
  context: Omit<SyntheticBehaviorContext, "screen"> & {
    maxSteps?: number;
    startScreen?: SyntheticScreen;
  },
): SyntheticDecision[] {
  return explainSyntheticJourney(context).steps;
}

export function explainSyntheticJourney(
  context: Omit<SyntheticBehaviorContext, "screen"> & {
    maxSteps?: number;
    startScreen?: SyntheticScreen;
  },
): SyntheticJourneyExplanation {
  const profile =
    typeof context.profile === "string"
      ? getSyntheticUserProfile(context.profile)
      : context.profile;
  const searchState = resolveTaskSearchState(context.taskId, context.searchState);
  const listings = context.listings ?? defaultListings;
  const maxSteps = context.maxSteps ?? 8;
  const steps: SyntheticJourneyStep[] = [];
  const history: SyntheticActionId[] = [...(context.history ?? [])];
  let screen = context.startScreen ?? "home";
  let filters = context.filters ?? {};
  let selectedListing = context.selectedListing;

  for (let index = 0; index < maxSteps && screen !== "success"; index += 1) {
    const stateBefore = journeyState(screen, history, filters, selectedListing);
    const decision = projectSyntheticUserBehavior({
      profile,
      taskId: context.taskId,
      screen,
      searchState,
      selectedListing,
      filters,
      history,
      listings,
      seed: context.seed,
      experience: context.experience,
    });

    history.push(decision.action.id);

    if (decision.action.id === "apply_task_filters") {
      filters = {
        ...filters,
        ...(decision.action.metadata?.filters as ListingFilters | undefined),
      };
    }

    if (decision.action.id === "open_best_listing") {
      const listingId = String(decision.action.metadata?.listingId ?? "");
      selectedListing = listings.find((listing) => listing.id === listingId);
    }

    screen = nextScreenForAction(screen, decision.action.id);
    steps.push({
      ...decision,
      stepIndex: index + 1,
      stateBefore,
      stateAfter: journeyState(screen, history, filters, selectedListing),
    });
  }

  return {
    profile,
    taskId: context.taskId,
    seed: context.seed ?? "synthetic",
    searchState,
    steps,
    totals: {
      totalDwellMs: steps.reduce((total, step) => total + step.dwellMs, 0),
      actionCount: steps.length,
      finalScreen: screen,
    },
  };
}

function buildActionCandidates(
  context: SyntheticBehaviorContext & {
    profile: SyntheticUserProfile;
    searchState: SearchState;
    history: SyntheticActionId[];
    listings: Listing[];
  },
): SyntheticActionCandidate[] {
  const bestListing = chooseBestListingForProfile(context);
  const profile = context.profile;
  const selectedListing = context.selectedListing ?? bestListing;

  switch (context.screen) {
    case "home":
      return [
        scoreCandidate({
          id: "start_search",
          label: "Set task search fields and submit",
          targetTestId: "search-submit",
          base: 4,
          taskRelevance: 4,
          preferenceMatch: 1 + profile.checkoutConfidence,
          effort: 0.8,
          risk: 0,
          profile,
          metadata: { searchState: context.searchState },
        }),
      ];
    case "results":
      return resultsCandidates(context, bestListing);
    case "filters":
      return [
        scoreCandidate({
          id: "apply_task_filters",
          label: "Apply filters that match the task and profile",
          targetTestId: "apply-filters-button",
          base: 3.2,
          taskRelevance:
            context.taskId === "find_pet_friendly"
              ? 4
              : context.taskId === "find_budget_stay"
                ? 3.4
                : context.taskId === "compare_cancellation"
                  ? 2.6
                  : 0.8,
          preferenceMatch: 1 + profile.filterAffinity * 3,
          effort: 1.6,
          risk: 0,
          profile,
          metadata: { filters: taskFilters(context.taskId, profile) },
        }),
      ];
    case "detail":
      return detailCandidates(context, selectedListing);
    case "checkout":
      return checkoutCandidates(context, selectedListing);
    case "success":
      return [];
    default:
      return [];
  }
}

function resultsCandidates(
  context: SyntheticBehaviorContext & {
    profile: SyntheticUserProfile;
    searchState: SearchState;
    history: SyntheticActionId[];
    listings: Listing[];
  },
  bestListing: Listing,
): SyntheticActionCandidate[] {
  const profile = context.profile;
  const filtersApplied = context.history.includes("apply_task_filters");
  const sortedLowest = context.history.includes("sort_lowest_price");
  const needsFilters =
    !filtersApplied &&
    (context.taskId === "find_pet_friendly" ||
      (context.taskId === "find_budget_stay" && profile.filterAffinity > 0.45));
  const needsLowestSort =
    !sortedLowest &&
    context.taskId === "find_budget_stay" &&
    profile.priceSensitivity > 0.65;
  const bestListingPreference = listingPreferenceScore(bestListing, context);

  return [
    scoreCandidate({
      id: "open_filters",
      label: "Open filters",
      targetTestId: "filters-button",
      base: 2.2,
      taskRelevance: needsFilters ? 4.2 : 0.6,
      preferenceMatch: profile.filterAffinity * 3.2,
      effort: 1.3,
      risk: 0,
      profile,
    }),
    scoreCandidate({
      id: "sort_lowest_price",
      label: "Sort results by lowest price",
      targetTestId: "sort-select",
      base: 1.8,
      taskRelevance: needsLowestSort ? 3.4 : 0.4,
      preferenceMatch: profile.priceSensitivity * 2.4,
      effort: 0.9,
      risk: 0,
      profile,
      metadata: { sort: "lowest" },
    }),
    scoreCandidate({
      id: "open_best_listing",
      label: `Open ${bestListing.title}`,
      targetTestId: `listing-card-open-${bestListing.id}`,
      base: 3.3,
      taskRelevance: filtersApplied || !needsFilters ? 3.4 : 0.1,
      preferenceMatch: needsFilters ? bestListingPreference * 0.45 : bestListingPreference,
      effort: 1,
      risk: listingRiskScore(bestListing, context),
      profile,
      metadata: {
        listingId: bestListing.id,
        total: calculatePrice(
          bestListing,
          context.searchState.checkin,
          context.searchState.checkout,
        ).total,
      },
    }),
  ];
}

function detailCandidates(
  context: SyntheticBehaviorContext & {
    profile: SyntheticUserProfile;
    searchState: SearchState;
    history: SyntheticActionId[];
    listings: Listing[];
  },
  listing: Listing,
): SyntheticActionCandidate[] {
  const profile = context.profile;
  const sawPolicy = context.history.includes("scroll_to_policy");
  const policyNeeded = context.taskId === "compare_cancellation" && !sawPolicy;
  const risk = listingRiskScore(listing, context);

  return [
    scoreCandidate({
      id: "scroll_to_policy",
      label: "Scroll to cancellation policy",
      targetTestId: "detail-cancellation-policy",
      base: 1.8,
      taskRelevance: policyNeeded ? 5.2 : profile.policySensitivity * 0.8,
      preferenceMatch: profile.policySensitivity * 3.4,
      effort: 1.4,
      risk: 0,
      profile,
    }),
    scoreCandidate({
      id: "reserve_listing",
      label: "Reserve listing",
      targetTestId: "reserve-button",
      base: 3.2,
      taskRelevance: policyNeeded ? 0.8 : 3.6,
      preferenceMatch: profile.checkoutConfidence * 3,
      effort: 0.9,
      risk,
      profile,
      metadata: {
        listingId: listing.id,
        total: calculatePrice(
          listing,
          context.searchState.checkin,
          context.searchState.checkout,
        ).total,
      },
    }),
    scoreCandidate({
      id: "back_to_results",
      label: "Back to results",
      base: 1.3,
      taskRelevance: risk > 2.4 ? 2.2 : 0.4,
      preferenceMatch: profile.exploration * 2,
      effort: 1.2,
      risk: 0,
      profile,
    }),
  ];
}

function checkoutCandidates(
  context: SyntheticBehaviorContext & {
    profile: SyntheticUserProfile;
    searchState: SearchState;
    history: SyntheticActionId[];
    listings: Listing[];
  },
  listing: Listing,
): SyntheticActionCandidate[] {
  const profile = context.profile;
  const reviewedPrice = context.history.includes("review_price_breakdown");
  const price = calculatePrice(
    listing,
    context.searchState.checkin,
    context.searchState.checkout,
  );
  const overBudget =
    profile.maxBudgetTotal !== undefined && price.total > profile.maxBudgetTotal;
  const needsReview =
    !reviewedPrice && (profile.priceSensitivity > 0.6 || overBudget);

  return [
    scoreCandidate({
      id: "review_price_breakdown",
      label: "Review price breakdown",
      targetTestId: "checkout-price-breakdown",
      base: 1.9,
      taskRelevance: needsReview ? 3.8 : 0.5,
      preferenceMatch: profile.priceSensitivity * 3.5,
      effort: 1.1,
      risk: 0,
      profile,
      metadata: { total: price.total },
    }),
    scoreCandidate({
      id: "confirm_reservation",
      label: "Confirm reservation",
      targetTestId: "confirm-reservation-button",
      base: 3.4,
      taskRelevance: needsReview ? 1.2 : 4,
      preferenceMatch: profile.checkoutConfidence * 3.2,
      effort: 0.7,
      risk: overBudget ? profile.priceSensitivity * 3.5 : 0,
      profile,
      metadata: { listingId: listing.id, total: price.total },
    }),
    scoreCandidate({
      id: "abandon_task",
      label: "Abandon checkout",
      base: 0.8,
      taskRelevance: overBudget ? 2.6 : 0.2,
      preferenceMatch: (1 - profile.checkoutConfidence) * 2,
      effort: 0.2,
      risk: 0,
      profile,
      metadata: { total: price.total },
    }),
  ];
}

function scoreCandidate({
  id,
  label,
  targetTestId,
  metadata,
  base,
  taskRelevance,
  preferenceMatch,
  effort,
  risk,
  profile,
}: {
  id: SyntheticActionId;
  label: string;
  targetTestId?: string;
  metadata?: Record<string, unknown>;
  base: number;
  taskRelevance: number;
  preferenceMatch: number;
  effort: number;
  risk: number;
  profile: SyntheticUserProfile;
}): SyntheticActionCandidate {
  const scoreBreakdown = {
    base,
    taskRelevance,
    preferenceMatch,
    effortPenalty: effort * (1.25 - profile.patience),
    riskPenalty: risk,
    experienceAdjustment: 0,
    total: 0,
  };
  scoreBreakdown.total =
    scoreBreakdown.base +
    scoreBreakdown.taskRelevance +
    scoreBreakdown.preferenceMatch -
    scoreBreakdown.effortPenalty -
    scoreBreakdown.riskPenalty +
    scoreBreakdown.experienceAdjustment;

  return {
    id,
    label,
    targetTestId,
    metadata,
    score: round(scoreBreakdown.total),
    scoreBreakdown: {
      ...scoreBreakdown,
      total: round(scoreBreakdown.total),
    },
  };
}

function applyExperienceToCandidate(
  candidate: SyntheticActionCandidate,
  experience: SyntheticExperienceConfig | undefined,
): SyntheticActionCandidate {
  const adjustment = experience?.actionScoreAdjustments?.[candidate.id] ?? 0;
  if (adjustment === 0) {
    return candidate;
  }

  const total = round(candidate.scoreBreakdown.total + adjustment);

  return {
    ...candidate,
    score: total,
    scoreBreakdown: {
      ...candidate.scoreBreakdown,
      experienceAdjustment: round(
        candidate.scoreBreakdown.experienceAdjustment + adjustment,
      ),
      total,
    },
  };
}

function chooseBestListingForProfile(
  context: SyntheticBehaviorContext & {
    profile: SyntheticUserProfile;
    searchState: SearchState;
    listings: Listing[];
  },
): Listing {
  const visible = visibleListings(
    context.searchState,
    context.filters,
    context.listings,
  );
  const ranked = [...visible].sort(
    (a, b) => listingScore(b, context) - listingScore(a, context),
  );

  return ranked[0] ?? context.listings[0];
}

function visibleListings(
  searchState: SearchState,
  filters: ListingFilters | undefined,
  listings: Listing[],
): Listing[] {
  return filterListings({
    ...(filters ?? {}),
    location: searchState.location,
  }).filter((listing) => listings.some((item) => item.id === listing.id));
}

function listingScore(
  listing: Listing,
  context: SyntheticBehaviorContext & {
    profile: SyntheticUserProfile;
    searchState: SearchState;
  },
): number {
  const profile = context.profile;
  const price = calculatePrice(
    listing,
    context.searchState.checkin,
    context.searchState.checkout,
  );
  let score =
    listing.rating * profile.qualitySensitivity +
    Math.min(1, listing.reviewCount / 200) * profile.qualitySensitivity;

  score -= price.total * profile.priceSensitivity * 0.004;

  if (profile.maxBudgetTotal !== undefined && price.total <= profile.maxBudgetTotal) {
    score += 3.6 * profile.priceSensitivity;
  }

  if (profile.prefersPetFriendly && listing.isPetFriendly) {
    score += 2.6;
  }

  if (profile.wantsParking && listing.hasParking) {
    score += 2.4;
  }

  if (context.taskId === "find_pet_friendly") {
    score += listing.isPetFriendly ? 2.8 : -2.8;
    score += listing.hasParking ? 2.2 : -2.2;
  }

  if (context.taskId === "compare_cancellation") {
    score +=
      listing.cancellationPolicy === "Flexible"
        ? 2.6 * profile.policySensitivity
        : listing.cancellationPolicy === "Moderate"
          ? 1.2 * profile.policySensitivity
          : -1.8 * profile.policySensitivity;
  }

  if (context.taskId === "complete_checkout") {
    score += profile.checkoutConfidence * 1.4;
  }

  return score;
}

function listingPreferenceScore(
  listing: Listing,
  context: SyntheticBehaviorContext & {
    profile: SyntheticUserProfile;
    searchState: SearchState;
  },
): number {
  const rawScore = listingScore(listing, context);
  return Math.max(0, Math.min(5.5, rawScore + 2.8));
}

function listingRiskScore(
  listing: Listing,
  context: SyntheticBehaviorContext & {
    profile: SyntheticUserProfile;
    searchState: SearchState;
  },
): number {
  const profile = context.profile;
  const price = calculatePrice(
    listing,
    context.searchState.checkin,
    context.searchState.checkout,
  );
  let risk = 0;

  if (profile.maxBudgetTotal !== undefined && price.total > profile.maxBudgetTotal) {
    risk +=
      ((price.total - profile.maxBudgetTotal) / profile.maxBudgetTotal) *
      6 *
      profile.priceSensitivity;
  }

  if (listing.cancellationPolicy === "Strict") {
    risk += profile.policySensitivity * 1.5;
  }

  return risk;
}

function taskFilters(
  taskId: SyntheticTaskId,
  profile: SyntheticUserProfile,
): ListingFilters {
  switch (taskId) {
    case "find_budget_stay":
      return {
        priceMax: profile.maxBudgetTotal ? 180 : undefined,
        sort: "lowest",
      };
    case "find_pet_friendly":
      return {
        petFriendly: true,
        parking: true,
      };
    case "compare_cancellation":
      return {
        cancellationPolicy: profile.policySensitivity > 0.8 ? "Flexible" : undefined,
      };
    case "complete_checkout":
      return {};
    default:
      return {};
  }
}

function explainDwell({
  profile,
  taskId,
  screen,
  action,
  searchState,
  selectedListing,
  resultCount,
  seed,
}: {
  profile: SyntheticUserProfile;
  taskId: SyntheticTaskId;
  screen: SyntheticScreen;
  action: SyntheticActionCandidate;
  searchState: SearchState;
  selectedListing?: Listing;
  resultCount: number;
  seed: string;
}): SyntheticDwellBreakdown {
  const base = baseDwellByScreen[screen];
  const resultComplexity =
    screen === "results" ? Math.min(5, resultCount) * 620 : 0;
  const formComplexity =
    screen === "filters" ? 1_200 + profile.filterAffinity * 900 : 0;
  const policyPressure =
    taskId === "compare_cancellation" && screen === "detail"
      ? profile.policySensitivity * 2_600
      : 0;
  const pricePressure =
    screen === "checkout"
      ? profile.priceSensitivity * 1_500 +
        checkoutOverBudgetPressure(profile, selectedListing, searchState)
      : 0;
  const actionUncertainty = Math.max(0, 8 - action.score) * 240;
  const patienceMultiplier = 0.65 + profile.patience * 0.9;
  const speedMultiplier = 1 / Math.max(0.35, profile.speed);
  const jitter = 0.86 + seededRandom(seed) * 0.28;
  const subtotalBeforeMultipliers =
    base +
      resultComplexity +
      formComplexity +
      policyPressure +
      pricePressure +
      actionUncertainty;

  return {
    base,
    resultComplexity: round(resultComplexity),
    formComplexity: round(formComplexity),
    policyPressure: round(policyPressure),
    pricePressure: round(pricePressure),
    actionUncertainty: round(actionUncertainty),
    subtotalBeforeMultipliers: round(subtotalBeforeMultipliers),
    patienceMultiplier: round(patienceMultiplier),
    speedMultiplier: round(speedMultiplier),
    jitter: round(jitter),
    experienceMultiplier: 1,
    total: Math.round(
      subtotalBeforeMultipliers * patienceMultiplier * speedMultiplier * jitter,
    ),
  };
}

function applyExperienceToDwell(
  breakdown: SyntheticDwellBreakdown,
  experience: SyntheticExperienceConfig | undefined,
  screen: SyntheticScreen,
  actionId: SyntheticActionId,
): SyntheticDwellBreakdown {
  const screenMultiplier = experience?.screenDwellMultipliers?.[screen] ?? 1;
  const actionMultiplier = experience?.actionDwellMultipliers?.[actionId] ?? 1;
  const experienceMultiplier = screenMultiplier * actionMultiplier;

  if (experienceMultiplier === 1) {
    return breakdown;
  }

  return {
    ...breakdown,
    experienceMultiplier: round(experienceMultiplier),
    total: Math.round(breakdown.total * experienceMultiplier),
  };
}

function checkoutOverBudgetPressure(
  profile: SyntheticUserProfile,
  listing: Listing | undefined,
  searchState: SearchState,
): number {
  if (!listing || profile.maxBudgetTotal === undefined) {
    return 0;
  }

  const total = calculatePrice(listing, searchState.checkin, searchState.checkout)
    .total;
  return total > profile.maxBudgetTotal
    ? ((total - profile.maxBudgetTotal) / profile.maxBudgetTotal) *
        4_000 *
        profile.priceSensitivity
    : 0;
}

function chooseActionCandidate({
  candidates,
  exploration,
  seed,
}: {
  candidates: SyntheticActionCandidate[];
  exploration: number;
  seed: string;
}): {
  action: SyntheticActionCandidate;
  selection: SyntheticCandidateSelection;
} {
  const temperature = 0.35 + exploration * 1.4;
  const topScore = Math.max(...candidates.map((candidate) => candidate.score));
  const weighted = candidates.map((candidate) => ({
    candidate,
    weight: Math.exp((candidate.score - topScore) / temperature),
  }));
  const total = weighted.reduce((sum, item) => sum + item.weight, 0);
  const draw = seededRandom(seed) * total;
  let remainingDraw = draw;
  let cumulativeWeight = 0;
  const probabilities: SyntheticCandidateProbability[] = [];

  for (const item of weighted) {
    cumulativeWeight += item.weight;
    probabilities.push({
      id: item.candidate.id,
      score: item.candidate.score,
      weight: round(item.weight),
      probability: round(item.weight / total),
      cumulativeProbability: round(cumulativeWeight / total),
    });
  }

  for (const item of weighted) {
    const selectedRangeStart = cumulativeWeightFor(weighted, item.candidate.id);
    const selectedRangeEnd = selectedRangeStart + item.weight;
    remainingDraw -= item.weight;
    if (remainingDraw <= 0) {
      return {
        action: item.candidate,
        selection: {
          seed,
          temperature: round(temperature),
          draw: round(draw),
          totalWeight: round(total),
          selectedRangeStart: round(selectedRangeStart),
          selectedRangeEnd: round(selectedRangeEnd),
          probabilities,
        },
      };
    }
  }

  return {
    action: candidates[0],
    selection: {
      seed,
      temperature: round(temperature),
      draw: round(draw),
      totalWeight: round(total),
      selectedRangeStart: 0,
      selectedRangeEnd: round(weighted[0]?.weight ?? 0),
      probabilities,
    },
  };
}

function cumulativeWeightFor(
  weighted: Array<{ candidate: SyntheticActionCandidate; weight: number }>,
  id: SyntheticActionId,
): number {
  let total = 0;
  for (const item of weighted) {
    if (item.candidate.id === id) {
      return total;
    }
    total += item.weight;
  }

  return total;
}

function nextScreenForAction(
  current: SyntheticScreen,
  actionId: SyntheticActionId,
): SyntheticScreen {
  switch (actionId) {
    case "start_search":
      return "results";
    case "open_filters":
      return "filters";
    case "apply_task_filters":
    case "sort_lowest_price":
    case "back_to_results":
      return "results";
    case "open_best_listing":
      return "detail";
    case "scroll_to_policy":
      return current;
    case "reserve_listing":
      return "checkout";
    case "review_price_breakdown":
      return current;
    case "confirm_reservation":
    case "abandon_task":
      return "success";
    default:
      return current;
  }
}

function journeyState(
  screen: SyntheticScreen,
  history: SyntheticActionId[],
  filters: ListingFilters,
  selectedListing: Listing | undefined,
): SyntheticJourneyState {
  return {
    screen,
    history: [...history],
    filters: { ...filters },
    selectedListingId: selectedListing?.id,
  };
}

function seededRandom(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }

  hash += hash << 13;
  hash ^= hash >>> 7;
  hash += hash << 3;
  hash ^= hash >>> 17;
  hash += hash << 5;

  return (hash >>> 0) / 4_294_967_296;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}
