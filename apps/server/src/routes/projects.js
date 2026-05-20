const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, isManagerOrAdmin } = require('../middleware/auth');
const { emitToProject } = require('../socket');

// GET /api/projects
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, search, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('projects')
      .select(`
        *,
        client:clients(id, name, email, company),
        manager:profiles!projects_manager_id_fkey(id, full_name, avatar_url),
        project_members(user_id, profiles(id, full_name, avatar_url))
      `, { count: 'exact' })
      .eq('is_archived', false)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Clients can only see their own projects
    if (req.user.role === 'client') {
      const { data: client } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', req.user.id)
        .single();
      if (client) query = query.eq('client_id', client.id);
    }

    // Members can see projects they're part of
    if (req.user.role === 'member') {
      query = query.or(`manager_id.eq.${req.user.id},project_members.user_id.eq.${req.user.id}`);
    }

    if (status) query = query.eq('status', status);
    if (search) query = query.ilike('name', `%${search}%`);

    const { data, error, count } = await query;
    if (error) throw error;

    res.json({ data, total: count, page: +page, limit: +limit });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

// GET /api/projects/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        client:clients(id, name, email, phone, company),
        manager:profiles!projects_manager_id_fkey(id, full_name, avatar_url, email),
        team:teams(id, name),
        milestones(*),
        project_members(user_id, role, profiles(id, full_name, avatar_url, email, role))
      `)
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Project not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project' });
  }
});

// POST /api/projects
router.post('/', authenticate, async (req, res) => {
  try {
    let {
      name, description, client_id, manager_id, team_id, status,
      priority, budget, start_date, end_date, tags, color, members
    } = req.body;

    if (req.user.role === 'client') {
      // Clients can only create project requests
      status = 'planning';
      // Find the client's record
      const { data: myClient } = await supabase.from('clients').select('id').eq('user_id', req.user.id).single();
      if (myClient) {
        client_id = myClient.id;
      }
      // Clear manager and team for client requests
      manager_id = null;
      team_id = null;
    } else if (!['admin', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    const { data: project, error } = await supabase
      .from('projects')
      .insert({
        name, description, client_id, manager_id: manager_id || (['admin', 'manager'].includes(req.user.role) ? req.user.id : null),
        team_id, status, priority, budget, start_date, end_date, tags, color,
        created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Add members
    if (members?.length) {
      await supabase.from('project_members').insert(
        members.map(m => ({ project_id: project.id, user_id: m.user_id, role: m.role || 'member' }))
      );
    }

    // Log activity
    await supabase.from('activity_logs').insert({
      user_id: req.user.id, action: 'created', entity_type: 'project',
      entity_id: project.id, entity_name: project.name,
    });

    emitToProject(project.id, 'project:created', project);
    res.status(201).json(project);
  } catch (err) {
    console.error('Create project error:', err);
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// PATCH /api/projects/:id
router.patch('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      user_id: req.user.id, action: 'updated', entity_type: 'project',
      entity_id: data.id, entity_name: data.name,
    });

    emitToProject(req.params.id, 'project:updated', data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update project' });
  }
});

// DELETE /api/projects/:id
router.delete('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    await supabase.from('projects').update({ is_archived: true }).eq('id', req.params.id);
    res.json({ message: 'Project archived successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to archive project' });
  }
});

// GET /api/projects/:id/stats
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const [tasks, timeLogs, invoices] = await Promise.all([
      supabase.from('tasks').select('status').eq('project_id', req.params.id),
      supabase.from('time_logs').select('hours').eq('project_id', req.params.id),
      supabase.from('invoices').select('total, amount_paid, status').eq('project_id', req.params.id),
    ]);

    const taskStats = { total: 0, todo: 0, in_progress: 0, review: 0, done: 0, blocked: 0 };
    tasks.data?.forEach(t => { taskStats.total++; taskStats[t.status] = (taskStats[t.status] || 0) + 1; });

    const totalHours = timeLogs.data?.reduce((sum, l) => sum + parseFloat(l.hours || 0), 0) || 0;
    const totalBilled = invoices.data?.reduce((sum, i) => sum + parseFloat(i.total || 0), 0) || 0;
    const totalPaid = invoices.data?.reduce((sum, i) => sum + parseFloat(i.amount_paid || 0), 0) || 0;

    res.json({ tasks: taskStats, totalHours, totalBilled, totalPaid });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch project stats' });
  }
});

// POST /api/projects/:id/members
router.post('/:id/members', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { members } = req.body;
    const { id } = req.params;

    if (!Array.isArray(members)) {
      return res.status(400).json({ error: 'Members must be an array' });
    }

    // Delete existing members
    const { error: deleteError } = await supabase
      .from('project_members')
      .delete()
      .eq('project_id', id);

    if (deleteError) throw deleteError;

    // Insert new members if any
    if (members.length > 0) {
      const insertData = members.map(m => ({
        project_id: id,
        user_id: m.user_id,
        role: m.role || 'member'
      }));

      const { error: insertError } = await supabase
        .from('project_members')
        .insert(insertData);

      if (insertError) throw insertError;
    }

    // Emit live update
    emitToProject(id, 'project:members_updated', { id, members });

    res.json({ message: 'Project members updated successfully' });
  } catch (err) {
    console.error('Error updating project members:', err);
    res.status(500).json({ error: 'Failed to update project members' });
  }
});

module.exports = router;
