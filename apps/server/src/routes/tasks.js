const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');
const { emitToProject } = require('../socket');

// Helper to recalculate and update project progress based on completed tasks
async function updateProjectProgress(projectId) {
  if (!projectId) return;
  const { data: tasks } = await supabase.from('tasks').select('status').eq('project_id', projectId);
  if (!tasks) return;
  const progress = tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'done').length / tasks.length) * 100) : 0;
  await supabase.from('projects').update({ progress }).eq('id', projectId);
}

// GET /api/tasks
router.get('/', authenticate, async (req, res) => {
  try {
    const { project_id, status, assigned_to, milestone_id, page = 1, limit = 50 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('tasks')
      .select(`
        *,
        assigned:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url),
        creator:profiles!tasks_created_by_fkey(id, full_name),
        milestone:milestones(id, name),
        _count:task_comments(count)
      `, { count: 'exact' })
      .order('position', { ascending: true })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (project_id) query = query.eq('project_id', project_id);
    if (status) query = query.eq('status', status);
    if (assigned_to) query = query.eq('assigned_to', assigned_to);
    if (milestone_id) query = query.eq('milestone_id', milestone_id);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

// GET /api/tasks/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        assigned:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url, email),
        creator:profiles!tasks_created_by_fkey(id, full_name),
        milestone:milestones(id, name),
        comments:task_comments(
          id, content, attachments, created_at, updated_at,
          user:profiles(id, full_name, avatar_url)
        ),
        time_logs(id, hours, description, logged_date, user:profiles(id, full_name))
      `)
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Task not found' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch task' });
  }
});

// POST /api/tasks
router.post('/', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert({ ...req.body, created_by: req.user.id })
      .select(`
        *,
        assigned:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url)
      `)
      .single();

    if (error) throw error;

    await supabase.from('activity_logs').insert({
      user_id: req.user.id, action: 'created', entity_type: 'task',
      entity_id: data.id, entity_name: data.title,
    });

    // Notify assigned user
    if (data.assigned_to && data.assigned_to !== req.user.id) {
      await supabase.from('notifications').insert({
        user_id: data.assigned_to,
        title: 'New Task Assigned',
        message: `You've been assigned: ${data.title}`,
        type: 'task',
        entity_type: 'task',
        entity_id: data.id,
        action_url: `/projects/${data.project_id}/tasks/${data.id}`,
      });
    }

    await updateProjectProgress(data.project_id);
    emitToProject(data.project_id, 'task:created', data);
    res.status(201).json(data);
  } catch (err) {
    console.error('Create task error:', err);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PATCH /api/tasks/:id
router.patch('/:id', authenticate, async (req, res) => {
  try {
    const updates = { ...req.body, updated_at: new Date().toISOString() };
    if (updates.status === 'done' && !updates.completed_at) {
      updates.completed_at = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', req.params.id)
      .select(`*, assigned:profiles!tasks_assigned_to_fkey(id, full_name, avatar_url)`)
      .single();

    if (error) throw error;

    await updateProjectProgress(data.project_id);
    emitToProject(data.project_id, 'task:updated', data);
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// PATCH /api/tasks/bulk-update (Kanban drag & drop)
router.patch('/bulk-update', authenticate, async (req, res) => {
  try {
    const { updates } = req.body; // [{ id, status, position }]
    const promises = updates.map(u =>
      supabase.from('tasks').update({ status: u.status, position: u.position }).eq('id', u.id)
    );
    await Promise.all(promises);

    // Recalculate progress using the first task's project ID
    if (updates.length > 0) {
      const { data: task } = await supabase.from('tasks').select('project_id').eq('id', updates[0].id).single();
      if (task) await updateProjectProgress(task.project_id);
    }

    res.json({ message: 'Tasks updated' });
  } catch (err) {
    res.status(500).json({ error: 'Bulk update failed' });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const { data: task } = await supabase.from('tasks').select('project_id').eq('id', req.params.id).single();
    const { error } = await supabase.from('tasks').delete().eq('id', req.params.id);
    if (error) throw error;
    
    if (task) await updateProjectProgress(task.project_id);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

// POST /api/tasks/:id/comments
router.post('/:id/comments', authenticate, async (req, res) => {
  try {
    const { content, attachments } = req.body;
    const { data, error } = await supabase
      .from('task_comments')
      .insert({ task_id: req.params.id, user_id: req.user.id, content, attachments })
      .select('*, user:profiles(id, full_name, avatar_url)')
      .single();

    if (error) throw error;
    
    // Get task for notification
    const { data: task } = await supabase.from('tasks').select('title, project_id, assigned_to').eq('id', req.params.id).single();
    if (task?.assigned_to && task.assigned_to !== req.user.id) {
      await supabase.from('notifications').insert({
        user_id: task.assigned_to,
        title: 'New Comment',
        message: `${req.user.full_name} commented on: ${task.title}`,
        type: 'task',
        entity_type: 'task',
        entity_id: req.params.id,
      });
    }

    emitToProject(task?.project_id, 'task:comment', { taskId: req.params.id, comment: data });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

// POST /api/tasks/:id/time
router.post('/:id/time', authenticate, async (req, res) => {
  try {
    const { hours, description, logged_date, project_id } = req.body;
    const { data, error } = await supabase
      .from('time_logs')
      .insert({ task_id: req.params.id, project_id, user_id: req.user.id, hours, description, logged_date })
      .select()
      .single();

    if (error) throw error;

    // Update task logged hours
    await supabase.rpc('increment_task_hours', { task_id: req.params.id, hours: parseFloat(hours) });
    res.status(201).json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to log time' });
  }
});

module.exports = router;
