const express = require('express');
const router = express.Router();
const { createClient } = require('@supabase/supabase-js');
const supabase = require('../lib/supabase');
const { authenticate, isAdmin, isManagerOrAdmin, isHrOrAdmin, authorize } = require('../middleware/auth');
const { sendWelcomeEmail, isSmtpConfigured } = require('../lib/mailer');

// Admin Supabase client (service role — can create auth users)
const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

// ── Role → prefix map ─────────────────────────────────────────────────────────
const ROLE_PREFIX = {
  admin:   'ADM',
  manager: 'MGR',
  finance: 'FIN',
  hr:      'HR',
  member:  'EMP',
  client:  'CLT',
};

// ── Generate next employee ID atomically ──────────────────────────────────────
async function generateEmployeeId(role) {
  const prefix = ROLE_PREFIX[role] || 'EMP';

  // Increment the counter for this role
  const { data, error } = await supabaseAdmin.rpc('increment_employee_seq', { p_role: role });

  if (error || data === null) {
    // Fallback: count existing employees of this role + 1
    const { count } = await supabaseAdmin
      .from('profiles')
      .select('*', { count: 'exact', head: true })
      .eq('role', role)
      .not('employee_id', 'is', null);
    const seq = (count || 0) + 1;
    return `${prefix}-${String(seq).padStart(3, '0')}`;
  }

  return `${prefix}-${String(data).padStart(3, '0')}`;
}

// ── POST /api/hr/employees ─────────────────────────────────────────────────────
// Admin creates a new internal employee (manager / finance / member)
router.post('/employees', authenticate, isHrOrAdmin, async (req, res) => {
  try {
    const {
      full_name, email, password,
      role = 'member', department,
      blood_group, phone, salary,
      send_email = true,
    } = req.body;

    if (!full_name || !email || !password || !role) {
      return res.status(400).json({ error: 'full_name, email, password and role are required' });
    }

    const allowedRoles = ['manager', 'finance', 'hr', 'member'];
    if (!allowedRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${allowedRoles.join(', ')}` });
    }

    // Generate employee ID
    const employeeId = await generateEmployeeId(role);

    // 1. Create Supabase auth user
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name, role, department, employee_id: employeeId },
    });

    if (authError) {
      return res.status(400).json({ error: authError.message });
    }

    // 2. Upsert profile with all HR fields
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .upsert({
        id: authData.user.id,
        email,
        full_name,
        role,
        department: department || null,
        blood_group: blood_group || null,
        phone: phone || null,
        salary: salary ? parseFloat(salary) : 0,
        employee_id: employeeId,
        joining_date: new Date().toISOString().split('T')[0],
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error('Profile creation error:', profileError);
      return res.status(400).json({ error: profileError.message || 'Failed to create employee profile' });
    }

    // 3. Send welcome email (non-blocking — don't fail if email fails)
    let emailResult = { skipped: true, reason: 'send_email=false' };
    if (send_email) {
      try {
        emailResult = await sendWelcomeEmail(email, {
          name: full_name,
          employeeId,
          email,
          password,
          role,
          department,
        });
      } catch (mailErr) {
        console.error('[HR] Email send failed:', mailErr.message);
        emailResult = { skipped: true, reason: mailErr.message };
      }
    }

    res.status(201).json({
      message: 'Employee created successfully',
      employee: profile,
      emailSent: emailResult.sent || false,
      smtpConfigured: isSmtpConfigured(),
    });
  } catch (err) {
    console.error('Create employee error:', err);
    res.status(500).json({ error: err.message || 'Failed to create employee' });
  }
});

// ── GET /api/hr/employees ─────────────────────────────────────────────────────
router.get('/employees', authenticate, authorize('admin', 'hr', 'manager'), async (req, res) => {
  try {
    const { role, department, search, page = 1, limit = 50, include_inactive = false } = req.query;

    let query = supabase
      .from('profiles')
      .select('id,email,full_name,role,department,blood_group,employee_id,phone,salary,joining_date,is_active,avatar_url,created_at', { count: 'exact' })
      .neq('role', 'client')
      .order('joining_date', { ascending: false })
      .range((page - 1) * limit, page * limit - 1);

    if (!include_inactive || include_inactive === 'false') {
      query = query.eq('is_active', true);
    }
    if (role) query = query.eq('role', role);
    if (department) query = query.eq('department', department);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%,employee_id.ilike.%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, total: count });
  } catch (err) {
    console.error('List employees error:', err);
    res.status(500).json({ error: 'Failed to fetch employees' });
  }
});

// ── GET /api/hr/employees/:id ──────────────────────────────────────────────────
router.get('/employees/:id', authenticate, async (req, res) => {
  try {
    // Allow self-access or admin/manager
    const isSelf = req.user.id === req.params.id;
    const isPrivileged = ['admin', 'manager'].includes(req.user.role);

    if (!isSelf && !isPrivileged) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('id,email,full_name,role,department,blood_group,employee_id,phone,salary,joining_date,is_active,avatar_url,timezone,created_at')
      .eq('id', req.params.id)
      .single();

    if (error || !data) return res.status(404).json({ error: 'Employee not found' });

    // Hide salary from non-admin/finance for other employees
    if (!isSelf && !['admin', 'finance'].includes(req.user.role)) {
      delete data.salary;
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch employee' });
  }
});

// ── PATCH /api/hr/employees/:id/role ──────────────────────────────────────────
// Admin promotes / changes role or department
router.patch('/employees/:id/role', authenticate, isHrOrAdmin, async (req, res) => {
  try {
    const { role, department } = req.body;

    const allowedRoles = ['manager', 'finance', 'hr', 'member'];
    if (role && !allowedRoles.includes(role)) {
      return res.status(400).json({ error: `Role must be one of: ${allowedRoles.join(', ')}` });
    }

    const updates = {};
    if (role) {
      updates.role = role;
      // Regenerate employee ID on role change
      updates.employee_id = await generateEmployeeId(role);
    }
    if (department !== undefined) updates.department = department;

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json({ message: 'Role updated successfully', employee: data });
  } catch (err) {
    console.error('Role update error:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// ── PATCH /api/hr/employees/:id/salary ────────────────────────────────────────
// Admin-only: set/update base salary
router.patch('/employees/:id/salary', authenticate, isHrOrAdmin, async (req, res) => {
  try {
    const { salary } = req.body;
    if (salary === undefined || isNaN(parseFloat(salary))) {
      return res.status(400).json({ error: 'Valid salary amount required' });
    }

    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ salary: parseFloat(salary) })
      .eq('id', req.params.id)
      .select('id,full_name,employee_id,salary')
      .single();

    if (error) throw error;
    res.json({ message: 'Salary updated', employee: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update salary' });
  }
});

// ── PATCH /api/hr/employees/:id/status ────────────────────────────────────────
// Admin activates / deactivates an employee
router.patch('/employees/:id/status', authenticate, isHrOrAdmin, async (req, res) => {
  try {
    const { is_active } = req.body;
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update({ is_active: Boolean(is_active) })
      .eq('id', req.params.id)
      .select('id,full_name,employee_id,is_active')
      .single();

    if (error) throw error;
    res.json({ message: `Employee ${is_active ? 'activated' : 'deactivated'}`, employee: data });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// ── GET /api/hr/departments ────────────────────────────────────────────────────
// List distinct departments in use
router.get('/departments', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('department')
      .neq('role', 'client')
      .not('department', 'is', null);

    if (error) throw error;

    const unique = [...new Set(data.map(d => d.department))].sort();
    res.json({ departments: unique });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch departments' });
  }
});

// ── DELETE /api/hr/employees/:id ───────────────────────────────────────────────
// Admin deletes an employee
router.delete('/employees/:id', authenticate, isHrOrAdmin, async (req, res) => {
  try {
    // Delete the Supabase auth user (cascades to profile if configured, but we delete auth user directly via admin API)
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(req.params.id);
    if (authError) {
      return res.status(400).json({ error: authError.message });
    }
    
    // Explicitly delete profile as well just in case ON DELETE CASCADE is missing
    await supabaseAdmin.from('profiles').delete().eq('id', req.params.id);

    res.json({ message: 'Employee deleted successfully' });
  } catch (err) {
    console.error('Delete employee error:', err);
    res.status(500).json({ error: 'Failed to delete employee' });
  }
});

module.exports = router;
