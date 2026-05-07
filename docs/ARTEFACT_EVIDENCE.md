# Artefact evidence map (brief ↔ prototype)

Use this table when capturing **screenshots** for the group report. Replace bracketed notes with your own images.

| Brief theme | What to screenshot | Where in repo |
|-------------|-------------------|---------------|
| Fault detection & visualisation | AR view with Hiro marker showing fault overlay | `static/ar.html`, `static/js/ar.js` |
| Fault annotation in the field | AR overlay + “Field note” / “Mark field verified” after signing in | Same; actions call `PATCH /api/faults/:id` |
| Central dashboard / fault CRUD | Operations page: fault list, add/edit | `static/index.html`, `static/js/main.js` |
| Tool tracking & accountability | Operations tool form + log table; AR Kanji “tool accountability” strip + quick log | `routes/toolLog.js`, `static/js/ar.js` |
| Data analytics dashboard | Analytics page: KPIs, donuts, bars, line, table | `static/dashboard.html`, `static/js/dashboard.js`, `GET /api/analytics` |
| Predictive / ML pathway | Dashboard “Predictive insights” panel + API response | `POST /api/predict-risk`, `analytics/train_model.py`, `analytics/model_weights.json` |
| Security & access control | Sign-in with password; network tab showing `401` without JWT then `200` with Bearer | `routes/auth.js`, `middleware/requireJwt.js`, `SECURITY.md` |
| Monitoring / unusual behaviour (demo) | Optional: `GET /api/audit-events` in browser or tool | `routes/analytics.js`, `middleware/audit.js` |
| Integration | Same-origin: Express serves `static/` and `/api/*` | `server.js` |

## Pathway contributions (one-liners)

- **Computing / AR**: Marker-based WebAR (A-Frame + AR.js), contextual overlays, in-AR confirm flows that persist to the API.
- **Cyber**: JWT auth, rate limits, Helmet, audit logging, documented test plan in `SECURITY.md`.
- **Data analytics**: Live SQL aggregates for dashboard charts; Ridge regression model trained offline and exposed via `/api/predict-risk`.

## Mockup alignment

The analytics layout (sidebar, KPI row, doughnut/bar/line charts, high-risk table, footer tiles) is implemented on **`dashboard.html`** and fed by **`GET /api/analytics`**, which derives metrics from extended **`FaultReport`** columns (`risk_score`, `weather_condition`, `asset_area`, `date_reported`, etc.).
