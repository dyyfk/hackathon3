import { getActorType, logUXEvent } from "@/lib/analytics";

export type FrictionSignal =
  | "dead_click"
  | "rage_click"
  | "repeated_filter_toggle"
  | "backtracking"
  | "long_dwell_on_filter"
  | "checkout_price_surprise"
  | "policy_search_friction";

type ClickRecord = {
  testId: string;
  timestamp: number;
};

let recentClicks: ClickRecord[] = [];
let filterToggleCount = 0;

export function recordPotentialRageClick(testId: string, page: string): void {
  const now = Date.now();
  recentClicks = [...recentClicks, { testId, timestamp: now }].filter(
    (record) => now - record.timestamp <= 3_000,
  );

  const matching = recentClicks.filter((record) => record.testId === testId);
  if (matching.length >= 3) {
    logFriction("rage_click", page, { elementTestId: testId });
    recentClicks = recentClicks.filter((record) => record.testId !== testId);
  }
}

export function recordFilterToggle(page: string): void {
  filterToggleCount += 1;
  if (filterToggleCount > 2) {
    logFriction("repeated_filter_toggle", page, {
      toggleCount: filterToggleCount,
    });
  }
}

export function resetFilterToggleCount(): void {
  filterToggleCount = 0;
}

export function logFriction(
  signal: FrictionSignal,
  page: string,
  metadata?: Record<string, unknown>,
): void {
  logUXEvent({
    actorType: getActorType(),
    type: "friction",
    page,
    metadata: {
      signal,
      ...metadata,
    },
  });
}
