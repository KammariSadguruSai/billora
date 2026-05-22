'use client'
import { useState, useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { payslipsApi, usersApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  Receipt, Plus, FileText, Search, CreditCard,
  CheckCircle2, Clock, X, User, Calendar, IndianRupee,
  Loader2, Trash2, CheckSquare, Banknote
} from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { toast } from 'sonner'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const MONTH_OPTIONS = MONTHS.map((m, i) => ({ label: m, value: i + 1 }))

// ─── Shared Input Field ────────────────────────────────────────────────────────
const Field = ({ label, name, placeholder, value, onChange }: { label: string; name: string; placeholder?: string, value: string, onChange: (val: string) => void }) => (
  <div>
    <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">{label}</label>
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">₹</span>
      <input
        type="number"
        placeholder={placeholder || '0'}
        value={value}
        onChange={e => onChange(e.target.value)}
        className="w-full pl-7 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all"
      />
    </div>
  </div>
)

// ─── Create Payslip Dialog ────────────────────────────────────────────────────
function CreatePayslipDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient()
  const [form, setForm] = useState({
    employee_id: '',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basic_salary: '',
    hra: '',
    allowances: '',
    bonuses: '',
    deductions: '',
    pf_deduction: '',
    tds_deduction: '',
    notes: '',
  })

  const { data: membersData } = useQuery({
    queryKey: ['members'],
    queryFn: () => usersApi.listMembers() as any,
    enabled: open,
  })
  const members = (membersData as any)?.data || []

  const num = (v: string) => parseFloat(v) || 0

  const grossSalary = num(form.basic_salary) + num(form.hra) + num(form.allowances) + num(form.bonuses)
  const totalDeductions = num(form.deductions) + num(form.pf_deduction) + num(form.tds_deduction)
  const netSalary = grossSalary - totalDeductions

  const createMutation = useMutation({
    mutationFn: (data: any) => payslipsApi.create(data),
    onSuccess: () => {
      toast.success('Payslip created successfully!')
      qc.invalidateQueries({ queryKey: ['payslips'] })
      onClose()
      setForm({
        employee_id: '', month: new Date().getMonth() + 1, year: new Date().getFullYear(),
        basic_salary: '', hra: '', allowances: '', bonuses: '',
        deductions: '', pf_deduction: '', tds_deduction: '', notes: '',
      })
    },
    onError: (err: any) => toast.error(err?.error || 'Failed to create payslip'),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.employee_id) return toast.error('Please select an employee')
    if (!form.basic_salary) return toast.error('Basic salary is required')
    createMutation.mutate({ ...form, net_salary: netSalary })
  }


  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white dark:bg-[#0f1117] border border-slate-200 dark:border-white/10 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-100 dark:border-white/10 sticky top-0 bg-white dark:bg-[#0f1117] z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Create Payslip</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Generate a new salary slip for an employee</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors">
            <X className="w-4 h-4 text-slate-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Employee + Period */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="sm:col-span-3">
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Employee *</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <select
                  value={form.employee_id}
                  onChange={e => setForm(f => ({ ...f, employee_id: e.target.value }))}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500/50 transition-all appearance-none"
                >
                  <option value="">Select an employee...</option>
                  {members.map((m: any) => (
                    <option key={m.id} value={m.id}>{m.full_name} ({m.role})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Month *</label>
              <select
                value={form.month}
                onChange={e => setForm(f => ({ ...f, month: parseInt(e.target.value) }))}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 appearance-none"
              >
                {MONTH_OPTIONS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Year *</label>
              <input
                type="number"
                value={form.year}
                onChange={e => setForm(f => ({ ...f, year: parseInt(e.target.value) }))}
                min={2020} max={2030}
                className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm font-semibold text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
              />
            </div>
          </div>

          {/* Earnings */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-emerald-500 rounded-full" /> Earnings
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Basic Salary *" name="basic_salary" value={form.basic_salary} onChange={v => setForm(f => ({ ...f, basic_salary: v }))} />
              <Field label="HRA" name="hra" value={form.hra} onChange={v => setForm(f => ({ ...f, hra: v }))} />
              <Field label="Allowances" name="allowances" value={form.allowances} onChange={v => setForm(f => ({ ...f, allowances: v }))} />
              <Field label="Bonuses" name="bonuses" value={form.bonuses} onChange={v => setForm(f => ({ ...f, bonuses: v }))} />
            </div>
          </div>

          {/* Deductions */}
          <div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-4 bg-rose-500 rounded-full" /> Deductions
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Other Deductions" name="deductions" value={form.deductions} onChange={v => setForm(f => ({ ...f, deductions: v }))} />
              <Field label="PF Deduction" name="pf_deduction" value={form.pf_deduction} onChange={v => setForm(f => ({ ...f, pf_deduction: v }))} />
              <Field label="TDS" name="tds_deduction" value={form.tds_deduction} onChange={v => setForm(f => ({ ...f, tds_deduction: v }))} />
            </div>
          </div>

          {/* Summary Panel */}
          <div className="rounded-2xl bg-gradient-to-br from-indigo-500/5 to-purple-500/5 border border-indigo-500/15 p-5 grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Gross Pay</p>
              <p className="text-lg font-black text-emerald-600 dark:text-emerald-400">₹{grossSalary.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center border-x border-indigo-500/15">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Deductions</p>
              <p className="text-lg font-black text-rose-500">₹{totalDeductions.toLocaleString('en-IN')}</p>
            </div>
            <div className="text-center">
              <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Net Pay</p>
              <p className="text-lg font-black text-indigo-600 dark:text-indigo-400">₹{netSalary.toLocaleString('en-IN')}</p>
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1.5 block">Notes (Optional)</label>
            <textarea
              value={form.notes}
              onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
              placeholder="Any additional notes..."
              rows={2}
              className="w-full px-3 py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-sm text-slate-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/40 resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 disabled:scale-100"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.3)' }}
            >
              {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Receipt className="w-4 h-4" />}
              {createMutation.isPending ? 'Creating...' : 'Create Payslip'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PayslipsPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)

  const isFinanceOrAdmin = ['admin', 'finance'].includes(user?.role || '')
  const isAdmin = user?.role === 'admin'

  const { data, isLoading } = useQuery({
    queryKey: ['payslips', search],
    queryFn: () => payslipsApi.list({ search: search || undefined }) as any,
  })

  const payslips = data?.data || []

  const approveMutation = useMutation({
    mutationFn: (id: string) => payslipsApi.approve(id),
    onSuccess: () => { toast.success('Payslip approved!'); qc.invalidateQueries({ queryKey: ['payslips'] }) },
    onError: (err: any) => toast.error(err?.error || 'Failed to approve'),
  })

  const markPaidMutation = useMutation({
    mutationFn: (id: string) => payslipsApi.markPaid(id, { payment_method: 'bank_transfer', payment_date: new Date().toISOString().split('T')[0] }),
    onSuccess: () => { toast.success('Payslip marked as paid!'); qc.invalidateQueries({ queryKey: ['payslips'] }) },
    onError: (err: any) => toast.error(err?.error || 'Failed to mark paid'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => payslipsApi.delete(id),
    onSuccess: () => { toast.success('Payslip deleted'); qc.invalidateQueries({ queryKey: ['payslips'] }) },
    onError: (err: any) => toast.error(err?.error || 'Failed to delete'),
  })

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <CreatePayslipDialog open={showCreate} onClose={() => setShowCreate(false)} />

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Payslips</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">
            {isFinanceOrAdmin ? 'Manage employee salaries and payments' : 'View your monthly payslips'}
          </p>
        </div>
        {isFinanceOrAdmin && (
          <button
            onClick={() => setShowCreate(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}
          >
            <Plus className="w-4 h-4" /> Create Payslip
          </button>
        )}
      </div>

      {/* Stats Cards (Finance/Admin) */}
      {isFinanceOrAdmin && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Total Payslips', value: data?.total || 0, icon: Receipt, color: 'text-indigo-500', bg: 'bg-indigo-500/10' },
            { label: 'Pending Approval', value: payslips.filter((p: any) => p.status === 'draft').length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Paid this Month', value: payslips.filter((p: any) => p.status === 'paid').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          ].map((stat, i) => (
            <div key={i} className="glass-card rounded-2xl p-5 border border-slate-950/[0.06] dark:border-white/10 flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.bg}`}>
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">{stat.value}</p>
                <p className="text-xs text-slate-500 dark:text-gray-400 font-medium">{stat.label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Main List */}
      <div className="glass-card rounded-2xl border border-slate-950/[0.06] dark:border-white/10 overflow-hidden">
        <div className="p-4 border-b border-slate-950/[0.06] dark:border-white/10 bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder={isFinanceOrAdmin ? "Search by employee..." : "Search payslips..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-white dark:bg-slate-950/50 border-slate-200 dark:border-white/10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="p-4 space-y-4">
            {[1, 2, 3].map(i => <Skeleton key={i} className="h-16 rounded-xl bg-slate-100 dark:bg-white/5" />)}
          </div>
        ) : payslips.length === 0 ? (
          <div className="p-12 text-center text-slate-500 dark:text-gray-400">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p className="font-semibold">No payslips found</p>
            {isFinanceOrAdmin && (
              <button onClick={() => setShowCreate(true)} className="mt-4 text-sm text-indigo-500 hover:underline font-semibold">
                Create the first payslip →
              </button>
            )}
          </div>
        ) : (
          <div className="divide-y divide-slate-950/[0.06] dark:divide-white/10">
            {payslips.map((p: any) => (
              <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group">

                {/* Month/Year Badge */}
                <div className="w-14 h-14 rounded-xl bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-100 dark:border-indigo-500/20 flex flex-col items-center justify-center flex-shrink-0 text-indigo-600 dark:text-indigo-400">
                  <span className="text-[10px] font-bold uppercase tracking-widest">{MONTHS[p.month - 1]}</span>
                  <span className="text-sm font-black">{p.year}</span>
                </div>

                {/* Employee Info (Admin/Finance only) */}
                {isFinanceOrAdmin && (
                  <div className="w-48 flex items-center gap-3">
                    <Avatar className="w-9 h-9 border border-slate-200 dark:border-white/10">
                      <AvatarImage src={p.employee?.avatar_url} />
                      <AvatarFallback className="bg-slate-100 dark:bg-slate-800 text-xs">
                        {p.employee?.full_name?.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">{p.employee?.full_name}</p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">{p.employee?.employee_id || p.employee?.role}</p>
                    </div>
                  </div>
                )}

                {/* Amounts */}
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Net Pay</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">₹{p.net_salary?.toLocaleString()}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Gross</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">₹{p.gross_salary?.toLocaleString()}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Deductions</p>
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400">₹{p.total_deductions?.toLocaleString()}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`
                    text-[10px] py-0.5 font-bold uppercase tracking-wider
                    ${p.status === 'paid' ? 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10' : ''}
                    ${p.status === 'approved' ? 'border-blue-200 text-blue-600 bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:bg-blue-500/10' : ''}
                    ${p.status === 'draft' ? 'border-orange-200 text-orange-600 bg-orange-50 dark:border-orange-500/30 dark:text-orange-400 dark:bg-orange-500/10' : ''}
                  `}>
                    {p.status}
                  </Badge>

                  {/* Action Buttons */}
                  {isFinanceOrAdmin && (
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {isAdmin && p.status === 'draft' && (
                        <button
                          onClick={() => approveMutation.mutate(p.id)}
                          disabled={approveMutation.isPending}
                          title="Approve"
                          className="w-7 h-7 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-500 flex items-center justify-center transition-colors"
                        >
                          <CheckSquare className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {isFinanceOrAdmin && p.status === 'approved' && (
                        <button
                          onClick={() => markPaidMutation.mutate(p.id)}
                          disabled={markPaidMutation.isPending}
                          title="Mark as Paid"
                          className="w-7 h-7 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 flex items-center justify-center transition-colors"
                        >
                          <Banknote className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {p.status === 'draft' && (
                        <button
                          onClick={() => { if (confirm('Delete this draft payslip?')) deleteMutation.mutate(p.id) }}
                          disabled={deleteMutation.isPending}
                          title="Delete"
                          className="w-7 h-7 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 flex items-center justify-center transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
