'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { invoicesApi, clientsApi } from '@/lib/api'
import { Plus, Download, Send, Search, FileText, Eye, MoreVertical, Trash2, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'
import Link from 'next/link'
import { useForm, useFieldArray } from 'react-hook-form'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  draft:    { label: 'Draft',    class: 'bg-gray-500/20 text-gray-400' },
  sent:     { label: 'Sent',     class: 'bg-blue-500/20 text-blue-400' },
  viewed:   { label: 'Viewed',   class: 'bg-purple-500/20 text-purple-400' },
  partial:  { label: 'Partial',  class: 'bg-yellow-500/20 text-yellow-400' },
  paid:     { label: 'Paid',     class: 'bg-green-500/20 text-green-400' },
  overdue:  { label: 'Overdue',  class: 'bg-red-500/20 text-red-400' },
  cancelled:{ label: 'Cancelled',class: 'bg-gray-500/20 text-gray-400' },
}

function downloadInvoicePDF(invoice: any) {
  const doc = new jsPDF()
  
  // Header
  doc.setFillColor(99, 102, 241)
  doc.rect(0, 0, 210, 40, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFontSize(22)
  doc.setFont('helvetica', 'bold')
  doc.text('INVOICE', 20, 25)
  doc.setFontSize(11)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.invoice_number || '', 150, 25)

  // Client info
  doc.setTextColor(30, 30, 30)
  doc.setFontSize(10)
  doc.text('Bill To:', 20, 55)
  doc.setFont('helvetica', 'bold')
  doc.text(invoice.client?.name || '', 20, 62)
  doc.setFont('helvetica', 'normal')
  doc.text(invoice.client?.email || '', 20, 68)
  doc.text(invoice.client?.company || '', 20, 74)
  if (invoice.client?.gstin) doc.text(`GSTIN: ${invoice.client.gstin}`, 20, 80)

  // Invoice details (right)
  doc.text(`Issue Date: ${invoice.issue_date || ''}`, 140, 55)
  doc.text(`Due Date: ${invoice.due_date || ''}`, 140, 62)
  doc.text(`Status: ${invoice.status?.toUpperCase()}`, 140, 69)

  // Items table
  const tableData = (invoice.items || []).map((item: any) => [
    item.description, item.quantity, `₹${parseFloat(item.rate).toLocaleString()}`, `₹${parseFloat(item.amount).toLocaleString()}`
  ])

  autoTable(doc, {
    head: [['Description', 'Qty', 'Rate', 'Amount']],
    body: tableData,
    startY: 95,
    styles: { fontSize: 10 },
    headStyles: { fillColor: [99, 102, 241] },
    alternateRowStyles: { fillColor: [248, 249, 255] },
  })

  const finalY = (doc as any).lastAutoTable.finalY + 10

  // Totals
  const totals = [
    ['Subtotal', `₹${parseFloat(invoice.subtotal || 0).toLocaleString()}`],
    ...(invoice.discount_amount > 0 ? [['Discount', `-₹${parseFloat(invoice.discount_amount).toLocaleString()}`]] : []),
    ...(invoice.cgst_amount > 0 ? [`CGST (${invoice.cgst_rate}%)`, `₹${parseFloat(invoice.cgst_amount).toLocaleString()}`] : []),
    ...(invoice.sgst_amount > 0 ? [`SGST (${invoice.sgst_rate}%)`, `₹${parseFloat(invoice.sgst_amount).toLocaleString()}`] : []),
    ...(invoice.igst_amount > 0 ? [`IGST (${invoice.igst_rate}%)`, `₹${parseFloat(invoice.igst_amount).toLocaleString()}`] : []),
  ]

  let yPos = finalY
  totals.forEach(([label, val]: any) => {
    doc.text(label, 140, yPos)
    doc.text(val, 185, yPos, { align: 'right' })
    yPos += 7
  })

  // Total box
  doc.setFillColor(99, 102, 241)
  doc.rect(130, yPos, 65, 12, 'F')
  doc.setTextColor(255, 255, 255)
  doc.setFont('helvetica', 'bold')
  doc.text('TOTAL', 135, yPos + 8)
  doc.text(`₹${parseFloat(invoice.total || 0).toLocaleString()}`, 190, yPos + 8, { align: 'right' })

  // Notes
  if (invoice.notes) {
    doc.setTextColor(100, 100, 100)
    doc.setFont('helvetica', 'normal')
    doc.setFontSize(9)
    doc.text('Notes:', 20, yPos + 5)
    doc.text(invoice.notes, 20, yPos + 12)
  }

  doc.save(`${invoice.invoice_number}.pdf`)
  toast.success('PDF downloaded!')
}

function CreateInvoiceDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { register, handleSubmit, reset, watch, control } = useForm({
    defaultValues: {
      client_id: '',
      due_date: '',
      notes: '',
      items: [{ description: '', quantity: 1, rate: 0, unit: 'unit' }],
      cgst_rate: 9, sgst_rate: 9, igst_rate: 0, discount_value: 0, discount_type: 'percentage'
    }
  })
  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const { data: clientsData } = useQuery({ queryKey: ['clients-list'], queryFn: () => clientsApi.list({ limit: 100 }) as any })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => invoicesApi.create(data) as any,
    onSuccess: () => { toast.success('Invoice created!'); qc.invalidateQueries({ queryKey: ['invoices'] }); setOpen(false); reset(); onSuccess() },
    onError: (err: any) => toast.error(err?.error || 'Failed to create invoice'),
  })

  const watchedItems = watch('items') || []
  const subtotal = watchedItems.reduce((s: number, i: any) => s + (parseFloat(i.quantity || 0) * parseFloat(i.rate || 0)), 0)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gradient-brand border-0 text-white gap-2" />}>
        <Plus className="w-4 h-4" /> New Invoice
      </DialogTrigger>
      <DialogContent className="glass border-white/10 max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Create Invoice</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Client *</label>
              <select {...register('client_id', { required: true })} className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200">
                <option value="">Select client...</option>
                {(clientsData?.data || []).map((c: any) => <option key={c.id} value={c.id}>{c.name} – {c.company || c.email}</option>)}
              </select>
            </div>
            <div>
              <label className="text-sm text-gray-300 mb-1.5 block">Due Date</label>
              <Input {...register('due_date')} type="date" className="bg-white/5 border-white/10" />
            </div>
          </div>

          {/* Items */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-gray-300">Line Items</label>
              <Button type="button" size="sm" variant="outline" onClick={() => append({ description: '', quantity: 1, rate: 0, unit: 'unit' })}>
                <Plus className="w-3.5 h-3.5 mr-1" /> Add Item
              </Button>
            </div>
            <div className="space-y-2">
              {fields.map((field, i) => (
                <div key={field.id} className="grid grid-cols-12 gap-2 items-center">
                  <Input {...register(`items.${i}.description`)} placeholder="Description" className="col-span-5 bg-white/5 border-white/10 text-sm" />
                  <Input {...register(`items.${i}.quantity`, { valueAsNumber: true })} type="number" placeholder="Qty" className="col-span-2 bg-white/5 border-white/10 text-sm" />
                  <Input {...register(`items.${i}.rate`, { valueAsNumber: true })} type="number" placeholder="Rate" className="col-span-3 bg-white/5 border-white/10 text-sm" />
                  <div className="col-span-1 text-xs text-gray-400">₹{((watchedItems[i]?.quantity || 0) * (watchedItems[i]?.rate || 0)).toLocaleString()}</div>
                  <button type="button" onClick={() => remove(i)} className="col-span-1 text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4" /></button>
                </div>
              ))}
            </div>
          </div>

          {/* Tax */}
          <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-white/3 border border-white/5">
            <div><label className="text-xs text-gray-400 mb-1 block">CGST %</label><Input {...register('cgst_rate', { valueAsNumber: true })} type="number" defaultValue={9} className="bg-white/5 border-white/10 text-sm" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">SGST %</label><Input {...register('sgst_rate', { valueAsNumber: true })} type="number" defaultValue={9} className="bg-white/5 border-white/10 text-sm" /></div>
            <div><label className="text-xs text-gray-400 mb-1 block">IGST %</label><Input {...register('igst_rate', { valueAsNumber: true })} type="number" defaultValue={0} className="bg-white/5 border-white/10 text-sm" /></div>
            <div className="col-span-3 pt-2 border-t border-white/5 text-sm font-semibold text-right">Subtotal: ₹{subtotal.toLocaleString()}</div>
          </div>

          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Notes</label>
            <textarea {...register('notes')} rows={2} placeholder="Payment terms, bank details..." className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200 placeholder-gray-500 resize-none" />
          </div>

          <Button type="submit" disabled={isPending} className="w-full gradient-brand border-0 text-white">
            {isPending ? 'Creating...' : 'Create Invoice'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function InvoicesPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['invoices', status],
    queryFn: () => invoicesApi.list({ status: status || undefined }) as any,
  })

  const sendMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.send(id) as any,
    onSuccess: () => { toast.success('Invoice sent!'); qc.invalidateQueries({ queryKey: ['invoices'] }) },
    onError: () => toast.error('Failed to send invoice'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => invoicesApi.delete(id) as any,
    onSuccess: () => { toast.success('Invoice deleted!'); qc.invalidateQueries({ queryKey: ['invoices'] }) },
  })

  const invoices = (data?.data || []).filter((inv: any) =>
    !search || inv.invoice_number?.toLowerCase().includes(search.toLowerCase()) || inv.client?.name?.toLowerCase().includes(search.toLowerCase())
  )

  const totalDue = invoices.reduce((s: number, i: any) => s + parseFloat(i.amount_due || 0), 0)
  const totalPaid = invoices.reduce((s: number, i: any) => s + parseFloat(i.amount_paid || 0), 0)

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Invoices</h1>
          <p className="text-gray-400 text-sm mt-1">{data?.total || 0} invoices · ₹{totalPaid.toLocaleString()} collected · ₹{totalDue.toLocaleString()} pending</p>
        </div>
        {['admin', 'manager'].includes(user?.role || '') && <CreateInvoiceDialog onSuccess={refetch} />}
      </div>

      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input placeholder="Search invoices..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200">
          <option value="">All Status</option>
          {Object.keys(STATUS_MAP).map(s => <option key={s} value={s}>{STATUS_MAP[s].label}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 rounded-xl animate-shimmer" />)}</div>
      ) : (
        <div className="glass-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
          <table className="w-full min-w-[600px]">
            <thead className="border-b border-border">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-4 py-3">Invoice #</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3 hidden md:table-cell">Date</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3 hidden sm:table-cell">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {invoices.map((inv: any) => (
                <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-muted/30 transition-colors">
                  <td className="px-4 py-3 text-sm font-medium text-indigo-400 whitespace-nowrap">{inv.invoice_number}</td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium whitespace-nowrap">{inv.client?.name}</p>
                    <p className="text-xs text-gray-400 hidden sm:block">{inv.client?.company}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-400 hidden md:table-cell">
                    <p className="whitespace-nowrap">{inv.issue_date}</p>
                    <p className="text-xs text-red-400 whitespace-nowrap">Due: {inv.due_date}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm font-semibold whitespace-nowrap">₹{parseFloat(inv.total || 0).toLocaleString()}</p>
                    {inv.amount_due > 0 && <p className="text-xs text-yellow-400 whitespace-nowrap">₹{parseFloat(inv.amount_due).toLocaleString()} due</p>}
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <Badge className={`text-xs ${STATUS_MAP[inv.status]?.class || ''}`}>{STATUS_MAP[inv.status]?.label || inv.status}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Link href={`/dashboard/invoices/${inv.id}`}><button className="text-gray-400 hover:text-white transition-colors"><Eye className="w-4 h-4" /></button></Link>
                      <button onClick={() => downloadInvoicePDF(inv)} className="text-gray-400 hover:text-white transition-colors"><Download className="w-4 h-4" /></button>
                      {['admin', 'manager'].includes(user?.role || '') && ['draft', 'viewed'].includes(inv.status) && (
                        <button onClick={() => sendMutation.mutate(inv.id)} className="text-gray-400 hover:text-indigo-400 transition-colors" title="Send Invoice Email"><Send className="w-4 h-4" /></button>
                      )}
                      {['admin', 'manager'].includes(user?.role || '') && (
                        <button onClick={() => {
                          const msg = encodeURIComponent(`Hi ${inv.client?.name || ''}, your invoice ${inv.invoice_number} for ₹${inv.total} is ready. You can view and pay it through your client portal.`)
                          window.open(`https://wa.me/?text=${msg}`, '_blank')
                        }} className="text-gray-400 hover:text-green-500 transition-colors" title="Send via WhatsApp">
                          <MessageCircle className="w-4 h-4" />
                        </button>
                      )}
                      {user?.role === 'admin' && (
                        <button onClick={() => { if(confirm('Delete this invoice?')) deleteMutation.mutate(inv.id) }} className="text-gray-400 hover:text-red-400 transition-colors"><Trash2 className="w-4 h-4" /></button>
                      )}
                      {user?.role === 'client' && parseFloat(inv.amount_due) > 0 && (
                        <Button size="sm" onClick={() => toast('Redirecting to payment gateway...', { description: 'Payment integration pending.' })} className="h-7 text-[10px] px-2 gradient-brand border-0 text-white">Pay</Button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
          </div>
          {invoices.length === 0 && <div className="text-center py-16 text-gray-500"><FileText className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No invoices found</p></div>}
        </div>
      )}
    </div>
  )
}
