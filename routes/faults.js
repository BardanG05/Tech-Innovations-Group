const express = require("express");
const pool = require("../db");
const { writeAudit, clientIp } = require("../middleware/audit");
const router = express.Router();

const FAULT_COLUMNS = [
  "fault_type",
  "location",
  "severity",
  "status",
  "notes",
  "marker_pattern",
  "risk_score",
  "weather_condition",
  "asset_area",
  "date_reported",
  "assigned_engineer",
  "days_to_resolve",
];

const REQUIRED_STRING_FIELDS = ["fault_type", "location", "severity", "status"];

/** @param {unknown} value */
function asTrimmedString(value) {
  if (value == null) return "";
  return String(value).trim();
}

/** @param {unknown} v */
function asNumberOrNull(v) {
  if (v === null || v === undefined || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

router.get("/api/faults", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "FaultReport" ORDER BY fault_id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal error getting data from faults" });
  }
});

router.post("/api/faults", async (req, res) => {
  const body = req.body || {};
  const { notes, marker_pattern } = body;

  const fault_type = asTrimmedString(body.fault_type);
  const location = asTrimmedString(body.location);
  const severity = asTrimmedString(body.severity);
  const status = asTrimmedString(body.status);

  if (!fault_type || !location || !severity || !status) {
    return res.status(400).json({
      error:
        "fault_type, location, severity, and status are required and must be non-empty after trimming whitespace",
    });
  }

  let risk_score = 5.0;
  if (body.risk_score !== undefined && body.risk_score !== null) {
    const n = asNumberOrNull(body.risk_score);
    if (n !== null) risk_score = n;
  }
  const weather_condition = body.weather_condition != null ? asTrimmedString(body.weather_condition) || null : null;
  const asset_area = body.asset_area != null ? asTrimmedString(body.asset_area) || null : null;
  const assigned_engineer =
    body.assigned_engineer != null ? asTrimmedString(body.assigned_engineer) || null : null;
  const days_to_resolve = asNumberOrNull(body.days_to_resolve);

  try {
    const result = await pool.query(
      `INSERT INTO "FaultReport" (
        fault_type, location, severity, status, notes, marker_pattern,
        risk_score, weather_condition, asset_area, assigned_engineer, days_to_resolve
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11) RETURNING *`,
      [
        fault_type,
        location,
        severity,
        status,
        notes != null ? asTrimmedString(notes) || null : null,
        marker_pattern != null ? asTrimmedString(marker_pattern) || null : null,
        risk_score,
        weather_condition,
        asset_area,
        assigned_engineer,
        days_to_resolve,
      ]
    );
    await writeAudit({
      user_id: req.user?.user_id ?? null,
      action: "fault_create",
      resource: `fault:${result.rows[0].fault_id}`,
      detail: { fault_type },
      ip: clientIp(req),
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error creating fault" });
  }
});

router.patch("/api/faults/:id", async (req, res) => {
  const faultId = parseInt(req.params.id, 10);
  if (!Number.isFinite(faultId)) {
    return res.status(400).json({ error: "Invalid fault id" });
  }

  const body = req.body || {};
  const assignments = [];
  const values = [];
  let idx = 1;

  for (const col of FAULT_COLUMNS) {
    if (body[col] === undefined) continue;

    if (REQUIRED_STRING_FIELDS.includes(col)) {
      const v = asTrimmedString(body[col]);
      if (!v) {
        return res.status(400).json({
          error: `${col} must be a non-empty string (whitespace-only values are not allowed)`,
        });
      }
      assignments.push(`${col} = $${idx++}`);
      values.push(v);
      continue;
    }

    if (col === "risk_score" || col === "days_to_resolve") {
      if (body[col] === null) {
        if (col === "risk_score") {
          return res.status(400).json({ error: "risk_score cannot be null" });
        }
        assignments.push(`${col} = $${idx++}`);
        values.push(null);
        continue;
      }
      const n = asNumberOrNull(body[col]);
      if (n === null) {
        return res.status(400).json({ error: `${col} must be a finite number` });
      }
      assignments.push(`${col} = $${idx++}`);
      values.push(n);
      continue;
    }

    if (col === "date_reported") {
      const v = body[col];
      if (v === null) {
        assignments.push(`${col} = $${idx++}`);
        values.push(null);
      } else {
        const d = new Date(String(v));
        if (Number.isNaN(d.getTime())) {
          return res.status(400).json({ error: "date_reported must be a valid ISO date string" });
        }
        assignments.push(`${col} = $${idx++}`);
        values.push(d.toISOString());
      }
      continue;
    }

    let v = body[col];
    if (v === null) {
      assignments.push(`${col} = $${idx++}`);
      values.push(null);
    } else {
      const s = asTrimmedString(v);
      assignments.push(`${col} = $${idx++}`);
      values.push(s === "" ? null : s);
    }
  }

  if (assignments.length === 0) {
    return res.status(400).json({ error: "No updatable fields provided" });
  }

  assignments.push(`updated_at = CURRENT_TIMESTAMP`);
  values.push(faultId);

  try {
    const result = await pool.query(
      `UPDATE "FaultReport" SET ${assignments.join(", ")} WHERE fault_id = $${idx} RETURNING *`,
      values
    );
    if (result.rowCount === 0) {
      return res.status(404).json({ error: "Fault not found" });
    }
    await writeAudit({
      user_id: req.user?.user_id ?? null,
      action: "fault_update",
      resource: `fault:${faultId}`,
      detail: body,
      ip: clientIp(req),
    });
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error updating fault" });
  }
});

module.exports = router;
