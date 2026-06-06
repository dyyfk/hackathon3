"use client";

import {
  ArrowUpRight,
  Bot,
  CheckCircle2,
  ClipboardList,
  Filter,
  GitBranch,
  Play,
  Route,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import sampleModalResults from "@/data/sampleModalResults.json";
import { buildImprovementCards } from "@/lib/improvementCards";
import {
  runSyntheticIterationLab,
  type SyntheticIterationLabReport,
} from "@/lib/syntheticOptimization";
import {
  summarizeAgentResults,
  type AgentResult,
  type AgentSummary,
} from "@/lib/summarizeAgentResults";

type DemoId =
  | "iteration-loop"
  | "checkout-trust"
  | "filter-rail"
  | "external-adapter"
  | "trace-to-ticket";

type DemoMetric = {
  label: string;
  value: string;
};

type DemoScenario = {
  id: DemoId;
  title: string;
  category: string;
  audience: string;
  route: string;
  routeLabel: string;
  pitch: string;
  proof: string;
  livePath: string[];
  metrics: DemoMetric[];
  script: string[];
};

const demoOrder: DemoId[] = [
  "iteration-loop",
  "checkout-trust",
  "filter-rail",
  "external-adapter",
  "trace-to-ticket",
];

const iconByDemo: Record<DemoId, typeof Sparkles> = {
  "iteration-loop": GitBranch,
  "checkout-trust": ShieldCheck,
  "filter-rail": Filter,
  "external-adapter": Route,
  "trace-to-ticket": ClipboardList,
};

const imageByDemo: Record<DemoId, { src: string; alt: string }> = {
  "iteration-loop": {
    src: "/demo-assets/iteration-lab-panel.png",
    alt: "A to E synthetic iteration lab screenshot",
  },
  "checkout-trust": {
    src: "/mock-stays/stay-03.jpg",
    alt: "Stay listing used for checkout trust demo",
  },
  "filter-rail": {
    src: "/mock-stays/stay-02.jpg",
    alt: "Stay listing used for filter rail demo",
  },
  "external-adapter": {
    src: "/mock-stays/stay-05.jpg",
    alt: "External experience adapter demo backdrop",
  },
  "trace-to-ticket": {
    src: "/mock-stays/stay-01.jpg",
    alt: "Agent trace to ticket demo backdrop",
  },
};

export default function DemoLauncherPage() {
  const [selectedDemoId, setSelectedDemoId] =
    useState<DemoId>("iteration-loop");
  const demoState = useMemo(buildDemoState, []);
  const selectedDemo = demoState.scenarios.find(
    (scenario) => scenario.id === selectedDemoId,
  ) ?? demoState.scenarios[0];

  return (
    <main data-demo-lab className="min-h-screen bg-[#f7f5f0] text-stone-950">
      <DemoLabStyles />
      <section className="border-b border-stone-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 sm:px-6 lg:grid-cols-[minmax(0,1fr)_auto] lg:px-8">
          <div>
            <p className="text-sm font-semibold uppercase text-[#e95f45]">
              WeaveHacks demo launcher
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Five ways to demo the agentic A/B lab
            </h1>
            <p className="mt-3 max-w-3xl text-base leading-7 text-stone-600">
              Pick a mode, show the proof surface, then jump into the live route.
              Each demo is intentionally different: UI iteration, trust repair,
              task flow repair, adapter generalization, and trace-to-ticket output.
            </p>
          </div>
          <div className="demo-runner-status" data-testid="demo-runner-status">
            <div>
              <span>Ready demos</span>
              <strong>{demoState.scenarios.length}</strong>
            </div>
            <div>
              <span>Total candidates</span>
              <strong>{demoState.iterationReport.totalCandidatesGenerated}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-6 sm:px-6 lg:grid-cols-[380px_minmax(0,1fr)] lg:px-8">
        <aside className="demo-picker" aria-label="Demo picker">
          {demoState.scenarios.map((scenario, index) => {
            const Icon = iconByDemo[scenario.id];
            const active = scenario.id === selectedDemo.id;

            return (
              <button
                key={scenario.id}
                type="button"
                data-testid={`demo-card-${scenario.id}`}
                aria-pressed={active}
                onClick={() => setSelectedDemoId(scenario.id)}
                className={active ? "demo-card demo-card-active" : "demo-card"}
              >
                <span className="demo-card-index">{index + 1}</span>
                <span className="demo-card-icon">
                  <Icon className="size-4" />
                </span>
                <span className="demo-card-copy">
                  <span>{scenario.category}</span>
                  <strong>{scenario.title}</strong>
                  <small>{scenario.audience}</small>
                </span>
              </button>
            );
          })}
        </aside>

        <section
          className="demo-stage"
          data-testid={`demo-detail-${selectedDemo.id}`}
        >
          <div className="demo-stage-header">
            <div>
              <p className="text-xs font-semibold uppercase text-[#e95f45]">
                {selectedDemo.category}
              </p>
              <h2>{selectedDemo.title}</h2>
              <p>{selectedDemo.pitch}</p>
            </div>
            <Link
              href={selectedDemo.route}
              className="demo-link-button"
              data-testid="demo-open-route"
            >
              <Play className="size-4" />
              {selectedDemo.routeLabel}
              <ArrowUpRight className="size-4" />
            </Link>
          </div>

          <div className="demo-evidence-grid">
            <DemoVisual
              demoId={selectedDemo.id}
              modalSummary={demoState.modalSummary}
            />

            <div className="demo-proof-panel">
              <div>
                <p className="demo-section-label">Proof to show</p>
                <p className="demo-proof-copy">{selectedDemo.proof}</p>
              </div>

              <div className="demo-metric-grid">
                {selectedDemo.metrics.map((metric) => (
                  <div key={metric.label} className="demo-metric">
                    <span>{metric.label}</span>
                    <strong>{metric.value}</strong>
                  </div>
                ))}
              </div>

              <div>
                <p className="demo-section-label">20 second live path</p>
                <ol className="demo-step-list">
                  {selectedDemo.livePath.map((step) => (
                    <li key={step}>{step}</li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          <div className="demo-script-panel">
            <div className="demo-script-heading">
              <Bot className="size-4" />
              <p>Talk track</p>
            </div>
            <div className="demo-script-grid">
              {selectedDemo.script.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </div>
          </div>

          <DemoEvidenceFooter
            selectedDemoId={selectedDemo.id}
            modalIssueTitle={demoState.modalIssueTitle}
          />
        </section>
      </section>
    </main>
  );
}

function buildDemoState(): {
  scenarios: DemoScenario[];
  iterationReport: SyntheticIterationLabReport;
  modalSummary: AgentSummary;
  modalIssueTitle: string;
} {
  const iterationReport = runSyntheticIterationLab({
    seedPrefix: "profile-demo",
    agentCount: 50,
    candidatesPerGeneration: 100,
    generationCount: 5,
  });
  const customAdapterReport = runSyntheticIterationLab({
    seedPrefix: "demo-adapter",
    agentCount: 12,
    candidatesPerGeneration: 4,
    generationCount: 3,
    taskIds: ["complete_checkout"],
    variants: [
      {
        id: "external_page_adapter",
        label: "External page adapter",
        description: "Adapter-provided page model and task contract.",
        actionScoreAdjustments: {
          start_search: -0.15,
          confirm_reservation: -0.2,
        },
      },
    ],
  });
  const modalResults = (sampleModalResults as { results: AgentResult[] }).results;
  const modalSummary = summarizeAgentResults(modalResults);
  const modalIssueTitle =
    buildImprovementCards(modalSummary)[0]?.title ?? "Reduce repeated friction";
  const generationB = iterationReport.generations[1];
  const generationC = iterationReport.generations[2];
  const generationD = iterationReport.generations[3];
  const fallbackTotalRuns = Object.values(modalSummary).reduce(
    (sum, summary) => sum + summary.runs,
    0,
  );
  const scenarios: DemoScenario[] = [
    {
      id: "iteration-loop",
      title: "A to E self-improvement cockpit",
      category: "UI plus optimization loop",
      audience: "Best opening demo for judges",
      route: "/synthetic",
      routeLabel: "Open iteration lab",
      pitch:
        "Start with one booking flow, let 50 synthetic users evaluate it, generate 100 UX candidates per round, and promote the winner through five generations.",
      proof:
        "The page now shows exactly which recipe each generation applied, not just the score. It proves a closed loop from friction signals to candidate UX changes to re-evaluation.",
      livePath: [
        "Open /synthetic and point at Applied changes.",
        "Call out B: checkout assurance plus upfront price confidence.",
        "Call out E: detail dwell compression plus fast-start defaults.",
        "Export JSON to show the same loop is machine-readable.",
      ],
      metrics: [
        { label: "Agents", value: String(iterationReport.agentCount) },
        {
          label: "Candidates",
          value: String(iterationReport.totalCandidatesGenerated),
        },
        { label: "Score lift", value: signed(iterationReport.scoreLift) },
        { label: "Dwell saved", value: formatMs(iterationReport.dwellReductionMs) },
      ],
      script: [
        "This is the core multi-agent orchestration story: the system does not ask one agent for an opinion, it runs a cohort and scores candidate changes.",
        "Each generation is an evaluated UX configuration, so the demo can defend why B, C, D, and E differ.",
        "The point is not magic redesign. The point is a repeatable optimization loop a product team can inspect.",
      ],
    },
    {
      id: "checkout-trust",
      title: "Checkout trust rescue",
      category: "UI repair demo",
      audience: "Great for product/design judges",
      route: "/versionA?variant=A&actor=judge&task=complete_checkout",
      routeLabel: "Open booking flow",
      pitch:
        "Show a cautious traveler hesitating because total price and confirmation confidence arrive too late, then show the proposed lane that moves trust cues earlier.",
      proof:
        "Generation B applies checkout assurance and upfront price confidence. The synthetic cohort sees lower friction and materially faster dwell.",
      livePath: [
        "Open the booking flow and go to a listing.",
        "Point out where price confidence and policy cues appear late.",
        "Switch to /synthetic and show the B applied winner.",
        "Describe the UI patch: sticky total, review checklist, clear confirm copy.",
      ],
      metrics: [
        {
          label: "Score delta",
          value: signed(round(generationB.summary.score - iterationReport.generations[0].summary.score)),
        },
        {
          label: "Dwell delta",
          value: `${formatMs(iterationReport.generations[0].summary.averageDwellMs - generationB.summary.averageDwellMs)} faster`,
        },
        {
          label: "Friction delta",
          value: `${Math.round(
            (iterationReport.generations[0].summary.feedback.totalFrictionRate -
              generationB.summary.feedback.totalFrictionRate) *
              100,
          )}pp lower`,
        },
        { label: "Candidate source", value: "Gen A winner" },
      ],
      script: [
        "The agent trace says users can complete the task, but they hesitate around price certainty and confirmation.",
        "The product fix is not a whole redesign. It is moving the trust payload to the moment where the user commits.",
        "This is a good UI demo because the before and after are easy for non-technical judges to understand.",
      ],
    },
    {
      id: "filter-rail",
      title: "Task-ready filter rail",
      category: "Workflow repair demo",
      audience: "Best for showing task awareness",
      route: "/versionB?variant=B&actor=judge&task=find_pet_friendly",
      routeLabel: "Open exploration flow",
      pitch:
        "Show how synthetic users with constraints waste time opening filters, then show task-aware chips that put the likely constraints in the result rail.",
      proof:
        "Generations C and D repeatedly promote task-ready filtering because the simulator keeps finding results and filter dwell as a high-friction path.",
      livePath: [
        "Open /versionB and choose a category.",
        "Explain the task: pet-friendly stay with parking.",
        "Show the rail proposal in this page's visual.",
        "Return to /synthetic and show C/D applied winners.",
      ],
      metrics: [
        {
          label: "Gen C score",
          value: String(generationC.summary.score),
        },
        {
          label: "Gen D score",
          value: String(generationD.summary.score),
        },
        {
          label: "Filter recipe",
          value: "Promoted twice",
        },
        {
          label: "D dwell",
          value: formatMs(generationD.summary.averageDwellMs),
        },
      ],
      script: [
        "This is the task-aware part of the demo. Different synthetic profiles do not need the same UI.",
        "The rail is generated because users with constraints keep paying the modal cost.",
        "It shows the system can propose targeted UI changes, not just rank A versus B.",
      ],
    },
    {
      id: "external-adapter",
      title: "External page adapter challenge",
      category: "Generalization demo",
      audience: "Best for technical judges",
      route: "/dashboard",
      routeLabel: "Open agent dashboard",
      pitch:
        "Show that the loop can start from an adapter-provided page model and task contract, instead of only the built-in Staybnb screens.",
      proof:
        "The custom adapter run starts from an external_page_adapter config, evaluates 12 agents, and still produces A to C candidate promotion.",
      livePath: [
        "Open /dashboard and show the public A/B URL inputs.",
        "Explain the adapter contract: observe, task, success, friction.",
        "Use fallback results if cloud Modal is unavailable.",
        "Show the custom adapter proof metric here.",
      ],
      metrics: [
        {
          label: "Adapter agents",
          value: String(customAdapterReport.agentCount),
        },
        {
          label: "Adapter candidates",
          value: String(customAdapterReport.totalCandidatesGenerated),
        },
        {
          label: "Generations",
          value: customAdapterReport.generations
            .map((generation) => generation.generationId)
            .join(" -> "),
        },
        {
          label: "Score lift",
          value: signed(customAdapterReport.scoreLift),
        },
      ],
      script: [
        "This is the honesty demo. We are not claiming arbitrary webpage magic with zero setup.",
        "A target page needs an adapter that tells agents what to observe, what success means, and which friction signals matter.",
        "Once that contract exists, the same candidate scoring loop can run on another product surface.",
      ],
    },
    {
      id: "trace-to-ticket",
      title: "Agent trace to product ticket",
      category: "Ops and PM demo",
      audience: "Best closing demo",
      route: "/dashboard",
      routeLabel: "Open trace dashboard",
      pitch:
        "Turn raw browser operations into concrete product work: issue tags, top friction, recommendation cards, and the exact events that caused them.",
      proof:
        "Fallback Modal results contain operation logs for A and B, summarize success and friction, then generate improvement cards such as total price and parking visibility.",
      livePath: [
        "Open /dashboard and click Use fallback demo results.",
        "Scroll to operation logs.",
        "Point at the issue tags and top friction cards.",
        "Close by saying this becomes the backlog for the next generated candidates.",
      ],
      metrics: [
        { label: "Fallback runs", value: String(fallbackTotalRuns) },
        {
          label: "A success",
          value: formatPercent(modalSummary.A?.successRate ?? 0),
        },
        {
          label: "B success",
          value: formatPercent(modalSummary.B?.successRate ?? 0),
        },
        { label: "Top ticket", value: modalIssueTitle },
      ],
      script: [
        "The agent is useful even before redesign. It creates a repeatable audit trail.",
        "A PM can see exactly which step created the friction, not just a vague score.",
        "That closes the loop: trace, ticket, candidate generation, re-test.",
      ],
    },
  ];

  return {
    iterationReport,
    modalSummary,
    modalIssueTitle,
    scenarios: scenarios.sort(
      (left, right) => demoOrder.indexOf(left.id) - demoOrder.indexOf(right.id),
    ),
  };
}

function DemoVisual({
  demoId,
  modalSummary,
}: {
  demoId: DemoId;
  modalSummary: AgentSummary;
}) {
  const image = imageByDemo[demoId];

  if (demoId === "iteration-loop") {
    return (
      <div className="demo-visual demo-visual-image">
        <Image
          src={image.src}
          alt={image.alt}
          width={980}
          height={1053}
          priority
        />
      </div>
    );
  }

  if (demoId === "checkout-trust") {
    return (
      <div className="demo-visual">
        <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" />
        <div className="demo-mock-overlay demo-checkout-mock">
          <div>
            <span>Before</span>
            <strong>Total appears after reserve intent</strong>
            <p>Agent pauses at checkout because fees and policy arrive late.</p>
          </div>
          <div>
            <span>After</span>
            <strong>$642 total, flexible policy, review checklist</strong>
            <p>Confidence moves next to the decision CTA.</p>
          </div>
        </div>
      </div>
    );
  }

  if (demoId === "filter-rail") {
    return (
      <div className="demo-visual">
        <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" />
        <div className="demo-mock-overlay demo-filter-mock">
          <div className="demo-filter-row">
            <span>Pet-friendly</span>
            <span>Parking</span>
            <span>Flexible cancel</span>
          </div>
          <div className="demo-filter-results">
            <strong>Task-ready rail</strong>
            <p>Constraint chips appear before the modal, cutting filter dwell.</p>
          </div>
        </div>
      </div>
    );
  }

  if (demoId === "external-adapter") {
    return (
      <div className="demo-visual">
        <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" />
        <div className="demo-mock-overlay demo-adapter-mock">
          <div>
            <span>Adapter contract</span>
            <code>observe page state</code>
            <code>define task success</code>
            <code>emit friction signals</code>
          </div>
          <div>
            <span>Same loop</span>
            <strong>A -&gt; B -&gt; C</strong>
            <p>Candidate scoring stays reusable once the page has a task model.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="demo-visual">
      <Image src={image.src} alt={image.alt} fill sizes="(min-width: 1024px) 45vw, 100vw" />
      <div className="demo-mock-overlay demo-trace-mock">
        <div className="demo-trace-summary">
          <span>Agent summary</span>
          <strong>
            A {formatPercent(modalSummary.A?.successRate ?? 0)} vs B{" "}
            {formatPercent(modalSummary.B?.successRate ?? 0)}
          </strong>
        </div>
        <ol>
          <li>open_variant</li>
          <li>submit_search</li>
          <li>parking_signal_not_visible</li>
          <li>total_price_not_visible_before_checkout</li>
        </ol>
      </div>
    </div>
  );
}

function DemoEvidenceFooter({
  selectedDemoId,
  modalIssueTitle,
}: {
  selectedDemoId: DemoId;
  modalIssueTitle: string;
}) {
  const copyByDemo: Record<DemoId, string> = {
    "iteration-loop":
      "Strongest claim: the product loop is inspectable. The screenshot shows which candidate became each generation.",
    "checkout-trust":
      "Strongest claim: synthetic friction can become a small, understandable UI patch rather than a vague redesign request.",
    "filter-rail":
      "Strongest claim: the system notices task-specific work, then proposes controls that match the task.",
    "external-adapter":
      "Strongest claim: the method generalizes through an explicit adapter contract, not hidden assumptions.",
    "trace-to-ticket": `Strongest claim: raw agent traces become backlog items. Example top ticket: ${modalIssueTitle}.`,
  };

  return (
    <div className="demo-evidence-footer">
      <CheckCircle2 className="size-4" />
      <span>{copyByDemo[selectedDemoId]}</span>
    </div>
  );
}

function formatMs(ms: number): string {
  return ms >= 1_000 ? `${(ms / 1_000).toFixed(1)}s` : `${ms}ms`;
}

function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`;
}

function round(value: number): number {
  return Number(value.toFixed(2));
}

function signed(value: number): string {
  return value > 0 ? `+${value}` : String(value);
}

function DemoLabStyles() {
  return (
    <style>{`
      [data-demo-lab] * {
        box-sizing: border-box;
      }

      [data-demo-lab] p,
      [data-demo-lab] h1,
      [data-demo-lab] h2,
      [data-demo-lab] ol {
        margin: 0;
      }

      [data-demo-lab] .demo-runner-status {
        display: grid;
        min-width: 280px;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
        align-self: end;
      }

      [data-demo-lab] .demo-runner-status div,
      [data-demo-lab] .demo-metric {
        border: 1px solid #e7e2da;
        border-radius: 8px;
        background: #f7f5f0;
        padding: 12px;
      }

      [data-demo-lab] .demo-runner-status span,
      [data-demo-lab] .demo-metric span,
      [data-demo-lab] .demo-section-label {
        color: #776e66;
        font-size: 0.72rem;
        font-weight: 850;
        letter-spacing: 0.04em;
        text-transform: uppercase;
      }

      [data-demo-lab] .demo-runner-status strong,
      [data-demo-lab] .demo-metric strong {
        display: block;
        margin-top: 5px;
        color: #1c1917;
        font-size: 1rem;
        line-height: 1.2;
      }

      [data-demo-lab] .demo-picker {
        display: grid;
        align-content: start;
        gap: 10px;
      }

      [data-demo-lab] .demo-card {
        display: grid;
        width: 100%;
        grid-template-columns: 34px 38px minmax(0, 1fr);
        gap: 10px;
        border: 1px solid #e2d9cf;
        border-radius: 8px;
        background: #ffffff;
        padding: 12px;
        color: inherit;
        text-align: left;
        cursor: pointer;
      }

      [data-demo-lab] .demo-card-active {
        border-color: #e95f45;
        box-shadow: 0 0 0 2px #ffe1d8;
      }

      [data-demo-lab] .demo-card-index,
      [data-demo-lab] .demo-card-icon {
        display: grid;
        width: 34px;
        height: 34px;
        place-items: center;
        border-radius: 999px;
        font-weight: 850;
      }

      [data-demo-lab] .demo-card-index {
        background: #1c1917;
        color: #ffffff;
      }

      [data-demo-lab] .demo-card-icon {
        background: #fff3ef;
        color: #e95f45;
      }

      [data-demo-lab] .demo-card-copy span,
      [data-demo-lab] .demo-card-copy small {
        display: block;
        color: #776e66;
        font-size: 0.76rem;
        font-weight: 800;
        line-height: 1.25;
      }

      [data-demo-lab] .demo-card-copy strong {
        display: block;
        margin: 3px 0;
        color: #1c1917;
        font-size: 1rem;
        line-height: 1.2;
      }

      [data-demo-lab] .demo-stage {
        border: 1px solid #e2d9cf;
        border-radius: 8px;
        background: #ffffff;
        padding: 18px;
      }

      [data-demo-lab] .demo-stage-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: 18px;
      }

      [data-demo-lab] .demo-stage-header h2 {
        margin-top: 5px;
        color: #1c1917;
        font-size: clamp(1.5rem, 2.2vw, 2.1rem);
        line-height: 1.1;
      }

      [data-demo-lab] .demo-stage-header p:last-child {
        margin-top: 10px;
        max-width: 760px;
        color: #5c544d;
        font-size: 1rem;
        line-height: 1.6;
      }

      [data-demo-lab] .demo-link-button {
        display: inline-flex;
        min-height: 42px;
        flex: 0 0 auto;
        align-items: center;
        justify-content: center;
        gap: 8px;
        border-radius: 999px;
        background: #1c1917;
        padding: 10px 14px;
        color: #ffffff;
        font-size: 0.86rem;
        font-weight: 800;
        text-decoration: none;
      }

      [data-demo-lab] .demo-evidence-grid {
        display: grid;
        grid-template-columns: minmax(0, 1.2fr) minmax(300px, 0.8fr);
        gap: 16px;
        margin-top: 18px;
      }

      [data-demo-lab] .demo-visual {
        position: relative;
        min-height: 420px;
        overflow: hidden;
        border: 1px solid #e7e2da;
        border-radius: 8px;
        background: #ece7df;
      }

      [data-demo-lab] .demo-visual img {
        object-fit: cover;
      }

      [data-demo-lab] .demo-visual-image {
        min-height: 0;
        background: #ffffff;
      }

      [data-demo-lab] .demo-visual-image img {
        position: static;
        width: 100%;
        height: auto;
        object-fit: contain;
      }

      [data-demo-lab] .demo-mock-overlay {
        position: absolute;
        inset: auto 18px 18px;
        display: grid;
        gap: 10px;
        border: 1px solid rgba(255, 255, 255, 0.55);
        border-radius: 8px;
        background: rgba(255, 255, 255, 0.94);
        padding: 14px;
        box-shadow: 0 18px 44px rgba(28, 25, 23, 0.18);
      }

      [data-demo-lab] .demo-checkout-mock {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      [data-demo-lab] .demo-checkout-mock div,
      [data-demo-lab] .demo-adapter-mock div,
      [data-demo-lab] .demo-trace-summary {
        border-radius: 8px;
        background: #f7f5f0;
        padding: 12px;
      }

      [data-demo-lab] .demo-mock-overlay span {
        color: #e95f45;
        font-size: 0.76rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      [data-demo-lab] .demo-mock-overlay strong {
        display: block;
        margin-top: 5px;
        color: #1c1917;
        line-height: 1.25;
      }

      [data-demo-lab] .demo-mock-overlay p {
        margin-top: 6px;
        color: #5c544d;
        font-size: 0.86rem;
        line-height: 1.45;
      }

      [data-demo-lab] .demo-filter-row {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
      }

      [data-demo-lab] .demo-filter-row span {
        border: 1px solid #d6ccc2;
        border-radius: 999px;
        background: #ffffff;
        padding: 8px 10px;
        color: #1c1917;
        font-size: 0.8rem;
        text-transform: none;
      }

      [data-demo-lab] .demo-filter-results {
        border-left: 4px solid #1f7a6b;
        padding-left: 12px;
      }

      [data-demo-lab] .demo-adapter-mock {
        grid-template-columns: 1fr 1fr;
      }

      [data-demo-lab] .demo-adapter-mock code {
        display: block;
        margin-top: 8px;
        border-radius: 6px;
        background: #1c1917;
        padding: 8px;
        color: #ffffff;
        font-size: 0.8rem;
      }

      [data-demo-lab] .demo-trace-mock ol {
        display: grid;
        gap: 8px;
        padding-left: 20px;
        color: #1c1917;
        font-size: 0.9rem;
        font-weight: 700;
      }

      [data-demo-lab] .demo-proof-panel {
        display: grid;
        align-content: start;
        gap: 18px;
      }

      [data-demo-lab] .demo-proof-copy {
        margin-top: 8px;
        color: #5c544d;
        font-size: 1rem;
        line-height: 1.55;
      }

      [data-demo-lab] .demo-metric-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 10px;
      }

      [data-demo-lab] .demo-step-list {
        display: grid;
        gap: 8px;
        margin-top: 10px;
        padding-left: 20px;
        color: #4c453f;
        line-height: 1.45;
      }

      [data-demo-lab] .demo-script-panel {
        margin-top: 16px;
        border: 1px solid #e7e2da;
        border-radius: 8px;
        background: #fbfaf7;
        padding: 14px;
      }

      [data-demo-lab] .demo-script-heading {
        display: flex;
        align-items: center;
        gap: 8px;
        color: #1f7a6b;
        font-size: 0.85rem;
        font-weight: 850;
        text-transform: uppercase;
      }

      [data-demo-lab] .demo-script-grid {
        display: grid;
        grid-template-columns: repeat(3, minmax(0, 1fr));
        gap: 10px;
        margin-top: 12px;
      }

      [data-demo-lab] .demo-script-grid p {
        border-radius: 8px;
        background: #ffffff;
        padding: 12px;
        color: #514941;
        font-size: 0.88rem;
        line-height: 1.5;
      }

      [data-demo-lab] .demo-evidence-footer {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        margin-top: 14px;
        color: #4f5f56;
        font-size: 0.9rem;
        font-weight: 700;
        line-height: 1.45;
      }

      [data-demo-lab] .demo-evidence-footer svg {
        flex: 0 0 16px;
        color: #1f7a6b;
      }

      @media (max-width: 1050px) {
        [data-demo-lab] .demo-evidence-grid,
        [data-demo-lab] .demo-script-grid {
          grid-template-columns: 1fr;
        }
      }

      @media (max-width: 760px) {
        [data-demo-lab] .demo-runner-status,
        [data-demo-lab] .demo-metric-grid,
        [data-demo-lab] .demo-checkout-mock,
        [data-demo-lab] .demo-adapter-mock {
          grid-template-columns: 1fr;
        }

        [data-demo-lab] .demo-stage-header {
          flex-direction: column;
        }

        [data-demo-lab] .demo-link-button {
          width: 100%;
        }
      }
    `}</style>
  );
}
