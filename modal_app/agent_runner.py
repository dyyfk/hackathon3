import asyncio
import re
import time
from typing import Any

import modal

app = modal.App("usertwin-agent-runner")

image = (
    modal.Image.debian_slim(python_version="3.11")
    .pip_install("fastapi[standard]", "playwright")
    .run_commands("python -m playwright install --with-deps chromium")
)


def tunnel_bypass_headers() -> dict[str, str]:
    return {
        "bypass-tunnel-reminder": "true",
        "ngrok-skip-browser-warning": "true",
    }


def compact_error_message(error: Exception, limit: int = 500) -> str:
    return " ".join(str(error).split())[:limit]


def configure_playwright_event_loop() -> None:
    if not hasattr(asyncio, "WindowsProactorEventLoopPolicy"):
        return

    if type(asyncio.get_event_loop_policy()).__name__ != "WindowsProactorEventLoopPolicy":
        asyncio.set_event_loop_policy(asyncio.WindowsProactorEventLoopPolicy())


def task_id(case: dict[str, Any]) -> str:
    task = case.get("task", {})
    return str(task.get("id", ""))


def is_parking_detail_task(task: str) -> bool:
    return task in {
        "verify_parking_decision_details",
        "find_pet_friendly_parking",
    }


def target_staybnb_listing_test_id(case: dict[str, Any]) -> str:
    return "listing-card-open-sf-003"


def target_stayfinder_listing_test_id(case: dict[str, Any]) -> str:
    return "stayfinder-listing-tahoe-glass-cabin"


def evaluate_success(
    task: str,
    primary_action_reached: bool,
    issues: list[str],
) -> bool:
    if not primary_action_reached:
        return False

    if is_parking_detail_task(task):
        blocking_issues = {
            "parking_signal_not_visible",
        }
        return not blocking_issues.intersection(issues)

    return True


@app.function(image=image, timeout=120, max_containers=20)
@modal.fastapi_endpoint(method="POST")
def run_agent(case: dict[str, Any]) -> dict[str, Any]:
    """
    Run one scripted synthetic user session against one app variant.

    Expected input:
    {
      "run_id": "a_budget_001",
      "variant": "A",
      "url": "https://public-demo-url/versionA",
      "persona": {"id": "budget_traveler", "name": "Budget traveler"},
      "task": {"id": "find_budget_stay", "name": "Find a stay under budget"}
    }
    """
    configure_playwright_event_loop()

    from playwright.sync_api import sync_playwright

    start = time.time()
    events: list[dict[str, Any]] = []
    issues: list[str] = []
    primary_action_reached = False
    success = False
    current_task_id = task_id(case)

    def now() -> float:
        return round(time.time() - start, 2)

    def record(
        event_type: str,
        label: str,
        extra: dict[str, Any] | None = None,
    ) -> None:
        item: dict[str, Any] = {
            "t": now(),
            "type": event_type,
            "label": label,
        }
        if extra:
            item.update(extra)
        events.append(item)

    def safe_click(
        page: Any,
        test_id: str,
        label: str,
        timeout: int = 4000,
    ) -> bool:
        try:
            page.get_by_test_id(test_id).click(timeout=timeout)
            record(
                "click",
                label,
                {"selector": f"[data-testid='{test_id}']"},
            )
            return True
        except Exception:
            issues.append(f"{test_id}_not_found_or_not_clickable")
            record(
                "friction",
                f"failed_{label}",
                {"selector": f"[data-testid='{test_id}']"},
            )
            return False

    def safe_fill(
        page: Any,
        test_id: str,
        value: str,
        label: str,
        timeout: int = 4000,
    ) -> bool:
        try:
            page.get_by_test_id(test_id).fill(value, timeout=timeout)
            record(
                "input",
                label,
                {"selector": f"[data-testid='{test_id}']"},
            )
            return True
        except Exception:
            issues.append(f"{test_id}_not_found_or_not_fillable")
            record(
                "friction",
                f"failed_{label}",
                {"selector": f"[data-testid='{test_id}']"},
            )
            return False

    def safe_check(
        page: Any,
        test_id: str,
        label: str,
        timeout: int = 4000,
    ) -> bool:
        try:
            page.get_by_test_id(test_id).check(timeout=timeout)
            record(
                "check",
                label,
                {"selector": f"[data-testid='{test_id}']"},
            )
            return True
        except Exception:
            issues.append(f"{test_id}_not_found_or_not_checkable")
            record(
                "friction",
                f"failed_{label}",
                {"selector": f"[data-testid='{test_id}']"},
            )
            return False

    def observe_signal(
        page: Any,
        test_id: str,
        label: str,
        issue: str,
        timeout: int = 3000,
    ) -> bool:
        selector = f"[data-testid='{test_id}']"
        try:
            page.locator(selector).first.wait_for(timeout=timeout)
            record(
                "observe",
                label,
                {"selector": selector},
            )
            return True
        except Exception:
            issues.append(issue)
            record(
                "friction",
                issue,
                {"selector": selector},
            )
            return False

    def observe_text(
        page: Any,
        test_id: str,
        pattern: str,
        label: str,
        issue: str,
        timeout: int = 3000,
    ) -> bool:
        selector = f"[data-testid='{test_id}']"
        try:
            locator = page.locator(selector).first
            locator.wait_for(timeout=timeout)
            text = locator.inner_text(timeout=timeout)

            if re.search(pattern, text, re.IGNORECASE):
                record(
                    "observe",
                    label,
                    {"selector": selector},
                )
                return True
        except Exception:
            pass

        issues.append(issue)
        record(
            "friction",
            issue,
            {"selector": selector},
        )
        return False

    def run_existing_staybnb_flow(page: Any) -> bool:
        observe_signal(
            page,
            "location-input",
            "client_ready",
            "client_ready_not_observed",
            timeout=10000,
        )
        safe_fill(page, "location-input", "San Francisco", "search_location")
        safe_fill(page, "checkin-input", "2026-06-14", "set_checkin")
        safe_fill(page, "checkout-input", "2026-06-16", "set_checkout")
        safe_click(page, "search-submit", "submit_search")
        observe_signal(
            page,
            "spa-search-results",
            "search_results_visible",
            "search_results_not_visible",
        )

        safe_click(page, "filters-button", "open_filter")
        if is_parking_detail_task(current_task_id):
            safe_check(page, "parking-checkbox", "require_parking")
        safe_click(page, "apply-filters-button", "apply_filters")

        listing_test_id = target_staybnb_listing_test_id(case)
        if safe_click(page, listing_test_id, f"open_{listing_test_id}"):
            record(
                "decision",
                "selected_listing_candidate",
                {"test_id": listing_test_id},
            )

        observe_signal(
            page,
            "listing-detail-page",
            "listing_detail_visible",
            "listing_detail_not_visible",
        )
        observe_signal(page, "detail-title", "detail_title_visible", "detail_title_not_visible")
        if is_parking_detail_task(current_task_id):
            observe_text(
                page,
                "detail-amenities",
                "parking|driveway|garage",
                "parking_signal_visible",
                "parking_signal_not_visible",
            )
        observe_signal(
            page,
            "detail-cancellation-policy",
            "cancellation_policy_visible_before_checkout",
            "cancellation_policy_not_visible_before_checkout",
        )
        observe_signal(
            page,
            "checkout-total-line",
            "total_price_visible_before_checkout",
            "total_price_not_visible_before_checkout",
            timeout=1000,
        )

        if safe_click(page, "reserve-button", "start_checkout", timeout=5000):
            checkout_seen = observe_signal(
                page,
                "checkout-page",
                "checkout_page_visible",
                "checkout_page_not_visible",
            )
            observe_signal(
                page,
                "checkout-price-breakdown",
                "checkout_price_breakdown_visible",
                "checkout_summary_not_visible",
            )
            safe_click(page, "confirm-reservation-button", "confirm_reservation")
            observe_signal(
                page,
                "reservation-success",
                "reservation_success_visible",
                "reservation_success_not_visible",
            )
            return checkout_seen

        return False

    def run_existing_stayfinder_flow(page: Any) -> bool:
        observe_signal(
            page,
            "stayfinder-app",
            "client_ready",
            "client_ready_not_observed",
            timeout=10000,
        )
        safe_click(page, "category-tab-Cabins", "filter_cabins")

        listing_test_id = target_stayfinder_listing_test_id(case)
        if safe_click(page, listing_test_id, f"open_{listing_test_id}"):
            record(
                "decision",
                "selected_listing_candidate",
                {"test_id": listing_test_id},
            )

        observe_signal(
            page,
            "stayfinder-detail",
            "listing_detail_visible",
            "listing_detail_not_visible",
        )
        if is_parking_detail_task(current_task_id):
            observe_text(
                page,
                "stayfinder-detail",
                "parking|driveway|garage",
                "parking_signal_visible",
                "parking_signal_not_visible",
            )
        observe_text(
            page,
            "stayfinder-detail",
            r"\$[0-9]",
            "nightly_price_visible_before_request",
            "price_signal_not_visible",
        )

        if safe_click(page, "stayfinder-request", "send_request", timeout=5000):
            return observe_signal(
                page,
                "stayfinder-modal",
                "request_confirmation_visible",
                "request_confirmation_not_visible",
            )

        return False

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True, args=["--no-sandbox"])
        page = browser.new_page(viewport={"width": 1280, "height": 800})
        page.set_extra_http_headers(tunnel_bypass_headers())

        try:
            page.goto(case["url"], wait_until="domcontentloaded", timeout=30000)
            record("page_view", "open_variant", {"url": page.url})
            record(
                "task",
                "task_context",
                {
                    "persona": case.get("persona", {}).get("name"),
                    "task": case.get("task", {}).get("name"),
                    "task_id": current_task_id,
                },
            )

            variant = str(case.get("variant", "")).upper()
            if variant == "B" or "/versionB" in page.url:
                primary_action_reached = run_existing_stayfinder_flow(page)
            else:
                primary_action_reached = run_existing_staybnb_flow(page)

            success = evaluate_success(
                current_task_id,
                primary_action_reached,
                issues,
            )
            record(
                "evaluation",
                "task_success_evaluated",
                {
                    "success": success,
                    "primary_action_reached": primary_action_reached,
                    "issues": sorted(set(issues)),
                },
            )

        except Exception as exc:
            issues.append(f"run_error:{type(exc).__name__}")
            record(
                "error",
                "run_error",
                {
                    "error_type": type(exc).__name__,
                    "error_message": compact_error_message(exc),
                },
            )
        finally:
            browser.close()

    duration = now()
    action_events = [
        event for event in events if event["type"] in ["check", "click", "input"]
    ]
    friction_events = [event for event in events if event["type"] in ["friction", "error"]]

    return {
        "run_id": case.get("run_id"),
        "variant": case.get("variant"),
        "url": case.get("url"),
        "persona": case.get("persona", {}).get("name"),
        "task": case.get("task", {}).get("name"),
        "success": success,
        "time_to_complete_sec": duration,
        "step_count": len(action_events),
        "friction_count": len(friction_events),
        "issues": sorted(set(issues)),
        "events": events,
        "modal": {
            "cloud_run": True,
            "runner": "Modal Web Function + Playwright",
        },
    }
