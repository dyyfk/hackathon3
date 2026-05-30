export type SearchState = {
  location: string;
  checkin: string;
  checkout: string;
  adults: number;
  children: number;
  pets: number;
};

const defaults: SearchState = {
  location: "San Francisco",
  checkin: "2026-06-14",
  checkout: "2026-06-16",
  adults: 1,
  children: 0,
  pets: 0,
};

function firstParam(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function toNumber(value: string | string[] | undefined, fallback: number) {
  const parsed = Number(firstParam(value));
  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

export function readSearchState(
  params: Record<string, string | string[] | undefined>,
): SearchState {
  return {
    location: firstParam(params.location) || defaults.location,
    checkin: firstParam(params.checkin) || defaults.checkin,
    checkout: firstParam(params.checkout) || defaults.checkout,
    adults: toNumber(params.adults, defaults.adults),
    children: toNumber(params.children, defaults.children),
    pets: toNumber(params.pets, defaults.pets),
  };
}

export function searchStateToParams(state: SearchState): URLSearchParams {
  const params = new URLSearchParams();
  params.set("location", state.location);
  params.set("checkin", state.checkin);
  params.set("checkout", state.checkout);
  params.set("adults", String(state.adults));
  params.set("children", String(state.children));
  params.set("pets", String(state.pets));
  return params;
}

export function guestSummary(state: Pick<SearchState, "adults" | "children" | "pets">) {
  const guests = state.adults + state.children;
  const guestText = `${guests} guest${guests === 1 ? "" : "s"}`;
  return state.pets > 0 ? `${guestText}, pets` : guestText;
}
