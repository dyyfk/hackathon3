"use client";

import {
  ArrowUpRight,
  CheckCircle2,
  Download,
  Gauge,
  Lightbulb,
  SlidersHorizontal,
  Sparkles,
} from "lucide-react";
import { useMemo, useState } from "react";
import {
  runSyntheticABTest,
  runSyntheticIterationLab,
  type SyntheticABTestReport,
  type SyntheticABVariantSummary,
  type SyntheticFeatureCandidate,
  type SyntheticImprovementRecommendation,
  type SyntheticIterationCandidate,
  type SyntheticIterationLabReport,
} from "@/lib/syntheticOptimization";
import {
  explainSyntheticJourney,
  syntheticUserProfiles,
  type SyntheticJourneyStep,
  type SyntheticTaskId,
} from "@/lib/syntheticUser";

const taskOptions: Array<{ id: SyntheticTaskId; label: string }> = [
  { id: "find_budget_stay", label: "Find budget stay" },
  { id: "find_pet_friendly", label: "Find pet-friendly stay" },
  { id: "compare_cancellation", label: "Compare cancellation" },
  { id: "complete_checkout", label: "Complete checkout" },
];

const profileMetrics = [
  "patience",
  "speed",
  "exploration",
  "priceSensitivity",
  "policySensitivity",
  "qualitySensitivity",
  "filterAffinity",
  "checkoutConfidence",
] as const;

type IterationRecipeCopy = {
  label: string;
  detail: string;
};

const iterationRecipeCopy: Record<string, IterationRecipeCopy> = {
  checkout_assurance: {
    label: "Checkout assurance lane",
    detail: "Reserve, review price, and confirm actions become easier; checkout dwell drops.",
  },
  upfront_price_confidence: {
    label: "Upfront price confidence",
    detail: "Total-cost context moves earlier, reducing checkout price hesitation.",
  },
  task_ready_filter_rail: {
    label: "Task-ready filter rail",
    detail: "Likely filters are exposed before a modal, reducing filter/results friction.",
  },
  policy_trust_strip: {
    label: "Policy trust strip",
    detail: "Cancellation and trust cues sit near the listing decision, lowering backtracking.",
  },
  match_confidence_panel: {
    label: "Match confidence panel",
    detail: "The chosen stay explains its task fit, helping users commit from results/detail.",
  },
  fast_start_search: {
    label: "Fast-start search defaults",
    detail: "Likely intent is preloaded so the first meaningful search happens sooner.",
  },
};

export default function SyntheticPage() {
  const [profileId, setProfileId] = useState(syntheticUserProfiles[0].id);
  const [taskId, setTaskId] = useState<SyntheticTaskId>("find_budget_stay");
  const [seed, setSeed] = useState("profile-demo");
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  const abReport = useMemo(
    () => runSyntheticABTest({ seedPrefix: seed || "profile-demo", agentCount: 50 }),
    [seed],
  );
  const iterationReport = useMemo(
    () =>
      runSyntheticIterationLab({
        seedPrefix: seed || "profile-demo",
        agentCount: 50,
        candidatesPerGeneration: 100,
        generationCount: 5,
      }),
    [seed],
  );
  const explanation = useMemo(
    () =>
      explainSyntheticJourney({
        profile: profileId,
        taskId,
        seed,
      }),
    [profileId, seed, taskId],
  );
  const selectedStep =
    explanation.steps[Math.min(selectedStepIndex, explanation.steps.length - 1)];

  function downloadJson() {
    const blob = new Blob([JSON.stringify(explanation, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `synthetic-${profileId}-${taskId}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  function downloadImprovementJson() {
    const blob = new Blob([JSON.stringify({ abReport, iterationReport }, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `synthetic-ab-improvement-${seed || "profile-demo"}.json`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main
      data-synthetic-dashboard
      className="synthetic-dashboard min-h-screen bg-[#f7f5f0] text-stone-950"
    >
      <SyntheticCriticalStyles />
      <section className="synthetic-hero border-b border-stone-200 bg-white">
        <div className="synthetic-container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="synthetic-heading-row flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e95f45]">
                Synthetic lab
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
                Behavior inspector
              </h1>
            </div>
            <button
              data-testid="synthetic-export-json"
              type="button"
              onClick={downloadJson}
              className="synthetic-button synthetic-button-primary inline-flex w-fit items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
            >
              <Download className="size-4" />
              Export JSON
            </button>
          </div>

          <div className="synthetic-control-grid mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
            <label className="text-sm font-semibold text-stone-700">
              Profile
              <select
                data-testid="synthetic-profile-select"
                value={profileId}
                onChange={(event) => {
                  setProfileId(event.target.value);
                  setSelectedStepIndex(0);
                }}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-normal"
              >
                {syntheticUserProfiles.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-stone-700">
              Task
              <select
                data-testid="synthetic-task-select"
                value={taskId}
                onChange={(event) => {
                  setTaskId(event.target.value as SyntheticTaskId);
                  setSelectedStepIndex(0);
                }}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-normal"
              >
                {taskOptions.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-sm font-semibold text-stone-700">
              Seed
              <input
                data-testid="synthetic-seed-input"
                value={seed}
                onChange={(event) => {
                  setSeed(event.target.value);
                  setSelectedStepIndex(0);
                }}
                className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-3 py-2 font-normal"
              />
            </label>
          </div>
        </div>
      </section>

      <IterationLabPanel report={iterationReport} />
      <ImprovementPanel report={abReport} onDownload={downloadImprovementJson} />

      <section className="synthetic-container synthetic-inspector-layout mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6">
          <section className="synthetic-card rounded-lg border border-stone-200 bg-white p-5">
            <h2 className="text-lg font-semibold">{explanation.profile.label}</h2>
            <p className="mt-2 text-sm leading-6 text-stone-600">
              {explanation.profile.description}
            </p>
            <div className="mt-5 space-y-3">
              {profileMetrics.map((metric) => (
                <MetricRow
                  key={metric}
                  label={metric}
                  value={explanation.profile[metric]}
                />
              ))}
            </div>
            <div className="mt-5 rounded-lg bg-stone-50 p-3 text-sm text-stone-700">
              <p>Max budget: {explanation.profile.maxBudgetTotal ?? "none"}</p>
              <p>Pet-friendly: {String(Boolean(explanation.profile.prefersPetFriendly))}</p>
              <p>Parking: {String(Boolean(explanation.profile.wantsParking))}</p>
            </div>
          </section>

          <section className="synthetic-card rounded-lg border border-stone-200 bg-white p-5">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="size-4 text-[#e95f45]" />
              <h2 className="text-lg font-semibold">Workflow</h2>
            </div>
            <div className="mt-4 space-y-2">
              {explanation.steps.map((step, index) => (
                <button
                  key={`${step.stepIndex}-${step.action.id}`}
                  data-testid={`synthetic-step-${step.stepIndex}`}
                  type="button"
                  onClick={() => setSelectedStepIndex(index)}
                  className={`w-full rounded-lg border px-3 py-3 text-left text-sm ${
                    index === selectedStepIndex
                      ? "border-stone-950 bg-stone-950 text-white"
                      : "border-stone-200 bg-white text-stone-800 hover:border-stone-400"
                  }`}
                >
                  <span className="block font-semibold">
                    {step.stepIndex}. {step.action.id}
                  </span>
                  <span className="mt-1 block text-xs opacity-75">
                    {step.screen} · {formatMs(step.dwellMs)}
                  </span>
                </button>
              ))}
            </div>
            <dl className="mt-5 grid grid-cols-2 gap-3 text-sm">
              <SummaryValue label="Actions" value={explanation.totals.actionCount} />
              <SummaryValue
                label="Dwell"
                value={formatMs(explanation.totals.totalDwellMs)}
              />
            </dl>
          </section>
        </aside>

        {selectedStep ? (
          <section className="space-y-6" data-testid="synthetic-step-detail">
            <section className="synthetic-card rounded-lg border border-stone-200 bg-white p-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="text-sm font-semibold uppercase tracking-[0.12em] text-stone-500">
                    Step {selectedStep.stepIndex}
                  </p>
                  <h2 className="mt-2 text-2xl font-semibold">
                    {selectedStep.action.label}
                  </h2>
                  <p className="mt-2 text-sm text-stone-600">
                    {selectedStep.stateBefore.screen} →{" "}
                    {selectedStep.stateAfter.screen}
                  </p>
                </div>
                <div className="rounded-lg bg-[#fff3ef] px-4 py-3 text-sm font-semibold text-[#b5422b]">
                  {formatMs(selectedStep.dwellMs)}
                </div>
              </div>
            </section>

            <CandidateTable step={selectedStep} />
            <DwellTable step={selectedStep} />
            <StatePanel step={selectedStep} />
          </section>
        ) : null}
      </section>
    </main>
  );
}

function IterationLabPanel({ report }: { report: SyntheticIterationLabReport }) {
  const firstGeneration = report.generations[0];
  const lastGeneration = report.generations[report.generations.length - 1];

  return (
    <section
      data-testid="synthetic-iteration-lab"
      className="border-b border-stone-200 bg-white"
    >
      <div className="synthetic-container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="synthetic-heading-row flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e95f45]">
              Iteration proof
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">
              A -&gt; B -&gt; C -&gt; D -&gt; E self-improvement loop
            </h2>
          </div>
          <div className="synthetic-loop-badge">
            {report.agentCount} synthetic users x {report.totalCandidatesGenerated} candidates
          </div>
        </div>

        <div className="synthetic-loop-summary mt-5 grid gap-3 md:grid-cols-4">
          <SummaryValue label="Agent budget" value={report.agentCount} />
          <SummaryValue
            label="Candidates"
            value={report.totalCandidatesGenerated}
          />
          <SummaryValue label="Score lift" value={formatSigned(report.scoreLift)} />
          <SummaryValue
            label="Dwell saved"
            value={formatMs(report.dwellReductionMs)}
          />
        </div>

        <div className="synthetic-applied-strip" data-testid="synthetic-applied-changes">
          <div className="synthetic-applied-strip-heading">
            <Sparkles className="size-4" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                Applied changes
              </p>
              <h3>What each generation actually changed</h3>
            </div>
          </div>
          <div className="synthetic-applied-grid">
            {report.generations.map((generation, index) => {
              const previousGeneration = report.generations[index - 1];
              const appliedCandidate = previousGeneration?.selectedCandidate;
              const scoreDelta = previousGeneration
                ? generation.summary.score - previousGeneration.summary.score
                : 0;
              const dwellDelta = previousGeneration
                ? previousGeneration.summary.averageDwellMs -
                  generation.summary.averageDwellMs
                : 0;
              const frictionDelta = previousGeneration
                ? previousGeneration.summary.feedback.totalFrictionRate -
                  generation.summary.feedback.totalFrictionRate
                : 0;

              return (
                <AppliedChangeStep
                  key={generation.generationId}
                  generationId={generation.generationId}
                  appliedCandidate={appliedCandidate}
                  scoreDelta={scoreDelta}
                  dwellDelta={dwellDelta}
                  frictionDelta={frictionDelta}
                />
              );
            })}
          </div>
        </div>

        <div className="synthetic-iteration-grid mt-5">
          {report.generations.map((generation, index) => {
            const nextCandidate =
              generation.selectedCandidate ?? generation.recommendedNextCandidate;
            const previousGeneration = report.generations[index - 1];
            const appliedCandidate = previousGeneration?.selectedCandidate;
            const scoreLift =
              index === 0
                ? 0
                : Number(
                    (
                      generation.summary.score -
                      report.generations[index - 1].summary.score
                    ).toFixed(2),
                  );

            return (
              <article
                key={generation.generationId}
                data-testid={`synthetic-generation-${generation.generationId}`}
                className="synthetic-card synthetic-generation-card rounded-lg border border-stone-200 bg-white p-5"
              >
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                      Generation {generation.generationId}
                    </p>
                    <h3 className="mt-1 text-lg font-semibold">
                      {generation.label}
                    </h3>
                  </div>
                  <span className="synthetic-score-pill">
                    {generation.summary.score}
                  </span>
                </div>

                <div className="synthetic-score-bar" aria-hidden="true">
                  <span style={{ width: `${generation.summary.score}%` }} />
                </div>

                <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                  <SummaryValue
                    label="Complete"
                    value={formatPercent(generation.summary.completionRate)}
                  />
                  <SummaryValue
                    label="Friction"
                    value={formatPercent(
                      generation.summary.feedback.totalFrictionRate,
                    )}
                  />
                  <SummaryValue
                    label="Dwell"
                    value={formatMs(generation.summary.averageDwellMs)}
                  />
                  <SummaryValue
                    label="Delta"
                    value={index === 0 ? "base" : formatSigned(scoreLift)}
                  />
                </dl>

                <div className="synthetic-applied-candidate">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {appliedCandidate ? "Applied in this version" : "Baseline setup"}
                  </p>
                  <p className="mt-1 font-semibold">
                    {appliedCandidate
                      ? compactCandidateTitle(appliedCandidate)
                      : "Task-first search, filters, listing details, checkout"}
                  </p>
                  <div className="synthetic-recipe-chip-row">
                    {appliedCandidate
                      ? uniqueRecipeIds(appliedCandidate.appliedRecommendationIds).map(
                          (recipeId) => (
                            <span key={recipeId}>{describeIterationRecipe(recipeId).label}</span>
                          ),
                        )
                      : <span>Original flow</span>}
                  </div>
                </div>

                <div className="synthetic-selected-candidate">
                  <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
                    {generation.selectedCandidate ? "Next winner" : "Next backlog"}
                  </p>
                  <p className="mt-1 font-semibold">
                    {nextCandidate ? compactCandidateTitle(nextCandidate) : "No candidate"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-stone-600">
                    {nextCandidate?.rationale}
                  </p>
                </div>
              </article>
            );
          })}
        </div>

        <div className="synthetic-loop-footnote">
          <CheckCircle2 className="size-4" />
          <span>
            The same 50-session agent budget evaluates every generation, while
            each round scores 100 generated UX candidates before promoting the
            strongest one.
          </span>
        </div>

        {firstGeneration && lastGeneration ? (
          <p className="synthetic-loop-claim">
            Score moves from {firstGeneration.summary.score} to{" "}
            {lastGeneration.summary.score}; completion moves from{" "}
            {formatPercent(firstGeneration.summary.completionRate)} to{" "}
            {formatPercent(lastGeneration.summary.completionRate)}.
          </p>
        ) : null}
      </div>
    </section>
  );
}

function ImprovementPanel({
  report,
  onDownload,
}: {
  report: SyntheticABTestReport;
  onDownload: () => void;
}) {
  const optimizedSummary = report.optimizedProjection.summary;

  return (
    <section
      data-testid="synthetic-improvement-panel"
      className="border-b border-stone-200 bg-[#fffdf8]"
    >
      <div className="synthetic-container mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="synthetic-heading-row flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-[#e95f45]">
              Feedback loop
            </p>
            <h2 className="mt-2 text-2xl font-semibold tracking-normal">
              Synthetic A/B feedback
            </h2>
          </div>
          <button
            data-testid="synthetic-improvement-export-json"
            type="button"
            onClick={onDownload}
            className="synthetic-button synthetic-button-secondary inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-950"
          >
            <Download className="size-4" />
            Export improvement
          </button>
        </div>

        <div className="synthetic-score-layout mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <VariantScorecard
            variants={[...report.variants, optimizedSummary]}
            winnerVariantId={report.winner.variantId}
            optimizedVariantId={optimizedSummary.variantId}
          />

          <div className="synthetic-side-stack">
            <section className="synthetic-card synthetic-projection-card rounded-lg border border-stone-200 bg-white p-5">
              <div className="flex items-center gap-2">
                <ArrowUpRight className="size-4 text-[#e95f45]" />
                <h3 className="text-lg font-semibold">Projected self-improvement</h3>
              </div>
              <dl className="mt-4 grid grid-cols-2 gap-3 text-sm">
                <SummaryValue
                  label="Score lift"
                  value={formatSigned(report.optimizedProjection.scoreUplift)}
                />
                <SummaryValue
                  label="Completion"
                  value={formatSignedPercent(
                    report.optimizedProjection.completionRateUplift,
                  )}
                />
                <SummaryValue
                  label="Dwell saved"
                  value={formatMs(report.optimizedProjection.dwellReductionMs)}
                />
                <SummaryValue
                  label="Winner"
                  value={report.optimizedVariant.basedOnVariantId}
                />
              </dl>
              <p className="mt-4 text-sm leading-6 text-stone-600">
                {report.optimizedVariant.description}
              </p>
            </section>

            <FeatureCandidateCard candidate={report.featureCandidate} />
          </div>
        </div>

        <div className="synthetic-recommendation-grid mt-5 grid gap-3 md:grid-cols-2">
          {report.recommendations.map((recommendation) => (
            <RecommendationCard
              key={recommendation.id}
              recommendation={recommendation}
            />
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCandidateCard({
  candidate,
}: {
  candidate: SyntheticFeatureCandidate;
}) {
  return (
    <section
      data-testid="synthetic-feature-candidate"
      className="synthetic-card synthetic-feature-card rounded-lg border border-stone-200 bg-white p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sparkles className="size-4 text-[#e95f45]" />
          <h3 className="text-lg font-semibold">Next feature candidate</h3>
        </div>
        <span className="synthetic-confidence-pill">
          <Gauge className="size-4" />
          {candidate.confidence}
        </span>
      </div>
      <p className="synthetic-feature-source">{candidate.source}</p>
      <div>
        <p className="synthetic-feature-title">{candidate.title}</p>
        <p className="synthetic-feature-problem">{candidate.problem}</p>
      </div>
      <div className="synthetic-feature-list-grid">
        <FeatureCandidateList label="MVP" items={candidate.mvp} />
        <FeatureCandidateList label="Success metrics" items={candidate.metrics} />
      </div>
      <div className="synthetic-feature-evidence">
        {candidate.evidence.map((item) => (
          <span key={item}>
            <CheckCircle2 className="size-4" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function FeatureCandidateList({
  label,
  items,
}: {
  label: string;
  items: string[];
}) {
  return (
    <section className="synthetic-feature-list">
      <strong>{label}</strong>
      <div>
        {items.slice(0, 4).map((item) => (
          <span key={item}>
            <CheckCircle2 className="size-4" />
            {item}
          </span>
        ))}
      </div>
    </section>
  );
}

function VariantScorecard({
  variants,
  winnerVariantId,
  optimizedVariantId,
}: {
  variants: SyntheticABVariantSummary[];
  winnerVariantId: string;
  optimizedVariantId: string;
}) {
  return (
    <section className="synthetic-card synthetic-scorecard overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-5 py-4">
        <h3 className="text-lg font-semibold">A/B scorecard</h3>
        <p className="mt-1 text-sm text-stone-500">
          {variants[0]?.sessions ?? 0} synthetic sessions per variant
        </p>
      </div>
      <div className="overflow-x-auto">
        <table
          data-testid="synthetic-ab-table"
          className="min-w-full divide-y divide-stone-200 text-left text-sm"
        >
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Variant</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Complete</th>
              <th className="px-4 py-3">Dwell</th>
              <th className="px-4 py-3">Friction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {variants.map((variant) => (
              <tr
                key={variant.variantId}
                data-testid={`synthetic-ab-row-${variant.variantId}`}
                className={
                  variant.variantId === optimizedVariantId
                    ? "bg-[#fff7f4]"
                    : undefined
                }
              >
                <td className="px-4 py-3">
                  <div className="font-semibold text-stone-950">
                    {variant.label}
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1 text-xs text-stone-500">
                    {variant.variantId === winnerVariantId ? (
                      <span className="rounded-full bg-stone-950 px-2 py-0.5 font-semibold text-white">
                        Winner
                      </span>
                    ) : null}
                    {variant.variantId === optimizedVariantId ? (
                      <span className="rounded-full bg-[#ffe1d8] px-2 py-0.5 font-semibold text-[#b5422b]">
                        Projected
                      </span>
                    ) : null}
                  </div>
                </td>
                <td className="px-4 py-3 font-semibold">{variant.score}</td>
                <td className="px-4 py-3">
                  {formatPercent(variant.completionRate)}
                </td>
                <td className="px-4 py-3">{formatMs(variant.averageDwellMs)}</td>
                <td className="px-4 py-3">
                  {formatPercent(variant.feedback.totalFrictionRate)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecommendationCard({
  recommendation,
}: {
  recommendation: SyntheticImprovementRecommendation;
}) {
  const changes = [
    ...Object.entries(recommendation.actionScoreAdjustments ?? {}).map(
      ([key, value]) => `${key} ${formatSigned(Number(value))}`,
    ),
    ...Object.entries(recommendation.screenDwellMultipliers ?? {}).map(
      ([key, value]) => `${key} ${Math.round(Number(value) * 100)}% dwell`,
    ),
  ];

  return (
    <article
      data-testid={`synthetic-recommendation-${recommendation.id}`}
      className="synthetic-card synthetic-recommendation-card rounded-lg border border-stone-200 bg-white p-5"
    >
      <div className="flex items-start gap-3">
        <div className="grid size-9 shrink-0 place-items-center rounded-full bg-[#fff3ef] text-[#e95f45]">
          <Lightbulb className="size-4" />
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            Priority {recommendation.priority} · impact {recommendation.impact}
          </p>
          <h3 className="mt-1 text-lg font-semibold">
            {recommendation.title}
          </h3>
          <p className="mt-2 text-sm leading-6 text-stone-600">
            {recommendation.rationale}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {changes.slice(0, 5).map((change) => (
          <span
            key={change}
            className="rounded-full bg-stone-100 px-3 py-1 text-xs font-semibold text-stone-700"
          >
            {change}
          </span>
        ))}
      </div>
    </article>
  );
}

function AppliedChangeStep({
  generationId,
  appliedCandidate,
  scoreDelta,
  dwellDelta,
  frictionDelta,
}: {
  generationId: string;
  appliedCandidate?: SyntheticIterationCandidate;
  scoreDelta: number;
  dwellDelta: number;
  frictionDelta: number;
}) {
  const recipeCopies = appliedCandidate
    ? uniqueRecipeIds(appliedCandidate.appliedRecommendationIds).map(
        describeIterationRecipe,
      )
    : [];

  return (
    <article className="synthetic-applied-step">
      <div className="synthetic-applied-step-title">
        <span>{generationId}</span>
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-stone-500">
            {appliedCandidate ? "Applied winner" : "Baseline"}
          </p>
          <strong>
            {appliedCandidate
              ? compactCandidateTitle(appliedCandidate)
              : "Original booking flow"}
          </strong>
        </div>
      </div>

      {recipeCopies.length > 0 ? (
        <ul className="synthetic-applied-recipe-list">
          {recipeCopies.map((recipe) => (
            <li key={recipe.label}>
              <span>{recipe.label}</span>
              <p>{recipe.detail}</p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="synthetic-baseline-copy">
          Search, filters, listing detail, and checkout are evaluated as the
          unchanged control flow.
        </p>
      )}

      <dl className="synthetic-applied-metrics">
        <div>
          <dt>Score</dt>
          <dd>{appliedCandidate ? formatSigned(roundNumber(scoreDelta)) : "base"}</dd>
        </div>
        <div>
          <dt>Dwell</dt>
          <dd>{appliedCandidate ? formatDwellTrend(dwellDelta) : "base"}</dd>
        </div>
        <div>
          <dt>Friction</dt>
          <dd>{appliedCandidate ? formatRateTrend(frictionDelta) : "base"}</dd>
        </div>
      </dl>
    </article>
  );
}

function compactCandidateTitle(candidate: SyntheticIterationCandidate): string {
  return candidate.title.replace(/^Variant [A-E] candidate \d+:\s*/, "");
}

function uniqueRecipeIds(ids: string[]): string[] {
  return ids.filter((id, index) => ids.indexOf(id) === index);
}

function describeIterationRecipe(recipeId: string): IterationRecipeCopy {
  if (recipeId.startsWith("compress_") && recipeId.endsWith("_screen")) {
    const screen = recipeId.replace(/^compress_/, "").replace(/_screen$/, "");
    const screenLabel = humanizeToken(screen);

    return {
      label: `Compress ${screenLabel} screen`,
      detail: `The slowest ${screenLabel.toLowerCase()} screen gets a dwell multiplier cut.`,
    };
  }

  return (
    iterationRecipeCopy[recipeId] ?? {
      label: humanizeToken(recipeId),
      detail: "This candidate adjusts action confidence and screen dwell multipliers.",
    }
  );
}

function humanizeToken(value: string): string {
  return value
    .split("_")
    .filter(Boolean)
    .map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`)
    .join(" ");
}

function MetricRow({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-wide text-stone-500">
        <span>{label}</span>
        <span>{value.toFixed(2)}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-stone-100">
        <div
          className="h-2 rounded-full bg-[#e95f45]"
          style={{ width: `${Math.min(100, Math.max(0, value * 100))}%` }}
        />
      </div>
    </div>
  );
}

function SummaryValue({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-lg bg-stone-50 p-3">
      <dt className="text-xs font-semibold uppercase tracking-wide text-stone-500">
        {label}
      </dt>
      <dd className="mt-1 font-semibold">{value}</dd>
    </div>
  );
}

function CandidateTable({ step }: { step: SyntheticJourneyStep }) {
  return (
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
      <div className="border-b border-stone-200 px-5 py-4">
        <h2 className="text-lg font-semibold">Candidate actions</h2>
        <p className="mt-1 text-sm text-stone-500">
          Temperature {step.selection.temperature} · draw {step.selection.draw} of{" "}
          {step.selection.totalWeight}
        </p>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-stone-200 text-left text-sm">
          <thead className="bg-stone-50 text-xs uppercase tracking-wide text-stone-500">
            <tr>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Base</th>
              <th className="px-4 py-3">Task</th>
              <th className="px-4 py-3">Preference</th>
              <th className="px-4 py-3">Effort</th>
              <th className="px-4 py-3">Risk</th>
              <th className="px-4 py-3">UX adj</th>
              <th className="px-4 py-3">Probability</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100">
            {step.candidates.map((candidate) => {
              const probability = step.selection.probabilities.find(
                (item) => item.id === candidate.id,
              );
              return (
                <tr
                  key={candidate.id}
                  className={
                    candidate.id === step.action.id ? "bg-[#fff7f4]" : undefined
                  }
                >
                  <td className="px-4 py-3 font-semibold text-stone-900">
                    {candidate.id}
                  </td>
                  <td className="px-4 py-3">{candidate.scoreBreakdown.total}</td>
                  <td className="px-4 py-3">{candidate.scoreBreakdown.base}</td>
                  <td className="px-4 py-3">
                    {candidate.scoreBreakdown.taskRelevance}
                  </td>
                  <td className="px-4 py-3">
                    {candidate.scoreBreakdown.preferenceMatch}
                  </td>
                  <td className="px-4 py-3">
                    -{candidate.scoreBreakdown.effortPenalty.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    -{candidate.scoreBreakdown.riskPenalty.toFixed(2)}
                  </td>
                  <td className="px-4 py-3">
                    {formatSigned(candidate.scoreBreakdown.experienceAdjustment)}
                  </td>
                  <td className="px-4 py-3">
                    {probability ? `${Math.round(probability.probability * 100)}%` : "-"}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function DwellTable({ step }: { step: SyntheticJourneyStep }) {
  const rows = [
    ["base", step.dwellBreakdown.base],
    ["resultComplexity", step.dwellBreakdown.resultComplexity],
    ["formComplexity", step.dwellBreakdown.formComplexity],
    ["policyPressure", step.dwellBreakdown.policyPressure],
    ["pricePressure", step.dwellBreakdown.pricePressure],
    ["actionUncertainty", step.dwellBreakdown.actionUncertainty],
    ["subtotalBeforeMultipliers", step.dwellBreakdown.subtotalBeforeMultipliers],
    ["patienceMultiplier", step.dwellBreakdown.patienceMultiplier],
    ["speedMultiplier", step.dwellBreakdown.speedMultiplier],
    ["jitter", step.dwellBreakdown.jitter],
    ["experienceMultiplier", step.dwellBreakdown.experienceMultiplier],
    ["total", step.dwellBreakdown.total],
  ];

  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5">
      <h2 className="text-lg font-semibold">Dwell breakdown</h2>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {rows.map(([label, value]) => (
          <div
            key={label}
            className="flex items-center justify-between gap-4 rounded-lg bg-stone-50 px-3 py-2 text-sm"
          >
            <span className="font-medium text-stone-600">{label}</span>
            <span className="font-semibold text-stone-950">{value}</span>
          </div>
        ))}
      </div>
    </section>
  );
}

function StatePanel({ step }: { step: SyntheticJourneyStep }) {
  return (
    <section className="grid gap-4 md:grid-cols-2">
      <JsonPanel label="State before" value={step.stateBefore} />
      <JsonPanel label="State after" value={step.stateAfter} />
    </section>
  );
}

function JsonPanel({ label, value }: { label: string; value: unknown }) {
  return (
    <section className="rounded-lg border border-stone-200 bg-white p-5">
      <h2 className="text-lg font-semibold">{label}</h2>
      <pre className="mt-4 max-h-80 overflow-auto rounded-lg bg-stone-950 p-4 text-xs leading-5 text-stone-100">
        {JSON.stringify(value, null, 2)}
      </pre>
    </section>
  );
}

function formatMs(ms: number): string {
  return ms >= 1_000 ? `${(ms / 1_000).toFixed(1)}s` : `${ms}ms`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function formatSigned(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function formatSignedPercent(value: number): string {
  return value > 0 ? `+${formatPercent(value)}` : formatPercent(value);
}

function formatDwellTrend(value: number): string {
  if (value > 0) return `${formatMs(value)} faster`;
  if (value < 0) return `${formatMs(Math.abs(value))} slower`;
  return "flat";
}

function formatRateTrend(value: number): string {
  const points = Math.round(Math.abs(value) * 100);

  if (value > 0) return `${points}pp lower`;
  if (value < 0) return `${points}pp higher`;
  return "flat";
}

function roundNumber(value: number): number {
  return Number(value.toFixed(2));
}

function SyntheticCriticalStyles() {
  return (
    <style>{`
      [data-synthetic-dashboard] {
        --synthetic-bg: #f7f5f0;
        --synthetic-panel: #ffffff;
        --synthetic-ink: #1c1917;
        --synthetic-muted: #6b625b;
        --synthetic-line: #e7e2da;
        --synthetic-soft: #f4f1ec;
        --synthetic-accent: #e95f45;
        --synthetic-accent-soft: #fff3ef;
        min-height: 100vh;
        background: var(--synthetic-bg);
        color: var(--synthetic-ink);
        font-family:
          Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont,
          "Segoe UI", sans-serif;
        letter-spacing: 0;
      }

      [data-synthetic-dashboard] *,
      [data-synthetic-dashboard] *::before,
      [data-synthetic-dashboard] *::after {
        box-sizing: border-box;
      }

      [data-synthetic-dashboard] .block {
        display: block;
      }

      [data-synthetic-dashboard] .inline-flex {
        display: inline-flex;
      }

      [data-synthetic-dashboard] .flex {
        display: flex;
      }

      [data-synthetic-dashboard] .grid {
        display: grid;
      }

      [data-synthetic-dashboard] .hidden {
        display: none;
      }

      [data-synthetic-dashboard] .w-full {
        width: 100%;
      }

      [data-synthetic-dashboard] .w-fit {
        width: fit-content;
      }

      [data-synthetic-dashboard] .min-w-0 {
        min-width: 0;
      }

      [data-synthetic-dashboard] .min-w-full {
        min-width: 100%;
      }

      [data-synthetic-dashboard] .shrink-0 {
        flex-shrink: 0;
      }

      [data-synthetic-dashboard] .size-4 {
        width: 1rem;
        height: 1rem;
      }

      [data-synthetic-dashboard] .size-9 {
        width: 2.25rem;
        height: 2.25rem;
      }

      [data-synthetic-dashboard] .h-2 {
        height: 0.5rem;
      }

      [data-synthetic-dashboard] .max-h-80 {
        max-height: 20rem;
      }

      [data-synthetic-dashboard] .items-center {
        align-items: center;
      }

      [data-synthetic-dashboard] .items-start {
        align-items: flex-start;
      }

      [data-synthetic-dashboard] .justify-between {
        justify-content: space-between;
      }

      [data-synthetic-dashboard] .place-items-center {
        place-items: center;
      }

      [data-synthetic-dashboard] .text-left {
        text-align: left;
      }

      [data-synthetic-dashboard] .overflow-hidden {
        overflow: hidden;
      }

      [data-synthetic-dashboard] .overflow-auto {
        overflow: auto;
      }

      [data-synthetic-dashboard] .overflow-x-auto {
        overflow-x: auto;
      }

      [data-synthetic-dashboard] .grid-cols-2 {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      [data-synthetic-dashboard] .gap-2 {
        gap: 0.5rem;
      }

      [data-synthetic-dashboard] .gap-3 {
        gap: 0.75rem;
      }

      [data-synthetic-dashboard] .gap-4 {
        gap: 1rem;
      }

      [data-synthetic-dashboard] .gap-6 {
        gap: 1.5rem;
      }

      [data-synthetic-dashboard] .px-2 {
        padding-left: 0.5rem;
        padding-right: 0.5rem;
      }

      [data-synthetic-dashboard] .px-3 {
        padding-left: 0.75rem;
        padding-right: 0.75rem;
      }

      [data-synthetic-dashboard] .px-4 {
        padding-left: 1rem;
        padding-right: 1rem;
      }

      [data-synthetic-dashboard] .px-5 {
        padding-left: 1.25rem;
        padding-right: 1.25rem;
      }

      [data-synthetic-dashboard] .py-0\\.5 {
        padding-top: 0.125rem;
        padding-bottom: 0.125rem;
      }

      [data-synthetic-dashboard] .py-1 {
        padding-top: 0.25rem;
        padding-bottom: 0.25rem;
      }

      [data-synthetic-dashboard] .py-2 {
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
      }

      [data-synthetic-dashboard] .py-3 {
        padding-top: 0.75rem;
        padding-bottom: 0.75rem;
      }

      [data-synthetic-dashboard] .py-4 {
        padding-top: 1rem;
        padding-bottom: 1rem;
      }

      [data-synthetic-dashboard] .p-3 {
        padding: 0.75rem;
      }

      [data-synthetic-dashboard] .p-4 {
        padding: 1rem;
      }

      [data-synthetic-dashboard] .p-5 {
        padding: 1.25rem;
      }

      [data-synthetic-dashboard] .mt-1 {
        margin-top: 0.25rem;
      }

      [data-synthetic-dashboard] .mt-2 {
        margin-top: 0.5rem;
      }

      [data-synthetic-dashboard] .mt-4 {
        margin-top: 1rem;
      }

      [data-synthetic-dashboard] .mt-5 {
        margin-top: 1.25rem;
      }

      [data-synthetic-dashboard] .mt-6 {
        margin-top: 1.5rem;
      }

      [data-synthetic-dashboard] .ml-2 {
        margin-left: 0.5rem;
      }

      [data-synthetic-dashboard] .rounded-lg {
        border-radius: 10px;
      }

      [data-synthetic-dashboard] .rounded-full {
        border-radius: 999px;
      }

      [data-synthetic-dashboard] .border {
        border: 1px solid var(--synthetic-line);
      }

      [data-synthetic-dashboard] .border-b {
        border-bottom: 1px solid var(--synthetic-line);
      }

      [data-synthetic-dashboard] .bg-white {
        background: #ffffff;
      }

      [data-synthetic-dashboard] .bg-stone-50,
      [data-synthetic-dashboard] .bg-stone-100 {
        background: #f8f6f3;
      }

      [data-synthetic-dashboard] .bg-stone-950 {
        background: var(--synthetic-ink);
      }

      [data-synthetic-dashboard] .text-white {
        color: #ffffff;
      }

      [data-synthetic-dashboard] .text-stone-950,
      [data-synthetic-dashboard] .text-stone-900 {
        color: var(--synthetic-ink);
      }

      [data-synthetic-dashboard] .text-stone-800,
      [data-synthetic-dashboard] .text-stone-700,
      [data-synthetic-dashboard] .text-stone-600 {
        color: #5c544d;
      }

      [data-synthetic-dashboard] .text-stone-500 {
        color: #7c736c;
      }

      [data-synthetic-dashboard] .text-xs {
        font-size: 0.75rem;
      }

      [data-synthetic-dashboard] .text-sm {
        font-size: 0.875rem;
      }

      [data-synthetic-dashboard] .text-lg {
        font-size: 1.125rem;
      }

      [data-synthetic-dashboard] .text-2xl {
        font-size: 1.5rem;
      }

      [data-synthetic-dashboard] .font-normal {
        font-weight: 400;
      }

      [data-synthetic-dashboard] .font-medium {
        font-weight: 600;
      }

      [data-synthetic-dashboard] .font-semibold {
        font-weight: 750;
      }

      [data-synthetic-dashboard] .uppercase {
        text-transform: uppercase;
      }

      [data-synthetic-dashboard] .tracking-wide {
        letter-spacing: 0.04em;
      }

      [data-synthetic-dashboard] .leading-5 {
        line-height: 1.25rem;
      }

      [data-synthetic-dashboard] .leading-6 {
        line-height: 1.5rem;
      }

      [data-synthetic-dashboard] .divide-y > * + * {
        border-top: 1px solid var(--synthetic-line);
      }

      [data-synthetic-dashboard] .divide-stone-100 > * + *,
      [data-synthetic-dashboard] .divide-stone-200 > * + * {
        border-color: var(--synthetic-line);
      }

      [data-synthetic-dashboard] h1,
      [data-synthetic-dashboard] h2,
      [data-synthetic-dashboard] h3,
      [data-synthetic-dashboard] p,
      [data-synthetic-dashboard] dl,
      [data-synthetic-dashboard] dd,
      [data-synthetic-dashboard] table {
        margin: 0;
      }

      [data-synthetic-dashboard] h1 {
        font-size: clamp(2rem, 4vw, 3.2rem);
        line-height: 1;
        font-weight: 760;
      }

      [data-synthetic-dashboard] h2 {
        font-size: clamp(1.35rem, 2vw, 1.8rem);
        line-height: 1.15;
        font-weight: 720;
      }

      [data-synthetic-dashboard] h3 {
        font-size: 1.05rem;
        line-height: 1.2;
        font-weight: 700;
      }

      [data-synthetic-dashboard] .synthetic-hero {
        background: #ffffff;
        border-bottom: 1px solid var(--synthetic-line);
      }

      [data-synthetic-dashboard] .synthetic-container {
        width: min(100%, 1240px);
        margin-inline: auto;
        padding: 24px clamp(16px, 3vw, 32px);
      }

      [data-synthetic-dashboard] .synthetic-heading-row {
        display: flex;
        align-items: flex-end;
        justify-content: space-between;
        gap: 16px;
      }

      [data-synthetic-dashboard] .synthetic-heading-row p:first-child {
        margin-bottom: 8px;
        color: var(--synthetic-accent);
        font-size: 0.76rem;
        font-weight: 800;
        letter-spacing: 0.16em;
        text-transform: uppercase;
      }

      [data-synthetic-dashboard] .synthetic-button {
        display: inline-flex;
        min-height: 38px;
        width: fit-content;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 999px;
        padding: 9px 16px;
        border: 1px solid transparent;
        font: inherit;
        font-size: 0.875rem;
        font-weight: 700;
        cursor: pointer;
      }

      [data-synthetic-dashboard] .synthetic-button svg {
        width: 16px;
        height: 16px;
      }

      [data-synthetic-dashboard] .synthetic-button-primary {
        background: var(--synthetic-ink);
        color: #ffffff;
      }

      [data-synthetic-dashboard] .synthetic-button-secondary {
        background: #ffffff;
        color: var(--synthetic-ink);
        border-color: var(--synthetic-line);
      }

      [data-synthetic-dashboard] .synthetic-control-grid,
      [data-synthetic-dashboard] .synthetic-score-layout,
      [data-synthetic-dashboard] .synthetic-recommendation-grid,
      [data-synthetic-dashboard] .synthetic-inspector-layout {
        display: grid;
        gap: 16px;
      }

      [data-synthetic-dashboard] .synthetic-control-grid {
        grid-template-columns: repeat(3, minmax(0, 1fr));
        margin-top: 22px;
      }

      [data-synthetic-dashboard] label {
        display: block;
        color: #4b423b;
        font-size: 0.875rem;
        font-weight: 700;
      }

      [data-synthetic-dashboard] select,
      [data-synthetic-dashboard] input {
        display: block;
        width: 100%;
        min-height: 40px;
        margin-top: 8px;
        border: 1px solid #d7d0c8;
        border-radius: 12px;
        background: #ffffff;
        padding: 8px 12px;
        color: var(--synthetic-ink);
        font: inherit;
        font-weight: 500;
      }

      [data-testid="synthetic-improvement-panel"] {
        background: #fffdf8;
        border-bottom: 1px solid var(--synthetic-line);
      }

      [data-synthetic-dashboard] .synthetic-score-layout {
        grid-template-columns: minmax(0, 1fr) 360px;
        margin-top: 20px;
      }

      [data-synthetic-dashboard] .synthetic-side-stack {
        display: grid;
        align-content: start;
        gap: 16px;
      }

      [data-synthetic-dashboard] .synthetic-recommendation-grid {
        grid-template-columns: repeat(2, minmax(0, 1fr));
        margin-top: 18px;
      }

      [data-synthetic-dashboard] .synthetic-loop-badge {
        display: inline-flex;
        align-items: center;
        width: fit-content;
        border: 1px solid #f0c8bb;
        border-radius: 999px;
        background: #fff3ef;
        padding: 9px 14px;
        color: #a33d29;
        font-size: 0.875rem;
        font-weight: 800;
      }

      [data-synthetic-dashboard] .synthetic-loop-summary {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 12px;
      }

      [data-synthetic-dashboard] .synthetic-applied-strip {
        margin-top: 20px;
        border: 1px solid var(--synthetic-line);
        border-radius: 8px;
        background: #fbfaf7;
        padding: 16px;
      }

      [data-synthetic-dashboard] .synthetic-applied-strip-heading {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      [data-synthetic-dashboard] .synthetic-applied-strip-heading svg {
        width: 18px;
        height: 18px;
        flex: 0 0 18px;
        color: var(--synthetic-accent);
      }

      [data-synthetic-dashboard] .synthetic-applied-strip-heading h3 {
        margin-top: 2px;
        color: var(--synthetic-ink);
        font-size: 1.05rem;
        line-height: 1.25;
      }

      [data-synthetic-dashboard] .synthetic-applied-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(0, 1fr));
        gap: 10px;
        margin-top: 14px;
      }

      [data-synthetic-dashboard] .synthetic-applied-step {
        display: flex;
        min-height: 268px;
        flex-direction: column;
        border: 1px solid #eadfd5;
        border-left: 4px solid var(--synthetic-accent);
        border-radius: 8px;
        background: #ffffff;
        padding: 12px;
      }

      [data-synthetic-dashboard] .synthetic-applied-step-title {
        display: flex;
        align-items: flex-start;
        gap: 10px;
      }

      [data-synthetic-dashboard] .synthetic-applied-step-title > span {
        display: grid;
        width: 34px;
        height: 34px;
        flex: 0 0 34px;
        place-items: center;
        border-radius: 999px;
        background: var(--synthetic-ink);
        color: #ffffff;
        font-size: 0.9rem;
        font-weight: 850;
      }

      [data-synthetic-dashboard] .synthetic-applied-step-title strong {
        display: block;
        margin-top: 2px;
        color: var(--synthetic-ink);
        font-size: 0.92rem;
        line-height: 1.25;
      }

      [data-synthetic-dashboard] .synthetic-baseline-copy {
        margin-top: 14px;
        color: #5c544d;
        font-size: 0.84rem;
        line-height: 1.45;
      }

      [data-synthetic-dashboard] .synthetic-applied-recipe-list {
        display: grid;
        gap: 9px;
        margin: 14px 0 0;
        padding: 0;
        list-style: none;
      }

      [data-synthetic-dashboard] .synthetic-applied-recipe-list li span {
        display: block;
        color: var(--synthetic-ink);
        font-size: 0.84rem;
        font-weight: 800;
        line-height: 1.25;
      }

      [data-synthetic-dashboard] .synthetic-applied-recipe-list li p {
        margin-top: 3px;
        color: #6d625a;
        font-size: 0.78rem;
        line-height: 1.35;
      }

      [data-synthetic-dashboard] .synthetic-applied-metrics {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 6px;
        margin-top: auto;
        padding-top: 12px;
      }

      [data-synthetic-dashboard] .synthetic-applied-metrics div {
        border-radius: 6px;
        background: #f6f2ed;
        padding: 7px;
      }

      [data-synthetic-dashboard] .synthetic-applied-metrics dt {
        color: #7c736c;
        font-size: 0.68rem;
        font-weight: 800;
        line-height: 1;
        text-transform: uppercase;
      }

      [data-synthetic-dashboard] .synthetic-applied-metrics dd {
        margin-top: 4px;
        color: var(--synthetic-ink);
        font-size: 0.76rem;
        font-weight: 800;
        line-height: 1.15;
      }

      [data-synthetic-dashboard] .synthetic-iteration-grid {
        display: grid;
        grid-template-columns: repeat(5, minmax(180px, 1fr));
        gap: 12px;
        margin-top: 20px;
      }

      [data-synthetic-dashboard] .synthetic-generation-card {
        min-height: 520px;
      }

      [data-synthetic-dashboard] .synthetic-score-pill {
        display: grid;
        min-width: 48px;
        height: 48px;
        place-items: center;
        border-radius: 999px;
        background: var(--synthetic-ink);
        color: #ffffff;
        font-size: 1rem;
        font-weight: 850;
      }

      [data-synthetic-dashboard] .synthetic-score-bar {
        height: 10px;
        margin-top: 18px;
        overflow: hidden;
        border-radius: 999px;
        background: #eee8e0;
      }

      [data-synthetic-dashboard] .synthetic-score-bar span {
        display: block;
        height: 100%;
        border-radius: inherit;
        background: linear-gradient(90deg, #e95f45, #1f7a6b);
      }

      [data-synthetic-dashboard] .synthetic-selected-candidate {
        margin-top: 16px;
        border-top: 1px solid var(--synthetic-line);
        padding-top: 14px;
      }

      [data-synthetic-dashboard] .synthetic-applied-candidate {
        margin-top: 16px;
        border-top: 1px solid var(--synthetic-line);
        padding-top: 14px;
      }

      [data-synthetic-dashboard] .synthetic-applied-candidate p:nth-child(2) {
        color: var(--synthetic-ink);
        font-size: 0.92rem;
        line-height: 1.35;
      }

      [data-synthetic-dashboard] .synthetic-recipe-chip-row {
        display: flex;
        flex-wrap: wrap;
        gap: 6px;
        margin-top: 10px;
      }

      [data-synthetic-dashboard] .synthetic-recipe-chip-row span {
        border: 1px solid #dfd4cb;
        border-radius: 999px;
        background: #fbfaf7;
        padding: 5px 8px;
        color: #5f554e;
        font-size: 0.72rem;
        font-weight: 750;
        line-height: 1.1;
      }

      [data-synthetic-dashboard] .synthetic-selected-candidate p:nth-child(2) {
        color: var(--synthetic-ink);
        font-size: 0.92rem;
        line-height: 1.35;
      }

      [data-synthetic-dashboard] .synthetic-loop-footnote,
      [data-synthetic-dashboard] .synthetic-loop-claim {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 16px;
        color: #5c544d;
        font-size: 0.875rem;
        line-height: 1.5;
      }

      [data-synthetic-dashboard] .synthetic-loop-footnote svg {
        width: 16px;
        height: 16px;
        flex: 0 0 16px;
        color: #1f7a6b;
      }

      [data-synthetic-dashboard] .synthetic-loop-claim {
        display: block;
        margin-top: 8px;
        font-weight: 700;
      }

      [data-synthetic-dashboard] .synthetic-inspector-layout {
        grid-template-columns: 360px minmax(0, 1fr);
      }

      [data-synthetic-dashboard] .synthetic-card {
        overflow: hidden;
        border: 1px solid var(--synthetic-line);
        border-radius: 10px;
        background: var(--synthetic-panel);
      }

      [data-synthetic-dashboard] .synthetic-card:not(.synthetic-scorecard) {
        padding: 20px;
      }

      [data-synthetic-dashboard] .synthetic-scorecard > div:first-child {
        border-bottom: 1px solid var(--synthetic-line);
        padding: 18px 20px;
      }

      [data-synthetic-dashboard] .synthetic-scorecard p,
      [data-synthetic-dashboard] .synthetic-projection-card p,
      [data-synthetic-dashboard] .synthetic-recommendation-card p {
        margin-top: 6px;
        color: var(--synthetic-muted);
        font-size: 0.875rem;
        line-height: 1.5;
      }

      [data-testid="synthetic-ab-table"] {
        width: 100%;
        border-collapse: collapse;
        table-layout: auto;
        font-size: 0.875rem;
      }

      [data-testid="synthetic-ab-table"] th,
      [data-testid="synthetic-ab-table"] td {
        border-bottom: 1px solid #f0ece7;
        padding: 13px 16px;
        text-align: left;
        vertical-align: middle;
      }

      [data-testid="synthetic-ab-table"] th {
        background: #faf8f5;
        color: #7c736c;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      [data-testid="synthetic-ab-table"] td {
        color: #2f2925;
        font-weight: 600;
      }

      [data-synthetic-dashboard] .synthetic-projection-card dl,
      [data-synthetic-dashboard] .synthetic-card dl {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 12px;
      }

      [data-synthetic-dashboard] dt {
        color: #80766f;
        font-size: 0.72rem;
        font-weight: 800;
        letter-spacing: 0.08em;
        text-transform: uppercase;
      }

      [data-synthetic-dashboard] dd {
        margin-top: 4px;
        color: var(--synthetic-ink);
        font-weight: 800;
      }

      [data-synthetic-dashboard] .synthetic-projection-card dl > div,
      [data-synthetic-dashboard] .synthetic-card dl > div {
        border-radius: 8px;
        background: #f8f6f3;
        padding: 12px;
      }

      [data-synthetic-dashboard] .synthetic-recommendation-card {
        min-height: 154px;
      }

      [data-synthetic-dashboard] .synthetic-feature-card {
        display: grid;
        gap: 14px;
      }

      [data-synthetic-dashboard] .synthetic-confidence-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        border-radius: 999px;
        background: #fff3ef;
        padding: 5px 9px;
        color: #b5422b;
        font-size: 0.75rem;
        font-weight: 800;
      }

      [data-synthetic-dashboard] .synthetic-feature-source {
        color: #7c736c;
        font-size: 0.875rem;
      }

      [data-synthetic-dashboard] .synthetic-feature-title {
        color: var(--synthetic-ink);
        font-size: 1rem;
        font-weight: 800;
      }

      [data-synthetic-dashboard] .synthetic-feature-problem {
        margin-top: 6px;
        color: var(--synthetic-muted);
        font-size: 0.875rem;
        line-height: 1.5;
      }

      [data-synthetic-dashboard] .synthetic-feature-list-grid,
      [data-synthetic-dashboard] .synthetic-feature-evidence {
        display: grid;
        gap: 10px;
      }

      [data-synthetic-dashboard] .synthetic-feature-list {
        border-radius: 8px;
        background: #f8f6f3;
        padding: 12px;
      }

      [data-synthetic-dashboard] .synthetic-feature-list strong {
        color: #5c544d;
        font-size: 0.75rem;
        font-weight: 800;
        text-transform: uppercase;
      }

      [data-synthetic-dashboard] .synthetic-feature-list div {
        display: grid;
        gap: 8px;
        margin-top: 8px;
      }

      [data-synthetic-dashboard] .synthetic-feature-list span,
      [data-synthetic-dashboard] .synthetic-feature-evidence span {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        color: #5c544d;
        font-size: 0.83rem;
        line-height: 1.45;
      }

      [data-synthetic-dashboard] .synthetic-feature-list svg,
      [data-synthetic-dashboard] .synthetic-feature-evidence svg,
      [data-synthetic-dashboard] .synthetic-confidence-pill svg {
        width: 16px;
        height: 16px;
        flex: 0 0 16px;
        color: var(--synthetic-accent);
      }

      [data-synthetic-dashboard] .synthetic-recommendation-card > div:first-child {
        display: flex;
        gap: 12px;
        align-items: flex-start;
      }

      [data-synthetic-dashboard] .synthetic-recommendation-card > div:first-child > div:first-child {
        display: grid;
        width: 36px;
        height: 36px;
        flex: 0 0 36px;
        place-items: center;
        border-radius: 999px;
        background: var(--synthetic-accent-soft);
        color: var(--synthetic-accent);
      }

      [data-synthetic-dashboard] .synthetic-recommendation-card svg {
        width: 16px;
        height: 16px;
      }

      [data-synthetic-dashboard] .synthetic-recommendation-card > div:last-child {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        margin-top: 16px;
      }

      [data-synthetic-dashboard] .synthetic-recommendation-card span,
      [data-testid="synthetic-ab-table"] span {
        display: inline-flex;
        align-items: center;
        border-radius: 999px;
        background: #f2eee9;
        padding: 4px 9px;
        color: #5c544d;
        font-size: 0.75rem;
        font-weight: 800;
      }

      [data-testid="synthetic-ab-table"] span {
        background: var(--synthetic-ink);
        color: #ffffff;
      }

      [data-testid="synthetic-ab-row-self_improved"] {
        background: #fff7f4;
      }

      [data-testid="synthetic-ab-row-self_improved"] span {
        background: #ffe1d8;
        color: #b5422b;
      }

      [data-synthetic-dashboard] .space-y-6 > * + * {
        margin-top: 24px;
      }

      [data-synthetic-dashboard] .space-y-2 > * + * {
        margin-top: 8px;
      }

      [data-synthetic-dashboard] button[data-testid^="synthetic-step-"] {
        display: block;
        width: 100%;
        border: 1px solid var(--synthetic-line);
        border-radius: 8px;
        background: #ffffff;
        padding: 12px;
        text-align: left;
        color: var(--synthetic-ink);
        font: inherit;
        font-size: 0.875rem;
        cursor: pointer;
      }

      [data-synthetic-dashboard] button[data-testid="synthetic-step-1"] {
        background: var(--synthetic-ink);
        color: #ffffff;
      }

      [data-synthetic-dashboard] pre {
        max-height: 320px;
        overflow: auto;
        border-radius: 8px;
        background: #17120f;
        padding: 16px;
        color: #fffaf2;
        font-size: 0.78rem;
        line-height: 1.5;
      }

      @media (max-width: 900px) {
        [data-synthetic-dashboard] .synthetic-heading-row {
          align-items: flex-start;
          flex-direction: column;
        }

        [data-synthetic-dashboard] .synthetic-control-grid,
        [data-synthetic-dashboard] .synthetic-score-layout,
        [data-synthetic-dashboard] .synthetic-recommendation-grid,
        [data-synthetic-dashboard] .synthetic-loop-summary,
        [data-synthetic-dashboard] .synthetic-applied-grid,
        [data-synthetic-dashboard] .synthetic-iteration-grid,
        [data-synthetic-dashboard] .synthetic-inspector-layout {
          grid-template-columns: 1fr;
        }
      }
    `}</style>
  );
}
