const express = require("express");
const bcrypt = require("bcryptjs");
const pool = require("../db");
const { signToken } = require("../middleware/requireJwt");
const { writeAudit, clientIp } = require("../middleware/audit");

const router = express.Router();

router.post("/login", async (req, res) => {
  const { user_name, password } = req.body || {};
  const name = user_name != null ? String(user_name).trim() : "";
  if (!name || !password) {
    return res.status(400).json({ error: "user_name and password are required" });
  }

  try {
    const r = await pool.query('SELECT * FROM "User" WHERE user_name = $1', [name]);
    if (r.rowCount === 0) {
      await writeAudit({
        action: "login_failed",
        resource: "auth",
        detail: { reason: "unknown_user", user_name: name },
        ip: clientIp(req),
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const user = r.rows[0];
    const ok = await bcrypt.compare(String(password), user.password_hash);
    if (!ok) {
      await writeAudit({
        user_id: user.user_id,
        action: "login_failed",
        resource: "auth",
        detail: { reason: "bad_password" },
        ip: clientIp(req),
      });
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const token = signToken({
      user_id: user.user_id,
      user_name: user.user_name,
      user_role: user.user_role,
    });

    await writeAudit({
      user_id: user.user_id,
      action: "login_success",
      resource: "auth",
      ip: clientIp(req),
    });

    res.json({
      token,
      user: {
        user_id: user.user_id,
        user_name: user.user_name,
        user_role: user.user_role,
      },
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Login error" });
  }
});

module.exports = router;
