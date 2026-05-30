"use client";

import { Star } from "lucide-react";
import Image from "next/image";
import type { Listing } from "@/data/listings";
import { getActorType, logUXEvent } from "@/lib/analytics";
import { listingImageUrl } from "@/lib/listings";

export function ListingCard({
  listing,
  onOpen,
}: {
  listing: Listing;
  onOpen: (listing: Listing) => void;
}) {
  function logOpen() {
    logUXEvent({
      actorType: getActorType(),
      type: "listing_open",
      page: window.location.pathname,
      elementTestId: `listing-card-open-${listing.id}`,
      metadata: {
        listingId: listing.id,
        location: listing.location,
        nightlyPrice: listing.nightlyPrice,
      },
    });
  }

  function openListing() {
    logOpen();
    onOpen(listing);
  }

  return (
    <article
      data-testid={`listing-card-${listing.id}`}
      className="grid gap-4 border-b border-stone-200 py-6 sm:grid-cols-[220px_1fr]"
    >
      <div className="relative aspect-[4/3] overflow-hidden rounded-2xl bg-stone-200">
        <Image
          data-testid={`listing-card-image-${listing.id}`}
          src={listingImageUrl(listing)}
          alt={`${listing.title} preview`}
          className="h-full w-full object-cover"
          width={512}
          height={384}
          loading="lazy"
          unoptimized
        />
        <div className="absolute inset-x-4 bottom-4 rounded-xl bg-white/85 px-3 py-2 text-xs font-semibold text-stone-800 backdrop-blur">
          {listing.neighborhood}
        </div>
      </div>
      <div className="flex flex-col justify-between gap-4">
        <div>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm text-stone-500">
                {listing.propertyType} in {listing.neighborhood}
              </p>
              <h2
                data-testid={`listing-card-title-${listing.id}`}
                className="mt-1 text-xl font-semibold text-stone-950"
              >
                {listing.title}
              </h2>
            </div>
            <div
              data-testid={`listing-card-rating-${listing.id}`}
              className="inline-flex items-center gap-1 text-sm font-semibold text-stone-800"
            >
              <Star className="size-4 fill-[#e0a11b] text-[#e0a11b]" />
              <span>{listing.rating.toFixed(2)}</span>
            </div>
          </div>
          <p className="mt-3 text-sm text-stone-600">
            {listing.beds} beds - {listing.bedrooms} bedrooms -{" "}
            {listing.bathrooms} bath - up to {listing.maxGuests} guests
          </p>
          <p className="mt-3 line-clamp-2 text-sm text-stone-500">
            {listing.description}
          </p>
        </div>
        <div className="flex items-center justify-between gap-4">
          <p data-testid={`listing-card-price-${listing.id}`} className="text-stone-950">
            <span className="text-lg font-semibold">${listing.nightlyPrice}</span>{" "}
            <span className="text-sm text-stone-600">night</span>
          </p>
          <button
            data-testid={`listing-card-open-${listing.id}`}
            aria-label={`View ${listing.title}`}
            onClick={openListing}
            className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold text-stone-950 hover:border-stone-950"
            type="button"
          >
            View details
          </button>
        </div>
      </div>
    </article>
  );
}
