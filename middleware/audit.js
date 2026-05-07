const pool = require("../db");

/**
 * @param {{ user_id?: number | null, action: string, resource?: string, detail?: unknown, ip?: string | null }} entry
 */
async function writeAudit(entry) {
  try {
    await pool.query(
      `INSERT INTO "AuditLog" (user_id, action, resource, detail, ip_address)
       VALUES ($1, $2, $3, $4::jsonb, $5)`,
      [
        entry.user_id ?? null,
        entry.action,
        entry.resource ?? null,
        JSON.stringify(entry.detail ?? {}),
        entry.ip ?? null,
      ]
    );
  } catch (e) {
    console.error("audit log failed:", e.message);
  }
}

function clientIp(req) {
  const xf = req.headers["x-forwarded-for"];
  if (typeof xf === "string" && xf.length) return xf.split(",")[0].trim();
  return req.socket?.remoteAddress || null;
}

module.exports = { writeAudit, clientIp };
