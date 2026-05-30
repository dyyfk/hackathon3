(function () {
  const FEATURE_MAP = [
    {
      themes: ["date_picker_friction", "price_clarity"],
      title: "Smart Date + Price Confidence Guide",
      problem: "Synthetic users hesitate when dates require extra work and price confidence arrives too late.",
      mvp: [
        "Offer a flexible-date default before the calendar becomes blocking.",
        "Show total price and likely fees at the comparison moment.",
        "Trigger a contextual helper when date or price hesitation repeats.",
      ],
      metrics: [
        "date selection completion rate",
        "primary CTA click rate",
        "dwell time before first meaningful action",
        "friction rate",
      ],
    },
    {
      themes: ["price_clarity"],
      title: "Upfront Price Confidence Card",
      problem: "Users need earlier total-cost context before they commit to a listing or checkout path.",
      mvp: [
        "Expose total price, fees, and value cues on the first comparison surface.",
        "Keep price copy near the primary CTA and listing details.",
        "Log price exposure before every CTA click.",
      ],
      metrics: ["click rate", "detail open rate", "completion rate", "price-friction rate"],
    },
    {
      themes: ["date_picker_friction"],
      title: "Flexible Date Assist",
      problem: "Calendar decisions create hesitation before users can compare options.",
      mvp: [
        "Preselect a flexible weekend option for exploratory users.",
        "Label the calendar state clearly after each date interaction.",
        "Suggest nearby dates when users pause or backtrack.",
      ],
      metrics: ["date selection completion rate", "calendar dwell time", "drop-off rate", "CTA click rate"],
    },
    {
      themes: ["trust_review_confidence"],
      title: "Decision Trust Strip",
      problem: "Trust and review signals are not close enough to the decision point.",
      mvp: [
        "Move rating, review count, and trust cues next to the primary CTA.",
        "Highlight the strongest confidence cue for each listing.",
        "Measure whether trust exposure happens before detail open or save.",
      ],
      metrics: ["detail open rate", "like rate", "CTA click rate", "trust exposure rate"],
    },
    {
      themes: ["wishlist_account_wall"],
      title: "Low-Friction Save Intent",
      problem: "Save behavior can feel blocked when account expectations appear too early.",
      mvp: [
        "Let users express save intent before showing account requirements.",
        "Clarify what will be saved and when sign-in is needed.",
        "Track save intent separately from successful account completion.",
      ],
      metrics: ["like rate", "save intent rate", "account-wall drop-off", "return intent"],
    },
    {
      themes: ["experiences_discoverability"],
      title: "Search Path Clarifier",
      problem: "Adjacent discovery paths compete with the core stay-search task.",
      mvp: [
        "Separate stay search from Experiences and Services in the first viewport.",
        "Use clearer labels for secondary discovery paths.",
        "Measure secondary-path clicks before and after search intent is formed.",
      ],
      metrics: ["search start rate", "secondary click rate", "completion rate", "navigation friction rate"],
    },
  ];

  function buildFeatureCandidate(run) {
    if (!run || !run.variants) {
      return null;
    }
    const variants = [run.variants.A, run.variants.B].filter(Boolean);
    const themes = themeCounts(variants);
    const picked = pickFeature(themes);
    const evidence = evidenceItems(run, themes);
    const winner = run.matrix_summary?.winner || "tie";
    return {
      title: picked.title,
      problem: picked.problem,
      mvp: picked.mvp,
      metrics: picked.metrics,
      evidence,
      confidence: candidateConfidence(themes, evidence),
      source: winner === "tie" ? "A/B synthetic feedback" : `Variant ${winner} comparison feedback`,
    };
  }

  function themeCounts(variants) {
    const counts = new Map();
    variants.forEach((variant) => {
      (variant.feedback || []).forEach((item) => addTheme(counts, item.title, item.level === "high" ? 2 : 1));
      (variant.recommendations || []).forEach((item) => addTheme(counts, inferTheme(item), 1));
      (variant.raw?.summary?.top_findings || []).forEach((item) => addTheme(counts, item.theme, item.severity === "high" ? 2 : 1));
      (variant.raw?.traces || []).forEach((trace) => {
        const feedback = trace.final_feedback || {};
        (feedback.friction_themes || []).forEach((theme) => addTheme(counts, theme, trace.converted ? 1 : 2));
      });
    });
    return counts;
  }

  function addTheme(counts, value, weight) {
    const theme = normalizeTheme(value);
    if (!theme) return;
    counts.set(theme, (counts.get(theme) || 0) + weight);
  }

  function pickFeature(themes) {
    const ranked = [...FEATURE_MAP].sort((left, right) => scoreFeature(right, themes) - scoreFeature(left, themes));
    if (scoreFeature(ranked[0], themes) > 0) {
      return ranked[0];
    }
    return {
      title: "Next-Step Confidence Guide",
      problem: "Users need clearer guidance at the point where hesitation or drop-off begins.",
      mvp: [
        "Identify the highest-friction step from each trajectory.",
        "Add one contextual helper near that step.",
        "Track whether the helper changes CTA, save, and completion behavior.",
      ],
      metrics: ["friction rate", "CTA click rate", "completion rate", "dwell time"],
    };
  }

  function scoreFeature(feature, themes) {
    return feature.themes.reduce((score, theme) => score + (themes.get(theme) || 0), 0);
  }

  function evidenceItems(run, themes) {
    const items = [];
    const rankedThemes = [...themes.entries()].sort((left, right) => right[1] - left[1]);
    rankedThemes.slice(0, 2).forEach(([theme, count]) => {
      items.push(`${humanize(theme)} appeared across ${count} synthetic feedback signals.`);
    });
    const metrics = run.variants?.B?.derived_metrics && run.variants?.A?.derived_metrics
      ? metricEvidence(run.variants.A.derived_metrics, run.variants.B.derived_metrics)
      : [];
    items.push(...metrics);
    return items.slice(0, 3);
  }

  function metricEvidence(aMetrics, bMetrics) {
    const items = [];
    const completionGap = Math.round((Number(bMetrics.completion_rate || 0) - Number(aMetrics.completion_rate || 0)) * 100);
    const frictionGap = Math.round((Number(bMetrics.friction_rate || 0) - Number(aMetrics.friction_rate || 0)) * 100);
    if (completionGap !== 0) {
      items.push(`Variant B completion is ${completionGap > 0 ? "+" : ""}${completionGap} pts vs A.`);
    }
    if (frictionGap !== 0) {
      items.push(`Variant B friction is ${frictionGap > 0 ? "+" : ""}${frictionGap} pts vs A.`);
    }
    return items;
  }

  function candidateConfidence(themes, evidence) {
    const strongest = Math.max(0, ...themes.values());
    const score = Math.min(0.9, 0.5 + strongest * 0.035 + evidence.length * 0.04);
    return `${Math.round(score * 100)}%`;
  }

  function inferTheme(text) {
    const value = String(text || "").toLowerCase();
    if (value.includes("date") || value.includes("calendar")) return "date_picker_friction";
    if (value.includes("price") || value.includes("fee") || value.includes("cost")) return "price_clarity";
    if (value.includes("trust") || value.includes("review") || value.includes("rating")) return "trust_review_confidence";
    if (value.includes("wishlist") || value.includes("save") || value.includes("sign-in") || value.includes("account")) return "wishlist_account_wall";
    if (value.includes("experience") || value.includes("service")) return "experiences_discoverability";
    if (value.includes("navigation") || value.includes("cta")) return "navigation_clarity";
    return text;
  }

  function normalizeTheme(value) {
    return String(value || "")
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "");
  }

  function humanize(value) {
    return String(value || "").replace(/_/g, " ");
  }

  window.syntheticFeatureCandidate = { buildFeatureCandidate };
})();
