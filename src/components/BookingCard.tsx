"use client";

import { useState } from "react";
import type { Listing } from "@/data/listings";
import { getActorType, logUXEvent } from "@/lib/analytics";
import { guestSummary, type SearchState } from "@/lib/urlState";

export function BookingCard({
  listing,
  initialState,
  onReserve,
}: {
  listing: Listing;
  initialState: SearchState;
  onReserve: (state: SearchState) => void;
}) {
  const [state, setState] = useState(initialState);

  function reserve() {
    logUXEvent({
      actorType: getActorType(),
      type: "checkout_start",
      page: window.location.pathname,
      elementTestId: "reserve-button",
      metadata: { listingId: listing.id },
    });

    onReserve(state);
  }

  return (
    <section
      data-testid="booking-card"
      className="sticky top-28 rounded-3xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/10"
    >
      <p className="text-stone-950">
        <span className="text-2xl font-semibold">${listing.nightlyPrice}</span>{" "}
        <span className="text-sm text-stone-600">night</span>
      </p>
      <div className="mt-5 grid overflow-hidden rounded-2xl border border-stone-300">
        <label className="border-b border-stone-300 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Check in
          <input
            data-testid="booking-checkin-input"
            type="date"
            value={state.checkin}
            onChange={(event) =>
              setState((value) => ({ ...value, checkin: event.target.value }))
            }
            className="mt-1 block w-full text-sm font-normal normal-case tracking-normal text-stone-950 outline-none"
            aria-label="Booking check in"
          />
        </label>
        <label className="border-b border-stone-300 px-4 py-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
          Check out
          <input
            data-testid="booking-checkout-input"
            type="date"
            value={state.checkout}
            onChange={(event) =>
              setState((value) => ({ ...value, checkout: event.target.value }))
            }
            className="mt-1 block w-full text-sm font-normal normal-case tracking-normal text-stone-950 outline-none"
            aria-label="Booking check out"
          />
        </label>
        <button
          data-testid="booking-guests-button"
          aria-label="Review guests"
          className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-stone-500"
          type="button"
          onClick={() =>
            setState((value) => ({
              ...value,
              adults: Math.min(listing.maxGuests, value.adults + 1),
            }))
          }
        >
          Guests
          <span className="mt-1 block text-sm font-normal normal-case tracking-normal text-stone-950">
            {guestSummary(state)}
          </span>
        </button>
      </div>
      <button
        data-testid="reserve-button"
        aria-label="Reserve this stay"
        className="mt-5 w-full rounded-full bg-[#e95f45] px-5 py-3 text-sm font-semibold text-white hover:bg-[#d84f37]"
        type="button"
        onClick={reserve}
      >
        Reserve
      </button>
      <p className="mt-3 text-center text-sm text-stone-500">
        Fees calculated at checkout
      </p>
    </section>
  );
}
