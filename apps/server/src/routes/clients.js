const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, isManagerOrAdmin } = require('../middleware/auth');

// GET /api/clients
router.get('/', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { search, page = 1, limit = 20 } = req.query;
    let query = supabase
      .from('clients')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range((page-1)*limit, page*limit-1);
    if (search) query = query.or(`name.ilike.%${search}%,email.ilike.%${search}%,company.ilike.%${search}%`);
    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count });
  } catch (err) { res.status(500).json({ error: 'Failed to fetch clients' }); }
});

// GET /api/clients/:id
router.get('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .select(`*, projects(id, name, status, progress), invoices(id, invoice_number, total, status)`)
      .eq('id', req.params.id).single();
    if (error) return res.status(404).json({ error: 'Client not found' });
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to fetch client' }); }
});

// POST /api/clients
router.post('/', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients')
      .insert({ ...req.body, created_by: req.user.id })
      .select().single();
    if (error) throw error;
    res.status(201).json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to create client' }); }
});

// PATCH /api/clients/:id
router.patch('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('clients').update(req.body).eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (err) { res.status(500).json({ error: 'Failed to update client' }); }
});

// DELETE /api/clients/:id
router.delete('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    await supabase.from('clients').delete().eq('id', req.params.id);
    res.json({ message: 'Client deleted' });
  } catch (err) { res.status(500).json({ error: 'Failed to delete client' }); }
});

module.exports = router;
