import type { Listing } from "@/data/listings";
import { calculatePrice } from "@/lib/pricing";

export function PriceBreakdown({
  listing,
  checkin,
  checkout,
}: {
  listing: Listing;
  checkin: string;
  checkout: string;
}) {
  const price = calculatePrice(listing, checkin, checkout);

  return (
    <section
      data-testid="checkout-price-breakdown"
      className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm"
    >
      <h2 className="text-xl font-semibold text-stone-950">Price breakdown</h2>
      <div className="mt-5 space-y-4 text-sm">
        <div
          data-testid="checkout-nightly-line"
          className="flex items-center justify-between text-stone-700"
        >
          <span>
            ${listing.nightlyPrice} x {price.nights} nights
          </span>
          <span>${price.nightlySubtotal}</span>
        </div>
        <div
          data-testid="checkout-cleaning-fee-line"
          className="flex items-center justify-between text-stone-700"
        >
          <span>Cleaning fee</span>
          <span>${price.cleaningFee}</span>
        </div>
        <div
          data-testid="checkout-service-fee-line"
          className="flex items-center justify-between text-stone-700"
        >
          <span>Service fee</span>
          <span>${price.serviceFee}</span>
        </div>
        <div
          data-testid="checkout-tax-line"
          className="flex items-center justify-between text-stone-700"
        >
          <span>Tax estimate</span>
          <span>${price.tax}</span>
        </div>
        <div
          data-testid="checkout-total-line"
          className="flex items-center justify-between border-t border-stone-200 pt-4 text-lg font-semibold text-stone-950"
        >
          <span>Total</span>
          <span>${price.total}</span>
        </div>
      </div>
    </section>
  );
}
