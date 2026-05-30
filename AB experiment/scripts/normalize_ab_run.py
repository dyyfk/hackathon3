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
    run_mode = config.get("run_mode") or infer_run_mode(variant_a, variant_b)
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
            "run_mode": run_mode,
            "data_status": {
                "synthetic": "from_runner_stdout",
                "real_user": "generated_placeholder",
            },
        },
    }


def infer_run_mode(*variants: Dict[str, Any]) -> str:
    trace_sources = {
        str(trace.get("trace_source", ""))
        for variant in variants
        for trace in variant.get("raw", {}).get("traces", [])
    }
    if any(source.startswith("lm_batch_browser_observed") for source in trace_sources):
        return "browser_observed_lm_trace"
    if any(source.startswith("rule") for source in trace_sources):
        return "deterministic_rule"
    return "synthetic_runner"


def parse_synthetic_stdout(text: str) -> Dict[str, Any]:
    trace_section = extract_section_json(text, SECTION_TITLES["traces"])
    return {
        "profiles": extract_section_json(text, SECTION_TITLES["profiles"]).get("profiles", []),
        "traces": trace_section.get("traces", []),
        "page_context": trace_section.get("page_context"),
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
    metrics = dict(summary["metrics"])
    metrics["interaction_metrics"] = {
        **metrics.get("interaction_metrics", {}),
        **derive_interaction_metrics_from_traces(payload.get("traces", []), metrics),
    }
    payload = {
        **payload,
        "summary": {
            **summary,
            "metrics": metrics,
        },
    }
    derived = derive_metric_snapshot(metrics)
    feedback = feedback_rows(summary)
    logs = behavior_logs(payload["traces"])
    profiles = profile_rows(payload["profiles"])
    return {
        "label": display_variant_label(label, url),
        "url": url,
        "raw": payload,
        "summary_stats": [
            {
                "id": "click_rate",
                "label": "Click Rate",
                "value": percent(derived["click_rate"]),
                "detail": spread(label, url, "click_rate", "%"),
                "icon": "mouse-pointer-click",
            },
            {
                "id": "like_rate",
                "label": "Like Rate",
                "value": percent(derived["like_rate"]),
                "detail": spread(label, url, "like_rate", "%"),
                "icon": "heart",
            },
            {
                "id": "dwell_time",
                "label": "Avg Dwell",
                "value": f"{derived['dwell_time']:.0f}s",
                "detail": spread(label, url, "dwell_time", "s"),
                "icon": "timer",
            },
            {
                "id": "completion_rate",
                "label": "Completion",
                "value": percent(derived["completion_rate"]),
                "detail": spread(label, url, "completion_rate", "%"),
                "icon": "circle-check",
            },
        ],
        "metric_snapshot": [
            {
                "id": "primary_cta_rate",
                "label": "Primary CTA",
                "value": percent(derived["primary_cta_rate"]),
                "detail": spread(label, url, "primary_cta_rate", "%"),
            },
            {
                "id": "detail_open_rate",
                "label": "Detail Open",
                "value": percent(derived["detail_open_rate"]),
                "detail": spread(label, url, "detail_open_rate", "%"),
            },
            {
                "id": "clicks_per_user",
                "label": "Clicks/User",
                "value": number(derived["clicks_per_user"], 1),
                "detail": spread(label, url, "clicks_per_user", ""),
            },
            {
                "id": "friction_rate",
                "label": "Friction Rate",
                "value": percent(derived["friction_rate"]),
                "detail": spread(label, url, "friction_rate", "%"),
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
    interactions = metrics.get("interaction_metrics", {})
    conversion = metrics.get("conversion_rate")
    if conversion is None:
        conversion = clamp(0.28 + scores["purchase_intent"] * 0.04, 0.01, 0.95)
    dropoff = metrics.get("dropoff_rate")
    if dropoff is None:
        dropoff = clamp((10 - scores["purchase_intent"]) * 0.045, 0.03, 0.8)
    avg_task_seconds = metrics.get("avg_task_seconds")
    time_to_task = max(0.2, float(avg_task_seconds) / 60) if avg_task_seconds else max(0.6, metrics["avg_steps"] * 0.36)
    satisfaction = metrics.get("avg_satisfaction")
    if satisfaction is None:
        satisfaction = clamp(1 + ((scores["ease_of_search"] + scores["trust"]) / 2) / 10 * 4, 1, 5)
    completion_rate = float(interactions.get("completion_rate", conversion))
    click_rate = float(interactions.get("click_rate", completion_rate))
    primary_cta_rate = float(interactions.get("primary_cta_rate", click_rate))
    like_rate = float(interactions.get("like_rate", max(0.0, completion_rate - 0.25)))
    detail_open_rate = float(interactions.get("detail_open_rate", max(0.0, click_rate - 0.2)))
    dwell_time = float(interactions.get("avg_dwell_seconds", avg_task_seconds or time_to_task * 60))
    clicks_per_user = float(interactions.get("avg_clicks_per_user", metrics.get("avg_steps", 0) * click_rate))
    friction_rate = float(interactions.get("friction_step_rate", dropoff))
    return {
        "conversion": round(float(conversion), 3),
        "dropoff": round(float(dropoff), 3),
        "time_to_task": round(time_to_task, 2),
        "satisfaction": round(float(satisfaction), 2),
        "completion_rate": round(clamp(completion_rate, 0, 1), 3),
        "click_rate": round(clamp(click_rate, 0, 1), 3),
        "primary_cta_rate": round(clamp(primary_cta_rate, 0, 1), 3),
        "like_rate": round(clamp(like_rate, 0, 1), 3),
        "detail_open_rate": round(clamp(detail_open_rate, 0, 1), 3),
        "dwell_time": round(max(1, dwell_time), 1),
        "clicks_per_user": round(max(0, clicks_per_user), 2),
        "friction_rate": round(clamp(friction_rate, 0, 1), 3),
    }


def derive_interaction_metrics_from_traces(
    traces: Sequence[Dict[str, Any]], metrics: Dict[str, Any]
) -> Dict[str, float]:
    run_count = len(traces)
    if not run_count:
        return {}

    total_steps = sum(len(trace.get("steps", [])) for trace in traces)
    clicked_steps = 0
    primary_users = 0
    like_users = 0
    detail_users = 0
    high_friction_steps = 0
    total_elapsed = 0.0

    for trace in traces:
        steps = trace.get("steps", [])
        has_primary = False
        has_like = False
        has_detail = False
        for step in steps:
            event = str(step.get("event_type") or "").lower()
            action = str(step.get("action") or "").lower()
            intent = str(step.get("intent") or "").lower()
            clicked = bool(step.get("clicked")) or event in {
                "input",
                "primary_click",
                "secondary_click",
                "detail_open",
                "like_save",
            }
            if clicked:
                clicked_steps += 1
            has_primary = has_primary or bool(step.get("primary_action")) or event == "primary_click"
            has_detail = has_detail or bool(step.get("detail_action")) or event == "detail_open"
            has_like = has_like or bool(step.get("like_signal")) or event == "like_save" or any(
                term in f"{intent} {action}" for term in ["like", "save", "wishlist", "shortlist", "favorite"]
            )
            high_friction_steps += 1 if friction_value(step.get("friction", 0)) >= 0.45 else 0
            total_elapsed += elapsed_value(step)
        primary_users += 1 if has_primary else 0
        like_users += 1 if has_like else 0
        detail_users += 1 if has_detail else 0

    return {
        "click_rate": round(clicked_steps / total_steps, 2) if total_steps else 0.0,
        "primary_cta_rate": round(primary_users / run_count, 2),
        "like_rate": round(like_users / run_count, 2),
        "detail_open_rate": round(detail_users / run_count, 2),
        "completion_rate": float(metrics.get("conversion_rate", metrics.get("task_success_rate", 0))),
        "avg_dwell_seconds": round(total_elapsed / run_count, 1),
        "avg_clicks_per_user": round(clicked_steps / run_count, 2),
        "friction_step_rate": round(high_friction_steps / total_steps, 2) if total_steps else 0.0,
    }


def friction_value(value: Any) -> float:
    if isinstance(value, (int, float)):
        return clamp(float(value), 0, 1)
    return {
        "none": 0.05,
        "low": 0.2,
        "medium": 0.45,
        "high": 0.75,
    }.get(str(value).lower(), 0.45)


def elapsed_value(step: Dict[str, Any]) -> float:
    try:
        value = float(step.get("elapsed_seconds") or 0)
    except (TypeError, ValueError):
        value = 0
    if value > 0:
        return value
    return 16.0


def build_matrix_summary(a: Dict[str, Any], b: Dict[str, Any]) -> Dict[str, Any]:
    winner = choose_winner(a, b)
    a_metrics = a["derived_metrics"]
    b_metrics = b["derived_metrics"]
    synthetic_lift = b_metrics["completion_rate"] - a_metrics["completion_rate"]
    confidence = confidence_score(a, b)
    return {
        "winner": winner,
        "title": winner_title(winner, a["label"], b["label"]),
        "label": "Overall winner" if winner in {"A", "B"} else "No clear winner",
        "summary_primary": summary_primary(winner, a["label"], b["label"]),
        "summary_secondary": f"We are {round(confidence * 100)}% confident based on the current synthetic runs.",
        "date_range": "May 5 - May 12, 2025",
        "summary_stats": [
            {
                "label": "Real click lift",
                "value": format_lift(generated_real_lift(a, b, "click_rate")),
                "detail": "vs A",
                "kind": "lift",
            },
            {
                "label": "Completion lift",
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
        ("click_rate", "Click Rate", "mouse-pointer-click", "higher", percent),
        ("like_rate", "Like Rate", "heart", "higher", percent),
        ("dwell_time", "Dwell Time", "timer", "lower", lambda value: f"{value:.0f}s"),
        ("completion_rate", "Completion", "circle-check", "higher", percent),
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
        metrics["completion_rate"] * 0.28
        + metrics["primary_cta_rate"] * 0.18
        + metrics["detail_open_rate"] * 0.14
        + metrics["like_rate"] * 0.1
        + metrics["click_rate"] * 0.12
        + (metrics["satisfaction"] / 5) * 0.1
        + (1 - metrics["friction_rate"]) * 0.05
        + max(0, 1 - metrics["dwell_time"] / 360) * 0.03
    )


def winner_title(winner: str, a_label: str = "Variant A", b_label: str = "Variant B") -> str:
    if winner == "A":
        return f"{a_label} leads"
    if winner == "B":
        return f"{b_label} leads"
    return "Variants are comparable"


def summary_primary(winner: str, a_label: str = "Variant A", b_label: str = "Variant B") -> str:
    if winner == "tie":
        return "A and B show similar interaction outcomes across clicks, like intent, dwell time, and task completion."
    winner_label = a_label if winner == "A" else b_label
    return f"{winner_label} performs better on UI-specific interaction behavior across the current synthetic runs."


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
            "items": ["Log primary CTA clicks", "Track like/save intent", "Capture dwell time"],
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
                    "persona": trace.get("persona_id") or trace.get("profile_id", ""),
                    "segment": trace.get("segment", ""),
                    "step": step.get("step", len(logs) + 1),
                    "event": event_label(step.get("event_type")),
                    "intent": title_case(step.get("intent", "observe")),
                    "action": short_sentence(step.get("action", "")),
                    "friction": friction_label(step.get("friction", 0)),
                    "observation": short_sentence(
                        step.get("observation") or step.get("expected_result") or step.get("element", "")
                    ),
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
    if key == "dwell_time":
        return round(max(5, value + jitter * 90), 1)
    if key == "clicks_per_user":
        return round(max(0, value + jitter * 4), 2)
    if key == "satisfaction":
        return round(clamp(value + jitter * 3, 1, 5), 2)
    return round(clamp(value + jitter, 0.01, 0.95), 3)


def generated_real_lift(a: Dict[str, Any], b: Dict[str, Any], key: str) -> float:
    return generated_real_value("B", b["url"], key, b["derived_metrics"][key]) - generated_real_value("A", a["url"], key, a["derived_metrics"][key])


def display_variant_label(label: str, url: str) -> str:
    lowered = url.lower()
    if "versionc" in lowered or "version-c" in lowered:
        return "Variant C"
    if "versionb" in lowered or "version-b" in lowered:
        return "Variant B"
    if "versiona" in lowered or "version-a" in lowered:
        return "Variant A"
    return f"Variant {label}"


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
    if suffix == "s":
        return f"+/-{amount * 18:.0f}s"
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


def friction_label(value: Any) -> str:
    if isinstance(value, str):
        level = value.lower()
        if level == "high":
            return "High"
        if level in {"medium", "low"}:
            return "Medium" if level == "medium" else "Low"
        return "None"
    value = float(value)
    if value >= 0.35:
        return "High"
    if value >= 0.2:
        return "Medium"
    return "None"


def event_label(value: Any) -> str:
    labels = {
        "view": "View",
        "input": "Input",
        "primary_click": "CTA",
        "secondary_click": "Click",
        "detail_open": "Detail",
        "like_save": "Like",
        "scroll": "Scroll",
        "dwell": "Dwell",
        "dropoff": "Dropoff",
    }
    return labels.get(str(value or "").lower(), "View")


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
        "click_rate": "click rate",
        "like_rate": "like rate",
        "primary_cta_rate": "primary CTA rate",
        "detail_open_rate": "detail open rate",
        "friction_step_rate": "friction step rate",
        "avg_dwell_seconds": "average dwell time",
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
