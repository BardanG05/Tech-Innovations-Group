const express = require("express");
const pool = require("../db");
const router = express.Router();

router.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT user_id, user_name, user_role FROM "User" ORDER BY user_id'
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal error getting users" });
  }
});

router.get("/api/user", (req, res) => {
  res.send("get user data");
});

module.exports = router;
