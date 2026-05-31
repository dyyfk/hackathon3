import type { AgentSummary } from "@/lib/summarizeAgentResults";

export type ImprovementCard = {
  issue: string;
  title: string;
  suggestion: string;
  variant: string;
};

const issueSuggestions: Record<string, { title: string; suggestion: string }> =
  {
    total_price_not_visible: {
      title: "Show total price earlier",
      suggestion:
        "Show total price on listing cards and keep it visible in the checkout summary.",
    },
    total_price_not_visible_before_checkout: {
      title: "Show total price before checkout",
      suggestion:
        "Expose the all-in trip total before users commit to checkout so budget-sensitive users can decide earlier.",
    },
    checkout_summary_not_visible: {
      title: "Add a sticky checkout summary",
      suggestion:
        "Keep trip dates, fees, policies, and total price in a persistent summary near the booking action.",
    },
    filter_button_not_found_or_not_clickable: {
      title: "Make filters persistent",
      suggestion:
        "Place core filters above the listing grid so synthetic and human users can find constraints quickly.",
    },
    cancellation_policy_not_visible: {
      title: "Expose cancellation policy",
      suggestion:
        "Show the cancellation policy before checkout so users do not discover it late.",
    },
    cancellation_policy_not_visible_before_checkout: {
      title: "Expose cancellation policy earlier",
      suggestion:
        "Place the cancellation policy in the listing decision panel before the checkout button.",
    },
    pet_friendly_signal_not_visible: {
      title: "Surface pet eligibility",
      suggestion:
        "Add a clear pet-friendly badge on qualifying listings before users open checkout.",
    },
    parking_signal_not_visible: {
      title: "Surface parking availability",
      suggestion:
        "Show parking availability beside other listing badges so constrained travelers can scan quickly.",
    },
  };

export function buildImprovementCards(
  summary: AgentSummary,
): ImprovementCard[] {
  return Object.entries(summary)
    .flatMap(([variant, variantSummary]) =>
      variantSummary.topIssues.map(({ issue }) => {
        const fallback = {
          title: "Reduce repeated friction",
          suggestion:
            "Review the trajectory around this issue and move the needed information closer to the decision point.",
        };
        const details = issueSuggestions[issue] || fallback;

        return {
          issue,
          variant,
          ...details,
        };
      }),
    )
    .slice(0, 4);
}
