const express = require("express");
const pool = require("../db");
const { writeAudit, clientIp } = require("../middleware/audit");
const router = express.Router();

router.get("/api/tool-logs", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "ToolLog" ORDER BY created_at DESC NULLS LAST, tool_log_id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error fetching tool logs" });
  }
});

router.post("/api/tool-logs", async (req, res) => {
  const { tool_name, tool_id, checked_by, status_review } = req.body;

  if (!tool_name || checked_by === undefined || checked_by === null) {
    return res.status(400).json({ error: "Missing required fields: tool_name, checked_by" });
  }

  try {
    const result = await pool.query(
      'INSERT INTO "ToolLog" (tool_name, tool_id, checked_by, status_review) VALUES ($1, $2, $3, $4) RETURNING *',
      [tool_name, tool_id || null, checked_by, status_review || null]
    );
    await writeAudit({
      user_id: req.user?.user_id ?? null,
      action: "tool_log_create",
      resource: `tool_log:${result.rows[0].tool_log_id}`,
      detail: { tool_name },
      ip: clientIp(req),
    });
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error saving tool log" });
  }
});

module.exports = router;
