const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const { authenticate, isManagerOrAdmin } = require('../middleware/auth');
const { emitToUser } = require('../socket');
const nodemailer = require('nodemailer');

// Nodemailer transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: false,
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

// GET /api/invoices
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, client_id, project_id, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    let query = supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, company),
        project:projects(id, name),
        items:invoice_items(*)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (req.user.role === 'client') {
      const { data: client } = await supabase.from('clients').select('id').eq('user_id', req.user.id).single();
      if (client) query = query.eq('client_id', client.id);
    }

    if (status) query = query.eq('status', status);
    if (client_id) query = query.eq('client_id', client_id);
    if (project_id) query = query.eq('project_id', project_id);

    const { data, error, count } = await query;
    if (error) throw error;
    res.json({ data, total: count, page: +page, limit: +limit });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoices' });
  }
});

// GET /api/invoices/:id
router.get('/:id', authenticate, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .select(`
        *,
        client:clients(id, name, email, phone, company, address, gstin, pan),
        project:projects(id, name),
        milestone:milestones(id, name),
        items:invoice_items(*),
        payments(id, amount, payment_date, payment_method, transaction_id, status)
      `)
      .eq('id', req.params.id)
      .single();

    if (error) return res.status(404).json({ error: 'Invoice not found' });

    // Fetch Admin details to display on the invoice
    const { data: adminData } = await supabase.from('profiles').select('full_name, email, phone, company').eq('role', 'admin').limit(1).single();
    if (adminData) {
      data.admin_company = adminData;
    }

    // Mark as viewed by client
    if (req.user.role === 'client' && data.status === 'sent') {
      await supabase.from('invoices').update({ status: 'viewed', viewed_at: new Date().toISOString() }).eq('id', req.params.id);
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch invoice' });
  }
});

// POST /api/invoices
router.post('/', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const {
      client_id, project_id, milestone_id, issue_date, due_date, currency,
      discount_type, discount_value, cgst_rate, sgst_rate, igst_rate,
      notes, terms, bank_details, items
    } = req.body;

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.quantity * item.rate, 0);
    const discountAmount = discount_type === 'percentage'
      ? (subtotal * (discount_value || 0)) / 100
      : (discount_value || 0);
    const taxableAmount = subtotal - discountAmount;
    const cgstAmount = (taxableAmount * (cgst_rate || 0)) / 100;
    const sgstAmount = (taxableAmount * (sgst_rate || 0)) / 100;
    const igstAmount = (taxableAmount * (igst_rate || 0)) / 100;
    const taxAmount = cgstAmount + sgstAmount + igstAmount;
    const total = taxableAmount + taxAmount;

    const { data: invoice, error } = await supabase
      .from('invoices')
      .insert({
        client_id, project_id, milestone_id, issue_date, due_date, currency,
        subtotal, discount_type, discount_value, discount_amount: discountAmount,
        taxable_amount: taxableAmount, cgst_rate, sgst_rate, igst_rate,
        cgst_amount: cgstAmount, sgst_amount: sgstAmount, igst_amount: igstAmount,
        tax_amount: taxAmount, total, amount_due: total,
        notes, terms, bank_details, created_by: req.user.id,
      })
      .select()
      .single();

    if (error) throw error;

    // Insert items
    if (items?.length) {
      await supabase.from('invoice_items').insert(
        items.map((item, i) => ({
          invoice_id: invoice.id,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'unit',
          rate: item.rate,
          amount: item.quantity * item.rate,
          tax_rate: item.tax_rate || 0,
          position: i,
        }))
      );
    }

    // Update client billing stats
    await supabase
      .from('clients')
      .update({ total_billed: supabase.rpc('get_client_total_billed', { cid: client_id }) })
      .eq('id', client_id);

    res.status(201).json(invoice);
  } catch (err) {
    console.error('Create invoice error:', err);
    res.status(500).json({ error: 'Failed to create invoice' });
  }
});

// PATCH /api/invoices/:id
router.patch('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('invoices')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    if (error) throw error;
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to update invoice' });
  }
});

// POST /api/invoices/:id/send
router.post('/:id/send', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { data: invoice } = await supabase
      .from('invoices')
      .select('*, client:clients(name, email), items:invoice_items(*)')
      .eq('id', req.params.id)
      .single();

    if (!invoice) return res.status(404).json({ error: 'Invoice not found' });

    // Send email
    try {
      await transporter.sendMail({
        from: `"${process.env.APP_NAME}" <${process.env.EMAIL_FROM}>`,
        to: invoice.client.email,
        subject: `Invoice ${invoice.invoice_number} - ${process.env.APP_NAME}`,
        html: generateInvoiceEmail(invoice),
      });
    } catch (emailErr) {
      console.error('Email error:', emailErr);
    }

    const { data } = await supabase
      .from('invoices')
      .update({ status: 'sent', sent_at: new Date().toISOString() })
      .eq('id', req.params.id)
      .select()
      .single();

    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send invoice' });
  }
});

// DELETE /api/invoices/:id
router.delete('/:id', authenticate, isManagerOrAdmin, async (req, res) => {
  try {
    const { error } = await supabase.from('invoices').delete().eq('id', req.params.id);
    if (error) throw error;
    res.json({ message: 'Invoice deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete invoice' });
  }
});

function generateInvoiceEmail(invoice) {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <div style="background: #6366f1; color: white; padding: 24px; border-radius: 8px 8px 0 0;">
        <h1 style="margin: 0;">Invoice ${invoice.invoice_number}</h1>
      </div>
      <div style="background: #f9fafb; padding: 24px;">
        <p>Dear ${invoice.client.name},</p>
        <p>Please find your invoice for <strong>₹${invoice.total.toLocaleString()}</strong> attached.</p>
        <div style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 16px; margin: 16px 0;">
          <p><strong>Invoice #:</strong> ${invoice.invoice_number}</p>
          <p><strong>Amount:</strong> ₹${invoice.total.toLocaleString()}</p>
          <p><strong>Due Date:</strong> ${invoice.due_date || 'N/A'}</p>
        </div>
        <p>Please log in to your portal to view and pay this invoice.</p>
      </div>
    </div>
  `;
}

module.exports = router;
