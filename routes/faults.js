const express = require("express");
const pool = require("../db");
const router = express.Router();

const FAULT_COLUMNS = [
  "fault_type",
  "location",
  "severity",
  "status",
  "notes",
  "marker_pattern",
];

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
  const { fault_type, location, severity, status, notes, marker_pattern } = body;

  if (!fault_type || !location || !severity || !status) {
    return res.status(400).json({
      error: "fault_type, location, severity, and status are required",
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO "FaultReport" (fault_type, location, severity, status, notes, marker_pattern)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING *`,
      [
        String(fault_type).trim(),
        String(location).trim(),
        String(severity).trim(),
        String(status).trim(),
        notes != null ? String(notes).trim() || null : null,
        marker_pattern != null ? String(marker_pattern).trim() || null : null,
      ]
    );
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
    if (body[col] !== undefined) {
      let v = body[col];
      if (typeof v === "string") v = v.trim();
      assignments.push(`${col} = $${idx++}`);
      if (v === "" || v === null) values.push(null);
      else values.push(v);
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
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error updating fault" });
  }
});

module.exports = router;
