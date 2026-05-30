"use client";

import { X } from "lucide-react";
import { useState } from "react";
import { getActorType, logUXEvent } from "@/lib/analytics";
import { recordFilterToggle } from "@/lib/friction";
import type { ListingFilters } from "@/lib/listings";

const propertyTypes = ["Apartment", "House", "Studio", "Guest suite"];
const policies = ["Flexible", "Moderate", "Strict"];

export function FilterModal({
  filters,
  open,
  onClose,
  onApply,
  onClear,
}: {
  filters: ListingFilters;
  open: boolean;
  onClose: () => void;
  onApply: (filters: ListingFilters) => void;
  onClear: () => void;
}) {
  const [draft, setDraft] = useState<ListingFilters>(filters);

  if (!open) {
    return null;
  }

  function updateNumber(key: "priceMin" | "priceMax" | "bedrooms" | "rating", value: string) {
    setDraft((current) => ({
      ...current,
      [key]: value ? Number(value) : undefined,
    }));
  }

  function applyFilters() {
    onApply(draft);
    logUXEvent({
      actorType: getActorType(),
      type: "filter_apply",
      page: window.location.pathname,
      elementTestId: "apply-filters-button",
      metadata: draft,
    });
  }

  function closeModal() {
    onClose();
    recordFilterToggle(window.location.pathname);
    logUXEvent({
      actorType: getActorType(),
      type: "modal_close",
      page: window.location.pathname,
      elementTestId: "close-filters-button",
    });
  }

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/40 px-4 py-6">
      <section
        data-testid="filters-modal"
        className="mx-auto flex max-h-[88vh] max-w-xl flex-col rounded-2xl bg-white shadow-2xl"
        aria-label="Filters"
      >
        <div className="flex items-center justify-between border-b border-stone-200 px-6 py-4">
          <h2 className="text-lg font-semibold text-stone-950">Filters</h2>
          <button
            data-testid="close-filters-button"
            aria-label="Close filters"
            className="grid size-9 place-items-center rounded-full hover:bg-stone-100"
            type="button"
            onClick={closeModal}
          >
            <X className="size-5" />
          </button>
        </div>

        <div className="space-y-8 overflow-y-auto px-6 py-5">
          <section>
            <h3 className="text-sm font-semibold text-stone-950">Stay basics</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-stone-700">
                Property type
                <select
                  data-testid="property-type-select"
                  value={draft.propertyType || ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      propertyType: event.target.value || undefined,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2"
                >
                  <option value="">Any type</option>
                  {propertyTypes.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-stone-700">
                Bedrooms
                <select
                  data-testid="bedrooms-select"
                  value={draft.bedrooms || ""}
                  onChange={(event) => updateNumber("bedrooms", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2"
                >
                  <option value="">Any</option>
                  <option value="1">1+</option>
                  <option value="2">2+</option>
                  <option value="3">3+</option>
                </select>
              </label>
            </div>
          </section>

          <section className="rounded-xl border border-stone-200 p-4">
            <h3 className="text-sm font-semibold text-stone-950">Useful extras</h3>
            <div className="mt-4 space-y-3">
              <label className="flex items-center justify-between text-sm font-medium text-stone-700">
                Pet-friendly
                <input
                  data-testid="pet-friendly-checkbox"
                  type="checkbox"
                  checked={Boolean(draft.petFriendly)}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      petFriendly: event.target.checked,
                    }))
                  }
                  className="size-5 accent-[#e95f45]"
                />
              </label>
              <label className="flex items-center justify-between text-sm font-medium text-stone-700">
                Parking
                <input
                  data-testid="parking-checkbox"
                  type="checkbox"
                  checked={Boolean(draft.parking)}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      parking: event.target.checked,
                    }))
                  }
                  className="size-5 accent-[#e95f45]"
                />
              </label>
            </div>
          </section>

          <section>
            <h3 className="text-sm font-semibold text-stone-950">Price range</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-stone-700">
                Minimum
                <input
                  data-testid="price-min-input"
                  type="number"
                  value={draft.priceMin || ""}
                  onChange={(event) => updateNumber("priceMin", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2"
                  placeholder="$100"
                />
              </label>
              <label className="text-sm font-medium text-stone-700">
                Maximum
                <input
                  data-testid="price-max-input"
                  type="number"
                  value={draft.priceMax || ""}
                  onChange={(event) => updateNumber("priceMax", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2"
                  placeholder="$250"
                />
              </label>
            </div>
          </section>

          <section className="pb-6">
            <h3 className="text-sm font-semibold text-stone-950">Policy and quality</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <label className="text-sm font-medium text-stone-700">
                Cancellation policy
                <select
                  data-testid="cancellation-policy-select"
                  value={draft.cancellationPolicy || ""}
                  onChange={(event) =>
                    setDraft((current) => ({
                      ...current,
                      cancellationPolicy: event.target.value || undefined,
                    }))
                  }
                  className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2"
                >
                  <option value="">Any policy</option>
                  {policies.map((policy) => (
                    <option key={policy} value={policy}>
                      {policy}
                    </option>
                  ))}
                </select>
              </label>
              <label className="text-sm font-medium text-stone-700">
                Rating
                <select
                  data-testid="rating-select"
                  value={draft.rating || ""}
                  onChange={(event) => updateNumber("rating", event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 px-3 py-2"
                >
                  <option value="">Any rating</option>
                  <option value="4.6">4.6+</option>
                  <option value="4.8">4.8+</option>
                  <option value="4.9">4.9+</option>
                </select>
              </label>
            </div>
          </section>
        </div>

        <div className="flex items-center justify-between border-t border-stone-200 px-6 py-4">
          <button
            data-testid="clear-filters-button"
            className="text-sm font-semibold text-stone-700 underline"
            type="button"
            onClick={() => {
              setDraft({});
              onClear();
            }}
          >
            Clear all
          </button>
          <button
            data-testid="apply-filters-button"
            className="rounded-full bg-stone-950 px-5 py-3 text-sm font-semibold text-white"
            type="button"
            onClick={applyFilters}
          >
            Apply filters
          </button>
        </div>
      </section>
    </div>
  );
}
