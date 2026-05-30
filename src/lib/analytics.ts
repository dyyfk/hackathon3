import { EVENT_STORAGE_KEY, getOrCreateSessionId } from "@/lib/session";

export type UXEvent = {
  sessionId: string;
  actorType: "human" | "agent" | "unknown";
  variantId: "A" | "B";
  taskId?: string;
  timestamp: number;
  type:
    | "page_view"
    | "click"
    | "input"
    | "scroll"
    | "modal_open"
    | "modal_close"
    | "filter_apply"
    | "listing_open"
    | "checkout_start"
    | "checkout_success"
    | "friction";
  page: string;
  elementTestId?: string;
  elementText?: string;
  selector?: string;
  x?: number;
  y?: number;
  valueSummary?: string;
  metadata?: Record<string, unknown>;
};

function currentSearchParams() {
  if (typeof window === "undefined") {
    return new URLSearchParams();
  }

  return new URLSearchParams(window.location.search);
}

export function getActorType(): UXEvent["actorType"] {
  const actor = currentSearchParams().get("actor");
  return actor === "human" || actor === "agent" ? actor : "unknown";
}

export function getVariantId(): UXEvent["variantId"] {
  const variant = currentSearchParams().get("variant");
  return variant === "B" ? "B" : "A";
}

export function getTaskId(): string | undefined {
  return currentSearchParams().get("task") || undefined;
}

export function getStoredUXEvents(): UXEvent[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(EVENT_STORAGE_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UXEvent[]) : [];
  } catch {
    return [];
  }
}

export function clearUXEvents(): void {
  if (typeof window !== "undefined") {
    window.localStorage.removeItem(EVENT_STORAGE_KEY);
  }
}

export function logUXEvent(
  event: Omit<UXEvent, "sessionId" | "timestamp" | "variantId">,
): void {
  if (typeof window === "undefined") {
    return;
  }

  const fullEvent: UXEvent = {
    ...event,
    sessionId: getOrCreateSessionId(),
    timestamp: Date.now(),
    variantId: getVariantId(),
    taskId: event.taskId ?? getTaskId(),
  };

  const events = getStoredUXEvents();
  events.push(fullEvent);
  window.localStorage.setItem(EVENT_STORAGE_KEY, JSON.stringify(events));
  console.info("[staybnb UXEvent]", fullEvent);
}

export function exportUXEvents() {
  return {
    exportedAt: new Date().toISOString(),
    variantId: "A" as const,
    events: getStoredUXEvents(),
  };
}
