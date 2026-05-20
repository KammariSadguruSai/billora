'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { paymentsApi, invoicesApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { CreditCard, CheckCircle, XCircle, Upload, Search, Filter, Eye } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'

const STATUS_MAP: Record<string, { label: string; class: string }> = {
  pending:  { label: 'Pending Verification', class: 'bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400 border border-amber-500/20' },
  verified: { label: 'Verified',             class: 'bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20' },
  failed:   { label: 'Failed',               class: 'bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20' },
  refunded: { label: 'Refunded',             class: 'bg-purple-500/10 text-purple-600 dark:bg-purple-500/20 dark:text-purple-400 border border-purple-500/20' },
}

function UploadPaymentDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm()
  const { data: invoicesData } = useQuery({ queryKey: ['invoices-list-unpaid'], queryFn: () => invoicesApi.list({ limit: 200 }) as any })
  const unpaidInvoices = (invoicesData?.data || []).filter((inv: any) => parseFloat(inv.amount_due) > 0 && !['draft', 'cancelled'].includes(inv.status))

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => paymentsApi.create(data) as any,
    onSuccess: () => { toast.success('Payment submitted for verification!'); qc.invalidateQueries({ queryKey: ['payments'] }); setOpen(false); reset(); onSuccess() },
    onError: () => toast.error('Failed to submit payment'),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gradient-brand border-0 text-white gap-2" />}>
        <Upload className="w-4 h-4" /> Record Payment
      </DialogTrigger>
      <DialogContent className="glass border-slate-950/[0.06] dark:border-white/10 bg-white dark:bg-card max-w-lg shadow-2xl rounded-2xl text-foreground">
        <DialogHeader><DialogTitle className="text-foreground">Record Payment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4 text-foreground">
          <div>
            <label className="text-sm text-slate-600 dark:text-gray-300 mb-1.5 block">Invoice *</label>
            <select {...register('invoice_id', { required: true })} className="w-full rounded-lg bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-sm px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
              <option value="" className="dark:bg-slate-950 text-foreground">Select invoice...</option>
              {unpaidInvoices.map((inv: any) => (
                <option key={inv.id} value={inv.id} className="dark:bg-slate-950 text-foreground">{inv.invoice_number} – {inv.client?.name || 'Unknown'} ({inv.client?.company || 'No Company'}) – ₹{parseFloat(inv.amount_due || 0).toLocaleString()} due</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-slate-600 dark:text-gray-300 mb-1.5 block">Amount (₹) *</label>
              <Input {...register('amount', { required: true })} type="number" placeholder="5000" className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground" />
            </div>
            <div>
              <label className="text-sm text-slate-600 dark:text-gray-300 mb-1.5 block">Date</label>
              <Input {...register('payment_date')} type="date" className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground" />
            </div>
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-gray-300 mb-1.5 block">Payment Method</label>
            <select {...register('payment_method')} className="w-full rounded-lg bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-sm px-3 py-2 text-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50">
              <option value="upi" className="dark:bg-slate-950 text-foreground">UPI</option>
              <option value="bank_transfer" className="dark:bg-slate-950 text-foreground">Bank Transfer</option>
              <option value="cash" className="dark:bg-slate-950 text-foreground">Cash</option>
              <option value="cheque" className="dark:bg-slate-950 text-foreground">Cheque</option>
              <option value="card" className="dark:bg-slate-950 text-foreground">Card</option>
              <option value="razorpay" className="dark:bg-slate-950 text-foreground">Razorpay</option>
            </select>
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-gray-300 mb-1.5 block">Transaction ID / UTR</label>
            <Input {...register('transaction_id')} placeholder="UPI/Bank reference number" className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground" />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-gray-300 mb-1.5 block">Screenshot URL (optional)</label>
            <Input {...register('screenshot_url')} placeholder="https://..." className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground" />
          </div>
          <div>
            <label className="text-sm text-slate-600 dark:text-gray-300 mb-1.5 block">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full rounded-lg bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-sm px-3 py-2 text-foreground placeholder-slate-400 dark:placeholder-gray-500 resize-none focus:outline-none focus:ring-1 focus:ring-indigo-500/50" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full gradient-brand border-0 text-white">{isPending ? 'Submitting...' : 'Submit Payment'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function PaymentsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('')

  const isClient = user?.role === 'client'

  const { data: paymentsData, isLoading: loadingPayments, refetch: refetchPayments } = useQuery({
    queryKey: ['payments', statusFilter],
    queryFn: () => paymentsApi.list({ status: statusFilter || undefined }) as any,
    enabled: !isClient,
  })

  const { data: invoicesData, isLoading: loadingInvoices } = useQuery({
    queryKey: ['client-invoices-payments'],
    queryFn: () => invoicesApi.list({}) as any,
    enabled: isClient,
  })

  const verifyMutation = useMutation({
    mutationFn: (id: string) => paymentsApi.verify(id) as any,
    onSuccess: () => { toast.success('Payment verified!'); qc.invalidateQueries({ queryKey: ['payments'] }) },
    onError: () => toast.error('Verification failed'),
  })

  if (isClient) {
    const invoices = invoicesData?.data || []
    const totalPaid = invoices.reduce((s: number, i: any) => s + parseFloat(i.amount_paid || 0), 0)
    const totalDue = invoices.reduce((s: number, i: any) => s + parseFloat(i.amount_due || 0), 0)

    return (
      <div className="space-y-6 max-w-5xl">
        <div>
          <h1 className="text-2xl font-bold">Payments & Bills</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">₹{totalPaid.toLocaleString()} paid · ₹{totalDue.toLocaleString()} pending</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card bg-slate-950/[0.02] dark:bg-card/25 border border-slate-950/[0.06] dark:border-white/10 rounded-xl p-4">
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Total Paid</p>
            <p className="text-xl font-bold text-emerald-600 dark:text-emerald-400">₹{(totalPaid).toLocaleString()}</p>
          </div>
          <div className="glass-card bg-slate-950/[0.02] dark:bg-card/25 border border-slate-950/[0.06] dark:border-white/10 rounded-xl p-4">
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">Outstanding Balance</p>
            <p className="text-xl font-bold text-rose-600 dark:text-rose-400">₹{(totalDue).toLocaleString()}</p>
          </div>
        </div>

        {loadingInvoices ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : (
          <div className="glass-card bg-slate-950/[0.02] dark:bg-card/25 border border-slate-950/[0.06] dark:border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-slate-950/[0.06] dark:border-white/5">
                <tr className="text-left text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Amount Due</th>
                  <th className="px-5 py-3">Payment Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-950/[0.06] dark:divide-white/5 text-slate-700 dark:text-gray-300">
                {invoices.map((inv: any) => {
                  const isFullyPaid = parseFloat(inv.amount_due || 0) === 0;
                  return (
                    <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-950/[0.02] dark:hover:bg-white/2 transition-colors">
                      <td className="px-5 py-4 font-bold text-indigo-600 dark:text-indigo-400">{inv.invoice_number}</td>
                      <td className="px-5 py-4">₹{parseFloat(inv.total || 0).toLocaleString()}</td>
                      <td className="px-5 py-4">₹{parseFloat(inv.amount_due || 0).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        {isFullyPaid ? (
                          <Badge className="bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400 border border-emerald-500/20">Paid</Badge>
                        ) : (
                          <Badge className="bg-rose-500/10 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400 border border-rose-500/20">Not Paid</Badge>
                        )}
                      </td>
                      <td className="px-5 py-4">
                        {!isFullyPaid && (
                          <Button size="sm" onClick={() => toast('Redirecting to payment gateway...', { description: 'Payment integration pending.' })} className="h-7 text-[10px] px-3 gradient-brand border-0 text-white">Pay Now</Button>
                        )}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
            {invoices.length === 0 && <div className="text-center py-16 text-slate-500 dark:text-gray-500">No bills found</div>}
          </div>
        )}
      </div>
    )
  }

  const payments = paymentsData?.data || []
  const totalVerified = payments.filter((p: any) => p.status === 'verified').reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0)
  const totalPending = payments.filter((p: any) => p.status === 'pending').reduce((s: number, p: any) => s + parseFloat(p.amount || 0), 0)

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Payments</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">₹{totalVerified.toLocaleString()} verified · ₹{totalPending.toLocaleString()} pending</p>
        </div>
        {['admin', 'manager'].includes(user?.role || '') && <UploadPaymentDialog onSuccess={refetchPayments} />}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: payments.length, class: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Verified', value: `₹${(totalVerified/1000).toFixed(1)}K`, class: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Pending', value: `₹${(totalPending/1000).toFixed(1)}K`, class: 'text-amber-600 dark:text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="glass-card bg-slate-950/[0.02] dark:bg-card/25 border border-slate-950/[0.06] dark:border-white/10 rounded-xl p-4">
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-1">{s.label}</p>
            <p className={`text-xl font-bold ${s.class}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {[
          ['', 'All'],
          ['pending', 'Pending'],
          ['verified', 'Verified'],
          ['failed', 'Failed']
        ].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`px-4 py-1.5 rounded-full text-xs font-semibold transition-all cursor-pointer ${statusFilter === val ? 'bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20 dark:border-indigo-500/30' : 'bg-slate-950/[0.02] dark:bg-white/5 text-slate-500 dark:text-gray-400 border border-slate-950/[0.06] dark:border-white/10 hover:border-slate-950/15 dark:hover:border-white/20'}`}>
            {label}
          </button>
        ))}
      </div>

      {loadingPayments ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="glass-card bg-slate-950/[0.02] dark:bg-card/25 border border-slate-950/[0.06] dark:border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-slate-950/[0.06] dark:border-white/5">
              <tr className="text-left text-xs text-slate-500 dark:text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                {['admin', 'manager'].includes(user?.role || '') && <th className="px-5 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-950/[0.06] dark:divide-white/5 text-slate-700 dark:text-gray-300">
              {payments.map((p: any) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-slate-950/[0.02] dark:hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-bold text-indigo-600 dark:text-indigo-400">{p.invoice?.invoice_number || '—'}</p>
                    {p.transaction_id && <p className="text-xs text-slate-400 dark:text-gray-500 font-mono mt-0.5">{p.transaction_id}</p>}
                  </td>
                  <td className="px-5 py-4 text-sm capitalize text-slate-600 dark:text-gray-300">{p.payment_method?.replace('_', ' ')}</td>
                  <td className="px-5 py-4 text-sm font-bold text-emerald-600 dark:text-emerald-400">₹{parseFloat(p.amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm text-slate-500 dark:text-gray-400">{p.payment_date}</td>
                  <td className="px-5 py-4">
                    <Badge className={`text-xs ${STATUS_MAP[p.status]?.class || ''}`}>{STATUS_MAP[p.status]?.label || p.status}</Badge>
                  </td>
                  {['admin', 'manager'].includes(user?.role || '') && (
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {p.status === 'pending' && (
                          <button onClick={() => verifyMutation.mutate(p.id)} className="text-emerald-600 dark:text-emerald-400 hover:text-emerald-500 dark:hover:text-emerald-300 transition-colors cursor-pointer" title="Verify">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        )}
                        {p.screenshot_url && (
                          <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300">
                            <Eye className="w-4 h-4" />
                          </a>
                        )}
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <div className="text-center py-16 text-slate-500 dark:text-gray-500"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No payments found</p></div>}
        </div>
      )}
    </div>
  )
}
