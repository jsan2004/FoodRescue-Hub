const db = require('../config/database');

/**
 * Record a benchmarking test result for Scenario A or Scenario B
 */
function recordEvaluation(req, res) {
  try {
    const { scenario, task_name, participant_id, time_taken_seconds, errors_count, completed_successfully, notes } = req.body;

    if (!scenario || !task_name || time_taken_seconds === undefined) {
      return res.status(400).json({ error: 'scenario, task_name, and time_taken_seconds are required' });
    }

    const stmt = db.prepare(`
      INSERT INTO evaluation_records (
        scenario, task_name, participant_id, time_taken_seconds, errors_count, completed_successfully, notes
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      scenario,
      task_name,
      participant_id || 'Anonymous Participant',
      parseFloat(time_taken_seconds),
      parseInt(errors_count, 10) || 0,
      completed_successfully !== undefined ? (completed_successfully ? 1 : 0) : 1,
      notes || null
    );

    return res.status(201).json({
      message: 'Evaluation trial logged successfully',
      id: result.lastInsertRowid
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Get aggregated comparison metrics for Scenario A vs Scenario B
 */
function getEvaluationMetrics(req, res) {
  try {
    const rawRecords = db.prepare(`
      SELECT * FROM evaluation_records ORDER BY created_at DESC
    `).all();

    // Aggregates by scenario
    const summaryByScenario = db.prepare(`
      SELECT 
        scenario,
        COUNT(*) as total_trials,
        ROUND(AVG(time_taken_seconds), 1) as avg_time_seconds,
        ROUND(AVG(errors_count), 2) as avg_errors,
        ROUND(SUM(completed_successfully) * 100.0 / COUNT(*), 1) as success_rate_pct
      FROM evaluation_records
      GROUP BY scenario
    `).all();

    // Aggregates by task and scenario
    const taskBreakdown = db.prepare(`
      SELECT 
        task_name,
        scenario,
        ROUND(AVG(time_taken_seconds), 1) as avg_time_seconds,
        ROUND(AVG(errors_count), 2) as avg_errors,
        COUNT(*) as trials
      FROM evaluation_records
      GROUP BY task_name, scenario
      ORDER BY task_name ASC, scenario ASC
    `).all();

    return res.json({
      records: rawRecords,
      summaryByScenario,
      taskBreakdown
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

module.exports = {
  recordEvaluation,
  getEvaluationMetrics
};
