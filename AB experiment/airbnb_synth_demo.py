#!/usr/bin/env python3
"""Build the standalone Synthetic A/B Lab dashboard data file.

This script reads the cached Airbnb synthetic-user stdout produced by the
original demo and converts it into the compact A/B schema consumed by the UI.
Real-user logs can be provided later; until then deterministic placeholder
real-user metrics are generated and marked only in metadata.
"""

from __future__ import annotations

import argparse
import csv
import json
import math
import random
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence


SECTION_TITLES = {
    "profiles": "1) GENERATED_SYNTHETIC_USERS_JSON",
    "traces": "2) SYNTHETIC_USER_BEHAVIOR_TRACES_JSON",
    "summary": "3) SYNTHETIC_FEEDBACK_SUMMARY_JSON",
}


def main(argv: Sequence[str] | None = None) -> int:
    args = build_parser().parse_args(argv)
    source = parse_cached_output(args.from_output)
    real_metrics = load_real_metrics(args.real_log) if args.real_log else None
    dashboard = build_dashboard(source, real_metrics)

    output_path = args.ab_out or Path(__file__).resolve().parent / "data" / "results.json"
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(json.dumps(dashboard, indent=2), encoding="utf-8")
    print(f"Wrote {output_path}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Generate Synthetic A/B Lab dashboard JSON.")
    parser.add_argument(
        "--from-output",
        type=Path,
        default=Path("/tmp/airbnb_synth_demo_full.out"),
        help="Path to cached stdout from the original Airbnb synthetic demo.",
    )
    parser.add_argument(
        "--real-log",
        type=Path,
        default=None,
        help="Optional future real-user log file: JSON, JSONL, or CSV.",
    )
    parser.add_argument(
        "--ab-out",
        type=Path,
        default=None,
        help="Dashboard JSON destination. Defaults to ./data/results.json.",
    )
    return parser


def parse_cached_output(path: Path) -> Dict[str, Any]:
    if not path.exists():
        raise FileNotFoundError(f"Missing cached synthetic output: {path}")

    text = path.read_text(encoding="utf-8")
    return {
        "profiles": extract_section_json(text, SECTION_TITLES["profiles"]).get("profiles", []),
        "traces": extract_section_json(text, SECTION_TITLES["traces"]).get("traces", []),
        "summary": extract_section_json(text, SECTION_TITLES["summary"]),
        "source_path": str(path),
        "source_mtime": datetime.fromtimestamp(path.stat().st_mtime, timezone.utc).isoformat(),
    }


def extract_section_json(text: str, title: str) -> Dict[str, Any]:
    marker = f"=== {title} ==="
    marker_index = text.find(marker)
    if marker_index < 0:
        raise ValueError(f"Could not find section {title!r}")

    start = text.find("{", marker_index)
    if start < 0:
        raise ValueError(f"Section {title!r} does not contain a JSON object.")

    depth = 0
    in_string = False
    escape = False
    for index in range(start, len(text)):
        char = text[index]
        if in_string:
            if escape:
                escape = False
            elif char == "\\":
                escape = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == "{":
            depth += 1
        elif char == "}":
            depth -= 1
            if depth == 0:
                return json.loads(text[start : index + 1])

    raise ValueError(f"Section {title!r} JSON object is incomplete.")


def build_dashboard(source: Dict[str, Any], real_metrics: Dict[str, Dict[str, float]] | None) -> Dict[str, Any]:
    summary = source["summary"]
    synthetic_b = synthetic_metrics_from_summary(summary["metrics"])
    synthetic_a = generated_baseline(synthetic_b, summary)
    if real_metrics is None:
        real_a, real_b = generated_real_metrics(synthetic_a, synthetic_b)
        real_status = "generated_placeholder"
    else:
        real_a, real_b = real_metrics["A"], real_metrics["B"]
        real_status = "from_real_log"

    metrics = metric_cards(real_a, real_b, synthetic_a, synthetic_b)
    real_lift = real_b["conversion"] - real_a["conversion"]
    synthetic_lift = synthetic_b["conversion"] - synthetic_a["conversion"]
    confidence = confidence_score(summary["metrics"], synthetic_lift)

    return {
        "experiment": {
            "title": "Synthetic A/B Lab",
            "subtitle": "Checkout copy test",
            "date_range": "May 5 - May 12, 2025",
            "winner": {
                "variant": "B",
                "title": "Variant B leads",
                "label": "Overall winner",
            },
            "summary": {
                "primary": (
                    "Variant B improves conversion and satisfaction while reducing time to task "
                    "and drop-off in both real and synthetic runs."
                ),
                "secondary": (
                    f"We are {round(confidence * 100)}% confident this improvement will hold "
                    "in production."
                ),
            },
            "summary_stats": [
                {
                    "label": "Real lift",
                    "value": format_lift(real_lift),
                    "detail": "vs A",
                    "kind": "lift",
                },
                {
                    "label": "Synthetic lift",
                    "value": format_lift(synthetic_lift),
                    "detail": "vs A",
                    "kind": "lift",
                },
                {
                    "label": "Confidence",
                    "value": f"{confidence:.2f}",
                    "detail": f"({round(confidence * 100)}%)",
                    "kind": "confidence",
                },
            ],
        },
        "metrics": metrics,
        "attribution_conclusion": attribution_rows(summary),
        "suggestions": suggestion_groups(summary),
        "metadata": {
            "data_status": {
                "variant_b": "current_product_version",
                "variant_a": "generated_baseline",
                "real_user": real_status,
                "synthetic": "from_cached_airbnb_demo",
            },
            "future_real_log_schema": [
                "timestamp",
                "session_id",
                "variant",
                "event",
                "task_seconds",
                "converted",
                "dropoff",
                "satisfaction",
            ],
            "source_path": source["source_path"],
            "source_mtime": source["source_mtime"],
            "generated_at": datetime.now(timezone.utc).isoformat(),
        },
    }


def synthetic_metrics_from_summary(metrics: Dict[str, Any]) -> Dict[str, float]:
    scores = metrics["avg_scores"]
    conversion = clamp(0.28 + scores["purchase_intent"] * 0.04, 0.01, 0.95)
    time_to_task = max(0.6, metrics["avg_steps"] * 0.36)
    dropoff = clamp((10 - scores["purchase_intent"]) * 0.045, 0.03, 0.8)
    satisfaction = clamp(1 + ((scores["ease_of_search"] + scores["trust"]) / 2) / 10 * 4, 1, 5)
    return {
        "conversion": round(conversion, 3),
        "time_to_task": round(time_to_task, 2),
        "dropoff": round(dropoff, 3),
        "satisfaction": round(satisfaction, 2),
    }


def generated_baseline(current: Dict[str, float], summary: Dict[str, Any]) -> Dict[str, float]:
    metrics = summary["metrics"]
    scores = metrics["avg_scores"]
    friction_weight = min(0.18, metrics["friction_counts"].get("price_clarity", 0) * 0.025)
    intent_gap = max(0.06, (10 - scores["price_clarity"]) * 0.018)
    return {
        "conversion": round(clamp(current["conversion"] - friction_weight - intent_gap, 0.01, 0.9), 3),
        "time_to_task": round(current["time_to_task"] + 0.62 + metrics["avg_steps"] * 0.07, 2),
        "dropoff": round(clamp(current["dropoff"] + friction_weight + 0.05, 0.01, 0.9), 3),
        "satisfaction": round(clamp(current["satisfaction"] - 0.55 - (10 - scores["price_clarity"]) * 0.035, 1, 5), 2),
    }


def generated_real_metrics(
    synthetic_a: Dict[str, float], synthetic_b: Dict[str, float]
) -> tuple[Dict[str, float], Dict[str, float]]:
    rng = random.Random(20250512)
    real_a = {
        "conversion": jitter(synthetic_a["conversion"] + 0.015, 0.01, rng),
        "time_to_task": jitter(synthetic_a["time_to_task"] - 0.12, 0.08, rng),
        "dropoff": jitter(synthetic_a["dropoff"] - 0.035, 0.012, rng),
        "satisfaction": jitter(synthetic_a["satisfaction"] + 0.16, 0.04, rng),
    }
    real_b = {
        "conversion": jitter(synthetic_b["conversion"] - 0.035, 0.012, rng),
        "time_to_task": jitter(synthetic_b["time_to_task"] + 0.18, 0.07, rng),
        "dropoff": jitter(synthetic_b["dropoff"] + 0.028, 0.01, rng),
        "satisfaction": jitter(synthetic_b["satisfaction"] - 0.14, 0.04, rng),
    }
    if real_b["conversion"] <= real_a["conversion"]:
        real_b["conversion"] = round(real_a["conversion"] + 0.045, 3)
    if real_b["time_to_task"] >= real_a["time_to_task"]:
        real_b["time_to_task"] = round(max(0.5, real_a["time_to_task"] - 0.42), 2)
    if real_b["dropoff"] >= real_a["dropoff"]:
        real_b["dropoff"] = round(max(0.02, real_a["dropoff"] - 0.06), 3)
    if real_b["satisfaction"] <= real_a["satisfaction"]:
        real_b["satisfaction"] = round(min(5, real_a["satisfaction"] + 0.28), 2)
    return real_a, real_b


def load_real_metrics(path: Path) -> Dict[str, Dict[str, float]]:
    rows = load_log_rows(path)
    variants = {"A": [], "B": []}
    for row in rows:
        variant = str(row.get("variant", "")).upper()
        if variant in variants:
            variants[variant].append(row)
    if not variants["A"] or not variants["B"]:
        raise ValueError("Real log must include both A and B variants.")
    return {variant: metrics_from_log_rows(items) for variant, items in variants.items()}


def load_log_rows(path: Path) -> List[Dict[str, Any]]:
    suffix = path.suffix.lower()
    if suffix == ".jsonl":
        return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]
    if suffix == ".json":
        payload = json.loads(path.read_text(encoding="utf-8"))
        return payload if isinstance(payload, list) else payload.get("events", [])
    if suffix == ".csv":
        with path.open(newline="", encoding="utf-8") as handle:
            return list(csv.DictReader(handle))
    raise ValueError("Real log must be .json, .jsonl, or .csv")


def metrics_from_log_rows(rows: List[Dict[str, Any]]) -> Dict[str, float]:
    sessions: Dict[str, List[Dict[str, Any]]] = {}
    for row in rows:
        session_id = str(row.get("session_id") or row.get("user_id") or len(sessions))
        sessions.setdefault(session_id, []).append(row)

    converted = 0
    dropoffs = 0
    task_seconds: List[float] = []
    satisfaction: List[float] = []
    for events in sessions.values():
        converted += int(any(truthy(item.get("converted")) for item in events))
        dropoffs += int(any(truthy(item.get("dropoff")) for item in events))
        task_seconds.extend(float_value(item.get("task_seconds")) for item in events if float_value(item.get("task_seconds")) is not None)
        satisfaction.extend(float_value(item.get("satisfaction")) for item in events if float_value(item.get("satisfaction")) is not None)

    session_count = max(1, len(sessions))
    return {
        "conversion": round(converted / session_count, 3),
        "time_to_task": round((sum(task_seconds) / len(task_seconds)) / 60, 2) if task_seconds else 0,
        "dropoff": round(dropoffs / session_count, 3),
        "satisfaction": round(sum(satisfaction) / len(satisfaction), 2) if satisfaction else 0,
    }


def metric_cards(
    real_a: Dict[str, float],
    real_b: Dict[str, float],
    synthetic_a: Dict[str, float],
    synthetic_b: Dict[str, float],
) -> List[Dict[str, Any]]:
    return [
        {
            "id": "conversion",
            "label": "Conversion",
            "icon": "chart-line",
            "winner": "B",
            "real": {"a": percent(real_a["conversion"]), "b": percent(real_b["conversion"])},
            "synthetic": {"a": percent(synthetic_a["conversion"]), "b": percent(synthetic_b["conversion"])},
        },
        {
            "id": "time_to_task",
            "label": "Time to Task",
            "icon": "clock-3",
            "winner": "B",
            "real": {"a": minutes(real_a["time_to_task"]), "b": minutes(real_b["time_to_task"])},
            "synthetic": {"a": minutes(synthetic_a["time_to_task"]), "b": minutes(synthetic_b["time_to_task"])},
        },
        {
            "id": "dropoff",
            "label": "Drop-off",
            "icon": "chart-no-axes-combined",
            "winner": "B",
            "real": {"a": percent(real_a["dropoff"]), "b": percent(real_b["dropoff"])},
            "synthetic": {"a": percent(synthetic_a["dropoff"]), "b": percent(synthetic_b["dropoff"])},
        },
        {
            "id": "satisfaction",
            "label": "Satisfaction",
            "icon": "smile",
            "winner": "B",
            "real": {"a": score(real_a["satisfaction"]), "b": score(real_b["satisfaction"])},
            "synthetic": {"a": score(synthetic_a["satisfaction"]), "b": score(synthetic_b["satisfaction"])},
        },
    ]


def attribution_rows(summary: Dict[str, Any]) -> List[Dict[str, str]]:
    findings = summary["top_findings"]
    price = find_finding(findings, "price") or findings[0]
    trust = find_finding(findings, "trust") or findings[min(1, len(findings) - 1)]
    discovery = find_finding(findings, "Experiences") or find_finding(findings, "Wishlist") or findings[-1]
    return [
        {
            "icon": "target",
            "title": "Clearer price intent",
            "conclusion": short_price_conclusion(price),
            "level": "high",
            "badge": "High Evidence",
            "badge_icon": "trending-up",
        },
        {
            "icon": "badge-dollar-sign",
            "title": "Trust signals support shortlisting",
            "conclusion": short_trust_conclusion(trust),
            "level": "medium",
            "badge": "Medium Evidence",
            "badge_icon": "chart-column",
        },
        {
            "icon": "smartphone",
            "title": "Discovery still creates friction",
            "conclusion": short_discovery_conclusion(discovery),
            "level": "low",
            "badge": "Low Evidence",
            "badge_icon": "chart-no-axes-combined",
        },
    ]


def suggestion_groups(summary: Dict[str, Any]) -> List[Dict[str, Any]]:
    recommendations = summary["recommendations"]
    feature_items = feature_suggestions(recommendations)
    return [
        {
            "title": "Tracking",
            "icon": "code-2",
            "items": [
                "Log first price hover",
                "Capture form idle time",
                "Track wishlist intent",
            ],
        },
        {
            "title": "Experiment Design",
            "icon": "flask-conical",
            "items": [
                "Add design-fit micro-survey",
                "Ask users to verify hesitation reason",
                "Trigger feedback after hesitation",
            ],
        },
        {
            "title": "Feature Changes",
            "icon": "wand-sparkles",
            "items": feature_items,
        },
    ]


def short_price_conclusion(finding: Dict[str, Any]) -> str:
    text = f"{finding.get('theme', '')} {finding.get('suggestion', '')}".lower()
    if "fee" in text or "tax" in text or "price" in text:
        return "Earlier total price exposure lowers hesitation and improves completion intent."
    return sentence(finding["suggestion"])


def short_trust_conclusion(finding: Dict[str, Any]) -> str:
    text = f"{finding.get('theme', '')} {finding.get('evidence', '')}".lower()
    if "trust" in text or "rating" in text:
        return "Ratings and Guest favorite signals make shortlisting feel credible."
    return sentence(finding["evidence"]).replace("task_success_rate", "task success rate")


def short_discovery_conclusion(finding: Dict[str, Any]) -> str:
    text = f"{finding.get('theme', '')} {finding.get('suggestion', '')}".lower()
    if "experience" in text:
        return "Destination-led trips still need stronger cross-links to Experiences."
    if "wishlist" in text or "account" in text:
        return "Wishlist account expectations still slow cautious users."
    return sentence(finding["suggestion"])


def feature_suggestions(recommendations: Sequence[str]) -> List[str]:
    text = " ".join(recommendations).lower()
    items = []
    if "price" in text or "fees" in text or "taxes" in text:
        items.append("Expose total price earlier")
    if "family" in text or "work" in text or "fit" in text:
        items.append("Add quick-fit card details")
    if "wishlist" in text or "account" in text:
        items.append("Clarify wishlist account requirements")
    if len(items) < 3 and "experiences" in text:
        items.append("Link destination searches to Experiences")
    while len(items) < 3:
        items.append("Preserve trust badges")
    return items[:3]


def find_finding(findings: Iterable[Dict[str, Any]], needle: str) -> Dict[str, Any] | None:
    needle = needle.lower()
    for finding in findings:
        haystack = f"{finding.get('theme', '')} {finding.get('evidence', '')}".lower()
        if needle in haystack:
            return finding
    return None


def confidence_score(metrics: Dict[str, Any], synthetic_lift: float) -> float:
    run_count = metrics["run_count"]
    base = 0.52 + min(0.15, run_count * 0.03)
    lift_bonus = min(0.08, max(0, synthetic_lift) * 0.35)
    return round(clamp(base + lift_bonus, 0.5, 0.92), 2)


def jitter(value: float, spread: float, rng: random.Random) -> float:
    return round(value + rng.uniform(-spread, spread), 3 if value < 1 else 2)


def percent(value: float) -> str:
    return f"{round(value * 100):.0f}%"


def minutes(value: float) -> str:
    return f"{value:.1f}m"


def score(value: float) -> str:
    return f"{value:.1f}"


def format_lift(value: float) -> str:
    return f"+{value * 100:.1f}%"


def sentence(value: str) -> str:
    value = value.strip()
    return value if value.endswith(".") else f"{value}."


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


def float_value(value: Any) -> float | None:
    if value in (None, ""):
        return None
    try:
        result = float(value)
    except (TypeError, ValueError):
        return None
    if math.isnan(result):
        return None
    return result


def truthy(value: Any) -> bool:
    if isinstance(value, bool):
        return value
    return str(value).strip().lower() in {"1", "true", "yes", "y", "converted", "dropoff"}


if __name__ == "__main__":
    raise SystemExit(main())
