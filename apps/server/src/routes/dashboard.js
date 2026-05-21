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

    // Finance dashboard
    if (role === 'finance') {
      const [invoicesData, paymentsData, payslipsData, pendingPayments] = await Promise.all([
        supabase.from('invoices').select('id, total, amount_paid, status'),
        supabase.from('payments').select('amount, payment_date').gte('payment_date', startOfMonth),
        supabase.from('payslips').select('id, status, net_salary'),
        supabase.from('payments').select('*, invoice:invoices(invoice_number), client:invoices(client:clients(name))').eq('status', 'pending').limit(5),
      ]);

      const invoices = invoicesData.data || [];
      const payslips = payslipsData.data || [];

      const totalRevenue = invoices.reduce((s, i) => s + parseFloat(i.amount_paid || 0), 0);
      const pendingRevenue = invoices.reduce((s, i) => s + parseFloat(i.total || 0) - parseFloat(i.amount_paid || 0), 0);
      const monthlyRevenue = paymentsData.data?.reduce((s, p) => s + parseFloat(p.amount || 0), 0) || 0;

      const payrollStats = {
        totalDraft: payslips.filter(p => p.status === 'draft').length,
        totalPaid: payslips.filter(p => p.status === 'paid').length,
        monthlyPayroll: payslips.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.net_salary || 0), 0),
      };

      return res.json({
        stats: {
          totalRevenue,
          pendingRevenue,
          monthlyRevenue,
          payrollStats,
        },
        pendingPayments: pendingPayments.data,
      });
    }

    // HR dashboard
    if (role === 'hr') {
      const [profilesData, payslipsData, recentPayslipsData] = await Promise.all([
        supabase.from('profiles').select('id, department, is_active').neq('role', 'client'),
        supabase.from('payslips').select('id, status, net_salary'),
        supabase.from('payslips').select('*, employee:profiles(full_name)').order('created_at', { ascending: false }).limit(5),
      ]);

      const profiles = profilesData.data || [];
      const payslips = payslipsData.data || [];

      const activeEmployees = profiles.filter(p => p.is_active).length;
      const deptCounts = profiles.reduce((acc, p) => {
        const d = p.department || 'Unassigned';
        acc[d] = (acc[d] || 0) + 1;
        return acc;
      }, {});

      const payrollStats = {
        totalDraft: payslips.filter(p => p.status === 'draft').length,
        totalPaid: payslips.filter(p => p.status === 'paid').length,
        monthlyPayroll: payslips.filter(p => p.status === 'paid').reduce((s, p) => s + parseFloat(p.net_salary || 0), 0),
      };

      return res.json({
        stats: {
          activeEmployees,
          departments: Object.keys(deptCounts).length,
          deptCounts,
          payrollStats,
        },
        recentPayslips: recentPayslipsData.data || [],
      });
    }

    // Member dashboard
    if (role === 'member') {
      const [tasksData, myProjects, recentPayslips] = await Promise.all([
        supabase.from('tasks').select('id, status, priority, title').eq('assigned_to', userId),
        supabase.from('project_members').select('project:projects(id, name, status)').eq('user_id', userId),
        supabase.from('payslips').select('*').eq('employee_id', userId).order('created_at', { ascending: false }).limit(3),
      ]);

      const tasks = tasksData.data || [];
      const taskStats = {
        total: tasks.length,
        todo: tasks.filter(t => t.status === 'todo').length,
        in_progress: tasks.filter(t => t.status === 'in_progress').length,
        done: tasks.filter(t => t.status === 'done').length,
      };

      return res.json({
        stats: {
          taskStats,
          projectCount: myProjects.data?.length || 0,
        },
        recentTasks: tasks.slice(0, 5),
        recentPayslips: recentPayslips.data,
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
