const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate } = require('../middleware/auth');

// GET /api/chat/rooms
router.get('/rooms', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('chat_rooms')
      .select(`
        *,
        participants:chat_participants(user_id, last_read_at, user:profiles(id, full_name, avatar_url)),
        last_message:chat_messages(id, content, created_at, user:profiles(full_name))
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    // Filter to rooms user is part of
    const userRooms = data?.filter(room =>
      room.participants?.some(p => p.user_id === req.user.id)
    );

    res.json(userRooms);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch rooms' }); }
});

// GET /api/chat/rooms/:id/messages
router.get('/rooms/:id/messages', authenticate, async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*, user:profiles(id, full_name, avatar_url)')
      .eq('room_id', req.params.id)
      .order('created_at', { ascending: false })
      .range((page-1)*limit, page*limit-1);

    if (error) throw error;
    
    // Update last read
    await supabase.from('chat_participants')
      .update({ last_read_at: new Date().toISOString() })
      .eq('room_id', req.params.id).eq('user_id', req.user.id);

    res.json(data?.reverse() || []);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch messages' }); }
});

// POST /api/chat/rooms/:id/messages
router.post('/rooms/:id/messages', authenticate, async (req, res) => {
  try {
    const { content, message_type, attachments, reply_to } = req.body;
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({ room_id: req.params.id, user_id: req.user.id, content, message_type, attachments, reply_to })
      .select('*, user:profiles(id, full_name, avatar_url)')
      .single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to send message' }); }
});

// POST /api/chat/rooms
router.post('/rooms', authenticate, async (req, res) => {
  try {
    const { name, type, project_id, participants } = req.body;
    const { data: room, error } = await supabase
      .from('chat_rooms')
      .insert({ name, type, project_id, created_by: req.user.id })
      .select().single();

    if (error) throw error;

    // Add participants
    const allParticipants = [...new Set([req.user.id, ...(participants || [])])];
    await supabase.from('chat_participants').insert(
      allParticipants.map(uid => ({ room_id: room.id, user_id: uid }))
    );

    res.status(201).json(room);
  } catch (err) { res.status(500).json({ error: 'Failed to create room' }); }
});

// GET /api/chat/users
router.get('/users', authenticate, async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    let allowedUsers = [];

    const { data: allProfiles, error: profileErr } = await supabase.from('profiles').select('id, full_name, role, email');
    if (profileErr) throw profileErr;

    if (role === 'admin' || role === 'manager') {
      // Admins and managers can chat with anyone
      allowedUsers = allProfiles;
    } else {
      // For members or clients, they can ALWAYS chat with admins/managers
      const admins = allProfiles.filter(p => p.role === 'admin' || p.role === 'manager');
      allowedUsers = [...admins];

      // Also find people assigned to the same projects
      const { data: userProjects } = await supabase.from('project_members').select('project_id').eq('user_id', userId);
      const projectIds = (userProjects || []).map(p => p.project_id);

      if (projectIds.length > 0) {
        const { data: sharedMembers } = await supabase.from('project_members').select('user_id').in('project_id', projectIds);
        const sharedIds = (sharedMembers || []).map(m => m.user_id);

        const { data: sharedClients } = await supabase.from('projects').select('client_id(user_id)').in('id', projectIds);
        sharedClients?.forEach(p => { if (p.client_id?.user_id) sharedIds.push(p.client_id.user_id) });

        const additionalUsers = allProfiles.filter(p => sharedIds.includes(p.id));
        allowedUsers = [...allowedUsers, ...additionalUsers];
      }

      if (role === 'member') {
        // Find projects where member is assigned, see if there are clients
        // Already handled above
      }
      
      if (role === 'client') {
        // If client, find projects belonging to client, then find members of those projects
        const { data: clientRecord } = await supabase.from('clients').select('id').eq('user_id', userId).single();
        if (clientRecord) {
          const { data: myProjects } = await supabase.from('projects').select('id, manager_id').eq('client_id', clientRecord.id);
          const pIds = (myProjects || []).map(p => p.id);
          const mIds = (myProjects || []).map(p => p.manager_id).filter(Boolean);
          
          if (pIds.length > 0) {
            const { data: myMembers } = await supabase.from('project_members').select('user_id').in('project_id', pIds);
            const mUserIds = (myMembers || []).map(m => m.user_id);
            const extraUsers = allProfiles.filter(p => [...mUserIds, ...mIds].includes(p.id));
            allowedUsers = [...allowedUsers, ...extraUsers];
          }
        }
      }
    }

    // Deduplicate and remove self
    const uniqueUsers = Array.from(new Map(allowedUsers.map(u => [u.id, u])).values());
    res.json(uniqueUsers.filter(u => u.id !== userId));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch users for chat' });
  }
});

module.exports = router;
