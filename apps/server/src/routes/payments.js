const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, canManageFinance } = require('../middleware/auth');
const { emitToUser } = require('../socket');

// POST /api/payments
router.post('/', authenticate, async (req, res) => {
  try {
    if (['member', 'manager'].includes(req.user.role)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { invoice_id, amount, payment_date, payment_method, transaction_id, reference_number, screenshot_url, notes } = req.body;

    const { data: payment, error } = await supabase
      .from('payments')
      .insert({ invoice_id, amount, payment_date, payment_method, transaction_id, reference_number, screenshot_url, notes, status: 'pending' })
      .select()
      .single();

    if (error) throw error;

    // Notify admin
    const { data: admins } = await supabase.from('profiles').select('id').eq('role', 'admin');
    if (admins?.length) {
      await supabase.from('notifications').insert(
        admins.map(a => ({
          user_id: a.id,
          title: 'Payment Received',
          message: `Payment of ₹${amount} submitted for invoice ${invoice_id}`,
          type: 'payment',
          entity_type: 'payment',
          entity_id: payment.id,
        }))
      );
      admins.forEach(a => emitToUser(a.id, 'notification:new', { type: 'payment', amount }));
    }

    res.status(201).json(payment);
  } catch (err) {
    res.status(500).json({ error: 'Failed to record payment' });
  }
});

// PATCH /api/payments/:id/verify
router.patch('/:id/verify', authenticate, canManageFinance, async (req, res) => {
  try {
    const { data: payment } = await supabase.from('payments').select('*').eq('id', req.params.id).single();
    if (!payment) return res.status(404).json({ error: 'Payment not found' });

    await supabase.from('payments').update({
      status: 'verified',
      verified_by: req.user.id,
      verified_at: new Date().toISOString(),
    }).eq('id', req.params.id);

    // Update invoice amount_paid and status
    const { data: allPayments } = await supabase
      .from('payments')
      .select('amount')
      .eq('invoice_id', payment.invoice_id)
      .eq('status', 'verified');

    const totalPaid = allPayments.reduce((sum, p) => sum + parseFloat(p.amount), 0);

    const { data: invoice } = await supabase.from('invoices').select('total').eq('id', payment.invoice_id).single();
    const amountDue = Math.max(0, invoice.total - totalPaid);
    const status = amountDue === 0 ? 'paid' : 'partial';

    await supabase.from('invoices').update({
      amount_paid: totalPaid,
      amount_due: amountDue,
      status,
      ...(status === 'paid' ? { paid_at: new Date().toISOString() } : {}),
    }).eq('id', payment.invoice_id);

    res.json({ message: 'Payment verified', totalPaid, amountDue, status });
  } catch (err) {
    res.status(500).json({ error: 'Verification failed' });
  }
});

// GET /api/payments
router.get('/', authenticate, async (req, res) => {
  try {
    if (req.user.role === 'member') {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { status, invoice_id, page = 1, limit = 20 } = req.query;
    
    // If client, we need to filter invoices belonging to them
    let clientIds = null;
    if (req.user.role === 'client') {
      const { data: myClients } = await supabase.from('clients').select('id').eq('user_id', req.user.id);
      if (!myClients || myClients.length === 0) {
        return res.json({ data: [], total: 0, page: +page, limit: +limit });
      }
      clientIds = myClients.map(c => c.id);
    }

    let query = supabase
      .from('payments')
      .select('*, invoice:invoices!inner(id, invoice_number, total, client_id), client:invoices(client:clients(name, email))', { count: 'exact' })
      .order('created_at', { ascending: false });

    // Apply pagination properly (needs to be after filters generally, but supabase handles it)
    query = query.range((page-1)*limit, page*limit-1);

    if (status) query = query.eq('status', status);
    if (invoice_id) query = query.eq('invoice_id', invoice_id);
    
    if (clientIds) {
      // In Supabase, filtering by a joined table uses the relation name
      query = query.in('invoice.client_id', clientIds);
    }

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: +page, limit: +limit });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

module.exports = router;
