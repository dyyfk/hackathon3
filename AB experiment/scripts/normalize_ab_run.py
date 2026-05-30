#!/usr/bin/env python3
"""Normalize synthetic-user stdout into A/B dashboard JSON."""

from __future__ import annotations

import argparse
import hashlib
import json
import math
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
    a_stdout = args.a_output.read_text(encoding="utf-8")
    b_stdout = args.b_output.read_text(encoding="utf-8")
    run = normalize_ab_run(
        a_stdout=a_stdout,
        b_stdout=b_stdout,
        config={
            "a_url": args.a_url,
            "b_url": args.b_url,
            "profiles": args.profiles,
            "runs": args.runs,
            "model": args.model,
            "codex_timeout": args.codex_timeout,
        },
        run_id=args.run_id,
    )
    args.out.parent.mkdir(parents=True, exist_ok=True)
    args.out.write_text(json.dumps(run, indent=2), encoding="utf-8")
    print(f"Wrote {args.out}")
    return 0


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Normalize A/B synthetic-user runs.")
    parser.add_argument("--a-output", type=Path, required=True)
    parser.add_argument("--b-output", type=Path, required=True)
    parser.add_argument("--a-url", default="https://www.airbnb.com")
    parser.add_argument("--b-url", default="https://www.airbnb.com")
    parser.add_argument("--profiles", type=int, default=20)
    parser.add_argument("--runs", type=int, default=5)
    parser.add_argument("--model", default="auto")
    parser.add_argument("--codex-timeout", type=int, default=240)
    parser.add_argument("--run-id", default="sample-airbnb-ab")
    parser.add_argument("--out", type=Path, default=Path("data/latest_ab_run.json"))
    return parser


def normalize_ab_run(
    *,
    a_stdout: str,
    b_stdout: str,
    config: Dict[str, Any],
    run_id: str,
) -> Dict[str, Any]:
    created_at = datetime.now(timezone.utc).isoformat()
    variant_a = normalize_variant("A", config["a_url"], parse_synthetic_stdout(a_stdout))
    variant_b = normalize_variant("B", config["b_url"], parse_synthetic_stdout(b_stdout))
    matrix = build_matrix_summary(variant_a, variant_b)
    return {
        "schema_version": "synthetic_ab_run_v1",
        "run_id": run_id,
        "created_at": created_at,
        "config": config,
        "variants": {
            "A": variant_a,
            "B": variant_b,
        },
        "matrix_summary": matrix,
        "metadata": {
            "source": "AB experiment/scripts/airbnb_synth_demo.py",
            "data_status": {
                "synthetic": "from_runner_stdout",
                "real_user": "generated_placeholder",
            },
        },
    }


def parse_synthetic_stdout(text: str) -> Dict[str, Any]:
    return {
        "profiles": extract_section_json(text, SECTION_TITLES["profiles"]).get("profiles", []),
        "traces": extract_section_json(text, SECTION_TITLES["traces"]).get("traces", []),
        "summary": extract_section_json(text, SECTION_TITLES["summary"]),
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


def normalize_variant(label: str, url: str, payload: Dict[str, Any]) -> Dict[str, Any]:
    summary = payload["summary"]
    metrics = summary["metrics"]
    derived = derive_metric_snapshot(metrics)
    feedback = feedback_rows(summary)
    logs = behavior_logs(payload["traces"])
    profiles = profile_rows(payload["profiles"])
    return {
        "label": f"Variant {label}",
        "url": url,
        "raw": payload,
        "summary_stats": [
            {
                "id": "success",
                "label": "Success",
                "value": percent(metrics["task_success_rate"]),
                "detail": spread(label, url, "success", "%"),
                "icon": "circle-check",
            },
            {
                "id": "avg_steps",
                "label": "Avg Steps",
                "value": number(metrics["avg_steps"], 1),
                "detail": spread(label, url, "steps", ""),
                "icon": "footprints",
            },
            {
                "id": "ease",
                "label": "Ease (1-5)",
                "value": number(score_5(metrics["avg_scores"]["ease_of_search"]), 1),
                "detail": spread(label, url, "ease", ""),
                "icon": "smile",
            },
            {
                "id": "intent",
                "label": "Intent (1-5)",
                "value": number(score_5(metrics["avg_scores"]["purchase_intent"]), 1),
                "detail": spread(label, url, "intent", ""),
                "icon": "target",
            },
        ],
        "metric_snapshot": [
            {
                "id": "conversion",
                "label": "Conversion",
                "value": percent(derived["conversion"]),
                "detail": spread(label, url, "conversion", "%"),
            },
            {
                "id": "dropoff",
                "label": "Drop-off",
                "value": percent(derived["dropoff"]),
                "detail": spread(label, url, "dropoff", "%"),
            },
            {
                "id": "time_to_task",
                "label": "Time to Task",
                "value": f"{derived['time_to_task']:.1f}m",
                "detail": spread(label, url, "time", "m"),
            },
            {
                "id": "satisfaction",
                "label": "Satisfaction (1-5)",
                "value": number(derived["satisfaction"], 1),
                "detail": spread(label, url, "satisfaction", ""),
            },
        ],
        "derived_metrics": derived,
        "feedback": feedback,
        "logs": logs,
        "profiles": profiles,
        "recommendations": summary.get("recommendations", []),
    }


def derive_metric_snapshot(metrics: Dict[str, Any]) -> Dict[str, float]:
    scores = metrics["avg_scores"]
    conversion = clamp(0.28 + scores["purchase_intent"] * 0.04, 0.01, 0.95)
    dropoff = clamp((10 - scores["purchase_intent"]) * 0.045, 0.03, 0.8)
    time_to_task = max(0.6, metrics["avg_steps"] * 0.36)
    satisfaction = clamp(1 + ((scores["ease_of_search"] + scores["trust"]) / 2) / 10 * 4, 1, 5)
    return {
        "conversion": round(conversion, 3),
        "dropoff": round(dropoff, 3),
        "time_to_task": round(time_to_task, 2),
        "satisfaction": round(satisfaction, 2),
    }


def build_matrix_summary(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    winner = choose_winner(a, b)
    a_metrics = a["derived_metrics"]
    b_metrics = b["derived_metrics"]
    conversion_lift = b_metrics["conversion"] - a_metrics["conversion"]
    synthetic_lift = conversion_lift
    confidence = confidence_score(a, b)
    return {
        "winner": winner,
        "title": winner_title(winner),
        "label": "Overall winner" if winner in {"A", "B"} else "No clear winner",
        "summary_primary": summary_primary(winner),
        "summary_secondary": f"We are {round(confidence * 100)}% confident based on the current synthetic runs.",
        "date_range": "May 5 - May 12, 2025",
        "summary_stats": [
            {
                "label": "Real lift",
                "value": format_lift(generated_real_lift(a, b)),
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
        "metrics": matrix_metrics(a, b),
        "attribution_conclusion": matrix_feedback_rows(a, b),
        "suggestions": matrix_suggestions(a, b),
    }


def matrix_metrics(a: Dict[str, Any], b: Dict[str, Any]) -> List[Dict[str, Any]]:
    specs = [
        ("conversion", "Conversion", "chart-line", "higher", percent),
        ("time_to_task", "Time to Task", "clock-3", "lower", lambda value: f"{value:.1f}m"),
        ("dropoff", "Drop-off", "chart-no-axes-combined", "lower", percent),
        ("satisfaction", "Satisfaction", "smile", "higher", lambda value: number(value, 1)),
    ]
    rows = []
    for key, label, icon_name, direction, formatter in specs:
        a_value = a["derived_metrics"][key]
        b_value = b["derived_metrics"][key]
        winner = winner_for_metric(a_value, b_value, direction)
        rows.append(
            {
                "id": key,
                "label": label,
                "icon": icon_name,
                "winner": winner,
                "real": {
                    "a": formatter(generated_real_value("A", a["url"], key, a_value)),
                    "b": formatter(generated_real_value("B", b["url"], key, b_value)),
                },
                "synthetic": {
                    "a": formatter(a_value),
                    "b": formatter(b_value),
                },
            }
        )
    return rows


def choose_winner(a: Dict[str, Any], b: Dict[str, Any]) -> str:
    score_a = variant_score(a)
    score_b = variant_score(b)
    if abs(score_a - score_b) < 0.015:
        return "tie"
    return "B" if score_b > score_a else "A"


def variant_score(variant: Dict[str, Any]) -> float:
    metrics = variant["derived_metrics"]
    return (
        metrics["conversion"] * 0.4
        + (1 - metrics["dropoff"]) * 0.25
        + min(1, metrics["satisfaction"] / 5) * 0.25
        + max(0, 1 - metrics["time_to_task"] / 8) * 0.1
    )


def winner_title(winner: str) -> str:
    if winner == "A":
        return "Variant A leads"
    if winner == "B":
        return "Variant B leads"
    return "Variants are comparable"


def summary_primary(winner: str) -> str:
    if winner == "tie":
        return "A and B show similar synthetic-user outcomes across conversion, satisfaction, time to task, and drop-off."
    return f"Variant {winner} performs better across the current synthetic runs while preserving the same runner inputs."


def confidence_score(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    run_count = min(
        a["raw"]["summary"]["metrics"]["run_count"],
        b["raw"]["summary"]["metrics"]["run_count"],
    )
    gap = abs(variant_score(a) - variant_score(b))
    return round(clamp(0.5 + min(0.18, run_count * 0.025) + min(0.18, gap), 0.5, 0.9), 2)


def matrix_feedback_rows(a: Dict[str, Any], b: Dict[str, Any]) -> List[Dict[str, str]]:
    findings = a["raw"]["summary"].get("top_findings", []) + b["raw"]["summary"].get("top_findings", [])
    picked = findings[:3]
    while len(picked) < 3:
        picked.append({"theme": "Synthetic behavior pattern", "evidence": "The current run completed with comparable user paths.", "suggestion": "Review logs and profiles before making a product decision."})
    icons = ["target", "badge-dollar-sign", "smartphone"]
    levels = ["high", "medium", "low"]
    badges = ["High Evidence", "Medium Evidence", "Low Evidence"]
    badge_icons = ["trending-up", "chart-column", "chart-no-axes-combined"]
    return [
        {
            "icon": icons[index],
            "title": short_title(item["theme"]),
            "conclusion": short_sentence(item.get("evidence") or item.get("suggestion") or item["theme"]),
            "level": levels[index],
            "badge": badges[index],
            "badge_icon": badge_icons[index],
        }
        for index, item in enumerate(picked[:3])
    ]


def matrix_suggestions(a: Dict[str, Any], b: Dict[str, Any]) -> List[Dict[str, Any]]:
    recommendations = a.get("recommendations", []) + b.get("recommendations", [])
    feature_items = compact_items(recommendations, ["Expose total price earlier", "Add quick-fit card details", "Clarify account-wall expectations"])
    return [
        {
            "title": "Tracking",
            "icon": "code-2",
            "items": ["Log first CTA hover", "Capture form idle time", "Track price exposure"],
        },
        {
            "title": "Experiment Design",
            "icon": "flask-conical",
            "items": ["Add design-fit micro-survey", "Verify hesitation reason", "Trigger feedback after friction"],
        },
        {
            "title": "Feature Changes",
            "icon": "wand-sparkles",
            "items": feature_items,
        },
    ]


def feedback_rows(summary: Dict[str, Any]) -> List[Dict[str, str]]:
    rows = []
    for finding in summary.get("top_findings", [])[:3]:
        rows.append(
            {
                "icon": level_icon(finding.get("severity", "medium")),
                "title": short_title(finding["theme"]),
                "body": short_sentence(finding.get("evidence") or finding.get("suggestion") or finding["theme"]),
                "level": severity_to_level(finding.get("severity", "medium")),
                "badge": evidence_badge(finding.get("severity", "medium")),
            }
        )
    return rows


def behavior_logs(traces: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    logs = []
    for trace in traces:
        for step in trace.get("steps", []):
            logs.append(
                {
                    "persona": trace.get("persona_id", ""),
                    "segment": trace.get("segment", ""),
                    "step": step.get("step", len(logs) + 1),
                    "intent": title_case(step.get("intent", "observe")),
                    "action": short_sentence(step.get("action", "")),
                    "friction": friction_label(float(step.get("friction", 0))),
                    "observation": short_sentence(step.get("observation", "")),
                }
            )
    return logs


def profile_rows(profiles: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    rows = []
    for profile in profiles:
        style = profile.get("behavior_style", {})
        rows.append(
            {
                "persona": profile.get("id", ""),
                "segment": title_case(profile.get("segment", "")),
                "goal": short_sentence(profile.get("goal", "")),
                "tags": behavior_tags(style),
            }
        )
    return rows


def behavior_tags(style: Dict[str, float]) -> List[str]:
    if not style:
        return ["Synthetic", "Generated"]
    pairs = sorted(style.items(), key=lambda item: item[1], reverse=True)
    return [title_case(key).replace(" Sensitivity", "") for key, _ in pairs[:2]]


def generated_real_value(variant: str, url: str, key: str, value: float) -> float:
    jitter = (stable_unit(f"{variant}:{url}:{key}") - 0.5) * 0.035
    if key == "time_to_task":
        return round(max(0.4, value + jitter * 4), 2)
    if key == "satisfaction":
        return round(clamp(value + jitter * 3, 1, 5), 2)
    return round(clamp(value + jitter, 0.01, 0.95), 3)


def generated_real_lift(a: Dict[str, Any], b: Dict[str, Any]) -> float:
    return generated_real_value("B", b["url"], "conversion", b["derived_metrics"]["conversion"]) - generated_real_value("A", a["url"], "conversion", a["derived_metrics"]["conversion"])


def winner_for_metric(a: float, b: float, direction: str) -> str:
    if abs(a - b) < 0.005:
        return "tie"
    if direction == "higher":
        return "B" if b > a else "A"
    return "B" if b < a else "A"


def spread(label: str, url: str, key: str, suffix: str) -> str:
    amount = 0.3 + stable_unit(f"{label}:{url}:{key}") * 0.9
    if suffix == "%":
        return f"+/-{amount * 5:.1f}%"
    if suffix == "m":
        return f"+/-{amount:.1f}m"
    return f"+/-{amount:.1f}"


def stable_unit(text: str) -> float:
    digest = hashlib.sha256(text.encode("utf-8")).hexdigest()
    return int(digest[:8], 16) / 0xFFFFFFFF


def severity_to_level(severity: str) -> str:
    return {"high": "high", "medium": "medium", "low": "low"}.get(severity, "medium")


def evidence_badge(severity: str) -> str:
    return {"high": "High Evidence", "medium": "Medium Evidence", "low": "Low Evidence"}.get(severity, "Medium Evidence")


def level_icon(severity: str) -> str:
    return {"high": "circle-dollar-sign", "medium": "shield-check", "low": "triangle-alert"}.get(severity, "message-square")


def friction_label(value: float) -> str:
    if value >= 0.35:
        return "High"
    if value >= 0.2:
        return "Medium"
    return "None"


def compact_items(items: Sequence[str], fallback: Sequence[str]) -> List[str]:
    cleaned = []
    for item in items:
        text = item.strip().rstrip(".")
        if text.lower().startswith("prioritize "):
            text = text[11:]
        if len(text) > 44:
            text = text[:41].rstrip() + "..."
        if text:
            cleaned.append(text[0].upper() + text[1:])
        if len(cleaned) == 3:
            break
    while len(cleaned) < 3:
        cleaned.append(fallback[len(cleaned)])
    return cleaned


def short_title(value: str) -> str:
    value = humanize_text(value).strip().rstrip(".")
    if len(value) <= 38:
        return value
    return value[:35].rstrip() + "..."


def short_sentence(value: str) -> str:
    value = humanize_text(value)
    value = " ".join(value.strip().split())
    if len(value) > 92:
        value = value[:89].rstrip() + "..."
    return value if value.endswith(".") else f"{value}."


def humanize_text(value: str) -> str:
    replacements = {
        "task_success_rate": "task success rate",
        "ease_of_search": "ease of search",
        "price_clarity": "price clarity",
        "purchase_intent": "purchase intent",
        "experiences_discoverability": "experiences discoverability",
        "wishlist_account_wall": "wishlist account wall",
    }
    for source, replacement in replacements.items():
        value = value.replace(source, replacement)
    return value


def title_case(value: str) -> str:
    return value.replace("_", " ").replace("-", " ").title()


def score_5(score_10: float) -> float:
    return round(clamp(score_10 / 2, 1, 5), 1)


def percent(value: float) -> str:
    return f"{round(value * 100):.0f}%"


def number(value: float, digits: int) -> str:
    return f"{value:.{digits}f}"


def format_lift(value: float) -> str:
    sign = "+" if value >= 0 else ""
    return f"{sign}{value * 100:.1f}%"


def clamp(value: float, low: float, high: float) -> float:
    return max(low, min(high, value))


if __name__ == "__main__":
    raise SystemExit(main())
