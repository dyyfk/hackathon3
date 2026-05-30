const SAMPLE_URL = "../data/latest_ab_run.json";

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
  variantA: document.getElementById("variantA"),
  variantB: document.getElementById("variantB"),
};

let currentRun = null;
let pollingTimer = null;

loadSample();

refs.back.addEventListener("click", () => {
  window.location.href = "../";
});

refs.export.addEventListener("click", () => {
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
});

refs.start.addEventListener("click", startRun);

async function loadSample() {
  setStatus("Loading sample", "running");
  const response = await fetch(SAMPLE_URL, { cache: "no-store" });
  if (!response.ok) {
    setStatus("Missing sample", "failed");
    return;
  }
  currentRun = await response.json();
  hydrateControls(currentRun.config);
  renderRun(currentRun);
  setStatus("Ready", "ready");
}

async function startRun() {
  const payload = {
    a_url: refs.aUrl.value.trim() || "https://www.airbnb.com",
    b_url: refs.bUrl.value.trim() || "https://www.airbnb.com",
    profiles: Number(refs.profiles.value) || 20,
    runs: Number(refs.runs.value) || 5,
    model: refs.model.value,
    codex_timeout: Number(refs.timeout.value) || 240,
  };
  setRunning(true);
  setStatus("Queued", "running");
  try {
    const response = await fetch("/api/synthetic-runs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (!response.ok) {
      throw new Error("Start Run requires `python3 \"AB experiment/server.py\" --port 8765`.");
    }
    const job = await response.json();
    pollJob(job.job_id);
  } catch (error) {
    setRunning(false);
    setStatus("Static sample", "ready");
    console.warn(error);
  }
}

async function pollJob(jobId) {
  clearTimeout(pollingTimer);
  try {
    const response = await fetch(`/api/synthetic-runs/${jobId}`, { cache: "no-store" });
    const job = await response.json();
    if (job.status === "completed") {
      currentRun = job.result;
      renderRun(currentRun);
      hydrateControls(currentRun.config);
      setStatus("Completed", "ready");
      setRunning(false);
      return;
    }
    if (job.status === "failed") {
      setStatus("Failed", "failed");
      setRunning(false);
      return;
    }
    setStatus(job.status === "running" ? "Running" : "Queued", "running");
    pollingTimer = setTimeout(() => pollJob(jobId), 1800);
  } catch (error) {
    setStatus("Polling failed", "failed");
    setRunning(false);
    console.error(error);
  }
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

function renderRun(run) {
  renderVariant(refs.variantA, "A", run.variants.A, run.config);
  renderVariant(refs.variantB, "B", run.variants.B, run.config);
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderVariant(root, key, variant, config) {
  root.replaceChildren();
  const header = el("header", "variant-header");
  const badge = el("span", `variant-badge ${key === "B" ? "green" : "blue"}`, key);
  const title = el("div", "");
  title.append(el("h2", "", variant.label), el("p", "", variant.url));
  header.append(badge, title, el("span", "run-count", `${config.profiles} profiles - ${config.runs} runs`));

  root.append(
    header,
    summaryCards(variant.summary_stats, key),
    feedbackCard(variant.feedback),
    metricSnapshot(variant.metric_snapshot, key),
    logsCard(variant.logs),
    profilesCard(variant.profiles),
  );
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
    const item = el("div", "compact-row");
    const round = el("span", `mini-round ${row.level}`);
    round.append(icon(row.icon));
    item.append(round, el("span", "", row.body), el("b", `evidence-mini ${row.level}`, row.badge));
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

function logsCard(logs) {
  const card = sectionCard("Behavior Logs", "list");
  const table = document.createElement("table");
  table.className = "logs-table";
  table.innerHTML = "<thead><tr><th>Step</th><th>Intent</th><th>Action</th><th>Friction</th><th>Observation</th></tr></thead>";
  const body = document.createElement("tbody");
  logs.slice(0, 6).forEach((log, index) => {
    const row = document.createElement("tr");
    row.append(
      td(String(index + 1), "step-dot-cell"),
      td(log.intent),
      td(log.action),
      td(log.friction, `friction ${log.friction.toLowerCase()}`),
      td(log.observation),
    );
    body.append(row);
  });
  table.append(body);
  card.append(table, el("button", "link-button", `View more logs (${logs.length})`));
  return card;
}

function profilesCard(profiles) {
  const card = sectionCard("User Profiles", "users");
  const table = document.createElement("table");
  table.className = "profiles-table";
  table.innerHTML = "<thead><tr><th>Persona</th><th>Segment</th><th>Primary Goal</th><th>Behavior Style</th></tr></thead>";
  const body = document.createElement("tbody");
  profiles.slice(0, 5).forEach((profile) => {
    const row = document.createElement("tr");
    const tags = el("span", "tag-list");
    profile.tags.forEach((tag) => tags.append(el("span", "style-tag", tag)));
    row.append(td(profile.persona), td(profile.segment), td(profile.goal), cell(tags));
    body.append(row);
  });
  table.append(body);
  card.append(table, el("button", "link-button", `View all ${profiles.length} profiles`));
  return card;
}

function sectionCard(title, iconName) {
  const card = el("section", "runner-card");
  const head = el("h3", "");
  head.append(icon(iconName), document.createTextNode(title));
  card.append(head);
  return card;
}

function setStatus(text, state) {
  refs.status.className = `status-pill ${state}`;
  refs.status.innerHTML = `<span></span> ${text}`;
}

function setRunning(running) {
  refs.start.disabled = running;
  refs.start.querySelector("span").textContent = running ? "Running" : "Start Run";
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
