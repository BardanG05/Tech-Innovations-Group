const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

let cached = null;

function loadModel() {
  if (cached) return cached;
  const p = path.join(__dirname, "..", "analytics", "model_weights.json");
  const raw = fs.readFileSync(p, "utf8");
  cached = JSON.parse(raw);
  return cached;
}

/**
 * Build one-hot vector aligned to sklearn get_feature_names_out order.
 * @param {string[]} names
 * @param {{ severity?: string, weather_condition?: string, asset_area?: string }} input
 */
function buildVector(names, input) {
  const sev = (input.severity != null ? String(input.severity) : "Medium").trim() || "Medium";
  const weather =
    (input.weather_condition != null ? String(input.weather_condition) : "Dry").trim() || "Dry";
  const area =
    (input.asset_area != null ? String(input.asset_area) : "Station").trim() || "Station";

  return names.map((fname) => {
    if (fname.startsWith("cat__severity_")) {
      const v = fname.slice("cat__severity_".length);
      return v === sev ? 1 : 0;
    }
    if (fname.startsWith("cat__weather_condition_")) {
      const v = fname.slice("cat__weather_condition_".length);
      return v === weather ? 1 : 0;
    }
    if (fname.startsWith("cat__asset_area_")) {
      const v = fname.slice("cat__asset_area_".length);
      return v === area ? 1 : 0;
    }
    return 0;
  });
}

function dot(a, b) {
  let s = 0;
  for (let i = 0; i < a.length; i++) s += a[i] * b[i];
  return s;
}

router.post("/api/predict-risk", (req, res) => {
  try {
    const m = loadModel();
    if (m.kind !== "sklearn_ridge_onehot" || !Array.isArray(m.feature_names) || !Array.isArray(m.coefficients)) {
      return res.status(500).json({ error: "Invalid model file" });
    }
    const body = req.body || {};
    const vec = buildVector(m.feature_names, {
      severity: body.severity,
      weather_condition: body.weather_condition,
      asset_area: body.asset_area,
    });
    const raw = Number(m.intercept) + dot(m.coefficients, vec);
    const onTenScale = Math.min(10, Math.max(0, Number((raw / 10).toFixed(2))));
    res.json({
      predicted_risk_score_0_10: onTenScale,
      predicted_risk_raw: Math.round(raw * 100) / 100,
      model_rmse: m.rmse,
      features_used: { severity: body.severity, weather_condition: body.weather_condition, asset_area: body.asset_area },
    });
  } catch (e) {
    console.error(e.message);
    res.status(500).json({ error: "Prediction failed" });
  }
});

module.exports = router;
