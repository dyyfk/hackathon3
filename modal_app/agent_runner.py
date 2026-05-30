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


def task_id(case: dict[str, Any]) -> str:
    task = case.get("task", {})
    return str(task.get("id", ""))


def target_listing_test_id(case: dict[str, Any]) -> str:
    if task_id(case) == "find_pet_friendly_parking":
        return "listing-card-2"

    return "listing-card-0"


def evaluate_success(
    task: str,
    checkout_reached: bool,
    issues: list[str],
) -> bool:
    if not checkout_reached:
        return False

    if task == "find_pet_friendly_parking":
        blocking_issues = {
            "pet_friendly_signal_not_visible",
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
    from playwright.sync_api import sync_playwright

    start = time.time()
    events: list[dict[str, Any]] = []
    issues: list[str] = []
    checkout_reached = False
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
            try:
                page.get_by_test_id("client-ready").wait_for(
                    state="attached",
                    timeout=10000,
                )
                record("observe", "client_ready")
            except Exception:
                issues.append("client_ready_not_observed")
                record("friction", "client_ready_not_observed")

            safe_fill(page, "search-input", "San Francisco", "search_location")
            safe_click(page, "search-button", "submit_search")
            safe_click(page, "filter-button", "open_filter")

            if current_task_id == "find_pet_friendly_parking":
                observe_signal(
                    page,
                    "pet-friendly-badge",
                    "pet_friendly_signal_visible",
                    "pet_friendly_signal_not_visible",
                    timeout=2500,
                )
                observe_signal(
                    page,
                    "parking-badge",
                    "parking_signal_visible",
                    "parking_signal_not_visible",
                    timeout=2500,
                )

            listing_test_id = target_listing_test_id(case)
            if safe_click(page, listing_test_id, f"open_{listing_test_id}"):
                record("decision", "selected_listing_candidate", {"test_id": listing_test_id})

            observe_signal(
                page,
                "total-price",
                "total_price_visible_before_checkout",
                "total_price_not_visible_before_checkout",
            )
            observe_signal(
                page,
                "cancellation-policy",
                "cancellation_policy_visible_before_checkout",
                "cancellation_policy_not_visible_before_checkout",
            )

            if safe_click(page, "checkout-button", "start_checkout", timeout=5000):
                try:
                    page.get_by_test_id("checkout-summary").wait_for(timeout=3000)
                    record("observe", "checkout_summary_visible")
                    checkout_reached = True
                except Exception:
                    issues.append("checkout_summary_not_visible")
                    record("friction", "checkout_summary_not_visible")

            success = evaluate_success(current_task_id, checkout_reached, issues)
            record(
                "evaluation",
                "task_success_evaluated",
                {
                    "success": success,
                    "checkout_reached": checkout_reached,
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
    action_events = [event for event in events if event["type"] in ["click", "input"]]
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
