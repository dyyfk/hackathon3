"use client";

import { ArrowUpRight, Download, Lightbulb, SlidersHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import {
  runSyntheticABTest,
  type SyntheticABTestReport,
  type SyntheticABVariantSummary,
  type SyntheticImprovementRecommendation,
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

export default function SyntheticPage() {
  const [profileId, setProfileId] = useState(syntheticUserProfiles[0].id);
  const [taskId, setTaskId] = useState<SyntheticTaskId>("find_budget_stay");
  const [seed, setSeed] = useState("profile-demo");
  const [selectedStepIndex, setSelectedStepIndex] = useState(0);

  const abReport = useMemo(
    () => runSyntheticABTest({ seedPrefix: seed || "profile-demo" }),
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
    const blob = new Blob([JSON.stringify(abReport, null, 2)], {
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
    <main className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
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
              className="inline-flex w-fit items-center gap-2 rounded-full bg-stone-950 px-4 py-2 text-sm font-semibold text-white"
            >
              <Download className="size-4" />
              Export JSON
            </button>
          </div>

          <div className="mt-6 grid gap-3 lg:grid-cols-[1fr_1fr_1fr]">
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

      <ImprovementPanel report={abReport} onDownload={downloadImprovementJson} />

      <section className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[360px_minmax(0,1fr)] lg:px-8">
        <aside className="space-y-6">
          <section className="rounded-lg border border-stone-200 bg-white p-5">
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

          <section className="rounded-lg border border-stone-200 bg-white p-5">
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
            <section className="rounded-lg border border-stone-200 bg-white p-5">
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
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
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
            className="inline-flex w-fit items-center gap-2 rounded-full border border-stone-300 bg-white px-4 py-2 text-sm font-semibold text-stone-950"
          >
            <Download className="size-4" />
            Export improvement
          </button>
        </div>

        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1fr)_360px]">
          <VariantScorecard
            variants={[...report.variants, optimizedSummary]}
            winnerVariantId={report.winner.variantId}
            optimizedVariantId={optimizedSummary.variantId}
          />

          <section className="rounded-lg border border-stone-200 bg-white p-5">
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
        </div>

        <div className="mt-5 grid gap-3 md:grid-cols-2">
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
    <section className="overflow-hidden rounded-lg border border-stone-200 bg-white">
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
      className="rounded-lg border border-stone-200 bg-white p-5"
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
