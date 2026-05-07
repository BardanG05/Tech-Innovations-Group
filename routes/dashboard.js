const express = require("express");
const pool = require("../db");
const checkRole = require("../middleware/checkRole");

const router = express.Router();

// Manager dashboard - high-level overview
router.get(
  "/api/manager-dashboard",
  checkRole(["OPPS Manager"]),
  async (req, res) => {
    try {
      const faults = await pool.query('SELECT * FROM "FaultReport"');
      const toolLogs = await pool.query('SELECT * FROM "ToolLog"');

      res.json({
        message: "Manager dashboard data",
        logged_in_user: req.user,
        faults: faults.rows,
        tool_logs: toolLogs.rows
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        error: "Error loading manager dashboard"
      });
    }
  }
);

// Supervisor dashboard - operational review
router.get(
  "/api/supervisor-dashboard",
  checkRole(["Supervisor", "Manager"]),
  async (req, res) => {
    try {
      const openFaults = await pool.query(
        'SELECT * FROM "FaultReport" WHERE status = $1',
        ["Open"]
      );

      const toolLogs = await pool.query('SELECT * FROM "ToolLog"');

      res.json({
        message: "Supervisor dashboard data",
        logged_in_user: req.user,
        open_faults: openFaults.rows,
        tool_logs: toolLogs.rows
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        error: "Error loading supervisor dashboard"
      });
    }
  }
);

// Technician dashboard - personal submitted records
router.get(
  "/api/technician-dashboard",
  checkRole(["Technician", "Supervisor", "Manager"]),
  async (req, res) => {
    try {
      const userId = req.user.user_id;

      const myToolLogs = await pool.query(
        'SELECT * FROM "ToolLog" WHERE checked_by = $1',
        [userId]
      );

      const myFaults = await pool.query(
        'SELECT * FROM "FaultReport" WHERE reported_by = $1',
        [userId]
      );

      res.json({
        message: "Technician dashboard data",
        logged_in_user: req.user,
        my_faults: myFaults.rows,
        my_tool_logs: myToolLogs.rows
      });

    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        error: "Error loading technician dashboard"
      });
    }
  }
);

module.exports = router;