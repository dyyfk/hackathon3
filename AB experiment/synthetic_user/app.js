const refs = {
  aUrl: document.getElementById("aUrl"),
  bUrl: document.getElementById("bUrl"),
  profiles: document.getElementById("profiles"),
  runs: document.getElementById("runs"),
  model: document.getElementById("model"),
  timeout: document.getElementById("timeout"),
  start: document.getElementById("startButton"),
  status: document.getElementById("statusPill"),
  export: document.getElementById("exportButton"),
  back: document.getElementById("backButton"),
  stage: document.getElementById("stagePanel"),
  profilesPanel: document.getElementById("profilePanel"),
  agentSummary: document.getElementById("agentSummary"),
  variantGrid: document.getElementById("variantGrid"),
  variantA: document.getElementById("variantA"),
  variantB: document.getElementById("variantB"),
  modal: document.getElementById("detailModal"),
  modalClose: document.getElementById("modalClose"),
  modalContent: document.getElementById("modalContent"),
};

const STORAGE_KEY = "syntheticABLatestRunId";
const CONFIG_KEY = "syntheticABLastConfig";
const phases = [
  ["observing_pages", "Observe URLs"],
  ["generating_profiles", "Generate profiles"],
  ["profiles_ready", "Profiles ready"],
  ["generating_trajectories", "Generate trajectories"],
  ["trajectories_ready", "Trajectories ready"],
  ["summarizing_feedback", "Agent summary"],
  ["completed", "Complete"],
];

let currentRun = null;
let pollingTimer = null;

init();

function init() {
  hydrateControls(readJsonStorage(CONFIG_KEY));
  renderIdle();
  loadStoredRun();
  refs.back.addEventListener("click", () => {
    const suffix = currentRun?.run_id ? `?run=${encodeURIComponent(currentRun.run_id)}` : "";
    window.location.href = `../${suffix}`;
  });
  refs.export.addEventListener("click", exportRun);
  refs.start.addEventListener("click", startRun);
  refs.modalClose.addEventListener("click", closeModal);
  refs.modal.addEventListener("click", (event) => {
    if (event.target === refs.modal) {
      closeModal();
    }
  });
}

async function loadStoredRun() {
  const params = new URLSearchParams(window.location.search);
  const runId = params.get("run");
  if (!runId) {
    return;
  }
  try {
    const response = await fetch(`/api/synthetic-runs/${runId}`, { cache: "no-store" });
    const job = await response.json();
    if (job.status === "completed" && job.result) {
      currentRun = job.result;
      writeStorage(STORAGE_KEY, job.job_id || runId);
      hydrateControls(currentRun.config);
      renderRun(currentRun);
      setStatus("Completed", "ready");
      return;
    }
  } catch (error) {
    console.warn(error);
  }
  removeStorage(STORAGE_KEY);
}

function renderIdle() {
  currentRun = null;
  refs.stage.replaceChildren();
  refs.profilesPanel.replaceChildren();
  refs.agentSummary.replaceChildren();
  refs.variantA.replaceChildren();
  refs.variantB.replaceChildren();
  refs.profilesPanel.classList.add("hidden");
  refs.agentSummary.classList.add("hidden");
  refs.variantGrid.classList.add("hidden");
  refs.stage.append(emptyState());
  setStatus("Ready", "ready");
  setRunning(false);
}

function emptyState() {
  const wrap = el("div", "empty-state");
  wrap.append(
    icon("sparkles"),
    el("h2", "", "No synthetic run yet"),
    el("p", "", "Enter A/B URLs and generate synthetic profiles, trajectories, metrics, and agent feedback."),
  );
  return wrap;
}

function exportRun() {
  if (!currentRun) {
    return;
  }
  const blob = new Blob([JSON.stringify(currentRun, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${currentRun.run_id || "synthetic-ab-run"}.json`;
  link.click();
  URL.revokeObjectURL(url);
}

async function startRun() {
  const payload = readConfig();
  writeStorage(CONFIG_KEY, JSON.stringify(payload));
  removeStorage(STORAGE_KEY);
  currentRun = null;
  refs.profilesPanel.classList.add("hidden");
  refs.agentSummary.classList.add("hidden");
  refs.variantGrid.classList.add("hidden");
  refs.profilesPanel.replaceChildren();
  refs.agentSummary.replaceChildren();
  refs.variantA.replaceChildren();
  refs.variantB.replaceChildren();
  renderStage("queued", 0.04);
  setRunning(true);
  setStatus("Queued", "running");
  try {
    const response = await fetch("/api/synthetic-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Generate requires `python3 \"AB experiment/server.py\" --port 8765`.");
    }
    const job = await response.json();
    pollJob(job.job_id);
  } catch (error) {
    setRunning(false);
    setStatus("Failed", "failed");
    refs.stage.replaceChildren(errorState(error.message));
  }
}

function readConfig() {
  return {
    a_url: refs.aUrl.value.trim() || "https://www.airbnb.com",
    b_url: refs.bUrl.value.trim() || "https://www.airbnb.com",
    profiles: Number(refs.profiles.value) || 20,
    runs: Number(refs.runs.value) || 5,
    model: refs.model.value,
    codex_timeout: Number(refs.timeout.value) || 240,
  };
}

async function pollJob(jobId) {
  clearTimeout(pollingTimer);
  try {
    const response = await fetch(`/api/synthetic-runs/${jobId}`, { cache: "no-store" });
    const job = await response.json();
    renderJob(job);
    if (job.status === "completed") {
      currentRun = job.result;
      writeStorage(STORAGE_KEY, job.job_id);
      window.history.replaceState(null, "", `?run=${encodeURIComponent(job.job_id)}`);
      hydrateControls(currentRun.config);
      renderRun(currentRun);
      setStatus("Completed", "ready");
      setRunning(false);
      return;
    }
    if (job.status === "failed") {
      setStatus("Failed", "failed");
      setRunning(false);
      refs.stage.append(errorState(job.error || "Generation failed."));
      return;
    }
    pollingTimer = setTimeout(() => pollJob(jobId), 1500);
  } catch (error) {
    setStatus("Polling failed", "failed");
    setRunning(false);
    refs.stage.append(errorState(error.message));
  }
}

function renderJob(job) {
  const phase = job.phase || job.status || "queued";
  renderStage(phase, job.progress || 0.08, job);
  setStatus(phaseLabel(phase), "running");
  if (job.partial?.profiles) {
    renderProfiles(job.partial.profiles, job.partial.run_profiles || []);
  }
  if (job.partial?.variants) {
    refs.variantGrid.classList.remove("hidden");
    renderTrajectoryPreview(refs.variantA, "A", job.partial.variants.A, job.config);
    renderTrajectoryPreview(refs.variantB, "B", job.partial.variants.B, job.config);
  }
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderStage(phase, progress, source = {}) {
  refs.stage.replaceChildren();
  const history = source.phase_history || source.result?.phase_history || [];
  const header = el("div", "stage-header");
  header.append(el("h2", "", phaseLabel(phase)), stageMeta(source, history));
  const bar = el("div", "progress-track");
  bar.append(el("span", "progress-fill"));
  bar.firstElementChild.style.width = `${Math.max(4, Math.min(100, Math.round(progress * 100)))}%`;
  const rail = el("div", "stage-rail");
  const activeIndex = Math.max(0, phases.findIndex(([key]) => key === phase));
  phases.forEach(([key, label], index) => {
    const item = el("div", `stage-chip ${index < activeIndex ? "done" : ""} ${index === activeIndex ? "active" : ""}`);
    item.append(el("span", "", String(index + 1)), document.createTextNode(label));
    const duration = phaseDurationLabel(key, history);
    if (duration) {
      item.append(el("small", "", duration));
    }
    rail.append(item);
  });
  refs.stage.append(header, bar, rail);
}

function stageMeta(source, history) {
  const wrap = el("p", "stage-meta");
  const runMode = source.metadata?.run_mode || source.run_mode || source.result?.metadata?.run_mode || "deterministic_rule";
  const completedAt = source.completed_at || source.result?.completed_at || lastCompletedAt(history);
  if (completedAt) {
    wrap.textContent = `Generated at ${formatTime(completedAt)} · Completed in ${formatDuration(totalDurationMs(history))} · ${humanizeMode(runMode)}`;
  } else {
    wrap.textContent = `Synthetic generation runs from profiles to trajectories to metrics · ${humanizeMode(runMode)}`;
  }
  return wrap;
}

function phaseLabel(phase) {
  return {
    queued: "Queued",
    running: "Running",
    observing_pages: "Observing URLs",
    generating_profiles: "Generating profiles",
    profiles_ready: "Profiles ready",
    generating_trajectories: "Generating trajectories",
    trajectories_ready: "Trajectories ready",
    summarizing_feedback: "Generating agent summary",
    completed: "Completed",
  }[phase] || "Running";
}

function phaseDurationLabel(phase, history) {
  const item = history.find((entry) => entry.phase === phase && Number.isFinite(entry.duration_ms));
  return item ? formatDuration(item.duration_ms) : "";
}

function totalDurationMs(history) {
  return history.reduce((total, entry) => total + (Number(entry.duration_ms) || 0), 0);
}

function lastCompletedAt(history) {
  const last = [...history].reverse().find((entry) => entry.completed_at);
  return last?.completed_at || "";
}

function formatDuration(ms) {
  const value = Number(ms) || 0;
  if (value < 1000) {
    return `${Math.round(value)}ms`;
  }
  return `${(value / 1000).toFixed(value < 10_000 ? 1 : 0)}s`;
}

function formatTime(value) {
  if (!value) return "n/a";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "n/a";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

function humanizeMode(mode) {
  return String(mode || "deterministic_rule").replace(/_/g, " ");
}

function renderRun(run) {
  renderStage("completed", 1, run);
  renderProfiles(run.variants.A.raw.profiles, run.variants.A.profiles.map((profile) => profile.persona));
  renderAgentSummary(run);
  refs.variantGrid.classList.remove("hidden");
  renderVariant(refs.variantA, "A", run.variants.A, run.config);
  renderVariant(refs.variantB, "B", run.variants.B, run.config);
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderProfiles(rawProfiles, runProfileIds = []) {
  refs.profilesPanel.classList.remove("hidden");
  refs.profilesPanel.replaceChildren();
  const title = panelTitle("Generated User Profiles", "users", `${rawProfiles.length} profiles`);
  const grid = el("div", "profile-grid");
  rawProfiles.forEach((profile) => {
    const card = el("button", `profile-tile ${runProfileIds.includes(profile.id) ? "selected" : ""}`);
    card.type = "button";
    card.append(
      el("strong", "", profile.id),
      el("span", "", titleCase(profile.segment)),
      el("p", "", profile.goal),
    );
    card.addEventListener("click", () => openProfileModal(profile));
    grid.append(card);
  });
  refs.profilesPanel.append(title, grid);
}

function renderAgentSummary(run) {
  refs.agentSummary.classList.remove("hidden");
  refs.agentSummary.replaceChildren();
  const matrix = run.matrix_summary;
  const stats = el("div", "agent-stat-row");
  matrix.summary_stats.forEach((stat) => {
    const item = el("article", "agent-stat");
    item.append(el("span", "", stat.label), el("strong", "", stat.value), el("small", "", stat.detail));
    stats.append(item);
  });
  const findings = el("div", "agent-findings");
  matrix.attribution_conclusion.forEach((row) => {
    const item = el("article", `agent-finding ${row.level}`);
    item.append(icon(row.icon), el("strong", "", row.title), el("p", "", row.conclusion));
    findings.append(item);
  });
  refs.agentSummary.append(panelTitle("Agent Summary", "bot", matrix.title), el("p", "agent-copy", matrix.summary_primary), stats, findings);
}

function renderVariant(root, key, variant, config) {
  root.replaceChildren();
  root.append(
    variantHeader(key, variant, `${config.profiles} profiles - ${config.runs} runs`),
    summaryCards(variant.summary_stats, key),
    feedbackCard(variant.feedback),
    metricSnapshot(variant.metric_snapshot, key),
    userLogsCard(variant, key),
    profilesCard(variant.raw.profiles),
  );
}

function renderTrajectoryPreview(root, key, variant, config) {
  root.replaceChildren();
  if (!variant) {
    root.append(variantHeader(key, { label: `Variant ${key}`, url: "" }, `${config.profiles} profiles - ${config.runs} runs`));
    return;
  }
  const traces = variant.traces || [];
  const compact = el("section", "runner-card trajectory-preview");
  compact.append(panelTitle(`${traces.length} Trajectories`, "route", "Preview"));
  traces.forEach((trace) => {
    const row = el("button", "trajectory-row");
    row.type = "button";
    row.append(
      el("strong", "", trace.persona_id || trace.profile_id),
      el("span", "", `${trace.steps?.length || 0} steps`),
      el("small", "", trace.goal || ""),
    );
    row.addEventListener("click", () => openTraceModal(trace, key));
    compact.append(row);
  });
  root.append(variantHeader(key, { label: `Variant ${key}`, url: variant.url || "" }, `${config.profiles} profiles - ${config.runs} runs`), compact);
}

function variantHeader(key, variant, countText) {
  const header = el("header", "variant-header");
  const badge = el("span", `variant-badge ${key === "B" ? "green" : "blue"}`, key);
  const title = el("div", "");
  title.append(el("h2", "", variant.label), el("p", "", variant.url));
  header.append(badge, title, el("span", "run-count", countText));
  return header;
}

function summaryCards(stats, key) {
  const wrap = el("section", "runner-stat-grid");
  stats.forEach((stat) => {
    const card = el("article", "runner-stat-card");
    card.append(icon(stat.icon), el("span", "runner-stat-label", stat.label), el("strong", key === "B" ? "green-text" : "", stat.value), el("small", "", stat.detail));
    wrap.append(card);
  });
  return wrap;
}

function feedbackCard(rows) {
  const card = sectionCard("General Feedback", "message-square");
  const table = el("div", "compact-rows");
  rows.forEach((row) => {
    const item = el("button", "compact-row compact-button");
    item.type = "button";
    const round = el("span", `mini-round ${row.level}`);
    round.append(icon(row.icon));
    item.append(round, el("span", "", row.body), el("b", `evidence-mini ${row.level}`, row.badge));
    item.addEventListener("click", () => openFindingModal(row));
    table.append(item);
  });
  card.append(table);
  return card;
}

function metricSnapshot(metrics, key) {
  const card = sectionCard("Metric Snapshot", "chart-line");
  const grid = el("div", "snapshot-grid");
  metrics.forEach((metric) => {
    const item = el("div", "snapshot-cell");
    item.append(el("span", "", metric.label), el("strong", key === "B" ? "green-text" : "", metric.value), el("small", "", metric.detail));
    grid.append(item);
  });
  card.append(grid);
  return card;
}

function userLogsCard(variant, key) {
  const card = sectionCard("Behavior Logs by User", "list");
  const help = el(
    "span",
    "friction-help",
    "Friction means hesitation, confusion, or risk of drop-off during this step.",
  );
  help.title = help.textContent;
  card.querySelector("h3").append(help);

  const profiles = variant.raw.profiles || [];
  const list = el("div", "user-log-list");
  (variant.raw.traces || []).forEach((trace) => {
    const profileId = trace.persona_id || trace.profile_id;
    const profile = profiles.find((item) => item.id === profileId) || { id: profileId, segment: trace.segment, goal: trace.goal };
    const summary = traceSummary(trace);
    const userCard = el("article", "user-log-card");
    userCard.tabIndex = 0;
    userCard.setAttribute("role", "button");
    userCard.setAttribute("aria-label", `${profileId} Variant ${key} behavior details`);

    const header = el("div", "user-log-header");
    const identity = el("div", "");
    identity.append(el("strong", "", profileId), el("span", "", titleCase(profile.segment || trace.segment)));
    const status = el("b", `completion-badge ${trace.converted ? "completed" : "dropped"}`, trace.converted ? "Completed" : "Dropped");
    const statusWrap = el("div", "user-log-status");
    statusWrap.append(status, el("small", "", "View user"));
    header.append(identity, statusWrap);

    const stats = el("div", "user-log-stats");
    stats.append(
      miniStat("Dwell", `${summary.dwell}s`),
      miniStat("Clicks", String(summary.clicks)),
      miniStat("Friction", summary.highestFriction),
    );

    const actions = el("div", "action-chip-grid");
    (trace.steps || []).forEach((step) => {
      const action = el("button", "action-chip");
      action.type = "button";
      const friction = frictionInfo(step.friction);
      action.append(
        el("span", "action-step", String(step.step)),
        el("strong", "", eventLabel(step.event_type)),
        el("em", "", shortText(step.action || step.intent || "Observe", 54)),
        el("b", `friction-badge ${friction.level}`, friction.label),
      );
      action.addEventListener("click", (event) => {
        event.stopPropagation();
        openStepModalFromStep(step, trace, key);
      });
      actions.append(action);
    });

    userCard.append(header, stats, actions);
    userCard.addEventListener("click", () => openProfileModal(profile, key));
    userCard.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        openProfileModal(profile, key);
      }
    });
    list.append(userCard);
  });
  card.append(list);
  return card;
}

function miniStat(label, value) {
  const item = el("span", "user-mini-stat");
  item.append(el("em", "", label), el("strong", "", value));
  return item;
}

function traceSummary(trace) {
  const steps = trace.steps || [];
  return {
    dwell: steps.reduce((sum, step) => sum + (Number(step.elapsed_seconds) || 0), 0),
    clicks: steps.filter((step) => step.clicked || clickableEvent(step.event_type)).length,
    highestFriction: highestFrictionLabel(steps),
  };
}

function highestFrictionLabel(steps) {
  if (!steps.length) return "None";
  const highest = steps.reduce((max, step) => Math.max(max, frictionInfo(step.friction).score), 0);
  return frictionInfo(highest).label;
}

function clickableEvent(eventType) {
  return ["input", "primary_click", "secondary_click", "detail_open", "like_save"].includes(String(eventType || "").toLowerCase());
}

function frictionInfo(value) {
  if (typeof value === "string") {
    const lower = value.toLowerCase();
    if (lower === "high") return { label: "High", level: "high", score: 0.85 };
    if (lower === "medium") return { label: "Medium", level: "medium", score: 0.55 };
    if (lower === "low") return { label: "Low", level: "low", score: 0.25 };
    return { label: "None", level: "none", score: 0 };
  }
  const score = Number(value) || 0;
  if (score >= 0.75) return { label: "High", level: "high", score };
  if (score >= 0.45) return { label: "Medium", level: "medium", score };
  if (score >= 0.2) return { label: "Low", level: "low", score };
  return { label: "None", level: "none", score };
}

function eventLabel(value) {
  return {
    view: "View",
    input: "Input",
    primary_click: "CTA",
    secondary_click: "Click",
    detail_open: "Detail",
    like_save: "Like",
    scroll: "Scroll",
    dwell: "Dwell",
    dropoff: "Dropoff",
  }[String(value || "").toLowerCase()] || "View";
}

function profilesCard(profiles) {
  const card = sectionCard("User Profiles", "users");
  const table = document.createElement("table");
  table.className = "profiles-table interactive-table";
  table.innerHTML = "<thead><tr><th>Persona</th><th>Segment</th><th>Primary Goal</th><th>Behavior Style</th></tr></thead>";
  const body = document.createElement("tbody");
  profiles.forEach((profile) => {
    const row = document.createElement("tr");
    row.tabIndex = 0;
    const tags = el("span", "tag-list");
    behaviorTags(profile.behavior_style || {}).forEach((tag) => tags.append(el("span", "style-tag", tag)));
    row.append(td(profile.id || profile.persona), td(titleCase(profile.segment)), td(profile.goal), cell(tags));
    row.addEventListener("click", () => openProfileModal(profile));
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        openProfileModal(profile);
      }
    });
    body.append(row);
  });
  table.append(body);
  card.append(table);
  return card;
}

function openProfileModal(profile, focusVariant = "") {
  const traces = currentRun ? tracesForProfile(profile.id || profile.persona) : [];
  const body = el("div", "modal-stack");
  body.append(
    el("h2", "", profile.id || profile.persona),
    el("p", "modal-muted", `${titleCase(profile.segment)} - ${profile.goal || ""}`),
    keyValueGrid({
      Task: profile.task || "Generated synthetic browsing task",
      Guests: profile.constraints?.guests ?? "n/a",
      Destination: profile.constraints?.destination || "n/a",
      "Budget Preference": profile.constraints?.budget_preference || "n/a",
    }),
  );
  if (traces.length) {
    const traceWrap = el("div", "modal-two-col");
    sortFocusedTraces(traces, focusVariant).forEach(({ key, trace }) => {
      const section = el("section", `modal-card ${key === focusVariant ? "focused" : ""}`);
      section.append(
        el("h3", "", `Variant ${key} trajectory`),
        keyValueGrid({
          Completion: trace.converted ? "Completed" : "Dropped",
          "Task Time": `${trace.task_seconds || 0}s`,
          Satisfaction: trace.satisfaction || "n/a",
        }),
        trajectoryList(trace.steps || []),
      );
      traceWrap.append(section);
    });
    const feedbackWrap = el("div", "modal-two-col");
    sortFocusedTraces(traces, focusVariant).forEach(({ key, trace }) => {
      feedbackWrap.append(feedbackPanel(trace, key));
    });
    body.append(traceWrap, el("h3", "modal-section-title", "Generated Feedback"), feedbackWrap);
  }
  showModal(body);
}

function openTraceModal(trace, key) {
  const body = el("div", "modal-stack");
  body.append(
    el("h2", "", `${trace.persona_id || trace.profile_id} - Variant ${key}`),
    el("p", "modal-muted", trace.goal || ""),
    keyValueGrid({
      Completion: trace.converted ? "Completed" : "Dropped",
      "Task Time": `${trace.task_seconds || 0}s`,
      Satisfaction: trace.satisfaction || "n/a",
    }),
    trajectoryList(trace.steps || []),
  );
  showModal(body);
}

function openStepModalFromStep(step, trace, key) {
  const impact = metricImpact(step);
  const friction = frictionInfo(step.friction);
  const body = el("div", "modal-stack");
  body.append(
    el("h2", "", `${titleCase(step.intent || "Action")} - Variant ${key}`),
    el("p", "modal-muted", step.observation || step.expected_result || ""),
    keyValueGrid({
      User: trace.persona_id || trace.profile_id || "n/a",
      Event: eventLabel(step.event_type),
      Action: step.action || "n/a",
      Friction: `${friction.label} - hesitation, confusion, or drop-off risk`,
      "Metric Impact": impact,
    }),
    trajectoryList([step]),
  );
  showModal(body);
}

function openFindingModal(row) {
  const body = el("div", "modal-stack");
  body.append(el("h2", "", row.title || row.badge), el("p", "modal-muted", row.body), keyValueGrid({ Evidence: row.badge, Level: row.level }));
  showModal(body);
}

function feedbackPanel(trace, key) {
  const feedback = normalizeFeedback(trace.final_feedback);
  const panel = el("section", "modal-card feedback-panel");
  panel.append(el("h3", "", `Variant ${key}`));
  panel.append(
    feedbackList("Liked", feedback.liked_features),
    feedbackList("Confusion", feedback.confusion_points),
    keyValueGrid({ Recommendation: feedback.recommendation || "Review this user's trajectory." }),
    feedbackList("What's Next", nextActions(trace, feedback)),
  );
  return panel;
}

function feedbackList(title, items) {
  const section = el("div", "feedback-list");
  section.append(el("strong", "", title));
  const list = document.createElement("ul");
  (items && items.length ? items : ["No specific note generated."]).slice(0, 3).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  });
  section.append(list);
  return section;
}

function normalizeFeedback(feedback) {
  if (feedback && typeof feedback === "object") {
    return {
      liked_features: feedback.liked_features || [],
      confusion_points: feedback.confusion_points || [],
      friction_themes: feedback.friction_themes || [],
      recommendation: feedback.recommendation || "",
    };
  }
  return {
    liked_features: [],
    confusion_points: [String(feedback || "No feedback generated.")],
    friction_themes: [],
    recommendation: "Review this user's behavior before changing the design.",
  };
}

function nextActions(trace, feedback) {
  const actions = [];
  const themes = new Set(feedback.friction_themes || []);
  if (feedback.recommendation) {
    actions.push(feedback.recommendation);
  }
  if (themes.has("price_clarity")) actions.push("Test earlier total-price exposure for this segment.");
  if (themes.has("date_picker_friction")) actions.push("Instrument calendar hesitation and flexible-date selection.");
  if (themes.has("trust_review_confidence")) actions.push("Move trust, rating, or review signals closer to the decision point.");
  if (themes.has("wishlist_account_wall")) actions.push("Clarify save behavior before any sign-in requirement appears.");
  if (themes.has("navigation_clarity")) actions.push("Tighten the next-step CTA after the highest-friction action.");
  if (themes.has("experiences_discoverability")) actions.push("Make Experiences and Services easier to discover from the first screen.");
  if (trace.dropoff || !trace.converted) actions.push("Replay this user in the next design review as a drop-off scenario.");
  actions.push("Compare this user's A and B trajectory before deciding the winner.");
  return Array.from(new Set(actions)).slice(0, 3);
}

function tracesForProfile(profileId) {
  return ["A", "B"]
    .map((key) => {
      const variant = currentRun?.variants?.[key];
      const trace = variant?.raw?.traces?.find((item) => (item.persona_id || item.profile_id) === profileId);
      return trace ? { key, trace } : null;
    })
    .filter(Boolean);
}

function sortFocusedTraces(traces, focusVariant) {
  if (!focusVariant) {
    return traces;
  }
  return [...traces].sort((left, right) => {
    if (left.key === focusVariant) return -1;
    if (right.key === focusVariant) return 1;
    return left.key.localeCompare(right.key);
  });
}

function metricImpact(step) {
  const event = String(step.event_type || step.event || "").toLowerCase();
  const parts = [];
  if (step.primary_action || event === "primary_click") parts.push("+ primary CTA");
  if (step.detail_action || event === "detail_open") parts.push("+ detail open");
  if (step.like_signal || event === "like_save") parts.push("+ like intent");
  if (step.elapsed_seconds) parts.push(`+${step.elapsed_seconds}s dwell`);
  if (String(step.friction).toLowerCase() === "high") parts.push("+ friction risk");
  return parts.join(", ") || "Observation only";
}

function trajectoryList(steps) {
  const list = el("div", "trajectory-list");
  steps.forEach((step) => {
    const row = el("article", "trajectory-step");
    row.append(
      el("strong", "", `${step.step}. ${titleCase(step.intent || "observe")}`),
      el("p", "", step.action || ""),
      el("small", "", `${step.event_type || "view"} - ${step.friction || "none"} - ${step.elapsed_seconds || 0}s`),
    );
    list.append(row);
  });
  return list;
}

function keyValueGrid(values) {
  const grid = el("div", "kv-grid");
  Object.entries(values).forEach(([key, value]) => {
    const item = el("div", "");
    item.append(el("span", "", key), el("strong", "", String(value)));
    grid.append(item);
  });
  return grid;
}

function showModal(content) {
  refs.modalContent.replaceChildren(content);
  refs.modal.classList.remove("hidden");
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function closeModal() {
  refs.modal.classList.add("hidden");
  refs.modalContent.replaceChildren();
}

function sectionCard(title, iconName) {
  const card = el("section", "runner-card");
  card.append(panelTitle(title, iconName));
  return card;
}

function panelTitle(title, iconName, detail = "") {
  const head = el("h3", "");
  head.append(icon(iconName), document.createTextNode(title));
  if (detail) {
    head.append(el("small", "", detail));
  }
  return head;
}

function errorState(message) {
  const wrap = el("div", "empty-state error-state");
  wrap.append(icon("circle-alert"), el("h2", "", "Generation failed"), el("p", "", message));
  return wrap;
}

function hydrateControls(config) {
  if (!config) {
    return;
  }
  refs.aUrl.value = config.a_url || "https://www.airbnb.com";
  refs.bUrl.value = config.b_url || "https://www.airbnb.com";
  refs.profiles.value = config.profiles || 20;
  refs.runs.value = config.runs || 5;
  refs.model.value = config.model || "auto";
  refs.timeout.value = String(config.codex_timeout || 240);
}

function setStatus(text, state) {
  refs.status.className = `status-pill ${state}`;
  refs.status.innerHTML = `<span></span> ${text}`;
}

function setRunning(running) {
  refs.start.disabled = running;
  refs.start.querySelector("span").textContent = running ? "Generating" : "Generate";
}

function behaviorTags(style) {
  const pairs = Object.entries(style || {}).sort((a, b) => b[1] - a[1]);
  if (!pairs.length) return ["Synthetic"];
  return pairs.slice(0, 2).map(([key]) => titleCase(key).replace(" Sensitivity", ""));
}

function titleCase(value) {
  return String(value || "").replace(/[_-]/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function shortText(value, limit) {
  const text = String(value || "").trim();
  if (text.length <= limit) {
    return text;
  }
  return `${text.slice(0, Math.max(0, limit - 3)).trim()}...`;
}

function td(text, className = "") {
  const node = document.createElement("td");
  if (className) {
    node.className = className;
  }
  node.textContent = text;
  return node;
}

function cell(child) {
  const node = document.createElement("td");
  node.append(child);
  return node;
}

function icon(name) {
  const node = document.createElement("i");
  node.setAttribute("data-lucide", name);
  node.setAttribute("aria-hidden", "true");
  return node;
}

function el(tag, className = "", text = "") {
  const node = document.createElement(tag);
  if (className) {
    node.className = className;
  }
  if (text) {
    node.textContent = text;
  }
  return node;
}

function readJsonStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(key) || "null");
  } catch {
    return null;
  }
}

function writeStorage(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.warn(error);
  }
}

function removeStorage(key) {
  try {
    localStorage.removeItem(key);
  } catch (error) {
    console.warn(error);
  }
}
