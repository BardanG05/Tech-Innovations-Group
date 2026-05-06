/**
 * @param {HTMLElement} root
 * @param {(msg: string, variant?: 'ok'|'err'|'info') => void} toast
 */
export function createDashboardUi(root, toast) {
  void toast;
  const els = {
    loginSection: /** @type {HTMLElement} */ (root.querySelector("#login-section")),
    appSection: /** @type {HTMLElement} */ (root.querySelector("#app-section")),
    userSelect: /** @type {HTMLSelectElement} */ (root.querySelector("#user-select")),
    loginBtn: /** @type {HTMLButtonElement} */ (root.querySelector("#login-btn")),
    logoutBtn: /** @type {HTMLButtonElement} */ (root.querySelector("#logout-btn")),
    sessionLabel: /** @type {HTMLElement} */ (root.querySelector("#session-label")),
    faultsList: /** @type {HTMLElement} */ (root.querySelector("#faults-list")),
    toolsList: /** @type {HTMLElement} */ (root.querySelector("#tools-list")),
    refreshBtn: /** @type {HTMLButtonElement} */ (root.querySelector("#refresh-btn")),
    addFaultBtn: /** @type {HTMLButtonElement} */ (root.querySelector("#add-fault-btn")),
    linkAr: /** @type {HTMLAnchorElement} */ (root.querySelector("#link-ar")),
    apiBaseInput: /** @type {HTMLInputElement} */ (root.querySelector("#api-base-input")),
    saveApiBtn: /** @type {HTMLButtonElement} */ (root.querySelector("#save-api-base")),
    faultDialog: /** @type {HTMLDialogElement} */ (root.querySelector("#fault-dialog")),
    faultForm: /** @type {HTMLFormElement} */ (root.querySelector("#fault-form")),
    faultFormTitle: /** @type {HTMLElement} */ (root.querySelector("#fault-form-title")),
    faultIdField: /** @type {HTMLInputElement} */ (root.querySelector("#fault-id")),
    faultType: /** @type {HTMLInputElement} */ (root.querySelector("#fault-type")),
    faultLocation: /** @type {HTMLInputElement} */ (root.querySelector("#fault-location")),
    faultSeverity: /** @type {HTMLSelectElement} */ (root.querySelector("#fault-severity")),
    faultStatus: /** @type {HTMLSelectElement} */ (root.querySelector("#fault-status")),
    faultNotes: /** @type {HTMLTextAreaElement} */ (root.querySelector("#fault-notes")),
    faultMarker: /** @type {HTMLSelectElement} */ (root.querySelector("#fault-marker")),
    faultCancel: /** @type {HTMLButtonElement} */ (root.querySelector("#fault-cancel")),
    toolForm: /** @type {HTMLFormElement} */ (root.querySelector("#tool-form")),
    toolName: /** @type {HTMLInputElement} */ (root.querySelector("#tool-name")),
    toolId: /** @type {HTMLInputElement} */ (root.querySelector("#tool-id")),
    toolStatus: /** @type {HTMLSelectElement} */ (root.querySelector("#tool-status")),
    globalError: /** @type {HTMLElement} */ (root.querySelector("#global-error")),
  };

  /** @param {string | null} text */
  function showGlobalError(text) {
    if (!els.globalError) return;
    if (!text) {
      els.globalError.hidden = true;
      els.globalError.textContent = "";
      return;
    }
    els.globalError.hidden = false;
    els.globalError.textContent = text;
  }

  return { els, toast, showGlobalError };
}

/** @param {string} sev */
export function severityClass(sev) {
  const s = String(sev || "").toLowerCase();
  if (s.includes("critical") || s.includes("severe")) return "sev-critical";
  if (s.includes("high")) return "sev-high";
  if (s.includes("medium") || s.includes("med")) return "sev-medium";
  if (s.includes("low")) return "sev-low";
  return "sev-unknown";
}

/**
 * @param {unknown} row
 * @param {(id: number) => void} onEdit
 */
export function renderFaultCard(row, onEdit) {
  const r = /** @type {Record<string, unknown>} */ (row || {});
  const id = Number(r.fault_id);
  const type = String(r.fault_type ?? "");
  const loc = String(r.location ?? "");
  const sev = String(r.severity ?? "");
  const st = String(r.status ?? "");
  const notes = String(r.notes ?? "");
  const marker = String(r.marker_pattern ?? "");

  const card = document.createElement("article");
  card.className = `fault-card ${severityClass(sev)}`;

  const head = document.createElement("header");
  head.className = "fault-card__head";
  const typeEl = document.createElement("span");
  typeEl.className = "fault-card__type";
  typeEl.textContent = type;
  const badge = document.createElement("span");
  badge.className = "badge";
  badge.textContent = st;
  head.append(typeEl, badge);

  const pLoc = document.createElement("p");
  pLoc.className = "fault-card__meta";
  pLoc.appendChild(document.createElement("strong")).textContent = "Location";
  pLoc.appendChild(document.createTextNode(" "));
  const locSpan = document.createElement("span");
  locSpan.className = "loc";
  locSpan.textContent = loc;
  pLoc.appendChild(locSpan);

  const pSev = document.createElement("p");
  pSev.className = "fault-card__meta";
  pSev.appendChild(document.createElement("strong")).textContent = "Severity";
  pSev.appendChild(document.createTextNode(" "));
  const sevSpan = document.createElement("span");
  sevSpan.className = "sev";
  sevSpan.textContent = sev;
  pSev.appendChild(sevSpan);

  const pNotes = document.createElement("p");
  pNotes.className = "fault-card__notes";
  pNotes.textContent = notes ? notes : "No notes yet.";

  const pAr = document.createElement("p");
  pAr.className = "fault-card__ar";
  pAr.appendChild(document.createElement("strong")).textContent = "AR marker";
  pAr.appendChild(document.createTextNode(" "));
  const mk = document.createElement("span");
  mk.className = "mk";
  mk.textContent = marker || "—";
  pAr.appendChild(mk);

  const foot = document.createElement("footer");
  foot.className = "fault-card__foot";
  const btn = document.createElement("button");
  btn.type = "button";
  btn.className = "btn btn--ghost edit-btn";
  btn.textContent = "Update";
  btn.addEventListener("click", () => {
    if (Number.isFinite(id)) onEdit(id);
  });
  foot.appendChild(btn);

  card.append(head, pLoc, pSev, pNotes, pAr, foot);
  return card;
}

/**
 * @param {unknown} row
 */
export function renderToolRow(row) {
  const r = /** @type {Record<string, unknown>} */ (row || {});
  const tr = document.createElement("tr");

  const tdName = document.createElement("td");
  tdName.textContent = String(r.tool_name ?? "");
  const tdId = document.createElement("td");
  tdId.textContent = r.tool_id != null && String(r.tool_id) !== "" ? String(r.tool_id) : "—";
  const tdBy = document.createElement("td");
  tdBy.textContent = String(r.checked_by ?? "");
  const tdSt = document.createElement("td");
  const pill = document.createElement("span");
  pill.className = "pill";
  pill.textContent = String(r.status_review ?? "—");
  tdSt.appendChild(pill);
  const tdWhen = document.createElement("td");
  tdWhen.className = "muted";
  tdWhen.textContent = r.created_at ? String(r.created_at) : "—";

  tr.append(tdName, tdId, tdBy, tdSt, tdWhen);
  return tr;
}
