import * as api from "./api.js";

/** @typedef {Record<string, unknown>} FaultRow */

/** @type {FaultRow[]} */
let faultsCache = [];
/** @type {Record<string, unknown>[]} */
let toolsCache = [];

/** @type {FaultRow | null} */
let activeFault = null;

/** When true, Kanji marker is showing the tool accountability deck (not a fault). */
let toolsViewActive = false;

const SESSION_KEY = "AR_MAINT_SESSION";

const overlay = /** @type {HTMLElement} */ (document.getElementById("ar-overlay"));
const titleEl = /** @type {HTMLElement} */ (document.getElementById("ar-overlay-title"));
const line1 = /** @type {HTMLElement} */ (document.getElementById("ar-overlay-line1"));
const line2 = /** @type {HTMLElement} */ (document.getElementById("ar-overlay-line2"));
const line3 = /** @type {HTMLElement} */ (document.getElementById("ar-overlay-line3"));
const statusEl = /** @type {HTMLElement} */ (document.getElementById("ar-status"));

/** @returns {number | null} */
function readSessionUserId() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    return typeof u.user_id === "number" ? u.user_id : null;
  } catch {
    return null;
  }
}

function setStatus(text) {
  if (statusEl) statusEl.textContent = text;
}

function setActionStatus(text) {
  const el = document.getElementById("ar-action-status");
  if (el) el.textContent = text;
}

function hideActionPanels() {
  document.getElementById("ar-fault-actions")?.setAttribute("hidden", "");
  document.getElementById("ar-tool-actions")?.setAttribute("hidden", "");
}

function hideOverlay() {
  overlay.hidden = true;
  toolsViewActive = false;
  titleEl.textContent = "";
  line1.textContent = "";
  line2.textContent = "";
  line3.textContent = "";
  hideActionPanels();
  activeFault = null;
  const note = /** @type {HTMLTextAreaElement} */ (document.getElementById("ar-note"));
  if (note) note.value = "";
  setActionStatus("");
}

/**
 * @param {FaultRow} match
 */
function showFaultOverlay(match) {
  toolsViewActive = false;
  hideActionPanels();
  overlay.hidden = false;
  activeFault = match;
  titleEl.textContent = String(match.fault_type || "Fault");
  line1.textContent = `${String(match.severity || "")} · ${String(match.status || "")}`;
  line2.textContent = `${String(match.location || "")}${match.notes ? ` — ${String(match.notes)}` : ""}`;
  line3.textContent = "";
  document.getElementById("ar-fault-actions")?.removeAttribute("hidden");
}

/**
 * @param {'hiro'|'kanji'} preset
 */
function showFaultForPreset(preset) {
  const match = faultsCache.find((f) => {
    const m = String(f.marker_pattern || "").toLowerCase();
    return m === preset;
  });

  hideActionPanels();
  overlay.hidden = false;

  if (!match) {
    toolsViewActive = false;
    activeFault = null;
    titleEl.textContent = "No fault mapped";
    line1.textContent = `No fault uses the "${preset}" marker preset yet.`;
    line2.textContent = "Set marker preset on a fault in Operations, then refresh.";
    line3.textContent = "";
    return;
  }

  showFaultOverlay(match);
}

function summarizeTools() {
  const counts = {};
  for (const row of toolsCache.slice(0, 50)) {
    const n = String(row.tool_name || "?");
    counts[n] = (counts[n] || 0) + 1;
  }
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8)
    .map(([k, v]) => `${k}: ${v}`);
}

function showToolsOverlay() {
  toolsViewActive = true;
  activeFault = null;
  hideActionPanels();
  overlay.hidden = false;
  titleEl.textContent = "Tool accountability";
  line1.textContent = `${toolsCache.length} tool log rows (latest first).`;
  line2.textContent = "Verify kit before closing the work order.";
  const lines = summarizeTools();
  line3.textContent = lines.length ? lines.join("\n") : "(No tool logs yet — log from Operations or below.)";
  document.getElementById("ar-tool-actions")?.removeAttribute("hidden");
}

async function loadFaults() {
  try {
    const rows = await api.getFaults();
    faultsCache = Array.isArray(rows) ? /** @type {FaultRow[]} */ (rows) : [];
    setStatus(faultsCache.length ? "Hiro: fault + actions. Kanji: tools." : "No faults returned from API.");
  } catch (e) {
    faultsCache = [];
    const msg = e instanceof Error ? e.message : String(e);
    setStatus(`API error: ${msg}`);
    hideOverlay();
  }
}

async function loadToolLogs() {
  try {
    const rows = await api.getToolLogs();
    toolsCache = Array.isArray(rows) ? /** @type {Record<string, unknown>[]} */ (rows) : [];
  } catch {
    toolsCache = [];
  }
}

async function refreshAll() {
  await Promise.all([loadFaults(), loadToolLogs()]);
}

/**
 * @param {string} markerId
 * @param {'hiro'|'kanji'} preset
 */
function wireMarker(markerId, preset) {
  const el = document.getElementById(markerId);
  if (!el) return;

  el.addEventListener("markerFound", () => {
    if (preset === "hiro") {
      setStatus("Hiro marker — fault context");
      showFaultForPreset("hiro");
      return;
    }
    const kanjiFault = faultsCache.find(
      (f) => String(f.marker_pattern || "").toLowerCase() === "kanji"
    );
    if (kanjiFault) {
      setStatus("Kanji marker — fault context");
      showFaultOverlay(kanjiFault);
    } else {
      setStatus("Kanji marker — tool tracking");
      showToolsOverlay();
    }
  });

  el.addEventListener("markerLost", () => {
    setStatus("Marker lost — overlay hidden.");
    hideOverlay();
  });
}

document.getElementById("ar-refresh")?.addEventListener("click", () => {
  refreshAll();
});

document.getElementById("ar-append-note")?.addEventListener("click", async () => {
  if (!activeFault || activeFault.fault_id == null) {
    setActionStatus("No active fault.");
    return;
  }
  const noteEl = /** @type {HTMLTextAreaElement} */ (document.getElementById("ar-note"));
  const extra = noteEl?.value?.trim();
  if (!extra) {
    setActionStatus("Enter a note first.");
    return;
  }
  const prev = String(activeFault.notes || "").trim();
  const merged = prev ? `${prev}\n[AR] ${extra}` : `[AR] ${extra}`;
  try {
    await api.patchFault(activeFault.fault_id, { notes: merged });
    setActionStatus("Note saved.");
    if (noteEl) noteEl.value = "";
    await loadFaults();
    const updated = faultsCache.find((f) => f.fault_id === activeFault?.fault_id);
    if (updated) {
      activeFault = updated;
      line2.textContent = `${String(updated.location || "")}${updated.notes ? ` — ${String(updated.notes)}` : ""}`;
    }
  } catch (e) {
    setActionStatus(e instanceof Error ? e.message : String(e));
  }
});

document.getElementById("ar-verify")?.addEventListener("click", async () => {
  if (!activeFault || activeFault.fault_id == null) {
    setActionStatus("No active fault.");
    return;
  }
  try {
    await api.patchFault(activeFault.fault_id, { status: "Field verified" });
    setActionStatus("Status updated to Field verified.");
    await loadFaults();
    const updated = faultsCache.find((f) => f.fault_id === activeFault?.fault_id);
    if (updated) {
      activeFault = updated;
      line1.textContent = `${String(updated.severity || "")} · ${String(updated.status || "")}`;
    }
  } catch (e) {
    setActionStatus(e instanceof Error ? e.message : String(e));
  }
});

document.getElementById("ar-tool-log")?.addEventListener("click", async () => {
  const uid = readSessionUserId();
  if (uid == null) {
    setStatus("Sign in on Operations first (JWT + session required).");
    return;
  }
  const nameEl = /** @type {HTMLInputElement} */ (document.getElementById("ar-tool-name"));
  const tool_name = nameEl?.value?.trim();
  if (!tool_name) {
    setStatus("Enter a tool name.");
    return;
  }
  try {
    await api.createToolLog({
      tool_name,
      checked_by: uid,
      status_review: "Checked out (AR)",
    });
    setStatus(`Logged: ${tool_name}`);
    if (nameEl) nameEl.value = "";
    await loadToolLogs();
    if (!overlay.hidden && toolsViewActive) {
      showToolsOverlay();
    }
  } catch (e) {
    setStatus(e instanceof Error ? e.message : String(e));
  }
});

wireMarker("marker-hiro", "hiro");
wireMarker("marker-kanji", "kanji");

refreshAll();
