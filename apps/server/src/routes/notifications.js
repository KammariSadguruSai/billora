const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');
const { emitToUser } = require('../socket');

// GET /api/notifications
router.get('/', authenticate, async (req, res) => {
  try {
    const { is_read, page = 1, limit = 20 } = req.query;
    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', req.user.id)
      .order('created_at', { ascending: false })
      .range((page-1)*limit, page*limit-1);
    if (is_read !== undefined) query = query.eq('is_read', is_read === 'true');
    const { data, error, count } = await query;
    if (error) throw error;
    
    const unreadCount = await supabase
      .from('notifications')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', req.user.id)
      .eq('is_read', false);

    res.json({ data, total: count, unread: unreadCount.count });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch notifications' }); }
});

// PATCH /api/notifications/:id/read
router.patch('/:id/read', authenticate, async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('id', req.params.id).eq('user_id', req.user.id);
    res.json({ message: 'Marked as read' });
  } catch (err) { res.status(500).json({ error: 'Failed to mark read' }); }
});

// PATCH /api/notifications/read-all
router.patch('/read-all', authenticate, async (req, res) => {
  try {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', req.user.id).eq('is_read', false);
    res.json({ message: 'All marked as read' });
  } catch (err) { res.status(500).json({ error: 'Failed to mark all read' }); }
});

module.exports = router;
