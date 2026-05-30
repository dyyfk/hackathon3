"use client";

import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  PawPrint,
  ParkingCircle,
  ReceiptText,
  Search,
  ShieldCheck,
  SlidersHorizontal,
} from "lucide-react";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { listings, type Listing } from "@/data/listings";
import { calculatePrice } from "@/lib/pricing";
import type { SearchState } from "@/lib/urlState";

type Variant = "A" | "B";

const initialSearch: SearchState = {
  location: "San Francisco",
  checkin: "2026-06-14",
  checkout: "2026-06-16",
  adults: 2,
  children: 0,
  pets: 1,
};

const imageByIndex = [
  "/mock-stays/stay-01.jpg",
  "/mock-stays/stay-02.jpg",
  "/mock-stays/stay-03.jpg",
];

function totalLabel(listing: Listing, state: SearchState) {
  return `$${calculatePrice(listing, state.checkin, state.checkout).total}`;
}

function imageFor(index: number) {
  return imageByIndex[index % imageByIndex.length];
}

export function UserTwinVariant({ variant }: { variant: Variant }) {
  const improved = variant === "B";
  const [location, setLocation] = useState(initialSearch.location);
  const [searchState, setSearchState] = useState<SearchState>(initialSearch);
  const [hasSearched, setHasSearched] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [clientReady, setClientReady] = useState(false);

  useEffect(() => {
    setClientReady(true);
  }, []);

  const results = useMemo(() => {
    const matching = listings.filter((listing) =>
      listing.location.toLowerCase().includes(location.toLowerCase()),
    );
    return (matching.length > 0 ? matching : listings).slice(0, 3);
  }, [location]);

  function runSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSearchState((current) => ({ ...current, location }));
    setHasSearched(true);
    setSelectedListing(null);
    setCheckoutOpen(false);
  }

  function openListing(listing: Listing) {
    setSelectedListing(listing);
    setCheckoutOpen(false);
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fbfaf8]">
        {clientReady ? (
          <span data-testid="client-ready" className="sr-only">
            Client ready
          </span>
        ) : null}
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-end">
              <div>
                <p
                  data-testid="variant-label"
                  className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e95f45]"
                >
                  Variant {variant} / {improved ? "Improved" : "Baseline"}
                </p>
                <h1 className="mt-3 text-4xl font-semibold tracking-normal text-stone-950 sm:text-6xl">
                  StayLab short-stay search
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
                  {improved
                    ? "Clear price, policy, pet, and parking signals are available before checkout."
                    : "A realistic baseline where key booking signals appear late in the task."}
                </p>
              </div>
              <div className="overflow-hidden rounded-2xl border border-stone-200 bg-stone-950 text-white">
                <Image
                  src="/mock-stays/stay-04.jpg"
                  alt="StayLab apartment preview"
                  className="h-44 w-full object-cover opacity-90"
                  width={640}
                  height={360}
                  priority
                  unoptimized
                />
                <div className="p-5">
                  <p className="text-sm text-stone-300">Task under test</p>
                  <p className="mt-2 text-lg font-semibold">
                    Search, compare, select, and reach checkout.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={runSearch}
              className={`mt-8 grid gap-3 rounded-2xl border bg-white p-3 shadow-xl shadow-stone-900/10 md:grid-cols-[1fr_auto_auto] ${
                improved ? "border-stone-300" : "border-stone-200"
              }`}
            >
              <label className="rounded-xl px-4 py-3 hover:bg-stone-50">
                <span className="block text-xs font-semibold uppercase tracking-wide text-stone-500">
                  Location
                </span>
                <input
                  data-testid="search-input"
                  value={location}
                  onChange={(event) => setLocation(event.target.value)}
                  className="mt-1 w-full bg-transparent text-base font-medium text-stone-950 outline-none"
                  aria-label="Search location"
                />
              </label>
              <button
                data-testid="filter-button"
                type="button"
                onClick={() => setFilterOpen((value) => !value)}
                className={`inline-flex items-center justify-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold ${
                  improved
                    ? "border border-stone-950 bg-stone-950 text-white"
                    : "border border-stone-200 bg-stone-50 text-stone-600"
                }`}
              >
                <SlidersHorizontal className="size-4" />
                Filters
              </button>
              <button
                data-testid="search-button"
                type="submit"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e95f45] px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-[#e95f45]/25"
              >
                <Search className="size-4" />
                Search
              </button>
            </form>

            {filterOpen ? (
              <div className="mt-4 grid gap-3 rounded-2xl border border-stone-200 bg-[#fbfaf8] p-4 text-sm text-stone-700 md:grid-cols-4">
                <span>Two nights</span>
                <span>Pets allowed</span>
                <span>Parking preferred</span>
                <span>Flexible cancellation</span>
              </div>
            ) : null}
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          <div>
            <div className="flex items-end justify-between border-b border-stone-200 pb-5">
              <div>
                <p className="text-sm text-stone-500">
                  {hasSearched ? results.length : "Suggested"} stays in{" "}
                  {searchState.location}
                </p>
                <h2 className="mt-1 text-3xl font-semibold text-stone-950">
                  Compare stays
                </h2>
              </div>
              {improved ? (
                <div className="hidden gap-2 text-sm font-medium text-stone-700 md:flex">
                  <span className="rounded-full bg-white px-3 py-2">
                    Total price shown
                  </span>
                  <span className="rounded-full bg-white px-3 py-2">
                    Policy visible
                  </span>
                </div>
              ) : null}
            </div>

            <div>
              {results.map((listing, index) => (
                <ListingRow
                  key={listing.id}
                  index={index}
                  listing={listing}
                  state={searchState}
                  improved={improved}
                  selected={selectedListing?.id === listing.id}
                  onOpen={openListing}
                />
              ))}
            </div>
          </div>

          <aside className="space-y-5 lg:sticky lg:top-24 lg:self-start">
            {selectedListing ? (
              <DecisionPanel
                listing={selectedListing}
                state={searchState}
                improved={improved}
                checkoutOpen={checkoutOpen}
                onCheckout={() => setCheckoutOpen(true)}
              />
            ) : (
              <div className="rounded-2xl border border-stone-200 bg-white p-6">
                <h3 className="text-xl font-semibold text-stone-950">
                  Select a listing
                </h3>
                <p className="mt-3 text-sm leading-6 text-stone-600">
                  Modal agents click a result, inspect decision signals, then
                  continue to checkout.
                </p>
              </div>
            )}
          </aside>
        </section>
      </main>
    </>
  );
}

function ListingRow({
  index,
  listing,
  state,
  improved,
  selected,
  onOpen,
}: {
  index: number;
  listing: Listing;
  state: SearchState;
  improved: boolean;
  selected: boolean;
  onOpen: (listing: Listing) => void;
}) {
  return (
    <article
      data-testid={`listing-card-${index}`}
      tabIndex={0}
      role="button"
      onClick={() => onOpen(listing)}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          onOpen(listing);
        }
      }}
      className={`grid cursor-pointer gap-4 border-b border-stone-200 py-6 transition hover:bg-white sm:grid-cols-[210px_1fr] ${
        selected ? "bg-white" : ""
      }`}
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200">
        <Image
          src={imageFor(index)}
          alt={`${listing.title} preview`}
          className="h-full w-full object-cover"
          width={512}
          height={384}
          loading="lazy"
          unoptimized
        />
      </div>
      <div className="flex flex-col justify-between gap-4">
        <div>
          <p className="text-sm text-stone-500">
            {listing.propertyType} in {listing.neighborhood}
          </p>
          <h3 className="mt-1 text-xl font-semibold text-stone-950">
            {listing.title}
          </h3>
          <p className="mt-3 text-sm leading-6 text-stone-600">
            {listing.description}
          </p>
          {improved ? (
            <div className="mt-4 flex flex-wrap gap-2 text-xs font-semibold text-stone-700">
              {listing.isPetFriendly ? (
                <span
                  data-testid="pet-friendly-badge"
                  className="inline-flex items-center gap-1 rounded-full bg-[#eef7f4] px-3 py-1"
                >
                  <PawPrint className="size-3" />
                  Pet-friendly
                </span>
              ) : null}
              {listing.hasParking ? (
                <span
                  data-testid="parking-badge"
                  className="inline-flex items-center gap-1 rounded-full bg-[#eef7f4] px-3 py-1"
                >
                  <ParkingCircle className="size-3" />
                  Parking
                </span>
              ) : null}
              <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-3 py-1">
                <ShieldCheck className="size-3" />
                {listing.cancellationPolicy}
              </span>
            </div>
          ) : null}
        </div>
        <div className="flex items-center justify-between gap-3">
          <p className="text-stone-950">
            <span className="text-lg font-semibold">
              ${listing.nightlyPrice}
            </span>{" "}
            <span className="text-sm text-stone-600">night</span>
          </p>
          {improved ? (
            <p className="text-sm font-semibold text-stone-950">
              {totalLabel(listing, state)} total
            </p>
          ) : (
            <p className="text-sm text-stone-500">Fees later</p>
          )}
        </div>
      </div>
    </article>
  );
}

function DecisionPanel({
  listing,
  state,
  improved,
  checkoutOpen,
  onCheckout,
}: {
  listing: Listing;
  state: SearchState;
  improved: boolean;
  checkoutOpen: boolean;
  onCheckout: () => void;
}) {
  const price = calculatePrice(listing, state.checkin, state.checkout);

  return (
    <div
      data-testid="listing-detail"
      className="rounded-2xl border border-stone-200 bg-white p-6 shadow-xl shadow-stone-900/10"
    >
      <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e95f45]">
        Selected stay
      </p>
      <h3 className="mt-2 text-2xl font-semibold text-stone-950">
        {listing.title}
      </h3>
      <p className="mt-3 text-sm leading-6 text-stone-600">
        {listing.neighborhood}, {listing.location} - {listing.rating.toFixed(2)}{" "}
        rating - {listing.reviewCount} reviews
      </p>

      <div className="mt-5 grid gap-3 text-sm text-stone-700">
        <div className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3">
          <span>Pets</span>
          <span>{listing.isPetFriendly ? "Allowed" : "Not allowed"}</span>
        </div>
        <div className="flex items-center justify-between rounded-xl bg-stone-50 px-4 py-3">
          <span>Parking</span>
          <span>{listing.hasParking ? "Included" : "Not listed"}</span>
        </div>
        {improved && !checkoutOpen ? (
          <>
            <div
              data-testid="total-price"
              className="flex items-center justify-between rounded-xl bg-[#eef7f4] px-4 py-3 font-semibold text-stone-950"
            >
              <span>Total price</span>
              <span>${price.total}</span>
            </div>
            <div
              data-testid="cancellation-policy"
              className="flex items-center justify-between rounded-xl bg-[#eef7f4] px-4 py-3 font-semibold text-stone-950"
            >
              <span>Cancellation</span>
              <span>{listing.cancellationPolicy}</span>
            </div>
          </>
        ) : (
          <div className="rounded-xl bg-stone-50 px-4 py-3 text-stone-500">
            Total price and policy are confirmed during checkout.
          </div>
        )}
      </div>

      <button
        data-testid="checkout-button"
        type="button"
        onClick={onCheckout}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#e95f45] px-5 py-3 text-sm font-semibold text-white"
      >
        Continue to checkout
        <ArrowRight className="size-4" />
      </button>

      {checkoutOpen ? (
        <section
          data-testid="mock-checkout-page"
          className="mt-5 rounded-2xl border border-stone-200 bg-[#fbfaf8] p-5"
        >
          <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.14em] text-stone-500">
            <ReceiptText className="size-4" />
            Mock checkout
          </div>
          <div data-testid="checkout-summary" className="mt-4 space-y-3">
            <SummaryLine label="Dates" value={`${state.checkin} to ${state.checkout}`} />
            <SummaryLine label="Nightly" value={`$${price.nightlySubtotal}`} />
            <SummaryLine label="Cleaning" value={`$${price.cleaningFee}`} />
            <SummaryLine label="Service" value={`$${price.serviceFee}`} />
            <SummaryLine label="Tax" value={`$${price.tax}`} />
            <div
              data-testid="total-price"
              className="flex items-center justify-between border-t border-stone-200 pt-3 text-lg font-semibold text-stone-950"
            >
              <span>Total</span>
              <span>${price.total}</span>
            </div>
            <div
              data-testid="cancellation-policy"
              className="flex items-start gap-2 rounded-xl bg-white p-3 text-sm text-stone-700"
            >
              {listing.cancellationPolicy === "Strict" ? (
                <AlertCircle className="mt-0.5 size-4 text-[#e95f45]" />
              ) : (
                <ShieldCheck className="mt-0.5 size-4 text-emerald-700" />
              )}
              <span>{listing.cancellationPolicy} cancellation policy</span>
            </div>
            <div
              data-testid="task-success-marker"
              className="flex items-center gap-2 rounded-xl bg-stone-950 p-3 text-sm font-semibold text-white"
            >
              <CheckCircle2 className="size-4" />
              Checkout reached
            </div>
          </div>
        </section>
      ) : null}
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm text-stone-700">
      <span>{label}</span>
      <span className="font-medium text-stone-950">{value}</span>
    </div>
  );
}
