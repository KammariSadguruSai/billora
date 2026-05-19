const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, isManagerOrAdmin } = require('../middleware/auth');

// GET /api/dashboard
router.get('/', authenticate, async (req, res) => {
  try {
    const userId = req.user.id;
    const role = req.user.role;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

    if (role === 'client') {
      const { data: client } = await supabase.from('clients').select('id').eq('user_id', userId).single();
      const clientId = client?.id;

      const [projects, invoices, recentActivity] = await Promise.all([
        supabase.from('projects').select('id, name, status, progress, end_date').eq('client_id', clientId),
        supabase.from('invoices').select('id, invoice_number, total, amount_due, status').eq('client_id', clientId),
        supabase.from('activity_logs').select('*').limit(10).order('created_at', { ascending: false }),
      ]);

      return res.json({
        projects: { total: projects.data?.length || 0, data: projects.data },
        invoices: {
          total: invoices.data?.length || 0,
          pending: invoices.data?.filter(i => i.status !== 'paid').reduce((s, i) => s + parseFloat(i.amount_due || 0), 0),
          data: invoices.data?.slice(0, 5),
        },
        recentActivity: recentActivity.data,
      });
    }

    // Admin / Manager dashboard
    const [
      projectsData, tasksData, invoicesData, paymentsData,
      clientsData, usersData, recentProjects, pendingPayments
    ] = await Promise.all([
      supabase.from('projects').select('id, status', { count: 'exact' }),
      supabase.from('tasks').select('id, status', { count: 'exact' }),
      supabase.from('invoices').select('id, total, amount_paid, status'),
      supabase.from('payments').select('amount, payment_date').gte('payment_date', startOfMonth),
      supabase.from('clients').select('id', { count: 'exact' }),
      supabase.from('profiles').select('id, role', { count: 'exact' }),
      supabase.from('projects').select('id, name, status, progress, client:clients(name)').order('updated_at', { ascending: false }).limit(5),
      supabase.from('payments').select('*, invoice:invoices(invoice_number), client:invoices(client:clients(name))').eq('status', 'pending').limit(5),
    ]);

    const projects = projectsData.data || [];
    const tasks = tasksData.data || [];
    const invoices = invoicesData.data || [];

    const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
    const pendingRevenue = invoices.reduce((s, i) => s + parseFloat(i.total || 0) - parseFloat(i.amount_paid || 0), 0);
    const monthlyRevenue = paymentsData.data?.reduce((s, p) => s + parseFloat(p.amount || 0), 0) || 0;

    const projectStats = {
      total: projects.length,
      active: projects.filter(p => p.status === 'active').length,
      completed: projects.filter(p => p.status === 'completed').length,
      planning: projects.filter(p => p.status === 'planning').length,
    };

    const taskStats = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      in_progress: tasks.filter(t => t.status === 'in_progress').length,
      done: tasks.filter(t => t.status === 'done').length,
    };

    res.json({
      stats: {
        totalRevenue,
        pendingRevenue,
        monthlyRevenue,
        totalClients: clientsData.count,
        totalUsers: usersData.count,
        projectStats,
        taskStats,
      },
      recentProjects: recentProjects.data,
      pendingPayments: pendingPayments.data,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

module.exports = router;
