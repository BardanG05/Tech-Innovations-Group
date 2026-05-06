const express = require("express");
const cors = require("cors");
const pool = require("./db");
const toolLogRoutes = require("./routes/toolLog");
const app = express();

app.use(cors());
app.use(express.json());
app.use(toolLogRoutes);

//checking server health
app.get("/", (req, res) => {
  res.send("Railway maintenance backend API is running");
});

app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

//GET faults data 
app.get("/api/faults", async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM "FaultReport"');
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Internal error getting data from faults" });
  }
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// GET user access
app.get("/api/users", async (req, res) => {
  try{
    const result = await pool.query('SELECT * FROM "User"');
    res.json(result.rows);
  } catch(err) {
    console.error(err.message);
    res.status(500).json({error: "Internal error getting data from user "})
  }
});