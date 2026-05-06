const path = require("path");
const express = require("express");
const cors = require("cors");
const pool = require("./db");
const toolLogRoutes = require("./routes/toolLog");
const faultRoutes = require("./routes/faults");
const app = express();

app.use(cors());
app.use(express.json());
app.use(toolLogRoutes);
app.use(faultRoutes);

app.use(express.static(path.join(__dirname, "static")));

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "User" ORDER BY user_id');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal error getting data from user" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
