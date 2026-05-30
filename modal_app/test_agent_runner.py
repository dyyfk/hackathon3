import unittest

from modal_app.agent_runner import (
    compact_error_message,
    evaluate_success,
    target_listing_test_id,
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

    def test_pet_parking_task_selects_the_pet_and_parking_candidate(self) -> None:
        case = {"task": {"id": "find_pet_friendly_parking"}}

        self.assertEqual(target_listing_test_id(case), "listing-card-2")

    def test_budget_task_can_succeed_with_late_information_issues(self) -> None:
        self.assertTrue(
            evaluate_success(
                "find_budget_stay",
                checkout_reached=True,
                issues=[
                    "total_price_not_visible_before_checkout",
                    "cancellation_policy_not_visible_before_checkout",
                ],
            ),
        )

    def test_pet_parking_task_fails_when_required_signals_are_missing(self) -> None:
        self.assertFalse(
            evaluate_success(
                "find_pet_friendly_parking",
                checkout_reached=True,
                issues=["pet_friendly_signal_not_visible"],
            ),
        )


if __name__ == "__main__":
    unittest.main()
