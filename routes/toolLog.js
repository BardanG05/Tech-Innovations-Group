const express = require("express");
const pool = require("../db");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

<<<<<<< HEAD
router.get("/api/tool-logs", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM "ToolLog" ORDER BY created_at DESC NULLS LAST, tool_log_id DESC'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error fetching tool logs" });
=======
// Only supervisors and managers can view all tool logs
router.get(
  "/api/tool-logs",
  checkRole(["Supervisor", "Manager"]),
  async (req, res) => {
    try {
      const result = await pool.query('SELECT * FROM "ToolLog"');
      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Error fetching tool logs" });
    }
>>>>>>> d046d4a (Update backend role access and dashboard routes)
  }
);

// Technicians, supervisors and managers can create tool logs
router.post(
  "/api/tool-logs",
  checkRole(["Technician", "Supervisor", "Manager"]),
  async (req, res) => {
    const { tool_name, tool_id, status_review } = req.body;

<<<<<<< HEAD
  if (!tool_name || checked_by === undefined || checked_by === null) {
    return res.status(400).json({ error: "Missing required fields: tool_name, checked_by" });
  }

  try {
    const result = await pool.query(
      'INSERT INTO "ToolLog" (tool_name, tool_id, checked_by, status_review) VALUES ($1, $2, $3, $4) RETURNING *',
      [tool_name, tool_id || null, checked_by, status_review || null]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Error saving tool log" });
  }
});
=======
    if (!tool_name) {
      return res.status(400).json({ error: "Tool name is required" });
    }

    try {
      const result = await pool.query(
        'INSERT INTO "ToolLog" (tool_name, tool_id, checked_by, status_review) VALUES ($1, $2, $3, $4) RETURNING *',
        [tool_name, tool_id, req.user.user_id, status_review]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Error saving tool log" });
    }
  }
);
>>>>>>> d046d4a (Update backend role access and dashboard routes)

module.exports = router;
