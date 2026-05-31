#!/usr/bin/env python3
"""Generate a local Next.js route from a synthetic feature suggestion."""

from __future__ import annotations

import argparse
import json
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Sequence


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    repo_root = args.repo_root.resolve()
    candidate = read_candidate(args.payload_file)
    slug = clean_slug(args.slug)
    route_dir = repo_root / "src" / "app" / slug
    route_dir.mkdir(parents=True, exist_ok=True)
    page_path = route_dir / "page.tsx"
    page_path.write_text(render_page(candidate, slug), encoding="utf-8")

    metadata_dir = repo_root / "AB experiment" / "data" / "generated_versions"
    metadata_dir.mkdir(parents=True, exist_ok=True)
    metadata = {
        "slug": slug,
        "route": f"/{slug}",
        "path": str(page_path.relative_to(repo_root)),
        "candidate": candidate,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }
    (metadata_dir / f"{slug}.json").write_text(json.dumps(metadata, indent=2), encoding="utf-8")
    print(json.dumps(metadata, indent=2))
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate a local version route from AB suggestions.")
    parser.add_argument("--repo-root", type=Path, required=True)
    parser.add_argument("--payload-file", type=Path, required=True)
    parser.add_argument("--slug", default="generated-version")
    return parser


def read_candidate(path: Path) -> Dict[str, Any]:
    payload = json.loads(path.read_text(encoding="utf-8"))
    candidate = payload.get("candidate", payload)
    return {
        "title": clean(candidate.get("title") or "Smart Date + Price Confidence Guide"),
        "problem": clean(
            candidate.get("problem")
            or "Synthetic users need clearer dates, price confidence, and next-step guidance."
        ),
        "mvp": clean_list(candidate.get("mvp"), [
            "Offer a flexible-date default before the calendar becomes blocking.",
            "Show total price and likely fees at the comparison moment.",
            "Trigger a contextual helper when date or price hesitation repeats.",
        ]),
        "metrics": clean_list(candidate.get("metrics"), [
            "date selection completion rate",
            "primary CTA click rate",
            "dwell time before first meaningful action",
            "friction rate",
        ]),
        "evidence": clean_list(candidate.get("evidence"), [
            "Synthetic feedback highlighted date and price confidence as the strongest opportunity.",
        ]),
        "confidence": clean(candidate.get("confidence") or "Synthetic"),
    }


def clean_slug(value: str) -> str:
    slug = "".join(char for char in str(value or "").strip().strip("/") if char.isalnum() or char == "-")
    return slug or "generated-version"


def render_page(candidate: Dict[str, Any], slug: str) -> str:
    title = candidate["title"]
    problem = candidate["problem"]
    mvp = candidate["mvp"][:3]
    metrics = candidate["metrics"][:4]
    evidence = candidate["evidence"][:3]
    return f'''/* eslint-disable @next/next/no-img-element */

const mvpItems = {json.dumps(mvp, indent=2)};
const metricItems = {json.dumps(metrics, indent=2)};
const evidenceItems = {json.dumps(evidence, indent=2)};

const listings = [
  {{
    title: "Quiet Hayes Valley Flat",
    meta: "Apartment in Hayes Valley",
    rating: "4.91",
    nightly: "$198",
    total: "$580 total",
    image: "/mock-stays/stay-02.jpg",
  }},
  {{
    title: "Sunny Mission Studio",
    meta: "Studio in Mission District",
    rating: "4.82",
    nightly: "$165",
    total: "$493 total",
    image: "/mock-stays/stay-01.jpg",
  }},
];

export default function GeneratedSuggestionVersion() {{
  return (
    <main className="min-h-screen bg-[#fbfaf8] text-stone-950">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e95f45]">
            Generated {slug}
          </p>
          <h1 className="mt-3 text-5xl font-semibold tracking-normal sm:text-6xl">
            staybnb
          </h1>
          <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
            {escape_jsx(title)} generated from synthetic-user suggestions.
          </p>
          <div className="mt-6 grid gap-3 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-950 md:grid-cols-[1.2fr_1fr_1fr]">
            <div>
              <p className="text-sm font-semibold">Smart Date + Price Confidence Guide</p>
              <h2 className="mt-2 text-2xl font-semibold text-stone-950">
                Flexible dates and total price are ready before comparison.
              </h2>
            </div>
            <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
              <span className="font-semibold">Date status</span>
              <p className="mt-1">Flexible weekend - 2 nights selected</p>
            </div>
            <div className="rounded-2xl bg-white p-4 text-sm shadow-sm">
              <span className="font-semibold">Price status</span>
              <p className="mt-1">Estimated total and likely fees shown upfront</p>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_360px] lg:px-8">
        <div className="space-y-6">
          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-emerald-700">Suggestion implemented</p>
            <h2 className="mt-2 text-3xl font-semibold">{escape_jsx(title)}</h2>
            <p className="mt-3 leading-7 text-stone-600">{escape_jsx(problem)}</p>
            <div className="mt-5 grid gap-3 md:grid-cols-3">
              {{mvpItems.map((item) => (
                <div key={{item}} className="rounded-2xl bg-stone-50 p-4 text-sm text-stone-700">
                  {{item}}
                </div>
              ))}}
            </div>
          </section>

          <section className="rounded-3xl border border-stone-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-stone-200 pb-5 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-sm text-stone-500">2 stays - flexible weekend</p>
                <h2 className="mt-1 text-3xl font-semibold">Stays in San Francisco</h2>
              </div>
              <button className="rounded-full bg-[#e95f45] px-5 py-3 text-sm font-semibold text-white">
                Search with flexible dates
              </button>
            </div>
            <div className="divide-y divide-stone-200">
              {{listings.map((listing) => (
                <article key={{listing.title}} className="grid gap-4 py-6 sm:grid-cols-[220px_1fr]">
                  <img
                    src={{listing.image}}
                    alt={{listing.title}}
                    className="aspect-[4/3] w-full rounded-2xl object-cover"
                  />
                  <div className="flex flex-col justify-between gap-4">
                    <div>
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm text-stone-500">{{listing.meta}}</p>
                          <h3 className="mt-1 text-xl font-semibold">{{listing.title}}</h3>
                        </div>
                        <span className="text-sm font-semibold">★ {{listing.rating}}</span>
                      </div>
                      <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-950">
                        <p className="font-semibold">{{listing.total}}</p>
                        <p className="mt-1 text-emerald-800">
                          2 nights, cleaning, service, and tax included
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between gap-4">
                      <p><span className="text-lg font-semibold">{{listing.nightly}}</span> night</p>
                      <div className="flex gap-2">
                        <button className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold">
                          Shortlist
                        </button>
                        <button className="rounded-full border border-stone-300 px-4 py-2 text-sm font-semibold">
                          View details
                        </button>
                      </div>
                    </div>
                  </div>
                </article>
              ))}}
            </div>
          </section>
        </div>

        <aside className="h-fit rounded-3xl border border-stone-200 bg-white p-5 shadow-sm lg:sticky lg:top-8">
          <p className="text-sm font-semibold text-emerald-700">Generated confidence</p>
          <p className="mt-2 text-4xl font-semibold">{escape_jsx(candidate["confidence"])}</p>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            This local page was generated from the AB suggestion panel. It is ignored by git.
          </p>
          <div className="mt-5 space-y-5">
            <div>
              <h3 className="font-semibold">Evidence</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-stone-600">
                {{evidenceItems.map((item) => <li key={{item}}>{{item}}</li>)}}
              </ul>
            </div>
            <div>
              <h3 className="font-semibold">Success metrics</h3>
              <ul className="mt-2 list-disc space-y-2 pl-5 text-sm text-stone-600">
                {{metricItems.map((item) => <li key={{item}}>{{item}}</li>)}}
              </ul>
            </div>
          </div>
        </aside>
      </section>
    </main>
  );
}}
'''


def clean_list(value: Any, fallback: Sequence[str]) -> list[str]:
    if not isinstance(value, list):
        return list(fallback)
    cleaned = [clean(item) for item in value if clean(item)]
    return cleaned or list(fallback)


def clean(value: Any) -> str:
    return " ".join(str(value or "").split())[:240]


def escape_jsx(value: str) -> str:
    return (
        value.replace("&", "&amp;")
        .replace("<", "&lt;")
        .replace(">", "&gt;")
        .replace("{", "&#123;")
        .replace("}", "&#125;")
    )


if __name__ == "__main__":
    raise SystemExit(main())
