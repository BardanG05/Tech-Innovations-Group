const pool = require("../db");

function checkRole(allowedRoles) {
  return async (req, res, next) => {
    // user_id can come from query, body, or headers
    const userId =
      req.query.user_id ||
      req.body?.user_id ||
      req.headers["x-user-id"];

    if (!userId) {
      return res.status(401).json({
        error: "User ID is required"
      });
    }

    try {
      // Find the user in the User table
      const result = await pool.query(
        'SELECT * FROM "User" WHERE user_id = $1',
        [userId]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({
          error: "User not found"
        });
      }

      const user = result.rows[0];

      // Check if the user's role is allowed
      if (!allowedRoles.includes(user.user_role)) {
        return res.status(403).json({
          error: "Access denied",
          required_roles: allowedRoles,
          your_role: user.user_role
        });
      }

      // Store user info so the route can use it
      req.user = user;

      // Continue to the route
      next();

    } catch (err) {
      console.error(err.message);
      res.status(500).json({
        error: "Role check failed"
      });
    }
  };
}

module.exports = checkRole;