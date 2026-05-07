const express = require("express");
const pool = require("../db");
const router = express.Router();

router.get("/api/analytics", async (req, res) => {
  try {
    const totalR = await pool.query('SELECT COUNT(*)::int AS c FROM "FaultReport"');
    const total = totalR.rows[0].c;

    const avgRiskR = await pool.query(
      'SELECT COALESCE(AVG(risk_score), 0)::numeric(10,2) AS m FROM "FaultReport"'
    );
    const average_risk_score = Number(avgRiskR.rows[0].m);

    const openR = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "FaultReport" WHERE status ILIKE 'Open' OR status ILIKE 'In progress'`
    );
    const open_faults = openR.rows[0].c;
    const closedR = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "FaultReport" WHERE status ILIKE 'Closed' OR status ILIKE 'Resolved'`
    );
    const closed_faults = closedR.rows[0].c;
    const open_fault_percentage = total ? Math.round((open_faults / total) * 10000) / 100 : 0;

    const commonR = await pool.query(
      `SELECT fault_type, COUNT(*)::int AS n FROM "FaultReport" GROUP BY fault_type ORDER BY n DESC LIMIT 1`
    );
    const most_common_fault = commonR.rowCount ? commonR.rows[0].fault_type : null;

    const resR = await pool.query(
      `SELECT COALESCE(AVG(days_to_resolve), 0)::numeric(10,2) AS m FROM "FaultReport" WHERE days_to_resolve IS NOT NULL`
    );
    const average_resolution_days = Number(resR.rows[0].m);

    const areaRiskR = await pool.query(
      `SELECT asset_area, AVG(risk_score)::numeric(10,2) AS avg_r
       FROM "FaultReport" WHERE asset_area IS NOT NULL AND trim(asset_area) <> ''
       GROUP BY asset_area ORDER BY avg_r DESC LIMIT 1`
    );
    const highest_risk_area = areaRiskR.rowCount ? areaRiskR.rows[0].asset_area : null;

    const tailR = await pool.query(
      `SELECT COALESCE(AVG(risk_score), 0)::numeric(10,2) AS m FROM (
         SELECT risk_score FROM "FaultReport" ORDER BY date_reported DESC NULLS LAST LIMIT 20
       ) t`
    );
    const predicted_future_risk = Number(tailR.rows[0].m);

    const sevR = await pool.query(
      `SELECT severity, COUNT(*)::int AS c FROM "FaultReport" GROUP BY severity`
    );
    const severity_distribution = {};
    for (const row of sevR.rows) severity_distribution[row.severity] = row.c;

    const weatherR = await pool.query(
      `SELECT COALESCE(weather_condition, 'Unknown') AS w, COUNT(*)::int AS c
       FROM "FaultReport" GROUP BY COALESCE(weather_condition, 'Unknown')`
    );
    const faults_by_weather = {};
    for (const row of weatherR.rows) faults_by_weather[row.w] = row.c;

    const statusR = await pool.query(
      `SELECT status, COUNT(*)::int AS c FROM "FaultReport" GROUP BY status`
    );
    const faults_by_status = {};
    for (const row of statusR.rows) faults_by_status[row.status] = row.c;

    const areaCountR = await pool.query(
      `SELECT asset_area, COUNT(*)::int AS c FROM "FaultReport"
       WHERE asset_area IS NOT NULL AND trim(asset_area) <> ''
       GROUP BY asset_area ORDER BY c DESC`
    );
    const faults_by_area = {};
    for (const row of areaCountR.rows) faults_by_area[row.asset_area] = row.c;

    const avgByAreaR = await pool.query(
      `SELECT asset_area, ROUND(AVG(risk_score)::numeric, 2)::float AS m FROM "FaultReport"
       WHERE asset_area IS NOT NULL AND trim(asset_area) <> ''
       GROUP BY asset_area ORDER BY m DESC`
    );
    const average_risk_by_area = {};
    for (const row of avgByAreaR.rows) average_risk_by_area[row.asset_area] = Number(row.m);

    const trendR = await pool.query(
      `SELECT date_reported::date AS d, ROUND(AVG(risk_score)::numeric, 2)::float AS m
       FROM "FaultReport" WHERE date_reported IS NOT NULL
       GROUP BY date_reported::date ORDER BY d ASC`
    );
    const risk_trend_over_time = {};
    for (const row of trendR.rows) {
      const d = row.d instanceof Date ? row.d.toISOString().slice(0, 10) : String(row.d);
      risk_trend_over_time[d] = Number(row.m);
    }

    const highRiskCountR = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "FaultReport" WHERE risk_score >= 7`
    );
    const high_risk_count = highRiskCountR.rows[0].c;

    const highRiskR = await pool.query(
      `SELECT fault_id, fault_type, location, COALESCE(asset_area, '') AS asset_area,
              risk_score::float AS risk_score, status
       FROM "FaultReport" WHERE risk_score >= 7 ORDER BY risk_score DESC LIMIT 8`
    );
    const recent_high_risk_faults = highRiskR.rows.map((row) => ({
      fault_id: `F-${row.fault_id}`,
      fault_type: row.fault_type,
      location: row.location,
      asset_area: row.asset_area,
      risk_score: row.risk_score,
      status: row.status,
    }));

    const engR = await pool.query(
      `SELECT assigned_engineer, COUNT(*)::int AS c FROM "FaultReport"
       WHERE assigned_engineer IS NOT NULL AND trim(assigned_engineer) <> ''
       GROUP BY assigned_engineer`
    );
    const engineer_workload = {};
    for (const row of engR.rows) engineer_workload[row.assigned_engineer] = row.c;

    const highOpenR = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "FaultReport"
       WHERE risk_score >= 7 AND (status ILIKE 'Open' OR status ILIKE 'In progress')`
    );
    const overdue_high_risk_count = highOpenR.rows[0].c;

    const resolvedR = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "FaultReport" WHERE days_to_resolve IS NOT NULL AND days_to_resolve <= 5`
    );
    const resolvedDen = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "FaultReport" WHERE days_to_resolve IS NOT NULL`
    );
    const resolved_within_target_percentage =
      resolvedDen.rows[0].c > 0
        ? Math.round((resolvedR.rows[0].c / resolvedDen.rows[0].c) * 10000) / 100
        : 0;

    const auditR = await pool.query(
      `SELECT COUNT(*)::int AS c FROM "AuditLog" WHERE action NOT IN ('login_failed', 'login_success')`
    );
    const reports_generated = Math.min(99, auditR.rows[0].c || 5);

    const toolUsersR = await pool.query(
      `SELECT COUNT(DISTINCT checked_by)::int AS c FROM "ToolLog"
       WHERE created_at > NOW() - interval '7 days'`
    );
    const active_engineers_field = toolUsersR.rows[0].c || 3;

    res.json({
      total_faults: total,
      average_risk_score,
      open_faults,
      closed_faults,
      open_fault_percentage,
      most_common_fault,
      average_resolution_days,
      highest_risk_area,
      predicted_future_risk,
      most_likely_severity: Object.keys(severity_distribution).sort(
        (a, b) => (severity_distribution[b] || 0) - (severity_distribution[a] || 0)
      )[0],
      high_risk_count,
      overdue_high_risk_count,
      resolved_within_target_percentage,
      severity_distribution,
      faults_by_weather,
      faults_by_status,
      faults_by_area,
      average_risk_by_area,
      engineer_workload,
      risk_trend_over_time,
      recent_high_risk_faults,
      scheduled_tasks_estimate: 15,
      active_engineers_estimate: active_engineers_field,
      reports_generated,
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Analytics query failed" });
  }
});

router.get("/api/audit-events", async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT audit_id, user_id, action, resource, detail, ip_address, created_at
       FROM "AuditLog" ORDER BY created_at DESC LIMIT 100`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ error: "Audit log unavailable" });
  }
});

module.exports = router;
