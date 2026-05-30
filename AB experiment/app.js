const DATA_URL = "./data/latest_ab_run.json";

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
  suggestionGrid: document.getElementById("suggestionGrid"),
  exportButton: document.getElementById("exportButton"),
  runnerButton: document.getElementById("runnerButton"),
};

let dashboardData = null;

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
  const response = await fetch(DATA_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Could not load ${DATA_URL}: ${response.status}`);
  }
  dashboardData = await response.json();
  render(dashboardData);
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
  renderMetricMatrix(matrix.metrics);
  renderEvidence(matrix.attribution_conclusion);
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

function renderMetricMatrix(metrics) {
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

    headRow.append(titleCell, variantHead("A"), variantHead("B"));
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
