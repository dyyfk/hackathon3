import type { Listing } from "@/data/listings";

export function calculateNights(checkin: string, checkout: string): number {
  const start = new Date(`${checkin}T00:00:00`);
  const end = new Date(`${checkout}T00:00:00`);
  const diff = end.getTime() - start.getTime();

  if (!Number.isFinite(diff) || diff <= 0) {
    return 1;
  }

  return Math.max(1, Math.round(diff / 86_400_000));
}

export function calculatePrice(
  listing: Listing,
  checkin: string,
  checkout: string,
) {
  const nights = calculateNights(checkin, checkout);
  const nightlySubtotal = listing.nightlyPrice * nights;
  const cleaningFee = listing.cleaningFee;
  const serviceFee = listing.serviceFee;
  const tax = Math.round((nightlySubtotal + cleaningFee + serviceFee) * 0.12);
  const total = nightlySubtotal + cleaningFee + serviceFee + tax;

  return {
    nights,
    nightlySubtotal,
    cleaningFee,
    serviceFee,
    tax,
    total,
  };
}
