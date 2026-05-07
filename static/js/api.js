import { config } from "./config.js";

/**
 * @param {Response} res
 * @param {string} fallback
 */
async function parseErrorBody(res, fallback) {
  try {
    const ct = res.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const j = await res.json();
      if (j && typeof j.error === "string") return j.error;
      if (j && typeof j.message === "string") return j.message;
    }
    const t = await res.text();
    if (t) return t.slice(0, 200);
  } catch {
    /* ignore */
  }
  return fallback;
}

/**
 * @param {string} path
 * @param {RequestInit} [init]
 */
export async function apiFetch(path, init = {}) {
  const url = `${config.API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
  const headers = new Headers(init.headers || {});
  if (!headers.has("Accept")) headers.set("Accept", "application/json");
  const body = init.body;
  if (body && typeof body === "string" && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const token = typeof sessionStorage !== "undefined" ? sessionStorage.getItem("AR_MAINT_TOKEN") : null;
  if (token && !headers.has("Authorization")) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  let res;
  try {
    res = await fetch(url, { ...init, headers });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Network error";
    throw new Error(`Cannot reach API (${url}): ${msg}`);
  }

  if (res.status === 204) return null;

  const ct = res.headers.get("content-type") || "";
  const isJson = ct.includes("application/json");

  if (!res.ok) {
    const message = await parseErrorBody(
      res,
      `Request failed (${res.status} ${res.statusText})`
    );
    const err = new Error(message);
    err.status = res.status;
    throw err;
  }

  if (res.status === 200 || res.status === 201) {
    if (!isJson) return res.text();
    const text = await res.text();
    return text ? JSON.parse(text) : null;
  }

  return null;
}

/**
 * Login without sending an existing Bearer token.
 * @param {{ user_name: string, password: string }} body
 */
export async function postLogin(body) {
  const url = `${config.API_BASE_URL}/api/login`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;
  if (!res.ok) {
    const err = new Error((data && data.error) || res.statusText);
    err.status = res.status;
    throw err;
  }
  return data;
}

export function getHealth() {
  return apiFetch("/health");
}

export function getFaults() {
  return apiFetch("/api/faults");
}

export function getUsers() {
  return apiFetch("/api/users");
}

export function getToolLogs() {
  return apiFetch("/api/tool-logs");
}

/**
 * @param {Record<string, unknown>} body
 */
export function createFault(body) {
  return apiFetch("/api/faults", { method: "POST", body: JSON.stringify(body) });
}

/**
 * @param {number|string} id
 * @param {Record<string, unknown>} body
 */
export function patchFault(id, body) {
  return apiFetch(`/api/faults/${encodeURIComponent(String(id))}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * @param {Record<string, unknown>} body
 */
export function createToolLog(body) {
  return apiFetch("/api/tool-logs", { method: "POST", body: JSON.stringify(body) });
}

export function getAnalytics() {
  return apiFetch("/api/analytics");
}

export function getAuditEvents() {
  return apiFetch("/api/audit-events");
}

/**
 * @param {{ severity?: string, weather_condition?: string, asset_area?: string }} body
 */
export function postPredictRisk(body) {
  return apiFetch("/api/predict-risk", { method: "POST", body: JSON.stringify(body) });
}
