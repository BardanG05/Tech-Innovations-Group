import * as api from "./api.js";

/** @typedef {{ fault_type?: string, location?: string, severity?: string, status?: string, notes?: string, marker_pattern?: string }} FaultRow */

/** @type {FaultRow[]} */
let faultsCache = [];

const overlay = /** @type {HTMLElement} */ (document.getElementById("ar-overlay"));
const titleEl = /** @type {HTMLElement} */ (document.getElementById("ar-overlay-title"));
const line1 = /** @type {HTMLElement} */ (document.getElementById("ar-overlay-line1"));
const line2 = /** @type {HTMLElement} */ (document.getElementById("ar-overlay-line2"));
const statusEl = /** @type {HTMLElement} */ (document.getElementById("ar-status"));

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function hideOverlay() {
  overlay.hidden = true;
  titleEl.textContent = "";
  line1.textContent = "";
  line2.textContent = "";
}

/**
 * @param {'hiro'|'kanji'} preset
 */
function showOverlayForPreset(preset) {
  const match = faultsCache.find((f) => {
    const m = String(f.marker_pattern || "").toLowerCase();
    return m === preset;
  });

  if (!match) {
    overlay.hidden = false;
    titleEl.textContent = "No fault mapped";
    line1.textContent = `No fault uses the "${preset}" marker preset yet.`;
    line2.textContent = "Set marker preset on a fault in the dashboard, then refresh.";
    return;
  }

  overlay.hidden = false;
  titleEl.textContent = String(match.fault_type || "Fault");
  line1.textContent = `${String(match.severity || "")} · ${String(match.status || "")}`;
  line2.textContent = `${String(match.location || "")}${match.notes ? ` — ${String(match.notes)}` : ""}`;
}

async function loadFaults() {
  try {
    const rows = await api.getFaults();
    faultsCache = Array.isArray(rows) ? /** @type {FaultRow[]} */ (rows) : [];
    setStatus(faultsCache.length ? "Markers ready — show Hiro or Kanji." : "No faults returned from API.");
  } catch (e) {
    faultsCache = [];
    const msg = e instanceof Error ? e.message : String(e);
    setStatus(`API error: ${msg}`);
    hideOverlay();
  }
}

function wireMarker(markerId, preset) {
  const el = document.getElementById(markerId);
  if (!el) return;

  el.addEventListener("markerFound", () => {
    setStatus(`${preset} marker visible`);
    showOverlayForPreset(preset);
  });

  el.addEventListener("markerLost", () => {
    setStatus("Marker lost — overlay hidden.");
    hideOverlay();
  });
}

document.getElementById("ar-refresh")?.addEventListener("click", () => {
  loadFaults();
});

wireMarker("marker-hiro", "hiro");
wireMarker("marker-kanji", "kanji");

loadFaults();
