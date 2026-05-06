/**
 * @typedef {Object} AppConfig
 * @property {string} API_BASE_URL
 * @property {boolean} USE_MOCK_FAULT_API
 * @property {number} POLL_INTERVAL_MS - 0 disables polling
 */

const STORAGE_API_KEY = "AR_MAINT_API_BASE";

function readStoredApiBase() {
  try {
    return localStorage.getItem(STORAGE_API_KEY);
  } catch {
    return null;
  }
}

/** @type {AppConfig} */
export const config = {
  get API_BASE_URL() {
    const stored = readStoredApiBase();
    if (stored && stored.trim()) return stored.replace(/\/$/, "");
    if (typeof window !== "undefined" && window.location?.origin) {
      return window.location.origin.replace(/\/$/, "");
    }
    return "http://localhost:3000";
  },
  set API_BASE_URL(value) {
    try {
      if (value && String(value).trim()) {
        localStorage.setItem(STORAGE_API_KEY, String(value).trim().replace(/\/$/, ""));
      } else {
        localStorage.removeItem(STORAGE_API_KEY);
      }
    } catch {
      /* ignore */
    }
  },
  USE_MOCK_FAULT_API: false,
  /** Dashboard polling; 0 = off. Focus refresh always runs in main.js */
  POLL_INTERVAL_MS: 45_000,
};
