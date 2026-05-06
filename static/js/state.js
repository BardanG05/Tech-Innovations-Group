const SESSION_KEY = "AR_MAINT_SESSION";

/** @typedef {{ user_id: number, user_name: string, user_role: string }} SessionUser */

/** @type {SessionUser | null} */
let session = null;

/** @type {unknown[]} */
let faults = [];

/** @type {unknown[]} */
let toolLogs = [];

/** @type {unknown[]} */
let users = [];

/** @type {string | null} */
let lastError = null;

export function getSession() {
  return session;
}

/** @param {SessionUser | null} u */
export function setSession(u) {
  session = u;
  try {
    if (u) localStorage.setItem(SESSION_KEY, JSON.stringify(u));
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    /* ignore */
  }
}

export function loadSessionFromStorage() {
  try {
    const raw = localStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const u = JSON.parse(raw);
    if (u && typeof u.user_id === "number" && typeof u.user_name === "string") {
      session = u;
      return session;
    }
  } catch {
    /* ignore */
  }
  return null;
}

export function getFaults() {
  return faults;
}

/** @param {unknown[]} rows */
export function setFaults(rows) {
  faults = Array.isArray(rows) ? rows : [];
}

export function getToolLogs() {
  return toolLogs;
}

/** @param {unknown[]} rows */
export function setToolLogs(rows) {
  toolLogs = Array.isArray(rows) ? rows : [];
}

export function getUsers() {
  return users;
}

/** @param {unknown[]} rows */
export function setUsers(rows) {
  users = Array.isArray(rows) ? rows : [];
}

export function getLastError() {
  return lastError;
}

/** @param {string | null} e */
export function setLastError(e) {
  lastError = e;
}

/** Mock faults for UI demos when API is unavailable */
export function getMockFaults() {
  return [
    {
      fault_id: 101,
      fault_type: "Door sensor",
      location: "Staff corridor",
      severity: "Low",
      status: "Open",
      notes: "Demo data — start the API to load live faults.",
      marker_pattern: "hiro",
    },
    {
      fault_id: 102,
      fault_type: "Hydraulic leak",
      location: "Maintenance pit B",
      severity: "High",
      status: "Open",
      notes: "Demo overlay for kanji marker.",
      marker_pattern: "kanji",
    },
  ];
}
