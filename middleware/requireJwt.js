const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "change-me-in-production-trl3-demo";

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: "8h" });
}

function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

function requireJwt(req, res, next) {
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/i);
  if (!m) {
    return res.status(401).json({ error: "Missing or invalid Authorization header" });
  }
  const decoded = verifyToken(m[1]);
  if (!decoded || typeof decoded.user_id !== "number") {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
  req.user = {
    user_id: decoded.user_id,
    user_name: decoded.user_name,
    user_role: decoded.user_role,
  };
  next();
}

module.exports = { requireJwt, signToken, verifyToken, JWT_SECRET };
