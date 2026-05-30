"use client";

import { Search } from "lucide-react";
import { useState } from "react";
import { cityOptions } from "@/data/listings";
import type { SearchState } from "@/lib/urlState";
import { GuestPicker } from "@/components/GuestPicker";

type SearchHeroProps = {
  onSearch: (state: SearchState) => void;
};

export function SearchHero({ onSearch }: SearchHeroProps) {
  const [location, setLocation] = useState("San Francisco");
  const [checkin, setCheckin] = useState("2026-06-14");
  const [checkout, setCheckout] = useState("2026-06-16");
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [pets, setPets] = useState(0);
  const [guestCloseSignal, setGuestCloseSignal] = useState(0);

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextState = {
      location,
      checkin,
      checkout,
      adults,
      children,
      pets,
    };

    setGuestCloseSignal((value) => value + 1);
    onSearch(nextState);
  }

  return (
    <form
      data-testid="hero-search"
      onSubmit={submitSearch}
      className="mx-auto mt-10 grid max-w-5xl gap-2 rounded-[2rem] border border-stone-200 bg-white p-2 text-left shadow-2xl shadow-stone-900/10 md:grid-cols-[1.3fr_1fr_1fr_1fr_auto]"
    >
      <label className="rounded-full px-5 py-3 hover:bg-stone-50">
        <span className="block text-xs font-semibold uppercase tracking-wide text-stone-950">
          Location
        </span>
        <input
          data-testid="location-input"
          list="staybnb-cities"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          className="mt-1 w-full bg-transparent text-sm text-stone-700 outline-none"
          placeholder="Where are you going?"
          aria-label="Location"
        />
        <datalist id="staybnb-cities">
          {cityOptions.map((city) => (
            <option key={city} value={city} />
          ))}
        </datalist>
      </label>
      <label className="rounded-full px-5 py-3 hover:bg-stone-50">
        <span className="block text-xs font-semibold uppercase tracking-wide text-stone-950">
          Check in
        </span>
        <input
          data-testid="checkin-input"
          type="date"
          value={checkin}
          onChange={(event) => setCheckin(event.target.value)}
          className="mt-1 w-full bg-transparent text-sm text-stone-700 outline-none"
          aria-label="Check in"
        />
      </label>
      <label className="rounded-full px-5 py-3 hover:bg-stone-50">
        <span className="block text-xs font-semibold uppercase tracking-wide text-stone-950">
          Check out
        </span>
        <input
          data-testid="checkout-input"
          type="date"
          value={checkout}
          onChange={(event) => setCheckout(event.target.value)}
          className="mt-1 w-full bg-transparent text-sm text-stone-700 outline-none"
          aria-label="Check out"
        />
      </label>
      <GuestPicker
        adults={adults}
        childCount={children}
        pets={pets}
        closeSignal={guestCloseSignal}
        onAdultsChange={setAdults}
        onChildrenChange={setChildren}
        onPetsChange={setPets}
      />
      <button
        data-testid="search-submit"
        aria-label="Search stays"
        className="inline-flex items-center justify-center gap-2 rounded-full bg-[#e95f45] px-6 py-4 text-sm font-semibold text-white shadow-lg shadow-[#e95f45]/25 hover:bg-[#d84f37]"
        type="submit"
      >
        <Search className="size-4" />
        <span>Search</span>
      </button>
    </form>
  );
}
