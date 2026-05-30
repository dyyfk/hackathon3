export const SESSION_STORAGE_KEY = "staybnb_session_id";
export const EVENT_STORAGE_KEY = "staybnb_ux_events";

export function getOrCreateSessionId(): string {
  if (typeof window === "undefined") {
    return "server-session";
  }

  const existing = window.localStorage.getItem(SESSION_STORAGE_KEY);
  if (existing) {
    return existing;
  }

  const sessionId =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `staybnb-${Date.now()}-${Math.random().toString(16).slice(2)}`;

  window.localStorage.setItem(SESSION_STORAGE_KEY, sessionId);
  return sessionId;
}
