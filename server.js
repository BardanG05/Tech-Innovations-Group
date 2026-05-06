const path = require("path");
const express = require("express");
const cors = require("cors");
require("dotenv").config();

const pool = require("./db");

// Route files
const toolLogRoutes = require("./routes/toolLog");
<<<<<<< HEAD
const faultRoutes = require("./routes/faults");
const userRoutes = require("./routes/users");
=======
const dashboardRoutes = require("./routes/dashboard");

>>>>>>> d046d4a (Update backend role access and dashboard routes)
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
<<<<<<< HEAD
app.use(toolLogRoutes);
app.use(faultRoutes);
app.use(userRoutes);

app.use(express.static(path.join(__dirname, "static")));
=======

// Route files
app.use(toolLogRoutes);
app.use(dashboardRoutes);

// Checking server health
app.get("/", (req, res) => {
  res.send("Railway maintenance backend API is running");
});
>>>>>>> d046d4a (Update backend role access and dashboard routes)

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

<<<<<<< HEAD
app.get("/api/users", async (req, res) => {
=======
// GET faults data
app.get("/api/faults", async (req, res) => {
>>>>>>> d046d4a (Update backend role access and dashboard routes)
  try {
    const result = await pool.query('SELECT * FROM "User" ORDER BY user_id');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal error getting data from user" });
  }
});

// GET user access
app.get("/api/users", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "User"');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal error getting data from users" });
  }
});

// Start server last
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
<<<<<<< HEAD
});
=======
});
>>>>>>> d046d4a (Update backend role access and dashboard routes)
