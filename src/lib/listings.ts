import { listings, type Listing } from "@/data/listings";

export type ListingFilters = {
  location?: string;
  priceMin?: number;
  priceMax?: number;
  propertyType?: string;
  bedrooms?: number;
  petFriendly?: boolean;
  parking?: boolean;
  cancellationPolicy?: string;
  rating?: number;
  sort?: string;
};

export function getListingById(id: string): Listing | undefined {
  return listings.find((listing) => listing.id === id);
}

export function filterListings(filters: ListingFilters): Listing[] {
  let results = [...listings];

  if (filters.location) {
    const query = filters.location.toLowerCase();
    results = results.filter((listing) =>
      listing.location.toLowerCase().includes(query),
    );
  }

  if (filters.priceMin) {
    results = results.filter(
      (listing) => listing.nightlyPrice >= Number(filters.priceMin),
    );
  }

  if (filters.priceMax) {
    results = results.filter(
      (listing) => listing.nightlyPrice <= Number(filters.priceMax),
    );
  }

  if (filters.propertyType) {
    results = results.filter(
      (listing) => listing.propertyType === filters.propertyType,
    );
  }

  if (filters.bedrooms) {
    const bedroomMinimum = filters.bedrooms;
    results = results.filter((listing) => listing.bedrooms >= bedroomMinimum);
  }

  if (filters.petFriendly) {
    results = results.filter((listing) => listing.isPetFriendly);
  }

  if (filters.parking) {
    results = results.filter((listing) => listing.hasParking);
  }

  if (filters.cancellationPolicy) {
    results = results.filter(
      (listing) => listing.cancellationPolicy === filters.cancellationPolicy,
    );
  }

  if (filters.rating) {
    const ratingMinimum = filters.rating;
    results = results.filter((listing) => listing.rating >= ratingMinimum);
  }

  switch (filters.sort) {
    case "lowest":
      return results.sort((a, b) => a.nightlyPrice - b.nightlyPrice);
    case "rating":
      return results.sort((a, b) => b.rating - a.rating);
    case "reviewed":
      return results.sort((a, b) => b.reviewCount - a.reviewCount);
    default:
      return results.sort(
        (a, b) =>
          b.rating * 10 +
          b.reviewCount / 100 -
          (a.rating * 10 + a.reviewCount / 100),
      );
  }
}

export function listingGradient(id: string): string {
  const palettes = [
    "linear-gradient(135deg, #f6b7a8 0%, #f36f56 48%, #5f6f8f 100%)",
    "linear-gradient(135deg, #9fd8cb 0%, #4d9a89 45%, #233d4d 100%)",
    "linear-gradient(135deg, #f4d35e 0%, #ee964b 45%, #6b4d57 100%)",
    "linear-gradient(135deg, #a9def9 0%, #5d8aa8 50%, #273c75 100%)",
    "linear-gradient(135deg, #d6eadf 0%, #95b8a6 45%, #394032 100%)",
    "linear-gradient(135deg, #f7cad0 0%, #c08497 45%, #4a4e69 100%)",
  ];
  const index = id
    .split("")
    .reduce((total, char) => total + char.charCodeAt(0), 0);
  return palettes[index % palettes.length];
}

export function listingImageUrl(listing: Pick<Listing, "id" | "imageUrl">): string {
  if (listing.imageUrl) {
    return listing.imageUrl;
  }

  const index =
    (listing.id.split("").reduce((total, char) => total + char.charCodeAt(0), 0) %
      6) +
    1;
  return `/mock-stays/stay-${String(index).padStart(2, "0")}.jpg`;
}
