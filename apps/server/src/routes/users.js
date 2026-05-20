const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, isAdmin } = require('../middleware/auth');

// GET /api/users
router.get('/', authenticate, isAdmin, async (req, res) => {
  try {
    const { role, search, page = 1, limit = 20 } = req.query;
    let query = supabase
      .from('profiles').select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page-1)*limit, page*limit-1);
    if (role) query = query.eq('role', role);
    if (search) query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch users' }); }
});

// GET /api/users/members
router.get('/members', authenticate, async (req, res) => {
  try {
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, full_name, avatar_url, role, is_active')
      .neq('role', 'client')
      .eq('is_active', true)
      .order('full_name', { ascending: true });

    if (profilesError) throw profilesError;

    const { data: activeTasks, error: tasksError } = await supabase
      .from('tasks')
      .select('id, assigned_to')
      .not('status', 'eq', 'done');

    if (tasksError) throw tasksError;

    const taskCounts = {};
    activeTasks.forEach(t => {
      if (t.assigned_to) {
        taskCounts[t.assigned_to] = (taskCounts[t.assigned_to] || 0) + 1;
      }
    });

    const profilesWithWorkload = profiles.map(profile => {
      const activeCount = taskCounts[profile.id] || 0;
      let availability = 'free';
      if (activeCount >= 3) {
        availability = 'loaded';
      } else if (activeCount > 0) {
        availability = 'busy';
      }
      return {
        ...profile,
        active_tasks_count: activeCount,
        availability
      };
    });

    res.json({ data: profilesWithWorkload });
  } catch (err) {
    console.error('Error fetching members:', err);
    res.status(500).json({ error: 'Failed to fetch members workload' });
  }
});

// PATCH /api/users/me
router.patch('/me', authenticate, async (req, res) => {
  try {
    const allowed = ['full_name', 'phone', 'company', 'timezone', 'notification_email', 'notification_whatsapp', 'avatar_url'];
    const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => allowed.includes(k)));
    const { data, error } = await supabase.from('profiles').update(updates).eq('id', req.user.id).select().single();
    if (error) throw error;

    // Sync profile changes to the clients table if they exist
    if (updates.full_name || updates.company !== undefined || updates.phone !== undefined) {
      const clientUpdates = {};
      if (updates.full_name) clientUpdates.name = updates.full_name;
      if (updates.company !== undefined) clientUpdates.company = updates.company;
      if (updates.phone !== undefined) clientUpdates.phone = updates.phone;
      
      if (Object.keys(clientUpdates).length > 0) {
        await supabase.from('clients').update(clientUpdates).eq('user_id', req.user.id);
      }
    }

    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to update profile' }); }
});

// PATCH /api/users/:id
router.patch('/:id', authenticate, isAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('profiles').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;

    // Sync profile changes to the clients table if they exist
    if (req.body.full_name || req.body.company !== undefined || req.body.phone !== undefined) {
      const clientUpdates = {};
      if (req.body.full_name) clientUpdates.name = req.body.full_name;
      if (req.body.company !== undefined) clientUpdates.company = req.body.company;
      if (req.body.phone !== undefined) clientUpdates.phone = req.body.phone;
      
      if (Object.keys(clientUpdates).length > 0) {
        await supabase.from('clients').update(clientUpdates).eq('user_id', req.params.id);
      }
    }

    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to update user' }); }
});

module.exports = router;
