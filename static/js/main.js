import { config } from "./config.js";
import * as api from "./api.js";
import * as state from "./state.js";
import { createDashboardUi, renderFaultCard, renderToolRow } from "./ui.js";

/** @param {string} msg @param {'ok'|'err'|'info'} [variant] */
function toast(msg, variant = "info") {
  const host = document.getElementById("toasts");
  if (!host) return;
  const el = document.createElement("div");
  el.className = `toast toast--${variant}`;
  el.textContent = msg;
  host.appendChild(el);
  requestAnimationFrame(() => el.classList.add("toast--show"));
  setTimeout(() => {
    el.classList.remove("toast--show");
    setTimeout(() => el.remove(), 300);
  }, 4200);
}

/** @param {unknown} u */
function canManageFaults(u) {
  if (!u || typeof u !== "object") return false;
  const role = String(/** @type {Record<string, unknown>} */ (u).user_role || "").toLowerCase();
  return role.includes("supervisor") || role.includes("manager") || role.includes("admin");
}

async function refreshAll(ui) {
  state.setLastError(null);
  ui.showGlobalError(null);

  if (config.USE_MOCK_FAULT_API) {
    state.setFaults(state.getMockFaults());
  } else {
    try {
      const faults = await api.getFaults();
      state.setFaults(faults);
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      state.setFaults(state.getMockFaults());
      state.setLastError(msg);
      ui.showGlobalError(
        `Fault API unavailable (${msg}). Showing demo faults until the database is reachable.`
      );
      toast("Fault list fell back to demo data.", "err");
    }
  }

  try {
    const [users, logs] = await Promise.all([api.getUsers(), api.getToolLogs()]);
    state.setUsers(users);
    state.setToolLogs(logs);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    toast(msg, "err");
  }

  renderSession(ui);
  renderFaultsList(ui);
  renderToolsList(ui);
  fillUserSelect(ui);
}

function renderSession(ui) {
  const s = state.getSession();
  if (s) {
    ui.els.loginSection.hidden = true;
    ui.els.appSection.hidden = false;
    ui.els.sessionLabel.textContent = `${s.user_name} (${s.user_role})`;
    const can = canManageFaults(s);
    ui.els.addFaultBtn.disabled = !can;
    ui.els.addFaultBtn.title = can ? "" : "Only supervisors or managers can add faults in this demo.";
  } else {
    ui.els.loginSection.hidden = false;
    ui.els.appSection.hidden = true;
  }
}

function renderFaultsList(ui) {
  const host = ui.els.faultsList;
  host.replaceChildren();
  const rows = state.getFaults();
  if (!rows.length) {
    const p = document.createElement("p");
    p.className = "empty";
    p.textContent = "No faults loaded yet.";
    host.appendChild(p);
    return;
  }
  for (const row of rows) {
    host.appendChild(
      renderFaultCard(row, (id) => {
        openFaultDialog(ui, id);
      })
    );
  }
}

function renderToolsList(ui) {
  const tbody = ui.els.toolsList.querySelector("tbody");
  if (!tbody) return;
  tbody.replaceChildren();
  for (const row of state.getToolLogs()) {
    tbody.appendChild(renderToolRow(row));
  }
}

/** @param {ReturnType<typeof createDashboardUi>} ui @param {number | null} faultId */
function openFaultDialog(ui, faultId) {
  const dlg = ui.els.faultDialog;
  const isEdit = faultId != null;
  ui.els.faultFormTitle.textContent = isEdit ? "Update fault" : "Report new fault";
  ui.els.faultIdField.value = faultId != null ? String(faultId) : "";
  if (isEdit) {
    const row = state.getFaults().find((r) => Number(/** @type {any} */ (r).fault_id) === faultId);
    if (row && typeof row === "object") {
      const r = /** @type {Record<string, unknown>} */ (row);
      ui.els.faultType.value = String(r.fault_type ?? "");
      ui.els.faultLocation.value = String(r.location ?? "");
      ui.els.faultSeverity.value = String(r.severity ?? "Medium");
      ui.els.faultStatus.value = String(r.status ?? "Open");
      ui.els.faultNotes.value = String(r.notes ?? "");
      ui.els.faultMarker.value = String(r.marker_pattern ?? "");
    }
  } else {
    ui.els.faultForm.reset();
    ui.els.faultIdField.value = "";
    ui.els.faultSeverity.value = "Medium";
    ui.els.faultStatus.value = "Open";
    ui.els.faultMarker.value = "hiro";
  }
  dlg.showModal();
}

/** @param {ReturnType<typeof createDashboardUi>} ui */
function wireFaultForm(ui) {
  ui.els.faultForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const idRaw = ui.els.faultIdField.value.trim();
    const payload = {
      fault_type: ui.els.faultType.value.trim(),
      location: ui.els.faultLocation.value.trim(),
      severity: ui.els.faultSeverity.value,
      status: ui.els.faultStatus.value,
      notes: ui.els.faultNotes.value.trim(),
      marker_pattern: ui.els.faultMarker.value.trim() || null,
    };

    if (!payload.fault_type || !payload.location) {
      toast("Fault type and location are required.", "err");
      return;
    }

    try {
      if (idRaw) {
        const id = Number(idRaw);
        await api.patchFault(id, payload);
        toast("Fault updated.", "ok");
      } else {
        await api.createFault(payload);
        toast("Fault reported.", "ok");
      }
      ui.els.faultDialog.close();
      await refreshAll(ui);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "err");
    }
  });

  ui.els.faultCancel.addEventListener("click", () => ui.els.faultDialog.close());
}

/** @param {ReturnType<typeof createDashboardUi>} ui */
function wireToolForm(ui) {
  ui.els.toolForm.addEventListener("submit", async (ev) => {
    ev.preventDefault();
    const s = state.getSession();
    if (!s) {
      toast("Sign in first.", "err");
      return;
    }
    const tool_name = ui.els.toolName.value.trim();
    const tool_id = ui.els.toolId.value.trim() || null;
    const status_review = ui.els.toolStatus.value;
    if (!tool_name) {
      toast("Tool name is required.", "err");
      return;
    }
    try {
      await api.createToolLog({
        tool_name,
        tool_id,
        checked_by: s.user_id,
        status_review,
      });
      toast("Tool log saved.", "ok");
      ui.els.toolForm.reset();
      await refreshAll(ui);
    } catch (e) {
      toast(e instanceof Error ? e.message : String(e), "err");
    }
  });
}

/** @param {ReturnType<typeof createDashboardUi>} ui */
function wireLogin(ui) {
  ui.els.loginBtn.addEventListener("click", async () => {
    const id = Number(ui.els.userSelect.value);
    const u = state.getUsers().find((row) => Number(/** @type {any} */ (row).user_id) === id);
    if (!u || typeof u !== "object") {
      toast("Pick a user from the list.", "err");
      return;
    }
    const r = /** @type {Record<string, unknown>} */ (u);
    state.setSession({
      user_id: Number(r.user_id),
      user_name: String(r.user_name),
      user_role: String(r.user_role),
    });
    toast(`Signed in as ${r.user_name}`, "ok");
    await refreshAll(ui);
  });

  ui.els.logoutBtn.addEventListener("click", () => {
    state.setSession(null);
    toast("Signed out.", "info");
    renderSession(ui);
  });
}

/** @param {ReturnType<typeof createDashboardUi>} ui */
function fillUserSelect(ui) {
  const sel = ui.els.userSelect;
  sel.replaceChildren();
  const ph = document.createElement("option");
  ph.value = "";
  ph.textContent = "Select staff member…";
  sel.appendChild(ph);
  for (const row of state.getUsers()) {
    if (!row || typeof row !== "object") continue;
    const r = /** @type {Record<string, unknown>} */ (row);
    const opt = document.createElement("option");
    opt.value = String(r.user_id);
    opt.textContent = `${r.user_name} — ${r.user_role}`;
    sel.appendChild(opt);
  }
}

async function init() {
  const root = document.getElementById("app");
  if (!root) return;
  const ui = createDashboardUi(root, toast);

  if (ui.els.apiBaseInput) {
    ui.els.apiBaseInput.value = config.API_BASE_URL;
  }
  ui.els.saveApiBtn?.addEventListener("click", () => {
    const v = ui.els.apiBaseInput?.value?.trim();
    if (v) {
      config.API_BASE_URL = v;
      toast("API base saved. Refreshing…", "ok");
      refreshAll(ui);
    }
  });

  ui.els.refreshBtn.addEventListener("click", () => refreshAll(ui));
  ui.els.addFaultBtn.addEventListener("click", () => openFaultDialog(ui, null));

  wireFaultForm(ui);
  wireToolForm(ui);
  wireLogin(ui);

  state.loadSessionFromStorage();

  try {
    await api.getHealth();
  } catch {
    toast("Health check failed — verify API base URL in settings.", "err");
  }

  try {
    const users = await api.getUsers();
    state.setUsers(users);
    fillUserSelect(ui);
  } catch (e) {
    toast(e instanceof Error ? e.message : String(e), "err");
  }

  if (state.getSession()) {
    await refreshAll(ui);
  } else {
    renderSession(ui);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && state.getSession()) {
      refreshAll(ui);
    }
  });

  if (config.POLL_INTERVAL_MS > 0) {
    setInterval(() => {
      if (state.getSession()) refreshAll(ui);
    }, config.POLL_INTERVAL_MS);
  }
}

init();
