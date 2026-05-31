"use client";

import {
  Activity,
  Cloud,
  Loader2,
  Play,
  RotateCcw,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Header } from "@/components/Header";
import { personas } from "@/data/personas";
import { tasks } from "@/data/tasks";
import { buildImprovementCards } from "@/lib/improvementCards";
import type {
  AgentResult,
  AgentSummary,
  VariantSummary,
} from "@/lib/summarizeAgentResults";

type RunSource = "idle" | "running" | "completed" | "fallback";

type RunAgentsResponse = {
  source: string;
  error?: string;
  totalRuns: number;
  results: AgentResult[];
  summary: AgentSummary;
};

const percentFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 0,
  style: "percent",
});

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 1,
});

export default function DashboardPage() {
  const [variantAUrl, setVariantAUrl] = useState("");
  const [variantBUrl, setVariantBUrl] = useState("");
  const [runsPerCase, setRunsPerCase] = useState(1);
  const [status, setStatus] = useState<RunSource>("idle");
  const [response, setResponse] = useState<RunAgentsResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setVariantAUrl(
      (current) => current || `${window.location.origin}/versionA`,
    );
    setVariantBUrl(
      (current) => current || `${window.location.origin}/versionB`,
    );
  }, []);

  const improvementCards = useMemo(
    () => (response ? buildImprovementCards(response.summary) : []),
    [response],
  );

  async function runAgents(useFallback = false) {
    setStatus("running");
    setError(null);

    if (!useFallback && (isLocalUrl(variantAUrl) || isLocalUrl(variantBUrl))) {
      setError(
        "Modal runs in the cloud and cannot open localhost. Use your deployed GitHub/Vercel URLs or a public tunnel URL.",
      );
      setStatus("idle");
      return;
    }

    try {
      const res = await fetch("/api/modal/run-agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          variantUrls: {
            A: variantAUrl,
            B: variantBUrl,
          },
          runsPerCase,
          personas,
          tasks,
          useFallback,
        }),
      });
      const data = (await res.json()) as RunAgentsResponse;

      setResponse(data);
      setStatus(data.source.includes("fallback") ? "fallback" : "completed");
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to run agents",
      );
      setStatus("idle");
    }
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-[#fbfaf8]">
        <section className="border-b border-stone-200 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-[#eef7f4] px-3 py-2 text-sm font-semibold text-stone-800">
                  <Cloud className="size-4" />
                  Powered by Modal cloud agent runs
                </div>
                <h1 className="mt-5 text-4xl font-semibold tracking-normal text-stone-950 sm:text-5xl">
                  UserTwin Modal Agent Dashboard
                </h1>
                <p className="mt-4 max-w-2xl text-lg leading-8 text-stone-600">
                  Run cloud synthetic users across A/B variants.
                </p>
              </div>
              <div className="rounded-2xl border border-stone-200 bg-[#fbfaf8] p-4">
                <p className="text-sm font-semibold text-stone-950">
                  Status
                </p>
                <p
                  data-testid="dashboard-status"
                  className="mt-2 text-2xl font-semibold capitalize text-[#e95f45]"
                >
                  {status}
                </p>
                <p
                  data-testid="result-source"
                  className="mt-1 text-sm text-stone-500"
                >
                  Source: {response?.source || "not run"}
                </p>
              </div>
            </div>

            <div className="mt-8 grid gap-4 rounded-2xl border border-stone-200 bg-[#fbfaf8] p-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_150px_auto_auto]">
              <label className="text-sm font-medium text-stone-700">
                Version A URL
                <input
                  value={variantAUrl}
                  onChange={(event) => setVariantAUrl(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-950"
                  placeholder="https://example.com/version-a"
                  aria-label="Version A URL"
                  data-testid="variant-a-url"
                />
              </label>
              <label className="text-sm font-medium text-stone-700">
                Version B URL
                <input
                  value={variantBUrl}
                  onChange={(event) => setVariantBUrl(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-950"
                  placeholder="https://example.com/version-b"
                  aria-label="Version B URL"
                  data-testid="variant-b-url"
                />
              </label>
              <label className="text-sm font-medium text-stone-700">
                Runs per case
                <input
                  type="number"
                  min={1}
                  max={5}
                  value={runsPerCase}
                  onChange={(event) =>
                    setRunsPerCase(Number(event.target.value || 1))
                  }
                  className="mt-2 w-full rounded-xl border border-stone-300 bg-white px-4 py-3 text-stone-950"
                  aria-label="Runs per case"
                />
              </label>
              <button
                type="button"
                onClick={() => runAgents(false)}
                disabled={status === "running"}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#e95f45] px-5 py-3 text-sm font-semibold text-white disabled:opacity-60 lg:self-end"
              >
                {status === "running" ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Run Modal Agent Swarm
              </button>
              <button
                type="button"
                onClick={() => runAgents(true)}
                disabled={status === "running"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-stone-300 bg-white px-5 py-3 text-sm font-semibold text-stone-950 disabled:opacity-60 lg:self-end"
              >
                <RotateCcw className="size-4" />
                Use fallback demo results
              </button>
            </div>
            {error ? (
              <p className="mt-3 text-sm font-medium text-[#e95f45]">{error}</p>
            ) : null}
          </div>
        </section>

        <section className="mx-auto max-w-7xl space-y-8 px-4 py-8 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-5">
            <MetricTile
              label="Total runs"
              value={response?.totalRuns.toString() || "0"}
              testId="total-runs"
            />
            <MetricTile
              label="Variant A success"
              value={formatSuccess(response?.summary.A)}
            />
            <MetricTile
              label="Variant B success"
              value={formatSuccess(response?.summary.B)}
            />
            <MetricTile
              label="Avg steps"
              value={formatAverageSteps(response?.summary)}
            />
            <MetricTile
              label="Avg friction"
              value={formatAverageFriction(response?.summary)}
            />
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <VariantSummaryPanel variant="A" summary={response?.summary.A} />
                <VariantSummaryPanel variant="B" summary={response?.summary.B} />
              </div>

              <section className="rounded-2xl border border-stone-200 bg-white p-5">
                <div className="flex items-center gap-2">
                  <Activity className="size-5 text-[#e95f45]" />
                  <h2 className="text-xl font-semibold text-stone-950">
                    Raw runs
                  </h2>
                </div>
                <div className="mt-5 overflow-x-auto">
                  <table
                    data-testid="raw-runs-table"
                    className="w-full min-w-[920px] text-left text-sm"
                  >
                    <thead className="text-stone-500">
                      <tr>
                        <th className="border-b border-stone-200 py-3 pr-4">
                          Run
                        </th>
                        <th className="border-b border-stone-200 py-3 pr-4">
                          Variant
                        </th>
                        <th className="border-b border-stone-200 py-3 pr-4">
                          Persona
                        </th>
                        <th className="border-b border-stone-200 py-3 pr-4">
                          Success
                        </th>
                        <th className="border-b border-stone-200 py-3 pr-4">
                          Time
                        </th>
                        <th className="border-b border-stone-200 py-3 pr-4">
                          Issues
                        </th>
                        <th className="border-b border-stone-200 py-3 pr-4">
                          Operation log
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {(response?.results || []).map((run) => (
                        <tr key={run.run_id}>
                          <td className="border-b border-stone-100 py-3 pr-4 font-medium text-stone-950">
                            {run.run_id}
                          </td>
                          <td className="border-b border-stone-100 py-3 pr-4">
                            {run.variant}
                          </td>
                          <td className="border-b border-stone-100 py-3 pr-4">
                            {run.persona}
                          </td>
                          <td className="border-b border-stone-100 py-3 pr-4">
                            {run.success ? "Yes" : "No"}
                          </td>
                          <td className="border-b border-stone-100 py-3 pr-4">
                            {run.time_to_complete_sec}s
                          </td>
                          <td className="border-b border-stone-100 py-3 pr-4 text-stone-600">
                            {(run.issues || []).join(", ") || "None"}
                          </td>
                          <td className="border-b border-stone-100 py-3 pr-4 text-stone-600">
                            <OperationLog run={run} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            </div>

            <aside
              data-testid="improvement-cards"
              className="space-y-4 lg:sticky lg:top-24 lg:self-start"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="size-5 text-[#e95f45]" />
                <h2 className="text-xl font-semibold text-stone-950">
                  Improvement cards
                </h2>
              </div>
              {improvementCards.length > 0 ? (
                improvementCards.map((card) => (
                  <article
                    key={`${card.variant}-${card.issue}`}
                    className="rounded-2xl border border-stone-200 bg-white p-5"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-stone-500">
                      Variant {card.variant} - {card.issue}
                    </p>
                    <h3 className="mt-3 text-lg font-semibold text-stone-950">
                      {card.title}
                    </h3>
                    <p className="mt-3 text-sm leading-6 text-stone-600">
                      {card.suggestion}
                    </p>
                  </article>
                ))
              ) : (
                <div className="rounded-2xl border border-stone-200 bg-white p-5 text-sm leading-6 text-stone-600">
                  Run agents to generate product recommendations from observed
                  friction.
                </div>
              )}
            </aside>
          </div>
        </section>
      </main>
    </>
  );
}

function MetricTile({
  label,
  value,
  testId,
}: {
  label: string;
  value: string;
  testId?: string;
}) {
  return (
    <section
      data-testid={testId}
      className="rounded-2xl border border-stone-200 bg-white p-5"
    >
      <p className="text-sm font-medium text-stone-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-stone-950">{value}</p>
    </section>
  );
}

function VariantSummaryPanel({
  variant,
  summary,
}: {
  variant: "A" | "B";
  summary?: VariantSummary;
}) {
  return (
    <section
      data-testid={`variant-summary-${variant}`}
      className="rounded-2xl border border-stone-200 bg-white p-5"
    >
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-stone-950">
          Variant {variant}
        </h2>
        <span className="rounded-full bg-[#eef7f4] px-3 py-1 text-sm font-semibold text-stone-800">
          {summary ? `${summary.runs} runs` : "0 runs"}
        </span>
      </div>
      <dl className="mt-5 grid gap-3 text-sm">
        <SummaryMetric label="Success" value={formatSuccess(summary)} />
        <SummaryMetric
          label="Avg time"
          value={summary ? `${numberFormatter.format(summary.avgTime)}s` : "0s"}
        />
        <SummaryMetric
          label="Avg steps"
          value={summary ? numberFormatter.format(summary.avgSteps) : "0"}
        />
        <SummaryMetric
          label="Avg friction"
          value={summary ? numberFormatter.format(summary.avgFriction) : "0"}
        />
      </dl>
      <div className="mt-5 border-t border-stone-200 pt-4">
        <p className="text-sm font-semibold text-stone-950">Top issues</p>
        <ul className="mt-3 space-y-2 text-sm text-stone-600">
          {(summary?.topIssues || []).length > 0 ? (
            summary?.topIssues.map((issue) => (
              <li key={issue.issue} className="flex justify-between gap-3">
                <span>{issue.issue}</span>
                <span>{issue.count}</span>
              </li>
            ))
          ) : (
            <li>No issues reported</li>
          )}
        </ul>
      </div>
    </section>
  );
}

function SummaryMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-xl bg-stone-50 px-4 py-3">
      <dt className="text-stone-500">{label}</dt>
      <dd className="font-semibold text-stone-950">{value}</dd>
    </div>
  );
}

function formatSuccess(summary?: VariantSummary) {
  return summary ? percentFormatter.format(summary.successRate) : "0%";
}

function formatAverageSteps(summary?: AgentSummary) {
  const values = Object.values(summary || {});
  if (values.length === 0) {
    return "0";
  }

  return numberFormatter.format(
    values.reduce((sum, item) => sum + item.avgSteps, 0) / values.length,
  );
}

function formatAverageFriction(summary?: AgentSummary) {
  const values = Object.values(summary || {});
  if (values.length === 0) {
    return "0";
  }

  return numberFormatter.format(
    values.reduce((sum, item) => sum + item.avgFriction, 0) / values.length,
  );
}

function OperationLog({ run }: { run: AgentResult }) {
  const events = normalizeEvents(run);

  if (events.length === 0) {
    return <span>-</span>;
  }

  return (
    <details className="max-w-[360px]">
      <summary className="cursor-pointer font-medium text-stone-950">
        {formatLogSummary(events)}
      </summary>
      <ol className="mt-2 space-y-1 text-xs leading-5 text-stone-600">
        {events.map((event, index) => (
          <li key={`${event.label}-${index}`}>
            <span className="font-medium text-stone-900">
              {formatTime(event.t)}
            </span>{" "}
            {event.type}: {event.label}
          </li>
        ))}
      </ol>
    </details>
  );
}

function isLocalUrl(value: string) {
  try {
    const { hostname } = new URL(value);
    return (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "::1"
    );
  } catch {
    return false;
  }
}

function normalizeEvents(run: AgentResult) {
  return (run.events || [])
    .flatMap((event) => {
      if (!event || typeof event !== "object") {
        return [];
      }

      const item = event as Record<string, unknown>;
      const label = typeof item.label === "string" ? item.label : "event";
      const type = typeof item.type === "string" ? item.type : "event";
      const t = typeof item.t === "number" ? item.t : undefined;

      return [{ label, type, t }];
    })
    .slice(0, 14);
}

function formatLogSummary(
  events: Array<{ label: string; type: string; t?: number }>,
) {
  const preview = events
    .slice(0, 3)
    .map((event) => event.label)
    .join(" -> ");

  return `View ${events.length} events - ${preview}`;
}

function formatTime(value?: number) {
  return typeof value === "number" ? `${numberFormatter.format(value)}s` : "--";
}
