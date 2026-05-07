# Security baseline (TRL 3 prototype)

This document describes the intentional security posture of the demo and a lightweight test checklist suitable for coursework (Cyber pathway).

## Threat model (STRIDE-lite)

| Threat | Mitigation in repo | Residual risk |
|--------|-------------------|----------------|
| **Spoofing** | `POST /api/login` issues JWT signed with `JWT_SECRET`; protected routes use `Authorization: Bearer`. | Shared demo passwords; no MFA or device binding. |
| **Tampering** | Mutations audited in `AuditLog` via `writeAudit` on fault/tool actions and login. | No message signing on API payloads; DB not encrypted at rest in code. |
| **Repudiation** | Audit rows store `user_id`, `action`, `resource`, `ip_address`, `created_at`. | Client IP can be spoofed at HTTP layer; trust boundary is the network edge. |
| **Information disclosure** | `helmet` enabled (CSP relaxed for AR.js). `GET /api/users` exposes names/roles only (no password hash). | `GET /api/users` is public for the staff dropdown; acceptable for TRL 3 if documented. |
| **Denial of service** | Global rate limit + stricter limit on `/api` including login. | No WAF; single-node deployment. |
| **Elevation of privilege** | JWT carries `user_role`; extend with role checks on routes if RBAC is required. | Role is not yet enforced per endpoint. |

## Configuration

- Set a strong **`JWT_SECRET`** in production (see `.env.example`). The default in code is for local demo only.
- Use **HTTPS** in front of Node (reverse proxy or PaaS TLS). The app serves plain HTTP locally by design.

## Manual test checklist

1. **Health**: `GET /health` returns `200` and JSON `{ "status": "ok" }` without auth.
2. **Auth gate**: `GET /api/faults` without `Authorization` returns `401`.
3. **Login**: `POST /api/login` with valid `user_name` / `password` returns `token` and `user`.
4. **Login failure**: Wrong password increments audit (`login_failed`) and returns `401` without token.
5. **Authenticated read**: With `Bearer` token, `GET /api/faults` returns `200`.
6. **Analytics**: `GET /api/analytics` with Bearer returns aggregate JSON.
7. **Prediction**: `POST /api/predict-risk` with JSON body returns `predicted_risk_score_0_10`.
8. **Rate limit**: Many rapid `POST /api/login` attempts eventually receive `429` (login limiter).

## Reporting

Map screenshots of login, denied request, successful JWT call, and audit table to the group report under “Security & access control”.
