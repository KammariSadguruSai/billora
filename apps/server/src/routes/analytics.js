const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, isManagerOrAdmin } = require('../middleware/auth');

// GET /api/analytics/revenue
router.get('/revenue', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { year = new Date().getFullYear() } = req.query;
    const { data, error } = await supabase
      .from('payments')
      .select('amount, payment_date, payment_method')
      .gte('payment_date', `${year}-01-01`)
      .lte('payment_date', `${year}-12-31`)
      .eq('status', 'verified');

    if (error) throw error;

    // Group by month
    const monthly = Array.from({ length: 12 }, (_, i) => ({
      month: new Date(year, i, 1).toLocaleString('default', { month: 'short' }),
      revenue: 0,
      count: 0,
    }));

    data?.forEach(p => {
      const month = new Date(p.payment_date).getMonth();
      monthly[month].revenue += parseFloat(p.amount || 0);
      monthly[month].count++;
    });

    const total = data?.reduce((s, p) => s + parseFloat(p.amount || 0), 0) || 0;
    res.json({ monthly, total, year });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch revenue analytics' }); }
});

// GET /api/analytics/projects
router.get('/projects', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const [projects, tasks, timeLogs] = await Promise.all([
      supabase.from('projects').select('id, status, priority, budget, spent, progress, created_at'),
      supabase.from('tasks').select('id, status, priority, estimated_hours, logged_hours'),
      supabase.from('time_logs').select('hours, logged_date').order('logged_date', { ascending: true }).limit(90),
    ]);

    const statusGroups = { planning: 0, active: 0, on_hold: 0, completed: 0, cancelled: 0 };
    projects.data?.forEach(p => { statusGroups[p.status] = (statusGroups[p.status] || 0) + 1; });

    res.json({
      statusGroups,
      totalBudget: projects.data?.reduce((s, p) => s + parseFloat(p.budget || 0), 0),
      avgProgress: projects.data?.reduce((s, p) => s + p.progress, 0) / (projects.data?.length || 1),
      taskCompletion: (tasks.data?.filter(t => t.status === 'done').length || 0) / (tasks.data?.length || 1) * 100,
      timeLogs: timeLogs.data,
    });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch project analytics' }); }
});

// GET /api/analytics/team
router.get('/team', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('time_logs')
      .select('hours, user_id, logged_date, user:profiles(full_name, avatar_url)')
      .order('logged_date', { ascending: false })
      .limit(500);

    if (error) throw error;

    // Group by user
    const byUser = {};
    data?.forEach(log => {
      const uid = log.user_id;
      if (!byUser[uid]) byUser[uid] = { user: log.user, totalHours: 0, logs: [] };
      byUser[uid].totalHours += parseFloat(log.hours || 0);
      byUser[uid].logs.push(log);
    });

    res.json({ teamData: Object.values(byUser) });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch team analytics' }); }
});

module.exports = router;
