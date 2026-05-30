"use client";

import { useState } from "react";
import { PriceBreakdown } from "@/components/PriceBreakdown";
import type { Listing } from "@/data/listings";
import { getActorType, logUXEvent } from "@/lib/analytics";
import { guestSummary, type SearchState } from "@/lib/urlState";

export function CheckoutPanel({
  listing,
  state,
}: {
  listing: Listing;
  state: SearchState;
}) {
  const [confirmed, setConfirmed] = useState(false);

  function confirmReservation() {
    setConfirmed(true);
    logUXEvent({
      actorType: getActorType(),
      type: "checkout_success",
      page: window.location.pathname,
      elementTestId: "confirm-reservation-button",
      metadata: {
        listingId: listing.id,
      },
    });
  }

  return (
    <section data-testid="checkout-page" className="space-y-6">
      <div>
        <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e95f45]">
          Mock checkout
        </p>
        <h2 className="mt-2 text-2xl font-semibold text-stone-950">
          Finish your staybnb reservation
        </h2>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <div className="space-y-5">
          <section
            data-testid="checkout-trip-summary"
            className="rounded-2xl border border-stone-200 bg-white p-5"
          >
            <h3 className="text-lg font-semibold text-stone-950">
              Trip details
            </h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-stone-500">Dates</p>
                <p className="font-medium text-stone-950">
                  {state.checkin} to {state.checkout}
                </p>
              </div>
              <div>
                <p className="text-sm text-stone-500">Guests</p>
                <p className="font-medium text-stone-950">
                  {guestSummary(state)}
                </p>
              </div>
              <div>
                <p className="text-sm text-stone-500">Stay</p>
                <p className="font-medium text-stone-950">{listing.title}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-stone-950">Guest info</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-stone-700">
                Name
                <input
                  className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2"
                  placeholder="Test guest"
                  aria-label="Guest name"
                />
              </label>
              <label className="text-sm font-medium text-stone-700">
                Email
                <input
                  className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2"
                  placeholder="guest@example.com"
                  aria-label="Guest email"
                />
              </label>
            </div>
          </section>

          <section className="rounded-2xl border border-stone-200 bg-white p-5">
            <h3 className="text-lg font-semibold text-stone-950">
              Mock payment
            </h3>
            <p
              data-testid="mock-payment-notice"
              className="mt-4 rounded-2xl bg-[#eef7f4] p-4 text-sm leading-6 text-stone-700"
            >
              This is a mock checkout for UX testing. No payment will be
              processed.
            </p>
            <button
              data-testid="confirm-reservation-button"
              aria-label="Confirm reservation"
              className="mt-5 rounded-full bg-[#e95f45] px-6 py-3 text-sm font-semibold text-white hover:bg-[#d84f37]"
              type="button"
              onClick={confirmReservation}
            >
              Confirm reservation
            </button>
            {confirmed ? (
              <div
                data-testid="reservation-success"
                className="mt-5 rounded-2xl bg-stone-950 p-5 text-white"
              >
                <h3 className="text-xl font-semibold">
                  Reservation confirmed
                </h3>
                <p className="mt-2 text-sm text-stone-200">
                  Your mock reservation has been recorded for this session.
                </p>
              </div>
            ) : null}
          </section>
        </div>

        <div className="lg:sticky lg:top-28 lg:self-start">
          <PriceBreakdown
            listing={listing}
            checkin={state.checkin}
            checkout={state.checkout}
          />
        </div>
      </div>
    </section>
  );
}
