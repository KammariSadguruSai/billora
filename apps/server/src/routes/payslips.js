const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../lib/supabase');
const { sendPayslipEmail } = require('../lib/mailer');
const {
  authenticate, isAdmin, canManageFinance, canViewPayslips,
} = require('../middleware/auth');

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ── POST /api/payslips ─────────────────────────────────────────────────────────
// Finance or Admin creates a payslip for an employee
router.post('/', authenticate, canManageFinance, async (req, res) => {
  try {
    const {
      employee_id, month, year,
      basic_salary, hra = 0, allowances = 0, bonuses = 0,
      deductions = 0, pf_deduction = 0, tds_deduction = 0,
      net_salary, notes,
    } = req.body;

    if (!employee_id || !month || !year || net_salary === undefined || !basic_salary) {
      return res.status(400).json({ error: 'employee_id, month, year, basic_salary and net_salary are required' });
    }

    // Verify target employee exists and is not admin (can't create payslip for admin)
    const { data: emp, error: empError } = await supabaseAdmin
      .from('profiles')
      .select('id, full_name, employee_id, role, salary')
      .eq('id', employee_id)
      .single();

    if (empError || !emp) return res.status(404).json({ error: 'Employee not found' });
    if (emp.role === 'client') return res.status(400).json({ error: 'Cannot create payslip for client' });

    // Finance cannot create for admin (only admin can approve)
    if (emp.role === 'admin' && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Finance cannot create payslips for admin users' });
    }

    const { data, error } = await supabaseAdmin
      .from('payslips')
      .insert({
        employee_id,
        month: parseInt(month),
        year: parseInt(year),
        basic_salary: parseFloat(basic_salary),
        hra: parseFloat(hra),
        allowances: parseFloat(allowances),
        bonuses: parseFloat(bonuses),
        deductions: parseFloat(deductions),
        pf_deduction: parseFloat(pf_deduction),
        tds_deduction: parseFloat(tds_deduction),
        net_salary: parseFloat(net_salary),
        notes: notes || null,
        status: 'draft',
        created_by: req.user.id,
      })
      .select(`*, employee:profiles!employee_id(id,full_name,employee_id,department,role)`)
      .single();

    if (error) {
      if (error.code === '23505') {
        return res.status(409).json({ error: 'Payslip already exists for this employee/month/year' });
      }
      throw error;
    }

    res.status(201).json({ message: 'Payslip created', payslip: data });
  } catch (err) {
    console.error('Create payslip error:', err);
    res.status(500).json({ error: err.message || 'Failed to create payslip' });
  }
});

// ── GET /api/payslips ──────────────────────────────────────────────────────────
// Admin/Finance: all payslips  |  Member: own only
router.get('/', authenticate, canViewPayslips, async (req, res) => {
  try {
    const { month, year, status, employee_id, page = 1, limit = 30 } = req.query;
    const isPrivileged = ['admin', 'finance'].includes(req.user.role);

    let query = supabaseAdmin
      .from('payslips')
      .select(`
        id, month, year, basic_salary, hra, allowances, bonuses,
        deductions, pf_deduction, tds_deduction, gross_salary,
        total_deductions, net_salary, status, payment_date, payment_method,
        transaction_id, notes, created_at, updated_at,
        employee:profiles!employee_id(id, full_name, employee_id, department, role, avatar_url),
        creator:profiles!created_by(id, full_name)
      `, { count: 'exact' })
      .order('year', { ascending: false })
      .order('month', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    // Members can only see their own payslips
    if (!isPrivileged) {
      query = query.eq('employee_id', req.user.id);
    } else {
      if (employee_id) query = query.eq('employee_id', employee_id);
    }

    if (month) query = query.eq('month', parseInt(month));
    if (year)  query = query.eq('year', parseInt(year));
    if (status) query = query.eq('status', status);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, total: count });
  } catch (err) {
    console.error('List payslips error:', err);
    res.status(500).json({ error: 'Failed to fetch payslips' });
  }
});

// ── GET /api/payslips/:id ──────────────────────────────────────────────────────
router.get('/:id', authenticate, canViewPayslips, async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('payslips')
      .select(`
        *,
        employee:profiles!employee_id(id, full_name, employee_id, department, role, blood_group, joining_date),
        creator:profiles!created_by(id, full_name, employee_id),
        approver:profiles!approved_by(id, full_name, employee_id)
      `)
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Payslip not found' });

    // Members can only access their own payslip
    if (req.user.role === 'member' && data.employee_id !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch payslip' });
  }
});

// ── PATCH /api/payslips/:id ────────────────────────────────────────────────────
// Finance updates a draft payslip
router.patch('/:id', authenticate, canManageFinance, async (req, res) => {
  try {
    // First verify it's in draft state
    const { data: existing } = await supabaseAdmin.from('payslips').select('status,created_by').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Payslip not found' });
    if (existing.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft payslips can be edited' });
    }

    const allowed = ['basic_salary','hra','allowances','bonuses','deductions','pf_deduction','tds_deduction','net_salary','notes'];
    const updates = Object.fromEntries(
      Object.entries(req.body)
        .filter(([k]) => allowed.includes(k))
        .map(([k, v]) => [k, typeof v === 'string' && !isNaN(parseFloat(v)) ? parseFloat(v) : v])
    );

    const { data, error } = await supabaseAdmin
      .from('payslips')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Payslip updated', payslip: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update payslip' });
  }
});

// ── PATCH /api/payslips/:id/approve ───────────────────────────────────────────
// Finance or Admin approves a payslip (draft → approved)
router.patch('/:id/approve', authenticate, canManageFinance, async (req, res) => {
  try {
    const { data: existing } = await supabaseAdmin.from('payslips').select('status').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Payslip not found' });
    if (existing.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft payslips can be approved' });
    }

    const { data, error } = await supabaseAdmin
      .from('payslips')
      .update({ status: 'approved', approved_by: req.user.id })
      .eq('id', req.params.id)
      .select(`*, employee:profiles!employee_id(full_name, employee_id, email)`)
      .single();

    if (error) throw error;
    
    // Send email notification asynchronously
    if (data && data.employee && data.employee.email) {
      sendPayslipEmail(data.employee.email, {
        name: data.employee.full_name,
        month: data.month,
        year: data.year,
        netSalary: data.net_salary,
        status: 'approved',
        appUrl: process.env.APP_URL
      }).catch(e => console.error('Payslip email error:', e));
    }

    res.json({ message: 'Payslip approved', payslip: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to approve payslip' });
  }
});

// ── PATCH /api/payslips/:id/mark-paid ─────────────────────────────────────────
// Finance marks an approved payslip as paid
router.patch('/:id/mark-paid', authenticate, canManageFinance, async (req, res) => {
  try {
    const { payment_method, transaction_id, payment_date } = req.body;

    const { data: existing } = await supabaseAdmin.from('payslips').select('status').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Payslip not found' });
    if (existing.status !== 'approved') {
      return res.status(400).json({ error: 'Only approved payslips can be marked as paid' });
    }

    const { data, error } = await supabaseAdmin
      .from('payslips')
      .update({
        status: 'paid',
        payment_method: payment_method || 'bank_transfer',
        transaction_id: transaction_id || null,
        payment_date: payment_date || new Date().toISOString().split('T')[0],
      })
      .eq('id', req.params.id)
      .select(`*, employee:profiles!employee_id(full_name, employee_id, email)`)
      .single();

    if (error) throw error;

    // Send email notification asynchronously
    if (data && data.employee && data.employee.email) {
      sendPayslipEmail(data.employee.email, {
        name: data.employee.full_name,
        month: data.month,
        year: data.year,
        netSalary: data.net_salary,
        status: 'paid',
        appUrl: process.env.APP_URL
      }).catch(e => console.error('Payslip email error:', e));
    }

    res.json({ message: 'Payslip marked as paid', payslip: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to mark payslip as paid' });
  }
});

// ── DELETE /api/payslips/:id ───────────────────────────────────────────────────
// Admin or finance can delete a draft payslip
router.delete('/:id', authenticate, canManageFinance, async (req, res) => {
  try {
    const { data: existing } = await supabaseAdmin.from('payslips').select('status').eq('id', req.params.id).single();
    if (!existing) return res.status(404).json({ error: 'Payslip not found' });
    if (existing.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft payslips can be deleted' });
    }

    const { error } = await supabaseAdmin.from('payslips').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Payslip deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete payslip' });
  }
});

module.exports = router;
