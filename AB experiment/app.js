const refs = {
  title: document.getElementById("experimentTitle"),
  subtitle: document.getElementById("experimentSubtitle"),
  dateRange: document.getElementById("dateRange"),
  winnerTitle: document.getElementById("winnerTitle"),
  winnerLabel: document.getElementById("winnerLabel"),
  summaryPrimary: document.getElementById("summaryPrimary"),
  summarySecondary: document.getElementById("summarySecondary"),
  summaryStats: document.getElementById("summaryStats"),
  metricGrid: document.getElementById("metricGrid"),
  evidenceTable: document.getElementById("evidenceTable"),
  featurePanel: document.getElementById("featurePanel"),
  suggestionGrid: document.getElementById("suggestionGrid"),
  exportButton: document.getElementById("exportButton"),
  runnerButton: document.getElementById("runnerButton"),
};

let dashboardData = null;
const DATA_URL = "./data/latest_ab_run.json";

loadDashboard();

refs.runnerButton.addEventListener("click", () => {
  window.location.href = "./synthetic_user/";
});

refs.exportButton.addEventListener("click", () => {
  if (!dashboardData) {
    return;
  }
  const blob = new Blob([JSON.stringify(dashboardData, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "synthetic-ab-run.json";
  link.click();
  URL.revokeObjectURL(url);
});

async function loadDashboard() {
  const runId = requestedRunId();
  if (runId) {
    try {
      const response = await fetch(`/api/synthetic-runs/${encodeURIComponent(runId)}`, { cache: "no-store" });
      if (response.ok) {
        const job = await response.json();
        if (job.status === "completed" && job.result) {
          dashboardData = job.result;
          render(dashboardData);
          return;
        }
      }
    } catch (error) {
      console.warn(error);
    }
  }
  try {
    const response = await fetch(DATA_URL, { cache: "no-store" });
    if (response.ok) {
      const data = await response.json();
      if (data?.matrix_summary) {
        dashboardData = data;
        render(dashboardData);
        return;
      }
    }
  } catch (error) {
    console.warn(error);
  }
  renderEmptyDashboard();
}

function requestedRunId() {
  const params = new URLSearchParams(window.location.search);
  return params.get("run");
}

function renderEmptyDashboard() {
  dashboardData = null;
  refs.subtitle.textContent = "Generate a synthetic run first";
  refs.dateRange.textContent = "No run yet";
  refs.winnerTitle.textContent = "No experiment generated";
  refs.winnerLabel.textContent = "Waiting for synthetic users";
  refs.summaryPrimary.textContent = "Open Synthetic Users, enter A/B URLs, then generate profiles, trajectories, metrics, and agent feedback.";
  refs.summarySecondary.textContent = "";
  refs.summaryStats.replaceChildren();
  refs.metricGrid.replaceChildren(emptyPanel("Metric Matrix"));
  refs.evidenceTable.replaceChildren(emptyPanel("Attribution"));
  refs.featurePanel.replaceChildren();
  refs.featurePanel.classList.add("hidden");
  refs.suggestionGrid.replaceChildren(emptyPanel("Suggestions"));
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function emptyPanel(label) {
  const node = el("article", "empty-state compact-empty");
  node.append(icon("sparkles"), el("h3", "", label), el("p", "", "Generated results will appear here after the run completes."));
  return node;
}

function render(data) {
  const matrix = data.matrix_summary;
  refs.title.textContent = "Synthetic A/B Lab";
  refs.subtitle.textContent = "Checkout copy test";
  refs.dateRange.textContent = matrix.date_range;
  refs.winnerTitle.textContent = matrix.title;
  refs.winnerLabel.textContent = matrix.label;
  refs.summaryPrimary.textContent = matrix.summary_primary;
  refs.summarySecondary.textContent = matrix.summary_secondary;

  renderSummaryStats(matrix.summary_stats);
  renderMetricMatrix(matrix.metrics, data.variants);
  renderEvidence(matrix.attribution_conclusion);
  renderFeatureCandidate(data);
  renderSuggestions(matrix.suggestions);

  if (window.lucide) {
    window.lucide.createIcons();
  }
}

function renderSummaryStats(stats) {
  refs.summaryStats.replaceChildren();
  stats.forEach((stat) => {
    const card = el("article", "stat-card");
    const valueClass = stat.kind === "confidence" ? "stat-value blue" : "stat-value";
    card.append(
      el("div", "stat-label", stat.label),
      el("div", valueClass, stat.value),
      el("div", "stat-detail", stat.detail),
    );
    refs.summaryStats.append(card);
  });
}

function renderMetricMatrix(metrics, variants = {}) {
  refs.metricGrid.replaceChildren();
  metrics.forEach((metric) => {
    const card = el("article", "metric-card");
    const table = document.createElement("table");
    const thead = document.createElement("thead");
    const tbody = document.createElement("tbody");
    const headRow = document.createElement("tr");
    const titleCell = document.createElement("th");

    const titleWrap = el("span", "metric-title");
    const iconWrap = el("span", "metric-icon");
    iconWrap.append(icon(metric.icon));
    titleWrap.append(iconWrap, document.createTextNode(metric.label));
    titleCell.append(titleWrap);

    headRow.append(titleCell, variantHead(variantCode(variants.A?.label, "A")), variantHead(variantCode(variants.B?.label, "B")));
    thead.append(headRow);

    tbody.append(
      valueRow("Real", metric.real.a, metric.real.b, metric.winner),
      valueRow("Synthetic", metric.synthetic.a, metric.synthetic.b, metric.winner),
    );
    table.append(thead, tbody);
    card.append(table);
    refs.metricGrid.append(card);
  });
}

function variantCode(label, fallback) {
  const match = String(label || "").match(/Variant\\s+([A-Z])/i);
  return match ? match[1].toUpperCase() : fallback;
}

function variantHead(label) {
  const cell = document.createElement("th");
  cell.className = "variant-head";
  cell.textContent = label;
  return cell;
}

function valueRow(label, valueA, valueB, winner) {
  const row = document.createElement("tr");
  row.append(el("td", "", label), metricValue(valueA, winner === "A"), metricValue(valueB, winner === "B"));
  return row;
}

function metricValue(text, isWinner) {
  const cell = document.createElement("td");
  cell.className = isWinner ? "winner-value" : "";
  cell.textContent = text;
  return cell;
}

function renderEvidence(rows) {
  refs.evidenceTable.replaceChildren();
  rows.forEach((row) => {
    const item = el("article", "evidence-row");
    const round = el("div", `round-icon ${row.level}`);
    round.append(icon(row.icon));

    const badge = el("span", `evidence-badge ${row.level}`);
    badge.append(icon(row.badge_icon), document.createTextNode(row.badge));

    item.append(
      round,
      el("div", "evidence-title", row.title),
      el("div", "evidence-copy", row.conclusion),
      badge,
    );
    refs.evidenceTable.append(item);
  });
}

function renderSuggestions(groups) {
  refs.suggestionGrid.replaceChildren();
  groups.forEach((group) => {
    const column = el("section", "suggestion-column");
    const iconWrap = el("div", "suggestion-icon");
    const content = document.createElement("div");
    const list = el("div", "check-list");

    iconWrap.append(icon(group.icon));
    content.append(el("h3", "", group.title));
    group.items.forEach((item) => {
      const row = el("div", "check-item");
      row.append(el("span", "box"), el("span", "", item));
      list.append(row);
    });
    content.append(list);
    column.append(iconWrap, content);
    refs.suggestionGrid.append(column);
  });
}

function renderFeatureCandidate(data) {
  const candidate = window.syntheticFeatureCandidate?.buildFeatureCandidate(data);
  refs.featurePanel.replaceChildren();
  if (!candidate) {
    refs.featurePanel.classList.add("hidden");
    return;
  }
  refs.featurePanel.classList.remove("hidden");
  const header = el("div", "feature-header");
  const iconWrap = el("div", "feature-icon");
  iconWrap.append(icon("sparkles"));
  const copy = el("div", "");
  copy.append(el("h2", "", "Next Feature Candidate"), el("p", "", candidate.source));
  header.append(iconWrap, copy, featureConfidence(candidate.confidence));

  const body = el("div", "feature-body");
  const brief = el("section", "feature-brief");
  brief.append(el("h3", "", candidate.title), el("p", "", candidate.problem));
  body.append(brief, featureList("MVP", candidate.mvp), featureList("Success Metrics", candidate.metrics));

  const evidence = el("div", "feature-evidence");
  candidate.evidence.forEach((item) => {
    const row = el("span", "");
    row.append(icon("check"), document.createTextNode(item));
    evidence.append(row);
  });
  refs.featurePanel.append(header, body, evidence, featureActions(candidate, () => dashboardData?.config?.a_url));
}

function featureConfidence(value) {
  const badge = el("span", "feature-confidence");
  badge.append(icon("gauge"), document.createTextNode(value));
  return badge;
}

function featureList(title, items) {
  const section = el("section", "feature-list");
  section.append(el("strong", "", title));
  const list = document.createElement("ul");
  items.slice(0, 4).forEach((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    list.append(li);
  });
  section.append(list);
  return section;
}

function featureActions(candidate, sourceUrlFn) {
  const wrap = el("div", "feature-actions");
  const button = el("button", "feature-generate", "Generate a new version based on suggestions");
  button.type = "button";
  const status = el("p", "generated-version-status", "");
  button.addEventListener("click", () => generateVersion(candidate, sourceUrlFn(), button, status));
  wrap.append(button, status);
  return wrap;
}

async function generateVersion(candidate, sourceUrl, button, status) {
  const preview = window.open("about:blank", "_blank");
  button.disabled = true;
  button.textContent = "Generating version...";
  status.textContent = "Writing a local Next.js route from this suggestion.";
  try {
    const result = await window.syntheticFeatureCandidate.requestGeneratedVersion(candidate, sourceUrl);
    const link = document.createElement("a");
    link.href = result.url;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = result.route;
    status.replaceChildren(document.createTextNode("Generated "), link, document.createTextNode(" - local only, ignored by git."));
    if (preview) {
      preview.location.href = result.url;
    } else {
      window.open(result.url, "_blank", "noreferrer");
    }
  } catch (error) {
    if (preview) {
      preview.close();
    }
    status.textContent = error.message || "Version generation failed.";
  } finally {
    button.disabled = false;
    button.textContent = "Generate a new version based on suggestions";
  }
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
