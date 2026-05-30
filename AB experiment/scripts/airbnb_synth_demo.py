#!/usr/bin/env python3
"""Reproducible Airbnb synthetic-user demo powered by Codex CLI."""

from __future__ import annotations

import argparse
import json
import math
import re
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from html.parser import HTMLParser
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence
from urllib.error import URLError
from urllib.request import Request, urlopen


SEGMENTS = [
    "budget_weekend_couple",
    "family_planner",
    "remote_worker_business_traveler",
    "experience_seeker",
    "first_time_cautious_user",
]

FRICTION_SCORES = {
    "none": 0.05,
    "low": 0.2,
    "medium": 0.45,
    "high": 0.75,
}


class DemoError(Exception):
    """Raised when the demo cannot safely produce the requested output."""


@dataclass(frozen=True)
class AirbnbPageModel:
    url: str
    live_snapshot: Dict[str, Any] | None = None

    @property
    def page_kind(self) -> str:
        if not self.live_snapshot:
            return "airbnb_homepage"
        return str(self.live_snapshot.get("page_kind") or "airbnb_homepage")

    def to_dict(self) -> Dict[str, Any]:
        model = {
            "url": self.url,
            "page_type": "Airbnb homepage",
            "primary_tabs": ["Homes", "Experiences, new", "Services, new"],
            "search_controls": [
                {"name": "Where", "role": "searchbox", "purpose": "destination query"},
                {"name": "When", "role": "button", "purpose": "add dates"},
                {"name": "Who", "role": "button", "purpose": "add guests"},
                {"name": "Search", "role": "button", "purpose": "submit search"},
            ],
            "visible_content": {
                "homepage_carousel": "Popular homes in Lake Tahoe",
                "listing_cards": [
                    {
                        "title": "Condo in South Lake Tahoe",
                        "price": "$588 for 2 nights",
                        "rating": "4.78",
                        "signals": ["rating", "wishlist button"],
                    },
                    {
                        "title": "Cabin in Kings Beach",
                        "price": "$498 for 2 nights",
                        "rating": "4.95",
                        "signals": ["Guest favorite", "rating", "wishlist button"],
                    },
                    {
                        "title": "Home in Carnelian Bay",
                        "price": "$1,330 for 2 nights",
                        "rating": "4.98",
                        "signals": ["Guest favorite", "rating", "wishlist button"],
                    },
                    {
                        "title": "Cabin in South Lake Tahoe",
                        "price": "$843 for 2 nights",
                        "rating": "4.82",
                        "signals": ["Guest favorite", "rating", "wishlist button"],
                    },
                ],
            },
            "likely_friction": [
                "Total price and fees are not fully visible from the card.",
                "Date selection can slow down exploratory travelers.",
                "Wishlist may create account-wall friction.",
                "Experiences and Services are new tabs that may be missed by Homes-focused users.",
            ],
            "safe_runner_policy": [
                "Do not create or access an account.",
                "Do not book a stay.",
                "Do not send host messages.",
                "Do not enter payment details.",
                "Do not submit real personal data.",
            ],
        }
        if not self.live_snapshot:
            return model

        model["page_type"] = str(self.live_snapshot.get("page_type") or "Live A/B page")
        model["live_snapshot"] = self.live_snapshot
        if self.page_kind == "staybnb_booking":
            model["likely_friction"] = [
                "Total price and fees are not fully visible before checkout.",
                "Guests may need clearer listing detail before continuing.",
                "Mock checkout intent can be measured, but booking must not be submitted.",
            ]
        elif self.page_kind == "airbnb_archive":
            model["likely_friction"] = [
                "The page presents a brand archive/timeline instead of a booking search flow.",
                "Synthetic stay shoppers may not find destination, date, guest, or listing controls.",
                "Sign up and sign in are visible, but booking intent is unsupported.",
            ]
        return model


class VisibleTextParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.stack: List[str] = []
        self.skip_depth = 0
        self.lines: List[str] = []
        self.by_tag: Dict[str, List[str]] = {
            "title": [],
            "h1": [],
            "h2": [],
            "h3": [],
            "button": [],
            "a": [],
            "label": [],
        }

    def handle_starttag(self, tag: str, attrs: Sequence[tuple[str, str | None]]) -> None:
        tag = tag.lower()
        self.stack.append(tag)
        if tag in {"script", "style", "noscript", "svg"}:
            self.skip_depth += 1
        if tag == "input":
            attrs_dict = {key: value for key, value in attrs}
            label = attrs_dict.get("aria-label") or attrs_dict.get("placeholder") or attrs_dict.get("name")
            if label:
                self._append_tag("label", label)

    def handle_endtag(self, tag: str) -> None:
        tag = tag.lower()
        if tag in {"script", "style", "noscript", "svg"} and self.skip_depth:
            self.skip_depth -= 1
        if tag in self.stack:
            for index in range(len(self.stack) - 1, -1, -1):
                if self.stack[index] == tag:
                    del self.stack[index:]
                    break

    def handle_data(self, data: str) -> None:
        if self.skip_depth:
            return
        text = clean_text(data)
        if not text:
            return
        self.lines.append(text)
        for tag in reversed(self.stack):
            if tag in self.by_tag:
                self._append_tag(tag, text)
                break

    def _append_tag(self, tag: str, text: str) -> None:
        values = self.by_tag.setdefault(tag, [])
        if text not in values:
            values.append(text)


def clean_text(value: str) -> str:
    return re.sub(r"\s+", " ", value).strip()


def unique_limited(values: Iterable[str], limit: int) -> List[str]:
    seen = set()
    result: List[str] = []
    for value in values:
        text = clean_text(value)
        if not text or text in seen:
            continue
        seen.add(text)
        result.append(text[:160])
        if len(result) >= limit:
            break
    return result


def fetch_live_snapshot(url: str) -> Dict[str, Any]:
    request = Request(url, headers={"User-Agent": "SyntheticABLab/1.0"})
    try:
        with urlopen(request, timeout=12) as response:
            html = response.read(700_000).decode("utf-8", errors="replace")
    except (OSError, URLError) as exc:
        raise DemoError(f"Could not fetch live page snapshot for {url}: {exc}") from exc

    parser = VisibleTextParser()
    parser.feed(html)
    lines = unique_limited(parser.lines, 180)
    visible_text = "\n".join(lines)
    page_kind = detect_page_kind(visible_text)
    return {
        "schema_version": "browser_page_context_v1",
        "observation_source": "urllib_html",
        "url": url,
        "final_url": url,
        "page_kind": page_kind,
        "page_type": {
            "staybnb_booking": "Staybnb booking flow",
            "airbnb_archive": "Airbnb archive page",
        }.get(page_kind, "Live web page"),
        "title": (parser.by_tag.get("title") or [""])[0],
        "headings": unique_limited(
            parser.by_tag.get("h1", []) + parser.by_tag.get("h2", []) + parser.by_tag.get("h3", []),
            20,
        ),
        "buttons": unique_limited(parser.by_tag.get("button", []), 20),
        "links": unique_limited(parser.by_tag.get("a", []), 24),
        "labels": unique_limited(parser.by_tag.get("label", []), 24),
        "visible_text_excerpt": visible_text[:4000],
    }


def observe_page_context(url: str, cwd: Path, timeout_ms: int) -> Dict[str, Any] | None:
    script_path = cwd / "observe_page.mjs"
    node_cmd = shutil.which("node")
    if node_cmd and script_path.exists():
        try:
            completed = subprocess.run(
                [
                    node_cmd,
                    str(script_path),
                    "--url",
                    url,
                    "--timeout",
                    str(timeout_ms),
                ],
                cwd=str(cwd.parent),
                text=True,
                capture_output=True,
                timeout=max(20, math.ceil(timeout_ms / 1000) + 10),
                check=False,
            )
            if completed.returncode == 0:
                return json.loads(completed.stdout)
            print(
                "WARN: Browser page observation failed; falling back to HTML snapshot.\n"
                f"{tail(completed.stderr, 1600)}",
                file=sys.stderr,
            )
        except (OSError, subprocess.TimeoutExpired, json.JSONDecodeError) as exc:
            print(
                f"WARN: Browser page observation could not run; falling back to HTML snapshot: {exc}",
                file=sys.stderr,
            )

    try:
        return fetch_live_snapshot(url)
    except DemoError as exc:
        print(f"WARN: Live page snapshot unavailable; using built-in page model: {exc}", file=sys.stderr)
        return None


def detect_page_kind(text: str) -> str:
    lower = text.lower()
    if "airbnb archive" in lower or "airbed & breakfast" in lower or "2009 airbed" in lower:
        return "airbnb_archive"
    if "staybnb" in lower or "mock checkout" in lower or "search stays" in lower:
        return "staybnb_booking"
    return "airbnb_homepage"


class CodexClient:
    def __init__(
        self,
        cwd: Path,
        codex_cmd: str = "codex",
        timeout_seconds: int = 240,
        model: str | None = None,
    ) -> None:
        self.cwd = cwd
        self.codex_cmd = codex_cmd
        self.timeout_seconds = timeout_seconds
        self.model = model

    def generate_json(self, prompt: str, schema: Dict[str, Any], label: str) -> Dict[str, Any]:
        if shutil.which(self.codex_cmd) is None:
            raise DemoError(f"Cannot find Codex CLI command: {self.codex_cmd!r}")

        with tempfile.TemporaryDirectory(prefix="airbnb_synth_codex_") as tmp:
            tmp_path = Path(tmp)
            schema_path = tmp_path / "schema.json"
            output_path = tmp_path / "last_message.json"
            schema_path.write_text(json.dumps(schema, indent=2), encoding="utf-8")

            cmd = [
                self.codex_cmd,
                "exec",
                "--sandbox",
                "read-only",
                "--output-schema",
                str(schema_path),
                "--output-last-message",
                str(output_path),
                "-C",
                str(self.cwd),
                "-",
            ]
            if self.model:
                cmd[2:2] = ["--model", self.model]

            try:
                completed = subprocess.run(
                    cmd,
                    input=prompt,
                    text=True,
                    capture_output=True,
                    timeout=self.timeout_seconds,
                    cwd=str(self.cwd),
                    check=False,
                )
            except subprocess.TimeoutExpired as exc:
                raise DemoError(
                    f"Codex call timed out during {label} after {self.timeout_seconds}s."
                ) from exc

            if completed.returncode != 0:
                raise DemoError(
                    "Codex call failed during {label}.\n"
                    "Command: {cmd}\n"
                    "STDOUT:\n{stdout}\n"
                    "STDERR:\n{stderr}".format(
                        label=label,
                        cmd=" ".join(cmd),
                        stdout=tail(completed.stdout),
                        stderr=tail(completed.stderr),
                    )
                )

            if not output_path.exists():
                raise DemoError(f"Codex did not write an output file during {label}.")

            raw = output_path.read_text(encoding="utf-8").strip()
            if not raw:
                raise DemoError(f"Codex returned an empty output during {label}.")

            try:
                return parse_json_message(raw)
            except json.JSONDecodeError as exc:
                raise DemoError(
                    f"Codex returned non-JSON output during {label}:\n{tail(raw, 2000)}"
                ) from exc


class SyntheticUserGenerator:
    def __init__(self, codex: CodexClient, page_model: AirbnbPageModel) -> None:
        self.codex = codex
        self.page_model = page_model

    def generate(self, profile_count: int) -> List[Dict[str, Any]]:
        quotas = segment_quotas(profile_count)
        prompt = (
            "You are the Synthetic User Generator for an autonomous product research demo.\n"
            "Generate Airbnb synthetic user profiles from the provided page model.\n"
            "Return JSON only. Do not use tools. Do not invent unsafe tasks.\n\n"
            f"Profile count: {profile_count}\n"
            f"Segment quotas: {json.dumps(quotas, indent=2)}\n\n"
            "Airbnb page model:\n"
            f"{json.dumps(self.page_model.to_dict(), indent=2)}\n\n"
            "Rules:\n"
            "- Produce exactly the requested number of profiles.\n"
            "- IDs must be sequential: airbnb_u_001, airbnb_u_002, ...\n"
            "- Cover every segment in the quota table exactly.\n"
            "- Each profile must describe an executable browsing task, not a biography.\n"
            "- Behavior style values must be between 0 and 1.\n"
            "- Tasks must stop at comparison or intent assessment, never booking.\n"
        )
        data = self.codex.generate_json(prompt, profile_output_schema(profile_count), "profile generation")
        profiles = data.get("profiles", [])
        validate_profiles(profiles, profile_count)
        return profiles


class SyntheticTraceGenerator:
    def __init__(
        self, codex: CodexClient, page_model: AirbnbPageModel, variant: str, batch_size: int = 3
    ) -> None:
        self.codex = codex
        self.page_model = page_model
        self.variant = variant
        self.batch_size = max(1, batch_size)

    def generate(self, profiles: Sequence[Dict[str, Any]]) -> List[Dict[str, Any]]:
        traces: List[Dict[str, Any]] = []
        for start in range(0, len(profiles), self.batch_size):
            chunk = profiles[start : start + self.batch_size]
            traces.extend(self._generate_batch(chunk, start))
        return traces

    def _generate_batch(
        self, profiles: Sequence[Dict[str, Any]], offset: int
    ) -> List[Dict[str, Any]]:
        page_context = self.page_model.to_dict()
        prompt = (
            "You are the Synthetic Trace Generator for an A/B product research demo.\n"
            "Generate realistic, page-grounded behavior traces for the provided profiles.\n"
            "Return JSON only. Do not use tools. Do not produce prose outside JSON.\n\n"
            f"Variant: {self.variant}\n"
            f"URL: {self.page_model.url}\n\n"
            f"Trace batch starts at run index: {offset + 1}\n\n"
            "Browser-observed page context:\n"
            f"{json.dumps(page_context, indent=2)}\n\n"
            "Profiles to run:\n"
            f"{json.dumps(list(profiles), indent=2)}\n\n"
            "Rules:\n"
            "- Produce exactly one trace for each provided profile_id, preserving the input order.\n"
            "- Steps must be grounded in the observed page context, including visible labels, CTA names, forms, listings, or page text when available.\n"
            "- If the page context is sparse, infer cautiously and mention the uncertainty in observations.\n"
            "- converted means the synthetic user completed the research task or formed confident intent, not that they booked a stay.\n"
            "- dropoff means the user abandoned or could not complete the research task.\n"
            "- Do not create accounts, book stays, send messages, enter payment data, or submit real personal data.\n"
            "- Use 4 to 8 steps per trace. Friction must be exactly one of: none, low, medium, high.\n"
            "- Each step must include event_type: view, input, primary_click, secondary_click, detail_open, like_save, scroll, dwell, or dropoff.\n"
            "- clicked should be true only when the user activates or edits an interactive UI element.\n"
            "- like_signal should be true when the user saves, likes, wishlists, shortlists, or clearly expresses preference for an item.\n"
            "- primary_action should be true for the page's main task CTA such as Search, Reserve, Start, Continue, or equivalent.\n"
            "- detail_action should be true for opening a listing/detail/product view.\n"
            "- task_seconds should be the total estimated task time and roughly match elapsed_seconds across steps.\n"
            "- final_feedback should be one concise sentence in the user's voice.\n"
        )
        data = self.codex.generate_json(
            prompt,
            trace_output_schema(len(profiles)),
            f"browser-observed behavior trace generation batch {offset + 1}",
        )
        traces = data.get("traces", [])
        return normalize_lm_traces(traces, profiles, self.variant)


class SyntheticRunner:
    def __init__(self, page_model: AirbnbPageModel) -> None:
        self.page_model = page_model

    def run(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        segment = profile["segment"]
        constraints = profile["constraints"]
        destination = constraints["destination"]
        guests = constraints["guests"]
        style = profile["behavior_style"]

        if self.page_model.page_kind == "airbnb_archive":
            steps = self._archive_steps(profile)
        elif self.page_model.page_kind == "staybnb_booking":
            steps = self._staybnb_steps(profile, destination, guests)
        elif segment == "experience_seeker":
            steps = self._experience_steps(profile, destination, guests)
        elif segment == "first_time_cautious_user":
            steps = self._cautious_steps(profile, destination, guests)
        else:
            steps = self._homes_steps(profile, destination, guests)

        feedback = self._final_feedback(profile, steps, style)
        trace = {
            "persona_id": profile["id"],
            "segment": segment,
            "goal": profile["goal"],
            "steps": steps,
            "final_feedback": feedback,
        }
        validate_trace_safety(trace)
        return trace

    def _staybnb_steps(
        self, profile: Dict[str, Any], destination: str, guests: int
    ) -> List[Dict[str, Any]]:
        price_focus = profile["behavior_style"]["price_sensitivity"]
        detail_focus = profile["behavior_style"]["detail_orientation"]
        return [
            step(
                1,
                "Staybnb shows a compact booking-oriented homepage with search, comparison, and mock checkout stages.",
                f"I can see this is meant for finding a stay near {destination}.",
                "orient_on_staybnb",
                "scan header, hero copy, and booking workflow",
                "Staybnb homepage",
                "Confirm that the page supports stay discovery.",
                0.08,
                event_type="view",
                elapsed_seconds=9,
            ),
            step(
                2,
                "The form exposes LOCATION, CHECK IN, CHECK OUT, and GUESTS in one row.",
                f"I will set {destination} and {guests} guest(s) without leaving the page.",
                "configure_trip",
                "fill location, dates, and guests",
                "Search form",
                "Trip context is ready for search.",
                0.14,
                event_type="input",
                elapsed_seconds=24,
            ),
            step(
                3,
                "Search is the clear primary action, and the page labels the next phases as Search stays, Compare details, and Mock checkout.",
                "The flow tells me what will happen after search.",
                "submit_search",
                "click Search",
                "Search button",
                "Move from trip setup into stay comparison.",
                0.1,
                event_type="primary_click",
                primary_action=True,
                elapsed_seconds=8,
            ),
            step(
                4,
                "The page is instrumented for events, which supports measuring friction during the experiment.",
                "I expect the team can capture where I hesitate.",
                "notice_tracking",
                "scan Events counter and flow stage labels",
                "Events and stage indicators",
                "Understand that behavior can be measured without a real booking.",
                round(0.12 + detail_focus * 0.08, 2),
                event_type="scroll",
                elapsed_seconds=16,
            ),
            step(
                5,
                "Search results expose listing cards with View details actions, prices, ratings, beds, and guest capacity.",
                "I can open a listing and use that as my shortlist/like signal.",
                "compare_details",
                "click View details on the best matching listing",
                "Listing card View details button",
                "Decide whether the visible details are enough to continue.",
                round(0.18 + price_focus * 0.16, 2),
                event_type="detail_open",
                like_signal=True,
                detail_action=True,
                elapsed_seconds=30,
            ),
            step(
                6,
                "The detail page offers a Reserve CTA and clarifies that fees are calculated at checkout.",
                "I can express intent without entering payment or sending host messages.",
                "assess_checkout_intent",
                "activate mock checkout intent CTA",
                "Reserve button",
                "Measure purchase intent safely.",
                round(0.12 + detail_focus * 0.08, 2),
                event_type="primary_click",
                primary_action=True,
                elapsed_seconds=18,
            ),
        ]

    def _archive_steps(self, profile: Dict[str, Any]) -> List[Dict[str, Any]]:
        return [
            step(
                1,
                "The page opens as Airbnb Archive with a chronological product-history navigation.",
                "This looks like brand history, not a place to book a stay.",
                "orient_on_archive",
                "scan timeline and hero content",
                "Archive timeline",
                "Understand the page purpose before trying to search.",
                0.48,
                event_type="view",
                elapsed_seconds=22,
            ),
            step(
                2,
                "Timeline entries such as 2009 AirBed, 2010 Human, and later product eras dominate the first screen.",
                "The historical content is interesting, but it does not answer my trip-planning goal.",
                "scan_history",
                "read visible archive milestones",
                "Timeline list",
                "Determine whether any milestone leads to a stay search.",
                0.62,
                event_type="scroll",
                elapsed_seconds=42,
            ),
            step(
                3,
                "The archive navigation offers many era buttons, so users click around the timeline instead of progressing toward a stay task.",
                "I will try another era, but this is exploration rather than booking progress.",
                "timeline_click",
                "click a timeline era such as 2025 Services",
                "Archive timeline button",
                "Switch archive era, not booking context.",
                0.58,
                event_type="secondary_click",
                elapsed_seconds=18,
            ),
            step(
                4,
                "Some archived eras expose SearchSurface forms, but they feel like historical examples rather than the primary current booking flow.",
                "I am unsure whether this search will produce useful current listings.",
                "probe_archive_search",
                "scan archived search form without committing",
                "Archive SearchSurface",
                "Recognize that the CTA is not clearly tied to the task.",
                0.72,
                event_type="dwell",
                elapsed_seconds=38,
            ),
            step(
                5,
                "No clear listing cards, price comparison, or mock checkout path is visible from the archive experience.",
                "I cannot evaluate price, trust, or purchase intent from this page.",
                "abandon_booking_task",
                "stop before any account or personal-data step",
                "Archive page",
                "Exit with low booking confidence.",
                0.86,
                event_type="dropoff",
                elapsed_seconds=20,
            ),
        ]

    def _homes_steps(
        self, profile: Dict[str, Any], destination: str, guests: int
    ) -> List[Dict[str, Any]]:
        price_focus = profile["behavior_style"]["price_sensitivity"]
        detail_focus = profile["behavior_style"]["detail_orientation"]
        return [
            step(
                1,
                "Homepage shows Homes, Experiences, Services, plus Where, When, Who, Search.",
                f"I need a stay in {destination}, so I will start with the main search controls.",
                "orient_on_homepage",
                "scan visible header search",
                "Homepage search area",
                "Understand the quickest path to a stay search.",
                0.08,
            ),
            step(
                2,
                "The Where field is empty and prominent.",
                f"My destination is {destination}; I expect search suggestions or a direct query.",
                "enter_destination",
                f"type '{destination}' into Where",
                "Where searchbox",
                "Destination query is ready.",
                0.12,
            ),
            step(
                3,
                "The When control says Add dates.",
                "Dates matter, but I do not want to spend too long in a calendar.",
                "choose_dates",
                "choose a flexible weekend date range",
                "When button and date picker",
                "A short trip date range is selected or the date step is identified as friction.",
                0.28,
            ),
            step(
                4,
                "The Who control says Add guests.",
                f"I need the results to match {guests} guest(s).",
                "set_guests",
                f"set guests to {guests}",
                "Who guest selector",
                "Guest count is reflected in the search.",
                0.16,
            ),
            step(
                5,
                "Search button is visible after destination, dates, and guests.",
                "Now I want result cards I can compare quickly.",
                "submit_search",
                "click Search",
                "Search button",
                "Results or relevant listing cards are displayed.",
                0.1,
            ),
            step(
                6,
                "Visible Lake Tahoe cards include prices for 2 nights and ratings.",
                "I will compare value using price, rating, and Guest favorite labels.",
                "compare_listing_cards",
                "compare Cabin in Kings Beach, Condo in South Lake Tahoe, and Home in Carnelian Bay",
                "Listing cards",
                "Shortlist one or two options without committing.",
                round(0.12 + price_focus * 0.12, 2),
            ),
            step(
                7,
                "The listing cards show nightly-like totals but not a full checkout-style breakdown.",
                "I can see rough value, but I still wonder about fees and final total.",
                "evaluate_price_clarity",
                "inspect price text and note missing total-price detail",
                "Price text on listing cards",
                "Decide whether price information is enough to continue.",
                round(0.22 + price_focus * 0.28, 2),
            ),
            step(
                8,
                "Ratings and Guest favorite labels provide trust signals.",
                "The cards make me comfortable browsing, but I need details before a real decision.",
                "assess_trust",
                "use ratings and Guest favorite labels as trust signals",
                "Rating and badge text",
                "Estimate confidence in the shortlisted listings.",
                round(0.1 + detail_focus * 0.08, 2),
            ),
        ]

    def _experience_steps(
        self, profile: Dict[str, Any], destination: str, guests: int
    ) -> List[Dict[str, Any]]:
        return [
            step(
                1,
                "Homepage defaults to Homes, while Experiences and Services are marked new.",
                "I am more interested in activities than lodging, so I need to switch context.",
                "orient_on_homepage",
                "scan top tabs",
                "Homes, Experiences, Services tabs",
                "Find the non-stay discovery entry point.",
                0.14,
            ),
            step(
                2,
                "Experiences is visible next to Homes.",
                "The new label catches my eye; I expect activity search to live there.",
                "switch_to_experiences",
                "click Experiences tab",
                "Experiences tab",
                "Experience search mode becomes active.",
                0.18,
            ),
            step(
                3,
                "Search still begins with a Where-style location field.",
                f"I want activity ideas around {destination}.",
                "enter_destination",
                f"type '{destination}' into Where",
                "Where searchbox",
                "Activity discovery is scoped to a destination.",
                0.14,
            ),
            step(
                4,
                "Date and guest controls remain relevant for activities.",
                f"I need availability for {guests} participant(s), but flexible timing is okay.",
                "set_group_context",
                f"set participants to {guests} and keep timing flexible",
                "When and Who controls",
                "The search reflects activity group size.",
                0.24,
            ),
            step(
                5,
                "Search is the primary action after setting context.",
                "I want to see whether Airbnb clearly separates stays from activities.",
                "submit_search",
                "click Search",
                "Search button",
                "Activity or service results are displayed.",
                0.12,
            ),
            step(
                6,
                "The page model highlights that Experiences and Services may be missed.",
                "The entry point exists, but it competes with the stronger Homes default.",
                "evaluate_discoverability",
                "compare tab clarity and result relevance",
                "Top navigation and result area",
                "Judge whether activity discovery is obvious enough.",
                0.34,
            ),
        ]

    def _cautious_steps(
        self, profile: Dict[str, Any], destination: str, guests: int
    ) -> List[Dict[str, Any]]:
        return [
            step(
                1,
                "Homepage shows polished listing cards, prices, ratings, and wishlist buttons.",
                "I am new, so I want to understand value before giving any account details.",
                "orient_on_homepage",
                "scan search controls and visible listings",
                "Homepage and Lake Tahoe carousel",
                "Build enough confidence to explore safely.",
                0.1,
            ),
            step(
                2,
                "The Where searchbox is the clearest starting point.",
                f"I will search {destination} but keep my commitment low.",
                "enter_destination",
                f"type '{destination}' into Where",
                "Where searchbox",
                "Destination query is ready.",
                0.16,
            ),
            step(
                3,
                "The date picker may require several choices.",
                "I am willing to try, but calendar complexity could slow me down.",
                "choose_dates",
                "choose a flexible weekend date range",
                "When button and date picker",
                "A low-commitment trip window is selected.",
                0.38,
            ),
            step(
                4,
                "Guest count affects suitability and price.",
                f"I need results for {guests} guest(s).",
                "set_guests",
                f"set guests to {guests}",
                "Who guest selector",
                "Guest context is included.",
                0.18,
            ),
            step(
                5,
                "Cards show ratings and Guest favorite labels.",
                "I trust visible reviews more than beautiful photos.",
                "assess_trust",
                "compare rating and badge signals across listing cards",
                "Rating and badge text",
                "Identify whether the marketplace feels credible.",
                0.2,
            ),
            step(
                6,
                "Wishlist buttons are visible on cards.",
                "Saving looks useful, but an account wall would interrupt my evaluation.",
                "identify_account_wall_risk",
                "avoid wishlist and continue comparing visible card information",
                "Wishlist button",
                "Recognize account-wall friction without triggering it.",
                0.42,
            ),
            step(
                7,
                "Prices are visible but final cost details are not fully explained on the cards.",
                "Before I continue, I need clearer total-cost confidence.",
                "evaluate_price_clarity",
                "inspect price text and compare against budget preference",
                "Price text on listing cards",
                "Decide whether the search experience gives enough confidence.",
                0.44,
            ),
        ]

    def _final_feedback(
        self, profile: Dict[str, Any], steps: List[Dict[str, Any]], style: Dict[str, float]
    ) -> Dict[str, Any]:
        avg_friction = sum(item["friction"] for item in steps) / len(steps)
        price_sensitivity = style["price_sensitivity"]
        trust_sensitivity = style["trust_sensitivity"]
        segment = profile["segment"]

        ease = clamp_score(9 - avg_friction * 8)
        price_clarity = clamp_score(8 - price_sensitivity * 4 - avg_friction * 2)
        trust = clamp_score(7 + trust_sensitivity * 2 - avg_friction * 2)
        purchase_intent = clamp_score((ease + price_clarity + trust) / 3 - 0.5)

        if self.page_model.page_kind == "airbnb_archive":
            recommendation = "Do not send booking-intent traffic to the archive page; route users to a searchable stay flow or add a clear booking CTA."
            confusion = [
                "The page reads as a historical archive rather than a booking or comparison experience.",
                "Destination, date, guest, listing, and price controls are not available in the expected place.",
            ]
            liked = ["The timeline communicates brand evolution clearly."]
            purchase_intent = clamp_score(purchase_intent - 2.0)
        elif self.page_model.page_kind == "staybnb_booking":
            recommendation = "Keep the compact search-to-mock-checkout path, but expose total price and listing detail earlier."
            confusion = [
                "Final cost and listing detail need to be clearer before users move into checkout intent.",
            ]
            liked = [
                "The single-page flow makes search, comparison, and mock checkout easy to understand.",
                "Event capture signals make the experiment instrumentation visible to the team.",
            ]
        elif segment == "experience_seeker":
            recommendation = "Make Experiences and Services more discoverable from the default Homes flow."
            confusion = ["Experiences are visible but secondary to the stronger Homes default."]
            liked = ["The new tab gives a clear entry point once noticed."]
        elif segment == "first_time_cautious_user":
            recommendation = "Explain total cost and account-wall moments before users try to save listings."
            confusion = [
                "Final cost is not clear enough from listing cards.",
                "Wishlist appears useful but may interrupt evaluation.",
            ]
            liked = ["Ratings and Guest favorite badges help establish trust."]
        elif segment == "family_planner":
            recommendation = "Surface family-fit signals, sleeping setup, and flexible cancellation earlier."
            confusion = ["Family suitability requires more detail than the card provides."]
            liked = ["Guest count is easy to include in the search intent."]
        elif segment == "remote_worker_business_traveler":
            recommendation = "Expose work-trip filters such as Wi-Fi, desk, quietness, and commute area earlier."
            confusion = ["Work-readiness is hard to judge from the first listing cards."]
            liked = ["Destination and guest search path is fast."]
        else:
            recommendation = "Show estimated total price and fees earlier in the listing-card comparison flow."
            confusion = ["Budget comparison is slowed by incomplete total-price detail."]
            liked = ["Price and rating are visible enough to build an initial shortlist."]

        return {
            "task_success": avg_friction < 0.45,
            "scores": {
                "ease_of_search": ease,
                "price_clarity": price_clarity,
                "trust": trust,
                "purchase_intent": purchase_intent,
            },
            "liked_features": liked,
            "confusion_points": confusion,
            "friction_themes": friction_themes(segment, price_clarity, ease, trust, confusion),
            "recommendation": recommendation,
        }


class FeedbackSummarizer:
    def __init__(self, codex: CodexClient) -> None:
        self.codex = codex

    def summarize(
        self, profiles: List[Dict[str, Any]], traces: List[Dict[str, Any]]
    ) -> Dict[str, Any]:
        local_metrics = compute_metrics(traces)
        prompt = (
            "You are summarizing a synthetic Airbnb user research demo.\n"
            "Return JSON only. Do not use tools. Use the provided metrics exactly; do not invent counts.\n\n"
            "Generated profiles:\n"
            f"{json.dumps(profiles, indent=2)}\n\n"
            "Synthetic user traces:\n"
            f"{json.dumps(traces, indent=2)}\n\n"
            "Precomputed metrics and cluster counts to preserve:\n"
            f"{json.dumps(local_metrics, indent=2)}\n\n"
            "Write concise top findings and product recommendations suitable for a hackathon demo."
        )
        try:
            summary = self.codex.generate_json(
                prompt, summary_output_schema(len(traces)), "feedback summarization"
            )
        except DemoError as exc:
            print(f"WARN: LM feedback summarization failed; using local summary: {exc}", file=sys.stderr)
            summary = local_feedback_summary(profiles, traces, local_metrics)
        summary["metrics"] = local_metrics
        return summary


def step(
    number: int,
    observation: str,
    thought: str,
    intent: str,
    action: str,
    target_ui: str,
    expected_result: str,
    friction: float,
    event_type: str | None = None,
    clicked: bool | None = None,
    like_signal: bool = False,
    primary_action: bool = False,
    detail_action: bool = False,
    elapsed_seconds: int | None = None,
) -> Dict[str, Any]:
    event = event_type or infer_event_type(intent, action, target_ui)
    is_clicked = clicked if clicked is not None else event in {
        "input",
        "primary_click",
        "secondary_click",
        "detail_open",
        "like_save",
    }
    return {
        "step": number,
        "observation": observation,
        "persona_thought": thought,
        "intent": intent,
        "action": action,
        "target_ui": target_ui,
        "expected_result": expected_result,
        "friction": round(float(friction), 2),
        "event_type": event,
        "clicked": bool(is_clicked),
        "like_signal": bool(like_signal or event == "like_save"),
        "primary_action": bool(primary_action or event == "primary_click"),
        "detail_action": bool(detail_action or event == "detail_open"),
        "elapsed_seconds": int(elapsed_seconds if elapsed_seconds is not None else infer_elapsed_seconds(event, friction)),
    }


def infer_event_type(intent: str, action: str, target_ui: str) -> str:
    text = f"{intent} {action} {target_ui}".lower()
    if any(term in text for term in ["reserve", "checkout", "search", "submit"]):
        return "primary_click"
    if any(term in text for term in ["view details", "open listing", "compare detail"]):
        return "detail_open"
    if any(term in text for term in ["wishlist", "save", "like", "shortlist"]):
        return "like_save"
    if any(term in text for term in ["type", "set ", "choose", "fill", "enter"]):
        return "input"
    if any(term in text for term in ["scroll", "scan", "read", "review"]):
        return "scroll"
    if any(term in text for term in ["stop", "abandon", "exit"]):
        return "dropoff"
    return "view"


def infer_elapsed_seconds(event_type: str, friction: float) -> int:
    base = {
        "view": 8,
        "scroll": 16,
        "input": 18,
        "secondary_click": 14,
        "primary_click": 18,
        "detail_open": 28,
        "like_save": 10,
        "dwell": 32,
        "dropoff": 20,
    }.get(event_type, 12)
    return max(4, int(round(base * (1 + friction))))


def profile_output_schema(profile_count: int) -> Dict[str, Any]:
    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "additionalProperties": False,
        "required": ["profiles"],
        "properties": {
            "profiles": {
                "type": "array",
                "minItems": profile_count,
                "maxItems": profile_count,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "id",
                        "segment",
                        "goal",
                        "task",
                        "constraints",
                        "behavior_style",
                        "success_criteria",
                        "frustration_triggers",
                    ],
                    "properties": {
                        "id": {"type": "string"},
                        "segment": {"type": "string", "enum": SEGMENTS},
                        "goal": {"type": "string"},
                        "task": {"type": "string"},
                        "constraints": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": ["destination", "guests", "budget_preference"],
                            "properties": {
                                "destination": {"type": "string"},
                                "guests": {"type": "integer", "minimum": 1, "maximum": 8},
                                "budget_preference": {"type": "string"},
                            },
                        },
                        "behavior_style": {
                            "type": "object",
                            "additionalProperties": False,
                            "required": [
                                "patience",
                                "exploration",
                                "price_sensitivity",
                                "trust_sensitivity",
                                "detail_orientation",
                            ],
                            "properties": {
                                "patience": {"type": "number", "minimum": 0, "maximum": 1},
                                "exploration": {"type": "number", "minimum": 0, "maximum": 1},
                                "price_sensitivity": {
                                    "type": "number",
                                    "minimum": 0,
                                    "maximum": 1,
                                },
                                "trust_sensitivity": {
                                    "type": "number",
                                    "minimum": 0,
                                    "maximum": 1,
                                },
                                "detail_orientation": {
                                    "type": "number",
                                    "minimum": 0,
                                    "maximum": 1,
                                },
                            },
                        },
                        "success_criteria": {
                            "type": "array",
                            "minItems": 2,
                            "items": {"type": "string"},
                        },
                        "frustration_triggers": {
                            "type": "array",
                            "minItems": 2,
                            "items": {"type": "string"},
                        },
                    },
                },
            }
        },
    }


def trace_output_schema(run_count: int) -> Dict[str, Any]:
    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "additionalProperties": False,
        "required": ["traces"],
        "properties": {
            "traces": {
                "type": "array",
                "minItems": run_count,
                "maxItems": run_count,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": [
                        "profile_id",
                        "variant",
                        "converted",
                        "dropoff",
                        "task_seconds",
                        "satisfaction",
                        "steps",
                        "final_feedback",
                    ],
                    "properties": {
                        "profile_id": {"type": "string"},
                        "variant": {"type": "string"},
                        "converted": {"type": "boolean"},
                        "dropoff": {"type": "boolean"},
                        "task_seconds": {"type": "integer", "minimum": 10, "maximum": 1800},
                        "satisfaction": {"type": "number", "minimum": 1, "maximum": 5},
                        "steps": {
                            "type": "array",
                            "minItems": 3,
                            "maxItems": 10,
                            "items": {
                                "type": "object",
                                "additionalProperties": False,
                                "required": [
                                    "step",
                                    "intent",
                                    "action",
                                    "element",
                                    "friction",
                                    "observation",
                                    "elapsed_seconds",
                                    "event_type",
                                    "clicked",
                                    "like_signal",
                                    "primary_action",
                                    "detail_action",
                                ],
                                "properties": {
                                    "step": {"type": "integer", "minimum": 1, "maximum": 10},
                                    "intent": {"type": "string"},
                                    "action": {"type": "string"},
                                    "element": {"type": "string"},
                                    "friction": {
                                        "type": "string",
                                        "enum": ["none", "low", "medium", "high"],
                                    },
                                    "observation": {"type": "string"},
                                    "elapsed_seconds": {
                                        "type": "integer",
                                        "minimum": 1,
                                        "maximum": 600,
                                    },
                                    "event_type": {
                                        "type": "string",
                                        "enum": [
                                            "view",
                                            "input",
                                            "primary_click",
                                            "secondary_click",
                                            "detail_open",
                                            "like_save",
                                            "scroll",
                                            "dwell",
                                            "dropoff",
                                        ],
                                    },
                                    "clicked": {"type": "boolean"},
                                    "like_signal": {"type": "boolean"},
                                    "primary_action": {"type": "boolean"},
                                    "detail_action": {"type": "boolean"},
                                },
                            },
                        },
                        "final_feedback": {"type": "string"},
                    },
                },
            }
        },
    }


def summary_output_schema(run_count: int) -> Dict[str, Any]:
    return {
        "$schema": "http://json-schema.org/draft-07/schema#",
        "type": "object",
        "additionalProperties": False,
        "required": ["top_findings", "segment_notes", "recommendations", "demo_readout"],
        "properties": {
            "top_findings": {
                "type": "array",
                "minItems": 3,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["theme", "affected_users", "severity", "evidence", "suggestion"],
                    "properties": {
                        "theme": {"type": "string"},
                        "affected_users": {
                            "type": "integer",
                            "minimum": 0,
                            "maximum": run_count,
                        },
                        "severity": {"type": "string", "enum": ["low", "medium", "high"]},
                        "evidence": {"type": "string"},
                        "suggestion": {"type": "string"},
                    },
                },
            },
            "segment_notes": {
                "type": "array",
                "minItems": 1,
                "items": {
                    "type": "object",
                    "additionalProperties": False,
                    "required": ["segment", "note"],
                    "properties": {
                        "segment": {"type": "string", "enum": SEGMENTS},
                        "note": {"type": "string"},
                    },
                },
            },
            "recommendations": {
                "type": "array",
                "minItems": 3,
                "items": {"type": "string"},
            },
            "demo_readout": {"type": "string"},
        },
    }


def segment_quotas(profile_count: int) -> Dict[str, int]:
    base = profile_count // len(SEGMENTS)
    remainder = profile_count % len(SEGMENTS)
    return {
        segment: base + (1 if index < remainder else 0)
        for index, segment in enumerate(SEGMENTS)
    }


def rule_based_profiles(profile_count: int) -> List[Dict[str, Any]]:
    templates = {
        "budget_weekend_couple": {
            "goal": "Find an affordable two-night stay that still feels trustworthy.",
            "task": "Compare visible stay options by price, rating, and value signals without booking.",
            "destination": "Lake Tahoe",
            "guests": 2,
            "budget": "lowest credible visible total",
            "style": [0.48, 0.42, 0.94, 0.62, 0.58],
            "success": ["Compares at least two options.", "Forms a shortlist without booking."],
            "frustration": ["Fees are unclear.", "Low-price options are hard to compare."],
        },
        "family_planner": {
            "goal": "Find a reliable stay that looks suitable for a family trip.",
            "task": "Search for a family-sized stay and compare trust, space, and suitability signals.",
            "destination": "Lake Tahoe",
            "guests": 4,
            "budget": "moderate budget with strong trust signals",
            "style": [0.78, 0.58, 0.62, 0.9, 0.86],
            "success": ["Checks suitability signals.", "Avoids account or payment actions."],
            "frustration": ["Family details are missing.", "Cancellation or fee details are unclear."],
        },
        "remote_worker_business_traveler": {
            "goal": "Find a stay that would work for a quiet remote-work trip.",
            "task": "Assess whether the page exposes work-readiness, location, and fast booking confidence.",
            "destination": "Austin",
            "guests": 1,
            "budget": "business-friendly value with reliable amenities",
            "style": [0.64, 0.46, 0.55, 0.72, 0.82],
            "success": ["Finds practical fit signals.", "Identifies whether more details are needed."],
            "frustration": ["Work amenities are hidden.", "The next step takes too long."],
        },
        "experience_seeker": {
            "goal": "Discover whether activities or services are easy to find from the page.",
            "task": "Look for non-stay discovery paths and judge whether the page supports activity intent.",
            "destination": "New York",
            "guests": 2,
            "budget": "flexible if the experience feels distinctive",
            "style": [0.7, 0.88, 0.42, 0.62, 0.66],
            "success": ["Finds the experiences path.", "Understands what to do next."],
            "frustration": ["Experiences are secondary.", "Navigation labels compete for attention."],
        },
        "first_time_cautious_user": {
            "goal": "Understand the site without creating an account or exposing personal data.",
            "task": "Browse cautiously, check trust and cost clarity, and stop before account or payment steps.",
            "destination": "Lake Tahoe",
            "guests": 2,
            "budget": "needs clear price confidence before continuing",
            "style": [0.52, 0.38, 0.76, 0.92, 0.74],
            "success": ["Avoids unsafe actions.", "Forms confidence or identifies why not."],
            "frustration": ["Sign-in appears too early.", "Trust or fees are not explained."],
        },
    }
    destinations = {
        "budget_weekend_couple": ["Lake Tahoe", "Joshua Tree", "San Diego", "Portland"],
        "family_planner": ["Lake Tahoe", "San Francisco", "San Diego", "Seattle"],
        "remote_worker_business_traveler": ["Austin", "Seattle", "San Francisco", "Denver"],
        "experience_seeker": ["New York", "Los Angeles", "Miami", "Chicago"],
        "first_time_cautious_user": ["Lake Tahoe", "San Diego", "Portland", "Denver"],
    }
    budget_variants = {
        "budget_weekend_couple": [
            "lowest credible visible total",
            "under budget if ratings stay above average",
            "clear total price before opening checkout",
        ],
        "family_planner": [
            "moderate budget with strong trust signals",
            "family-fit value over cheapest option",
            "flexible budget if cancellation is clear",
        ],
        "remote_worker_business_traveler": [
            "business-friendly value with reliable amenities",
            "fast decision if work-readiness is visible",
            "company-reimbursable price clarity",
        ],
        "experience_seeker": [
            "flexible if the experience feels distinctive",
            "willing to pay more for a unique activity",
            "compare novelty before cost",
        ],
        "first_time_cautious_user": [
            "needs clear price confidence before continuing",
            "prefers visible fees before any account step",
            "will stop if trust or cost feels hidden",
        ],
    }
    quotas = segment_quotas(profile_count)
    profiles: List[Dict[str, Any]] = []
    for segment in SEGMENTS:
        template = templates[segment]
        for ordinal in range(quotas[segment]):
            index = len(profiles) + 1
            patience, exploration, price, trust, detail = template["style"]
            adjustment = ((index % 5) - 2) * 0.035
            style_values = [
                max(0.05, min(0.98, patience + adjustment)),
                max(0.05, min(0.98, exploration - adjustment / 2)),
                max(0.05, min(0.98, price + adjustment / 3)),
                max(0.05, min(0.98, trust - adjustment / 4)),
                max(0.05, min(0.98, detail + adjustment / 2)),
            ]
            destination = destinations[segment][ordinal % len(destinations[segment])]
            budget = budget_variants[segment][ordinal % len(budget_variants[segment])]
            guest_delta = 1 if segment == "family_planner" and ordinal % 3 == 2 else 0
            profiles.append(
                {
                    "id": f"airbnb_u_{index:03d}",
                    "segment": segment,
                    "goal": template["goal"],
                    "task": template["task"],
                    "constraints": {
                        "destination": destination,
                        "guests": template["guests"] + guest_delta,
                        "budget_preference": budget,
                    },
                    "behavior_style": {
                        "patience": round(style_values[0], 2),
                        "exploration": round(style_values[1], 2),
                        "price_sensitivity": round(style_values[2], 2),
                        "trust_sensitivity": round(style_values[3], 2),
                        "detail_orientation": round(style_values[4], 2),
                    },
                    "success_criteria": template["success"],
                    "frustration_triggers": template["frustration"],
                }
            )
    validate_profiles(profiles, profile_count)
    return profiles


def fallback_profiles(profile_count: int) -> List[Dict[str, Any]]:
    return rule_based_profiles(profile_count)


def validate_profiles(profiles: List[Dict[str, Any]], expected_count: int) -> None:
    if len(profiles) != expected_count:
        raise DemoError(f"Expected {expected_count} profiles, received {len(profiles)}.")
    ids = [profile.get("id") for profile in profiles]
    if len(ids) != len(set(ids)):
        raise DemoError("Generated profiles contain duplicate ids.")
    required_segments = set(SEGMENTS)
    seen_segments = {profile.get("segment") for profile in profiles}
    missing = required_segments - seen_segments
    if missing:
        raise DemoError(f"Generated profiles are missing segments: {sorted(missing)}")
    expected_ids = [f"airbnb_u_{index:03d}" for index in range(1, expected_count + 1)]
    if ids != expected_ids:
        raise DemoError(f"Profile ids must be sequential: expected {expected_ids}, received {ids}.")


def select_profiles_for_runs(
    profiles: Sequence[Dict[str, Any]], run_count: int
) -> List[Dict[str, Any]]:
    selected: List[Dict[str, Any]] = []
    selected_ids = set()

    for segment in SEGMENTS:
        match = next(
            (
                profile
                for profile in profiles
                if profile["segment"] == segment and profile["id"] not in selected_ids
            ),
            None,
        )
        if match:
            selected.append(match)
            selected_ids.add(match["id"])
        if len(selected) >= run_count:
            return selected

    for profile in profiles:
        if profile["id"] not in selected_ids:
            selected.append(profile)
            selected_ids.add(profile["id"])
        if len(selected) >= run_count:
            return selected

    return selected


def normalize_lm_traces(
    traces: Sequence[Dict[str, Any]], profiles: Sequence[Dict[str, Any]], variant: str
) -> List[Dict[str, Any]]:
    if len(traces) != len(profiles):
        raise DemoError(f"Expected {len(profiles)} traces, received {len(traces)}.")

    profile_by_id = {profile["id"]: profile for profile in profiles}
    seen_ids = set()
    normalized_by_id: Dict[str, Dict[str, Any]] = {}

    for raw_trace in traces:
        profile_id = str(raw_trace.get("profile_id", "")).strip()
        if profile_id not in profile_by_id:
            raise DemoError(f"Trace references unknown profile_id: {profile_id!r}")
        if profile_id in seen_ids:
            raise DemoError(f"Duplicate trace for profile_id: {profile_id}")
        seen_ids.add(profile_id)

        profile = profile_by_id[profile_id]
        steps: List[Dict[str, Any]] = []
        for index, raw_step in enumerate(raw_trace.get("steps", []), start=1):
            friction = str(raw_step.get("friction", "medium")).lower()
            if friction not in FRICTION_SCORES:
                raise DemoError(f"Invalid friction level for {profile_id}: {friction}")
            steps.append(
                {
                    "step": index,
                    "intent": clean_text(str(raw_step.get("intent", ""))) or "Observe",
                    "action": clean_text(str(raw_step.get("action", ""))) or "Observe page",
                    "element": clean_text(str(raw_step.get("element", ""))) or "Page",
                    "friction": friction,
                    "observation": clean_text(str(raw_step.get("observation", "")))
                    or "No additional observation.",
                    "elapsed_seconds": max(
                        1, min(600, int(round(float(raw_step.get("elapsed_seconds", 1)))))
                    ),
                    "event_type": str(raw_step.get("event_type") or "view"),
                    "clicked": bool(raw_step.get("clicked")),
                    "like_signal": bool(raw_step.get("like_signal")),
                    "primary_action": bool(raw_step.get("primary_action")),
                    "detail_action": bool(raw_step.get("detail_action")),
                }
            )

        if not steps:
            raise DemoError(f"Trace for {profile_id} contains no steps.")

        trace = {
            "profile_id": profile_id,
            "persona_id": profile_id,
            "variant": str(raw_trace.get("variant") or variant),
            "segment": profile["segment"],
            "goal": profile["goal"],
            "converted": bool(raw_trace.get("converted")),
            "dropoff": bool(raw_trace.get("dropoff")),
            "task_seconds": max(10, min(1800, int(raw_trace.get("task_seconds", 10)))),
            "satisfaction": round(max(1.0, min(5.0, float(raw_trace.get("satisfaction", 3)))), 1),
            "steps": steps,
            "final_feedback": clean_text(str(raw_trace.get("final_feedback", "")))
            or "The page gave enough signal to form an initial impression.",
            "trace_source": "lm_batch_browser_observed",
        }
        validate_trace_safety(trace)
        normalized_by_id[profile_id] = trace

    missing = set(profile_by_id) - seen_ids
    if missing:
        raise DemoError(f"Missing traces for profiles: {sorted(missing)}")
    return [normalized_by_id[profile["id"]] for profile in profiles]


def validate_trace_safety(trace: Dict[str, Any]) -> None:
    unsafe_action_terms = [
        "submit payment",
        "enter payment",
        "add credit card",
        "click reserve",
        "confirm reservation",
        "complete booking",
        "message host",
        "submit personal",
        "create account",
        "log in with",
        "login with",
    ]
    for item in trace["steps"]:
        action = item["action"].lower()
        if any(term in action for term in unsafe_action_terms):
            raise DemoError(
                f"Unsafe action found in trace for {trace.get('persona_id') or trace.get('profile_id')}: {item['action']}"
            )


def friction_themes(
    segment: str, price_clarity: int, ease: int, trust: int, confusion: Iterable[str]
) -> List[str]:
    text = " ".join(confusion).lower()
    themes = []
    if price_clarity <= 6 or "cost" in text or "price" in text:
        themes.append("price_clarity")
    if ease <= 6 or "calendar" in text or "date" in text:
        themes.append("date_picker_friction")
    if trust <= 6 or "review" in text or "trust" in text:
        themes.append("trust_review_confidence")
    if "wishlist" in text or "account" in text:
        themes.append("wishlist_account_wall")
    if segment == "experience_seeker":
        themes.append("experiences_discoverability")
    if not themes:
        themes.append("low_friction")
    return themes


def step_friction_value(step_item: Dict[str, Any]) -> float:
    value = step_item.get("friction", 0)
    if isinstance(value, (int, float)):
        return max(0.0, min(1.0, float(value)))
    return FRICTION_SCORES.get(str(value).lower(), 0.45)


def trace_success(trace: Dict[str, Any]) -> bool:
    if "converted" in trace:
        return bool(trace.get("converted"))
    feedback = trace.get("final_feedback")
    if isinstance(feedback, dict):
        return bool(feedback.get("task_success"))
    return False


def trace_dropoff(trace: Dict[str, Any]) -> bool:
    if "dropoff" in trace:
        return bool(trace.get("dropoff"))
    return not trace_success(trace)


def trace_task_seconds(trace: Dict[str, Any]) -> float:
    if "task_seconds" in trace:
        return float(trace.get("task_seconds") or 0)
    elapsed = [float(step_item.get("elapsed_seconds", 0) or 0) for step_item in trace.get("steps", [])]
    if any(elapsed):
        return sum(elapsed)
    return max(30.0, len(trace.get("steps", [])) * 22.0)


def trace_satisfaction(trace: Dict[str, Any]) -> float:
    if "satisfaction" in trace:
        return max(1.0, min(5.0, float(trace.get("satisfaction") or 3)))
    scores = trace_scores(trace)
    return max(1.0, min(5.0, ((scores["ease_of_search"] + scores["trust"]) / 2) / 2))


def trace_scores(trace: Dict[str, Any]) -> Dict[str, int]:
    feedback = trace.get("final_feedback")
    if isinstance(feedback, dict) and isinstance(feedback.get("scores"), dict):
        return {
            key: int(feedback["scores"][key])
            for key in ["ease_of_search", "price_clarity", "trust", "purchase_intent"]
        }

    steps = trace.get("steps", [])
    avg_friction = (
        sum(step_friction_value(step_item) for step_item in steps) / len(steps) if steps else 0.4
    )
    satisfaction = trace_satisfaction_raw(trace)
    converted = trace_success(trace)
    dropoff = trace_dropoff(trace)
    trace_text = trace_text_blob(trace)
    price_terms = any(term in trace_text for term in ["price", "fee", "fees", "total", "cost"])

    ease = clamp_score((satisfaction / 5) * 10 - avg_friction * 2 + (0.6 if converted else 0))
    trust = clamp_score((satisfaction / 5) * 8 + (1.4 if converted else 0) - avg_friction)
    purchase_intent = clamp_score(
        (satisfaction / 5) * 6 + (3 if converted else 1) - (2 if dropoff else 0) - avg_friction
    )
    price_clarity = clamp_score(ease + (0.8 if not price_terms else -1.0 if avg_friction > 0.25 else 0.2))
    return {
        "ease_of_search": ease,
        "price_clarity": price_clarity,
        "trust": trust,
        "purchase_intent": purchase_intent,
    }


def trace_satisfaction_raw(trace: Dict[str, Any]) -> float:
    try:
        return max(1.0, min(5.0, float(trace.get("satisfaction") or 3)))
    except (TypeError, ValueError):
        return 3.0


def trace_text_blob(trace: Dict[str, Any]) -> str:
    parts = [str(trace.get("final_feedback", "")), str(trace.get("goal", "")), str(trace.get("segment", ""))]
    for step_item in trace.get("steps", []):
        parts.extend(
            [
                str(step_item.get("intent", "")),
                str(step_item.get("action", "")),
                str(step_item.get("element", "")),
                str(step_item.get("target_ui", "")),
                str(step_item.get("observation", "")),
                str(step_item.get("expected_result", "")),
            ]
        )
    return " ".join(parts).lower()


def step_event_type(step_item: Dict[str, Any]) -> str:
    event = str(step_item.get("event_type") or "").strip()
    if event:
        return event
    return infer_event_type(
        str(step_item.get("intent", "")),
        str(step_item.get("action", "")),
        str(step_item.get("target_ui") or step_item.get("element") or ""),
    )


def step_elapsed_seconds(step_item: Dict[str, Any]) -> int:
    try:
        value = int(round(float(step_item.get("elapsed_seconds", 0))))
    except (TypeError, ValueError):
        value = 0
    if value > 0:
        return value
    return infer_elapsed_seconds(step_event_type(step_item), step_friction_value(step_item))


def step_clicked(step_item: Dict[str, Any]) -> bool:
    if "clicked" in step_item:
        return bool(step_item.get("clicked"))
    return step_event_type(step_item) in {
        "input",
        "primary_click",
        "secondary_click",
        "detail_open",
        "like_save",
    }


def step_like_signal(step_item: Dict[str, Any]) -> bool:
    if bool(step_item.get("like_signal")):
        return True
    text = f"{step_item.get('intent', '')} {step_item.get('action', '')}".lower()
    return step_event_type(step_item) == "like_save" or any(
        term in text for term in ["like", "save", "wishlist", "shortlist", "favorite"]
    )


def step_primary_action(step_item: Dict[str, Any]) -> bool:
    if bool(step_item.get("primary_action")):
        return True
    return step_event_type(step_item) == "primary_click"


def step_detail_action(step_item: Dict[str, Any]) -> bool:
    if bool(step_item.get("detail_action")):
        return True
    return step_event_type(step_item) == "detail_open"


def trace_friction_themes(trace: Dict[str, Any]) -> List[str]:
    feedback = trace.get("final_feedback")
    if isinstance(feedback, dict) and feedback.get("friction_themes"):
        return list(feedback["friction_themes"])

    text = trace_text_blob(trace)
    themes: List[str] = []
    if any(term in text for term in ["price", "fee", "fees", "total", "cost"]):
        themes.append("price_clarity")
    if any(term in text for term in ["date", "calendar", "check in", "check out"]):
        themes.append("date_picker_friction")
    if any(term in text for term in ["review", "rating", "trust", "safe", "verified", "guest favorite"]):
        themes.append("trust_review_confidence")
    if any(term in text for term in ["wishlist", "sign in", "login", "account"]):
        themes.append("wishlist_account_wall")
    if trace_dropoff(trace) or any(
        step_friction_value(step_item) >= FRICTION_SCORES["medium"] for step_item in trace.get("steps", [])
    ):
        themes.append("navigation_clarity")
    if not themes:
        themes.append("low_friction")
    return sorted(set(themes))


def local_feedback_summary(
    profiles: Sequence[Dict[str, Any]], traces: Sequence[Dict[str, Any]], metrics: Dict[str, Any]
) -> Dict[str, Any]:
    run_count = int(metrics["run_count"])
    friction_counts = metrics.get("friction_counts", {})
    ranked_themes = sorted(friction_counts.items(), key=lambda item: item[1], reverse=True)
    if not ranked_themes:
        ranked_themes = [("low_friction", run_count)]

    findings = []
    for theme, count in ranked_themes[:3]:
        findings.append(
            {
                "theme": theme,
                "affected_users": int(count),
                "severity": severity_for_count(int(count), run_count),
                "evidence": evidence_for_theme(theme, int(count), metrics),
                "suggestion": recommendation_for_theme(theme),
            }
        )
    while len(findings) < 3:
        findings.append(
            {
                "theme": "synthetic_behavior_pattern",
                "affected_users": run_count,
                "severity": "low",
                "evidence": f"{run_count} synthetic traces completed with structured browser-observed steps.",
                "suggestion": "Review logs and profile-level traces before making a product decision.",
            }
        )

    segment_notes = []
    for segment in metrics.get("segments_run", []):
        segment_notes.append({"segment": segment, "note": segment_note(segment)})
    if not segment_notes and profiles:
        segment_notes.append({"segment": profiles[0]["segment"], "note": segment_note(profiles[0]["segment"])})

    return {
        "top_findings": findings,
        "segment_notes": segment_notes,
        "recommendations": [item["suggestion"] for item in findings[:3]],
        "demo_readout": (
            f"{run_count} synthetic runs completed with conversion_rate={metrics['conversion_rate']}, "
            f"dropoff_rate={metrics['dropoff_rate']}, avg_task_seconds={metrics['avg_task_seconds']}, "
            f"avg_satisfaction={metrics['avg_satisfaction']}, and avg_steps={metrics['avg_steps']}."
        ),
    }


def severity_for_count(count: int, run_count: int) -> str:
    ratio = count / max(1, run_count)
    if ratio >= 0.6:
        return "high"
    if ratio >= 0.3:
        return "medium"
    return "low"


def evidence_for_theme(theme: str, count: int, metrics: Dict[str, Any]) -> str:
    if theme == "price_clarity":
        return f"{count} users referenced price, fees, total cost, or value confidence during the run."
    if theme == "date_picker_friction":
        return f"{count} users spent effort on date, calendar, or trip timing decisions."
    if theme == "trust_review_confidence":
        return f"{count} users looked for reviews, ratings, guest-favorite badges, or trust signals."
    if theme == "wishlist_account_wall":
        return f"{count} users encountered save, wishlist, sign-in, or account-risk moments."
    if theme == "navigation_clarity":
        return f"{count} users had medium or high-friction steps in the observed flow."
    return (
        f"{metrics['run_count']} synthetic traces completed with "
        f"avg_satisfaction={metrics['avg_satisfaction']}."
    )


def recommendation_for_theme(theme: str) -> str:
    return {
        "price_clarity": "Expose total price and likely fees earlier in comparison moments.",
        "date_picker_friction": "Reduce date-selection work with flexible-date defaults and clearer calendar affordances.",
        "trust_review_confidence": "Make ratings, review counts, and guest-favorite meaning easier to scan.",
        "wishlist_account_wall": "Clarify save behavior before any sign-in or account requirement appears.",
        "navigation_clarity": "Tighten primary CTA hierarchy and make the next step obvious after each interaction.",
        "experiences_discoverability": "Make Experiences and Services discoverable without competing with the stay search path.",
        "low_friction": "Keep the current flow and instrument small hesitation points for future validation.",
    }.get(theme, "Review the behavior logs and resolve repeated hesitation moments.")


def segment_note(segment: str) -> str:
    return {
        "budget_weekend_couple": "Budget travelers prioritized visible total cost and fast value comparison.",
        "family_planner": "Family planners looked for trust, suitability, and enough detail before continuing.",
        "remote_worker_business_traveler": "Work travelers needed practical fit signals such as quietness and setup confidence.",
        "experience_seeker": "Experience seekers needed the activity path to stand out from the default stay flow.",
        "first_time_cautious_user": "Cautious users were sensitive to account, trust, and fee surprises.",
    }.get(segment, "This segment completed the synthetic browsing task with structured feedback.")


def compute_metrics(traces: List[Dict[str, Any]]) -> Dict[str, Any]:
    run_count = len(traces)
    if run_count == 0:
        raise DemoError("Cannot summarize zero traces.")

    score_keys = ["ease_of_search", "price_clarity", "trust", "purchase_intent"]
    per_trace_scores = [trace_scores(trace) for trace in traces]
    avg_scores = {
        key: round(sum(scores[key] for scores in per_trace_scores) / run_count, 2)
        for key in score_keys
    }
    friction_counts: Dict[str, int] = {}
    for trace in traces:
        for theme in trace_friction_themes(trace):
            friction_counts[theme] = friction_counts.get(theme, 0) + 1

    conversion_rate = round(sum(1 for trace in traces if trace_success(trace)) / run_count, 2)
    dropoff_rate = round(sum(1 for trace in traces if trace_dropoff(trace)) / run_count, 2)
    avg_task_seconds = round(sum(trace_task_seconds(trace) for trace in traces) / run_count, 1)
    avg_satisfaction = round(sum(trace_satisfaction(trace) for trace in traces) / run_count, 2)
    total_steps = sum(len(trace.get("steps", [])) for trace in traces)
    clicked_steps = sum(
        1 for trace in traces for step in trace.get("steps", []) if step_clicked(step)
    )
    click_rate = clicked_steps / total_steps if total_steps else 0
    primary_cta_rate = sum(
        1 for trace in traces if any(step_primary_action(step) for step in trace.get("steps", []))
    ) / run_count
    like_rate = sum(1 for trace in traces if any(step_like_signal(step) for step in trace.get("steps", []))) / run_count
    detail_open_rate = sum(
        1 for trace in traces if any(step_detail_action(step) for step in trace.get("steps", []))
    ) / run_count
    friction_step_rate = (
        sum(
            1
            for trace in traces
            for step in trace.get("steps", [])
            if step_friction_value(step) >= FRICTION_SCORES["medium"]
        )
        / total_steps
        if total_steps
        else 0
    )
    avg_clicks_per_user = (
        sum(sum(1 for step in trace.get("steps", []) if step_clicked(step)) for trace in traces) / run_count
    )
    avg_dwell_seconds = round(
        sum(sum(step_elapsed_seconds(step) for step in trace.get("steps", [])) for trace in traces)
        / run_count,
        1,
    )

    return {
        "run_count": run_count,
        "task_success_rate": conversion_rate,
        "conversion_rate": conversion_rate,
        "dropoff_rate": dropoff_rate,
        "avg_task_seconds": avg_task_seconds,
        "avg_satisfaction": avg_satisfaction,
        "avg_steps": round(sum(len(trace["steps"]) for trace in traces) / run_count, 2),
        "avg_scores": avg_scores,
        "interaction_metrics": {
            "click_rate": round(click_rate, 2),
            "primary_cta_rate": round(primary_cta_rate, 2),
            "like_rate": round(like_rate, 2),
            "detail_open_rate": round(detail_open_rate, 2),
            "completion_rate": conversion_rate,
            "avg_dwell_seconds": avg_dwell_seconds,
            "avg_clicks_per_user": round(avg_clicks_per_user, 2),
            "friction_step_rate": round(friction_step_rate, 2),
        },
        "friction_counts": dict(sorted(friction_counts.items())),
        "segments_run": sorted({trace.get("segment", "unknown") for trace in traces}),
    }


def clamp_score(value: float) -> int:
    return max(1, min(10, int(round(value))))


def parse_json_message(raw: str) -> Dict[str, Any]:
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        stripped = raw.strip()
        if stripped.startswith("```"):
            lines = stripped.splitlines()
            if lines[0].startswith("```") and lines[-1] == "```":
                return json.loads("\n".join(lines[1:-1]))
        raise


def tail(text: str, limit: int = 4000) -> str:
    if len(text) <= limit:
        return text
    return text[-limit:]


def print_json_section(title: str, payload: Any) -> None:
    print(f"\n=== {title} ===")
    print(json.dumps(payload, ensure_ascii=False, indent=2))


def print_readable_summary(summary: Dict[str, Any]) -> None:
    print("\n=== READABLE_SUMMARY ===")
    metrics = summary["metrics"]
    print(
        "Ran {run_count} synthetic users; success rate={success}; avg steps={steps}.".format(
            run_count=metrics["run_count"],
            success=metrics["task_success_rate"],
            steps=metrics["avg_steps"],
        )
    )
    print("Average scores:", json.dumps(metrics["avg_scores"], ensure_ascii=False))
    print("\nTop findings:")
    for finding in summary["top_findings"]:
        print(
            "- [{severity}] {theme}: {affected} users. {suggestion}".format(
                severity=finding["severity"],
                theme=finding["theme"],
                affected=finding["affected_users"],
                suggestion=finding["suggestion"],
            )
        )
    print("\nDemo readout:")
    print(summary["demo_readout"])


def rule_based_traces(
    page_model: AirbnbPageModel,
    profiles: Sequence[Dict[str, Any]],
    variant: str,
    source: str,
) -> List[Dict[str, Any]]:
    runner = SyntheticRunner(page_model)
    traces = []
    for profile in profiles:
        trace = runner.run(profile)
        trace["variant"] = variant
        trace["trace_source"] = source
        trace["task_seconds"] = int(sum(step_item.get("elapsed_seconds", 0) for step_item in trace["steps"]))
        trace["converted"] = bool(trace["final_feedback"].get("task_success"))
        trace["dropoff"] = not trace["converted"]
        scores = trace["final_feedback"].get("scores", {})
        trace["satisfaction"] = round(
            max(1.0, min(5.0, ((scores.get("ease_of_search", 5) + scores.get("trust", 5)) / 2) / 2)),
            1,
        )
        traces.append(trace)
    return traces


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate Airbnb synthetic users and behavior traces using Codex CLI."
    )
    parser.add_argument("--url", default="https://www.airbnb.com", help="App URL to model.")
    parser.add_argument("--variant", default="B", help="Variant label for generated traces.")
    parser.add_argument("--profiles", type=int, default=20, help="Number of profiles to generate.")
    parser.add_argument("--runs", type=int, default=5, help="Number of profiles to run.")
    parser.add_argument(
        "--profile-mode",
        choices=["rule", "lm"],
        default="rule",
        help="Use deterministic profiles or LM-generated profiles.",
    )
    parser.add_argument(
        "--trace-mode",
        choices=["rule", "lm"],
        default="rule",
        help="Use LM-generated traces or deterministic UI-specific fallback traces.",
    )
    parser.add_argument(
        "--trace-batch-size",
        type=int,
        default=3,
        help="Number of synthetic users per LM trace batch.",
    )
    parser.add_argument(
        "--summary-mode",
        choices=["rule", "lm"],
        default="rule",
        help="Use deterministic summary metrics or an LM-generated feedback summary.",
    )
    parser.add_argument("--codex-cmd", default="codex", help="Codex CLI command path.")
    parser.add_argument(
        "--snapshot-live-page",
        action="store_true",
        help="Deprecated compatibility flag. Browser observation now runs by default.",
    )
    parser.add_argument(
        "--no-browser-observe",
        action="store_true",
        help="Skip browser observation and use the built-in page model unless --snapshot-live-page is set.",
    )
    parser.add_argument(
        "--browser-timeout",
        type=int,
        default=15000,
        help="Timeout in milliseconds for browser page observation.",
    )
    parser.add_argument(
        "--codex-timeout",
        type=int,
        default=240,
        help="Timeout in seconds for each Codex CLI call.",
    )
    parser.add_argument("--model", default=None, help="Optional Codex model override.")
    return parser


def main(argv: Sequence[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    if args.profiles < len(SEGMENTS):
        parser.error(f"--profiles must be at least {len(SEGMENTS)} to cover all segments.")
    if args.runs < 1:
        parser.error("--runs must be at least 1.")

    cwd = Path(__file__).resolve().parent
    if args.no_browser_observe:
        live_snapshot = fetch_live_snapshot(args.url) if args.snapshot_live_page else None
    else:
        live_snapshot = observe_page_context(args.url, cwd, args.browser_timeout)
    page_model = AirbnbPageModel(url=args.url, live_snapshot=live_snapshot)
    codex = CodexClient(
        cwd=cwd,
        codex_cmd=args.codex_cmd,
        timeout_seconds=args.codex_timeout,
        model=args.model,
    )

    try:
        if args.profile_mode == "lm":
            generator = SyntheticUserGenerator(codex, page_model)
            try:
                profiles = generator.generate(args.profiles)
            except DemoError as exc:
                print(f"WARN: LM profile generation failed; using deterministic profiles: {exc}", file=sys.stderr)
                profiles = rule_based_profiles(args.profiles)
        else:
            profiles = rule_based_profiles(args.profiles)
        run_profiles = select_profiles_for_runs(profiles, min(args.runs, len(profiles)))

        if args.trace_mode == "lm":
            try:
                trace_generator = SyntheticTraceGenerator(
                    codex, page_model, args.variant, args.trace_batch_size
                )
                traces = trace_generator.generate(run_profiles)
            except DemoError as exc:
                print(f"WARN: LM trace generation failed; using rule-based fallback: {exc}", file=sys.stderr)
                traces = rule_based_traces(page_model, run_profiles, args.variant, "rule_fallback")
        else:
            traces = rule_based_traces(page_model, run_profiles, args.variant, "rule_ui_specific")

        if args.summary_mode == "lm":
            summarizer = FeedbackSummarizer(codex)
            summary = summarizer.summarize(profiles, traces)
        else:
            metrics = compute_metrics(traces)
            summary = local_feedback_summary(profiles, traces, metrics)
            summary["metrics"] = metrics

        print_json_section("1) GENERATED_SYNTHETIC_USERS_JSON", {"profiles": profiles})
        print_json_section(
            "2) SYNTHETIC_USER_BEHAVIOR_TRACES_JSON",
            {"page_context": page_model.live_snapshot, "traces": traces},
        )
        print_json_section("3) SYNTHETIC_FEEDBACK_SUMMARY_JSON", summary)
        print_readable_summary(summary)
        return 0
    except DemoError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
