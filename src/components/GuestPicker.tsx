"use client";

import { Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { guestSummary } from "@/lib/urlState";

type GuestPickerProps = {
  adults: number;
  childCount: number;
  pets: number;
  closeSignal?: number;
  onAdultsChange: (value: number) => void;
  onChildrenChange: (value: number) => void;
  onPetsChange: (value: number) => void;
};

function Stepper({
  label,
  value,
  min,
  onChange,
  incrementTestId,
  decrementTestId,
}: {
  label: string;
  value: number;
  min: number;
  onChange: (value: number) => void;
  incrementTestId: string;
  decrementTestId: string;
}) {
  return (
    <div className="flex items-center justify-between gap-6 border-b border-stone-100 py-4 last:border-0">
      <div>
        <p className="font-medium text-stone-950">{label}</p>
        <p className="text-sm text-stone-500">
          {label === "Adults" ? "Ages 13 or above" : "Ages 2-12"}
        </p>
      </div>
      <div className="flex items-center gap-3">
        <button
          data-testid={decrementTestId}
          aria-label={`Decrease ${label.toLowerCase()}`}
          className="grid size-8 place-items-center rounded-full border border-stone-300 disabled:opacity-40"
          disabled={value <= min}
          type="button"
          onClick={() => onChange(Math.max(min, value - 1))}
        >
          <Minus className="size-4" />
        </button>
        <span className="w-5 text-center text-sm font-semibold">{value}</span>
        <button
          data-testid={incrementTestId}
          aria-label={`Increase ${label.toLowerCase()}`}
          className="grid size-8 place-items-center rounded-full border border-stone-300"
          type="button"
          onClick={() => onChange(value + 1)}
        >
          <Plus className="size-4" />
        </button>
      </div>
    </div>
  );
}

export function GuestPicker({
  adults,
  childCount,
  pets,
  closeSignal,
  onAdultsChange,
  onChildrenChange,
  onPetsChange,
}: GuestPickerProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [closeSignal]);

  return (
    <div className="relative">
      <button
        data-testid="guests-button"
        aria-label="Choose guests"
        className="w-full rounded-full px-5 py-3 text-left hover:bg-stone-50"
        type="button"
        onClick={() => setOpen((value) => !value)}
      >
        <span className="block text-xs font-semibold uppercase tracking-wide text-stone-950">
          Guests
        </span>
        <span className="text-sm text-stone-600">
          {guestSummary({ adults, children: childCount, pets })}
        </span>
      </button>

      {open ? (
        <div
          data-testid="guests-popover"
          className="absolute right-0 top-[calc(100%+12px)] z-30 w-80 rounded-2xl border border-stone-200 bg-white p-5 shadow-2xl"
        >
          <Stepper
            label="Adults"
            value={adults}
            min={1}
            onChange={onAdultsChange}
            incrementTestId="adults-increment"
            decrementTestId="adults-decrement"
          />
          <Stepper
            label="Children"
            value={childCount}
            min={0}
            onChange={onChildrenChange}
            incrementTestId="children-increment"
            decrementTestId="children-decrement"
          />
          <div className="flex items-center justify-between pt-4">
            <div>
              <p className="font-medium text-stone-950">Pets</p>
              <p className="text-sm text-stone-500">Some homes allow pets</p>
            </div>
            <button
              data-testid="pets-toggle"
              aria-label="Toggle pets"
              className={`rounded-full px-4 py-2 text-sm font-semibold ${
                pets > 0
                  ? "bg-stone-950 text-white"
                  : "border border-stone-300 text-stone-700"
              }`}
              type="button"
              onClick={() => onPetsChange(pets > 0 ? 0 : 1)}
            >
              {pets > 0 ? "Pets added" : "Add pets"}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
