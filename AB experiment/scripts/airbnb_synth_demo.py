#!/usr/bin/env python3
"""Reproducible Airbnb synthetic-user demo powered by Codex CLI."""

from __future__ import annotations

import argparse
import json
import math
import shutil
import subprocess
import sys
import tempfile
from dataclasses import dataclass
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence


SEGMENTS = [
    "budget_weekend_couple",
    "family_planner",
    "remote_worker_business_traveler",
    "experience_seeker",
    "first_time_cautious_user",
]


class DemoError(Exception):
    """Raised when the demo cannot safely produce the requested output."""


@dataclass(frozen=True)
class AirbnbPageModel:
    url: str

    def to_dict(self) -> Dict[str, Any]:
        return {
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


class SyntheticRunner:
    def __init__(self, page_model: AirbnbPageModel) -> None:
        self.page_model = page_model

    def run(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        segment = profile["segment"]
        constraints = profile["constraints"]
        destination = constraints["destination"]
        guests = constraints["guests"]
        style = profile["behavior_style"]

        if segment == "experience_seeker":
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

        if segment == "experience_seeker":
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
        summary = self.codex.generate_json(
            prompt, summary_output_schema(len(traces)), "feedback summarization"
        )
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
) -> Dict[str, Any]:
    return {
        "step": number,
        "observation": observation,
        "persona_thought": thought,
        "intent": intent,
        "action": action,
        "target_ui": target_ui,
        "expected_result": expected_result,
        "friction": round(float(friction), 2),
    }


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


def validate_trace_safety(trace: Dict[str, Any]) -> None:
    unsafe_action_terms = [
        "log in",
        "login",
        "reserve",
        "payment",
        "message host",
        "submit personal",
    ]
    for item in trace["steps"]:
        action = item["action"].lower()
        if any(term in action for term in unsafe_action_terms):
            raise DemoError(
                f"Unsafe action found in trace for {trace['persona_id']}: {item['action']}"
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


def compute_metrics(traces: List[Dict[str, Any]]) -> Dict[str, Any]:
    run_count = len(traces)
    if run_count == 0:
        raise DemoError("Cannot summarize zero traces.")

    score_keys = ["ease_of_search", "price_clarity", "trust", "purchase_intent"]
    avg_scores = {
        key: round(
            sum(trace["final_feedback"]["scores"][key] for trace in traces) / run_count, 2
        )
        for key in score_keys
    }
    friction_counts: Dict[str, int] = {}
    for trace in traces:
        for theme in trace["final_feedback"].get("friction_themes", []):
            friction_counts[theme] = friction_counts.get(theme, 0) + 1

    return {
        "run_count": run_count,
        "task_success_rate": round(
            sum(1 for trace in traces if trace["final_feedback"]["task_success"]) / run_count,
            2,
        ),
        "avg_steps": round(sum(len(trace["steps"]) for trace in traces) / run_count, 2),
        "avg_scores": avg_scores,
        "friction_counts": dict(sorted(friction_counts.items())),
        "segments_run": sorted({trace["segment"] for trace in traces}),
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


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Generate Airbnb synthetic users and behavior traces using Codex CLI."
    )
    parser.add_argument("--url", default="https://www.airbnb.com", help="App URL to model.")
    parser.add_argument("--profiles", type=int, default=20, help="Number of profiles to generate.")
    parser.add_argument("--runs", type=int, default=5, help="Number of profiles to run.")
    parser.add_argument("--codex-cmd", default="codex", help="Codex CLI command path.")
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
    page_model = AirbnbPageModel(url=args.url)
    codex = CodexClient(
        cwd=cwd,
        codex_cmd=args.codex_cmd,
        timeout_seconds=args.codex_timeout,
        model=args.model,
    )

    try:
        generator = SyntheticUserGenerator(codex, page_model)
        profiles = generator.generate(args.profiles)
        run_profiles = select_profiles_for_runs(profiles, min(args.runs, len(profiles)))

        runner = SyntheticRunner(page_model)
        traces = [runner.run(profile) for profile in run_profiles]

        summarizer = FeedbackSummarizer(codex)
        summary = summarizer.summarize(profiles, traces)

        print_json_section("1) GENERATED_SYNTHETIC_USERS_JSON", {"profiles": profiles})
        print_json_section("2) SYNTHETIC_USER_BEHAVIOR_TRACES_JSON", {"traces": traces})
        print_json_section("3) SYNTHETIC_FEEDBACK_SUMMARY_JSON", summary)
        print_readable_summary(summary)
        return 0
    except DemoError as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    raise SystemExit(main())
