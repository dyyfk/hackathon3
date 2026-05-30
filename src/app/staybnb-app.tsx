"use client";

import { BarChart3, ChevronLeft, SlidersHorizontal } from "lucide-react";
import Image from "next/image";
import { useMemo, useState } from "react";
import { BookingCard } from "@/components/BookingCard";
import { CheckoutPanel } from "@/components/CheckoutPanel";
import { EventDebugPanel } from "@/components/EventDebugPanel";
import { FilterModal } from "@/components/FilterModal";
import { Footer } from "@/components/Footer";
import { Header } from "@/components/Header";
import { ListingCard } from "@/components/ListingCard";
import { SearchHero } from "@/components/SearchHero";
import type { Listing } from "@/data/listings";
import { getActorType, logUXEvent } from "@/lib/analytics";
import { recordFilterToggle } from "@/lib/friction";
import {
  filterListings,
  listingImageUrl,
  type ListingFilters,
} from "@/lib/listings";
import type { SearchState } from "@/lib/urlState";

type View = "intro" | "results" | "detail" | "checkout" | "dashboard";

const initialSearch: SearchState = {
  location: "San Francisco",
  checkin: "2026-06-14",
  checkout: "2026-06-16",
  adults: 1,
  children: 0,
  pets: 0,
};

export function StaybnbApp() {
  const [view, setView] = useState<View>("intro");
  const [searchState, setSearchState] = useState<SearchState>(initialSearch);
  const [filters, setFilters] = useState<ListingFilters>({});
  const [sort, setSort] = useState("recommended");
  const [filterOpen, setFilterOpen] = useState(false);
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null);

  const results = useMemo(
    () =>
      filterListings({
        ...filters,
        location: searchState.location,
        sort,
      }),
    [filters, searchState.location, sort],
  );

  function showResults(nextState: SearchState) {
    setSearchState(nextState);
    setSelectedListing(null);
    setView("results");
  }

  function openFilters() {
    setFilterOpen(true);
    recordFilterToggle(window.location.pathname);
    logUXEvent({
      actorType: getActorType(),
      type: "modal_open",
      page: window.location.pathname,
      elementTestId: "filters-button",
    });
  }

  function openListing(listing: Listing) {
    setSelectedListing(listing);
    setView("detail");
  }

  function startCheckout(nextState: SearchState) {
    setSearchState(nextState);
    setView("checkout");
  }

  return (
    <>
      <Header />
      <main className="bg-[#fbfaf8]">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e95f45]">
                  Variant A baseline
                </p>
                <h1 className="mt-3 text-5xl font-semibold tracking-normal text-stone-950 sm:text-6xl">
                  staybnb
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
                  A compact single-page booking lab for search, comparison,
                  checkout, and UX event capture.
                </p>
              </div>
              <button
                data-testid="dashboard-tab"
                aria-label="Open event dashboard"
                className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-950"
                type="button"
                onClick={() => setView("dashboard")}
              >
                <BarChart3 className="size-4" />
                Events
              </button>
            </div>
            <SearchHero onSearch={showResults} />
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          {view === "intro" ? <IntroPanel /> : null}
          {view === "results" ? (
            <ResultsPanel
              results={results}
              searchState={searchState}
              sort={sort}
              setSort={setSort}
              openFilters={openFilters}
              openListing={openListing}
            />
          ) : null}
          {view === "detail" && selectedListing ? (
            <DetailPanel
              listing={selectedListing}
              searchState={searchState}
              onBack={() => setView("results")}
              onReserve={startCheckout}
            />
          ) : null}
          {view === "checkout" && selectedListing ? (
            <CheckoutPanel listing={selectedListing} state={searchState} />
          ) : null}
          {view === "dashboard" ? <EventDebugPanel /> : null}
        </section>

        <FilterModal
          filters={filters}
          open={filterOpen}
          onClose={() => setFilterOpen(false)}
          onApply={(nextFilters) => {
            setFilters(nextFilters);
            setFilterOpen(false);
          }}
          onClear={() => setFilters({})}
        />
      </main>
      <Footer />
    </>
  );
}

function IntroPanel() {
  const introItems = [
    {
      label: "Search stays",
      image: "/mock-stays/stay-01.jpg",
    },
    {
      label: "Compare details",
      image: "/mock-stays/stay-02.jpg",
    },
    {
      label: "Mock checkout",
      image: "/mock-stays/stay-03.jpg",
    },
  ];

  return (
    <div className="grid gap-5 md:grid-cols-3">
      {introItems.map((item, index) => (
          <article
            key={item.label}
            className="overflow-hidden rounded-2xl border border-stone-200 bg-white"
          >
            <Image
              src={item.image}
              alt={`${item.label} preview`}
              className="aspect-[4/3] w-full object-cover"
              width={512}
              height={384}
              loading="lazy"
              unoptimized
            />
            <div className="p-5">
              <div className="text-sm font-semibold text-stone-500">
                0{index + 1}
              </div>
              <h2 className="mt-4 text-xl font-semibold text-stone-950">
                {item.label}
              </h2>
            </div>
          </article>
      ))}
    </div>
  );
}

function ResultsPanel({
  results,
  searchState,
  sort,
  setSort,
  openFilters,
  openListing,
}: {
  results: Listing[];
  searchState: SearchState;
  sort: string;
  setSort: (value: string) => void;
  openFilters: () => void;
  openListing: (listing: Listing) => void;
}) {
  return (
    <section data-testid="spa-search-results">
      <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm text-stone-500">
            {results.length} stays - {searchState.checkin} to{" "}
            {searchState.checkout}
          </p>
          <h2
            data-testid="spa-results-heading"
            className="mt-1 text-3xl font-semibold text-stone-950"
          >
            Stays in {searchState.location}
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button
            data-testid="filters-button"
            aria-label="Open filters"
            className="inline-flex items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-950"
            type="button"
            onClick={openFilters}
          >
            <SlidersHorizontal className="size-4" />
            Filters
          </button>
          <label className="text-sm font-medium text-stone-700">
            Sort
            <select
              data-testid="sort-select"
              value={sort}
              onChange={(event) => setSort(event.target.value)}
              className="ml-2 rounded-full border border-stone-300 bg-white px-3 py-2"
            >
              <option value="recommended">Recommended</option>
              <option value="lowest">Lowest price</option>
              <option value="rating">Highest rating</option>
              <option value="reviewed">Most reviewed</option>
            </select>
          </label>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div>
          {results.map((listing) => (
            <ListingCard
              key={listing.id}
              listing={listing}
              onOpen={openListing}
            />
          ))}
        </div>
        <aside className="hidden rounded-2xl border border-stone-200 bg-white p-5 lg:block">
          <h3 className="font-semibold text-stone-950">Map preview</h3>
          <div className="mt-4 h-80 rounded-2xl bg-[#dfeee9]" />
        </aside>
      </div>
    </section>
  );
}

function DetailPanel({
  listing,
  searchState,
  onBack,
  onReserve,
}: {
  listing: Listing;
  searchState: SearchState;
  onBack: () => void;
  onReserve: (state: SearchState) => void;
}) {
  return (
    <section data-testid="listing-detail-page" className="space-y-6">
      <button
        className="inline-flex items-center gap-2 text-sm font-semibold text-stone-700"
        type="button"
        onClick={onBack}
      >
        <ChevronLeft className="size-4" />
        Back to results
      </button>

      <Image
        data-testid="detail-gallery-image"
        src={listingImageUrl(listing)}
        alt={`${listing.title} gallery preview`}
        className="max-h-[460px] min-h-72 w-full rounded-3xl object-cover"
        width={1200}
        height={600}
        unoptimized
      />

      <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="space-y-8">
          <section>
            <h2
              data-testid="detail-title"
              className="text-3xl font-semibold text-stone-950"
            >
              {listing.title}
            </h2>
            <p
              data-testid="detail-rating"
              className="mt-3 text-sm font-medium text-stone-700"
            >
              {listing.rating.toFixed(2)} - {listing.reviewCount} reviews -{" "}
              {listing.neighborhood}, {listing.location}
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-stone-950">
              About this stay
            </h3>
            <p
              data-testid="detail-description"
              className="mt-3 max-w-3xl leading-7 text-stone-600"
            >
              {listing.description}
            </p>
          </section>

          <section>
            <h3 className="text-xl font-semibold text-stone-950">
              Amenities
            </h3>
            <div
              data-testid="detail-amenities"
              className="mt-4 grid gap-3 sm:grid-cols-2"
            >
              {listing.amenities.map((amenity) => (
                <div key={amenity} className="rounded-xl bg-white p-4">
                  {amenity}
                </div>
              ))}
            </div>
          </section>

          <section
            data-testid="detail-cancellation-policy"
            className="pt-8"
          >
            <h3 className="text-xl font-semibold text-stone-950">
              Cancellation policy
            </h3>
            <p className="mt-3 leading-7 text-stone-600">
              {listing.cancellationPolicy} cancellation. In Variant A this
              policy remains lower in the detail view to preserve policy-search
              friction.
            </p>
          </section>
        </div>

        <BookingCard
          listing={listing}
          initialState={searchState}
          onReserve={onReserve}
        />
      </div>
    </section>
  );
}
