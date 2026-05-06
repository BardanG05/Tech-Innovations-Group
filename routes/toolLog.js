const express = require("express");
const pool = require("../db");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

// Supervisors and OPPS Managers can view all tool logs
router.get(
  "/api/tool-logs",
  checkRole(["Supervisor", "OPPS Manager"]),
  async (req, res) => {
    try {
      const result = await pool.query(
        'SELECT * FROM "ToolLog" ORDER BY created_at DESC NULLS LAST, tool_log_id DESC'
      );

      res.json(result.rows);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Error fetching tool logs" });
    }
  }
);

// Technicians, supervisors and OPPS Managers can create tool logs
router.post(
  "/api/tool-logs",
  checkRole(["Technician", "Supervisor", "OPPS Manager"]),
  async (req, res) => {
    const { tool_name, tool_id, status_review } = req.body;

    if (!tool_name) {
      return res.status(400).json({
        error: "Missing required field: tool_name"
      });
    }

    try {
      const result = await pool.query(
        'INSERT INTO "ToolLog" (tool_name, tool_id, checked_by, status_review) VALUES ($1, $2, $3, $4) RETURNING *',
        [
          tool_name,
          tool_id || null,
          req.user.user_id,
          status_review || null
        ]
      );

      res.status(201).json(result.rows[0]);
    } catch (err) {
      console.error(err.message);
      res.status(500).json({ error: "Error saving tool log" });
    }
  }
);

module.exports = router;