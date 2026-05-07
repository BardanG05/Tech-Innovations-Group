import { config } from "./config.js";
import * as api from "./api.js";

/** @param {string} msg */
function showBanner(msg) {
  const el = document.getElementById("dash-banner");
  if (!el) return;
  el.hidden = false;
  el.textContent = msg;
}

/** @param {Record<string, number>} obj */
function objToChartData(obj) {
  const labels = Object.keys(obj || {});
  const data = labels.map((k) => Number(obj[k]));
  return { labels, data };
}

/** @param {string} canvasId @param {string} label @param {string[]} labels @param {number[]} data */
function miniLine(canvasId, label, labels, data) {
  const el = /** @type {HTMLCanvasElement} */ (document.getElementById(canvasId));
  if (!el || !window.Chart) return;
  const ctx = el.getContext("2d");
  if (!ctx) return;
  const last = data.slice(-8);
  const labs = labels.slice(-8);
  new window.Chart(ctx, {
    type: "line",
    data: {
      labels: labs,
      datasets: [
        {
          label,
          data: last,
          borderColor: "#3d9cf9",
          backgroundColor: "rgba(61,156,249,0.15)",
          fill: true,
          tension: 0.35,
          pointRadius: 0,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { display: false },
        y: { display: false },
      },
    },
  });
}

/** @param {string} canvasId @param {Record<string, number>} dict */
function doughnut(canvasId, dict) {
  const el = /** @type {HTMLCanvasElement} */ (document.getElementById(canvasId));
  if (!el || !window.Chart) return;
  const { labels, data } = objToChartData(dict);
  const ctx = el.getContext("2d");
  if (!ctx) return;
  new window.Chart(ctx, {
    type: "doughnut",
    data: {
      labels,
      datasets: [
        {
          data,
          backgroundColor: [
            "#3d9cf9",
            "#5ee1a8",
            "#f5c15c",
            "#f07178",
            "#9aa7bd",
            "#8b5cf6",
          ],
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: "right", labels: { color: "#e8edf5", boxWidth: 10 } } },
    },
  });
}

/** @param {string} canvasId @param {Record<string, number>} dict @param {boolean} horizontal */
function barChart(canvasId, dict, horizontal) {
  const el = /** @type {HTMLCanvasElement} */ (document.getElementById(canvasId));
  if (!el || !window.Chart) return;
  const { labels, data } = objToChartData(dict);
  const ctx = el.getContext("2d");
  if (!ctx) return;
  new window.Chart(ctx, {
    type: "bar",
    data: {
      labels,
      datasets: [
        {
          label: "Value",
          data,
          backgroundColor: "#3d9cf9aa",
        },
      ],
    },
    options: {
      indexAxis: horizontal ? "y" : "x",
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: {
        x: { ticks: { color: "#9aa7bd" }, grid: { color: "#2a3548" } },
        y: { ticks: { color: "#9aa7bd" }, grid: { color: "#2a3548" } },
      },
    },
  });
}

/** @param {string} canvasId @param {Record<string, number>} series */
function lineTrend(canvasId, series) {
  const el = /** @type {HTMLCanvasElement} */ (document.getElementById(canvasId));
  if (!el || !window.Chart) return;
  const labels = Object.keys(series || {}).sort();
  const data = labels.map((k) => Number(series[k]));
  const ctx = el.getContext("2d");
  if (!ctx) return;
  new window.Chart(ctx, {
    type: "line",
    data: {
      labels,
      datasets: [
        {
          label: "Avg risk",
          data,
          borderColor: "#3d9cf9",
          backgroundColor: "rgba(61,156,249,0.12)",
          fill: true,
          tension: 0.25,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { labels: { color: "#e8edf5" } } },
      scales: {
        x: { ticks: { color: "#9aa7bd", maxRotation: 45 } },
        y: { ticks: { color: "#9aa7bd" }, grid: { color: "#2a3548" } },
      },
    },
  });
}

function setText(id, text) {
  const n = document.getElementById(id);
  if (n) n.textContent = text;
}

function renderTable(rows) {
  const tb = document.querySelector("#dash-risk-table tbody");
  if (!tb) return;
  tb.replaceChildren();
  for (const row of rows || []) {
    const tr = document.createElement("tr");
    const r = /** @type {Record<string, unknown>} */ (row);
    for (const k of ["fault_id", "fault_type", "location", "risk_score", "status"]) {
      const td = document.createElement("td");
      td.textContent = String(r[k] ?? "");
      tr.appendChild(td);
    }
    tb.appendChild(tr);
  }
}

async function runPredict() {
  const sev = /** @type {HTMLSelectElement} */ (document.getElementById("pred-severity"));
  const wx = /** @type {HTMLInputElement} */ (document.getElementById("pred-weather"));
  const ar = /** @type {HTMLInputElement} */ (document.getElementById("pred-area"));
  const out = document.getElementById("pred-out");
  if (!sev || !out) return;
  try {
    const res = await api.postPredictRisk({
      severity: sev.value,
      weather_condition: wx?.value || "Dry",
      asset_area: ar?.value || "Station",
    });
    out.textContent = `Predicted risk (0–10): ${res.predicted_risk_score_0_10} (raw model ${res.predicted_risk_raw}, training RMSE ${res.model_rmse})`;
  } catch (e) {
    out.textContent = e instanceof Error ? e.message : String(e);
  }
}

async function init() {
  const apiInput = /** @type {HTMLInputElement} */ (document.getElementById("dash-api-base"));
  if (apiInput) apiInput.value = config.API_BASE_URL;

  document.getElementById("dash-save-api")?.addEventListener("click", () => {
    const v = apiInput?.value?.trim();
    if (v) {
      config.API_BASE_URL = v;
      window.location.reload();
    }
  });

  document.getElementById("dash-predict-btn")?.addEventListener("click", () => runPredict());

  try {
    const d = await api.getAnalytics();
    setText("kpi-risk", String(d.average_risk_score ?? "—"));
    setText("kpi-risk-hint", d.highest_risk_area ? `Hotspot: ${d.highest_risk_area}` : "");

    setText("kpi-open", String(d.open_faults ?? "—"));
    setText("kpi-open-hint", `${d.open_fault_percentage ?? 0}% of total`);

    setText("kpi-common", String(d.most_common_fault ?? "—"));
    setText("kpi-res", String(d.average_resolution_days ?? "—"));
    setText("kpi-pred", String(d.predicted_future_risk ?? "—"));
    setText("kpi-pred-hint", "Rolling mean (last 20 reports)");

    setText("foot-high", d.highest_risk_area ? `${d.highest_risk_area}` : "—");
    setText("foot-eng", String(d.active_engineers_estimate ?? "—"));
    setText("foot-tasks", String(d.scheduled_tasks_estimate ?? "—"));
    setText("foot-reports", String(d.reports_generated ?? "—"));

    renderTable(d.recent_high_risk_faults);

    const trend = d.risk_trend_over_time || {};
    const trendLabels = Object.keys(trend).sort();
    const trendData = trendLabels.map((k) => Number(trend[k]));
    miniLine("spark-risk", "risk", trendLabels, trendData);
    miniLine("spark-open", "trend", trendLabels, trendData);
    miniLine("spark-common", "trend", trendLabels, trendData);
    miniLine("spark-res", "trend", trendLabels, trendData);
    miniLine("spark-pred", "trend", trendLabels, trendData);

    doughnut("chart-weather", d.faults_by_weather || {});
    doughnut("chart-status", d.faults_by_status || {});
    barChart("chart-risk-area", d.average_risk_by_area || {}, false);
    barChart("chart-fault-area", d.faults_by_area || {}, true);
    lineTrend("chart-trend", d.risk_trend_over_time || {});
  } catch (e) {
    const err = e instanceof Error ? e.message : String(e);
    if (/** @type {any} */ (e).status === 401) {
      showBanner("Sign in from Operations (index.html) first — JWT required for analytics.");
    } else {
      showBanner(`Could not load analytics: ${err}`);
    }
  }
}

init();
