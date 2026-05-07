const path = require("path");
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { requireJwt } = require("./middleware/requireJwt");
const authRoutes = require("./routes/auth");
const toolLogRoutes = require("./routes/toolLog");
const faultRoutes = require("./routes/faults");
const analyticsRoutes = require("./routes/analytics");
const predictRoutes = require("./routes/predict");
const userRoutes = require("./routes/users");

const app = express();

app.use(
  helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
  })
);
app.use(cors());
app.use(express.json({ limit: "200kb" }));

const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 600,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(generalLimiter);

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 40,
  message: { error: "Too many login attempts" },
});

function selectiveJwt(req, res, next) {
  const url = (req.originalUrl || "").split("?")[0];
  if (!url.startsWith("/api/")) return next();
  if (req.method === "POST" && url === "/api/login") return next();
  if (req.method === "GET" && url === "/api/users") return next();
  return requireJwt(req, res, next);
}

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.use("/api", loginLimiter, authRoutes);
app.use(selectiveJwt);
app.use(toolLogRoutes);
app.use(faultRoutes);
app.use(analyticsRoutes);
app.use(predictRoutes);
app.use(userRoutes);

app.use(express.static(path.join(__dirname, "static")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
