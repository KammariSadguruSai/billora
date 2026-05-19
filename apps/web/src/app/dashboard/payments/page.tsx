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
  pending:  { label: 'Pending Verification', class: 'bg-yellow-500/20 text-yellow-400' },
  verified: { label: 'Verified',             class: 'bg-green-500/20 text-green-400' },
  failed:   { label: 'Failed',               class: 'bg-red-500/20 text-red-400' },
  refunded: { label: 'Refunded',             class: 'bg-purple-500/20 text-purple-400' },
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
      <DialogContent className="glass border-white/10 max-w-lg">
        <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Invoice *</label>
            <select {...register('invoice_id', { required: true })} className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200">
              <option value="">Select invoice...</option>
              {unpaidInvoices.map((inv: any) => (
                <option key={inv.id} value={inv.id}>{inv.invoice_number} – {inv.client?.name || 'Unknown'} ({inv.client?.company || 'No Company'}) – ₹{parseFloat(inv.amount_due || 0).toLocaleString()} due</option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-300 mb-1.5 block">Amount (₹) *</label><Input {...register('amount', { required: true })} type="number" placeholder="5000" className="bg-white/5 border-white/10" /></div>
            <div><label className="text-sm text-gray-300 mb-1.5 block">Date</label><Input {...register('payment_date')} type="date" className="bg-white/5 border-white/10" /></div>
          </div>
          <div>
            <label className="text-sm text-gray-300 mb-1.5 block">Payment Method</label>
            <select {...register('payment_method')} className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200">
              <option value="upi">UPI</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="cash">Cash</option>
              <option value="cheque">Cheque</option>
              <option value="card">Card</option>
              <option value="razorpay">Razorpay</option>
            </select>
          </div>
          <div><label className="text-sm text-gray-300 mb-1.5 block">Transaction ID / UTR</label><Input {...register('transaction_id')} placeholder="UPI/Bank reference number" className="bg-white/5 border-white/10" /></div>
          <div><label className="text-sm text-gray-300 mb-1.5 block">Screenshot URL (optional)</label><Input {...register('screenshot_url')} placeholder="https://..." className="bg-white/5 border-white/10" /></div>
          <div><label className="text-sm text-gray-300 mb-1.5 block">Notes</label>
            <textarea {...register('notes')} rows={2} className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200 placeholder-gray-500 resize-none" />
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
          <p className="text-gray-400 text-sm mt-1">₹{totalPaid.toLocaleString()} paid · ₹{totalDue.toLocaleString()} pending</p>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="glass-card border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Total Paid</p>
            <p className="text-xl font-bold text-green-400">₹{(totalPaid).toLocaleString()}</p>
          </div>
          <div className="glass-card border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">Outstanding Balance</p>
            <p className="text-xl font-bold text-red-400">₹{(totalDue).toLocaleString()}</p>
          </div>
        </div>

        {loadingInvoices ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
        ) : (
          <div className="glass-card border border-white/10 rounded-xl overflow-hidden">
            <table className="w-full">
              <thead className="border-b border-white/5">
                <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                  <th className="px-5 py-3">Invoice</th>
                  <th className="px-5 py-3">Total Amount</th>
                  <th className="px-5 py-3">Amount Due</th>
                  <th className="px-5 py-3">Payment Status</th>
                  <th className="px-5 py-3">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {invoices.map((inv: any) => {
                  const isFullyPaid = parseFloat(inv.amount_due || 0) === 0;
                  return (
                    <motion.tr key={inv.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-white/2 transition-colors">
                      <td className="px-5 py-4 font-medium text-indigo-400">{inv.invoice_number}</td>
                      <td className="px-5 py-4 text-gray-300">₹{parseFloat(inv.total || 0).toLocaleString()}</td>
                      <td className="px-5 py-4 text-gray-300">₹{parseFloat(inv.amount_due || 0).toLocaleString()}</td>
                      <td className="px-5 py-4">
                        {isFullyPaid ? (
                          <Badge className="bg-green-500/20 text-green-400">Paid</Badge>
                        ) : (
                          <Badge className="bg-red-500/20 text-red-400">Not Paid</Badge>
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
            {invoices.length === 0 && <div className="text-center py-16 text-gray-500">No bills found</div>}
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
          <p className="text-gray-400 text-sm mt-1">₹{totalVerified.toLocaleString()} verified · ₹{totalPending.toLocaleString()} pending</p>
        </div>
        {['admin', 'manager'].includes(user?.role || '') && <UploadPaymentDialog onSuccess={refetchPayments} />}
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total', value: payments.length, color: '#6366f1' },
          { label: 'Verified', value: `₹${(totalVerified/1000).toFixed(1)}K`, color: '#10b981' },
          { label: 'Pending', value: `₹${(totalPending/1000).toFixed(1)}K`, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="glass-card border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">{s.label}</p>
            <p className="text-xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Status filter */}
      <div className="flex gap-2 flex-wrap">
        {[['', 'All'], ['pending', 'Pending'], ['verified', 'Verified'], ['failed', 'Failed']].map(([val, label]) => (
          <button key={val} onClick={() => setStatusFilter(val)}
            className={`px-4 py-1.5 rounded-full text-sm transition-all ${statusFilter === val ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'bg-white/5 text-gray-400 border border-white/10 hover:border-white/20'}`}>
            {label}
          </button>
        ))}
      </div>

      {loadingPayments ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 rounded-xl" />)}</div>
      ) : (
        <div className="glass-card border border-white/10 rounded-xl overflow-hidden">
          <table className="w-full">
            <thead className="border-b border-white/5">
              <tr className="text-left text-xs text-gray-400 uppercase tracking-wider">
                <th className="px-5 py-3">Invoice</th>
                <th className="px-5 py-3">Method</th>
                <th className="px-5 py-3">Amount</th>
                <th className="px-5 py-3">Date</th>
                <th className="px-5 py-3">Status</th>
                {['admin', 'manager'].includes(user?.role || '') && <th className="px-5 py-3">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {payments.map((p: any) => (
                <motion.tr key={p.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="hover:bg-white/2 transition-colors">
                  <td className="px-5 py-4">
                    <p className="text-sm font-medium text-indigo-400">{p.invoice?.invoice_number || '—'}</p>
                    {p.transaction_id && <p className="text-xs text-gray-400">{p.transaction_id}</p>}
                  </td>
                  <td className="px-5 py-4 text-sm capitalize text-gray-300">{p.payment_method?.replace('_', ' ')}</td>
                  <td className="px-5 py-4 text-sm font-semibold text-green-400">₹{parseFloat(p.amount || 0).toLocaleString()}</td>
                  <td className="px-5 py-4 text-sm text-gray-400">{p.payment_date}</td>
                  <td className="px-5 py-4">
                    <Badge className={`text-xs ${STATUS_MAP[p.status]?.class || ''}`}>{STATUS_MAP[p.status]?.label || p.status}</Badge>
                  </td>
                  {['admin', 'manager'].includes(user?.role || '') && (
                    <td className="px-5 py-4">
                      {p.status === 'pending' && (
                        <div className="flex gap-2">
                          <button onClick={() => verifyMutation.mutate(p.id)} className="text-green-400 hover:text-green-300 transition-colors" title="Verify">
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                      {p.screenshot_url && (
                        <a href={p.screenshot_url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-300">
                          <Eye className="w-4 h-4" />
                        </a>
                      )}
                    </td>
                  )}
                </motion.tr>
              ))}
            </tbody>
          </table>
          {payments.length === 0 && <div className="text-center py-16 text-gray-500"><CreditCard className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No payments found</p></div>}
        </div>
      )}
    </div>
  )
}
