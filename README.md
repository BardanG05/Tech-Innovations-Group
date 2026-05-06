# Tech Innovations — AR Maintenance Support

University group project: **Technological Innovations in Business Analytics**. This repository contains the **Express API**, **PostgreSQL schema**, and a **static frontend** under `static/`.

## Quick start

1. Create a PostgreSQL database and apply schema + seed data:

   - Run [`DataBases/scheme.sql`](DataBases/scheme.sql)
   - Run [`DataBases/sample_data.sql`](DataBases/sample_data.sql)

2. Copy [`.env.example`](.env.example) to `.env` and set database credentials.

3. Install and run the server (serves API + static UI on the same port):

   ```bash
   npm install
   npm start
   ```

4. Open **http://localhost:3000/** for the dashboard and **http://localhost:3000/ar.html** for the AR view (use HTTPS or localhost so the camera works).

If the API runs on another host, set **API base URL** on the sign-in panel (stored in `localStorage` as `AR_MAINT_API_BASE`).

## Frontend layout

| Path | Purpose |
|------|---------|
| `static/index.html` | Dashboard: faults, tool logs, session |
| `static/ar.html` | WebAR (A-Frame + AR.js) with marker overlays |
| `static/js/api.js` | HTTP client |
| `static/js/state.js` | Client state + session persistence |
| `static/js/ui.js` | DOM rendering helpers |
| `static/js/main.js` | Dashboard bootstrap |
| `static/js/ar.js` | AR marker wiring |
| `static/js/config.js` | API base URL + feature flags |

## API contract (JSON)

Base URL: same origin in dev, or override via dashboard settings.

### Faults — `FaultReport`

| Method | Path | Body / notes |
|--------|------|----------------|
| `GET` | `/api/faults` | Returns an array of faults. |
| `POST` | `/api/faults` | `{ fault_type, location, severity, status, notes?, marker_pattern? }` — first four are required. |
| `PATCH` | `/api/faults/:id` | Any subset of: `fault_type`, `location`, `severity`, `status`, `notes`, `marker_pattern`. |

`marker_pattern` should match AR.js presets used in `static/ar.html` (e.g. `hiro`, `kanji`) so the AR overlay can map markers to rows.

### Tool logs — `ToolLog`

| Method | Path | Body / notes |
|--------|------|----------------|
| `GET` | `/api/tool-logs` | Returns rows, newest first. |
| `POST` | `/api/tool-logs` | `{ tool_name, tool_id?, checked_by, status_review? }` — `tool_name` and `checked_by` (integer user id) are required. |

### Users

| Method | Path | Notes |
|--------|------|--------|
| `GET` | `/api/users` | Used to populate the sign-in list and `checked_by` until token auth exists. |

### Health

| Method | Path |
|--------|------|
| `GET` | `/health` |

## Backend coordination notes

- **Authentication:** The UI simulates login by choosing a user from `GET /api/users`. When the team adds real auth, wire tokens in `static/js/api.js` (`sessionStorage` key `AR_MAINT_TOKEN` is already read when set).
- **Tool check-in/out:** The current API appends a new `ToolLog` row per action; there is no `PATCH` for logs yet. The dashboard documents this behaviour.

## AR markers

Print **Hiro** and **Kanji** markers compatible with [AR.js](https://ar-js-org.github.io/AR.js-Docs/) and point the device camera at them in `ar.html`. Overlays show the fault whose `marker_pattern` matches the visible marker preset.
