import asyncio
import unittest

from modal_app.agent_runner import (
    compact_error_message,
    configure_playwright_event_loop,
    evaluate_success,
    target_staybnb_listing_test_id,
    target_stayfinder_listing_test_id,
    tunnel_bypass_headers,
)


class AgentRunnerTests(unittest.TestCase):
    def test_tunnel_bypass_headers_include_known_warning_bypasses(self) -> None:
        headers = tunnel_bypass_headers()

        self.assertEqual(headers["bypass-tunnel-reminder"], "true")
        self.assertEqual(headers["ngrok-skip-browser-warning"], "true")

    def test_compact_error_message_keeps_useful_context(self) -> None:
        error = RuntimeError("first line\nsecond line")

        self.assertEqual(compact_error_message(error), "first line second line")

    def test_configure_playwright_event_loop_restores_windows_subprocess_support(
        self,
    ) -> None:
        if not hasattr(asyncio, "WindowsSelectorEventLoopPolicy"):
            self.skipTest("Windows event loop policy is not available")

        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
        configure_playwright_event_loop()

        self.assertEqual(
            type(asyncio.get_event_loop_policy()).__name__,
            "WindowsProactorEventLoopPolicy",
        )

    def test_parking_task_selects_existing_staybnb_parking_candidate(self) -> None:
        case = {"task": {"id": "verify_parking_decision_details"}}

        self.assertEqual(target_staybnb_listing_test_id(case), "listing-card-open-sf-003")

    def test_stayfinder_flow_targets_existing_cabin_with_parking(self) -> None:
        case = {"task": {"id": "verify_parking_decision_details"}}

        self.assertEqual(
            target_stayfinder_listing_test_id(case),
            "stayfinder-listing-tahoe-glass-cabin",
        )

    def test_primary_flow_can_succeed_with_late_information_issues(self) -> None:
        self.assertTrue(
            evaluate_success(
                "complete_primary_flow",
                primary_action_reached=True,
                issues=[
                    "total_price_not_visible_before_checkout",
                    "cancellation_policy_not_visible_before_checkout",
                ],
            ),
        )

    def test_parking_task_fails_when_required_signals_are_missing(self) -> None:
        self.assertFalse(
            evaluate_success(
                "verify_parking_decision_details",
                primary_action_reached=True,
                issues=["parking_signal_not_visible"],
            ),
        )


if __name__ == "__main__":
    unittest.main()
