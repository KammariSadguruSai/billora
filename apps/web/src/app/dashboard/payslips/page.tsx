'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { payslipsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  Receipt, Plus, FileText, Search, CreditCard, Banknote,
  CheckCircle2, Clock, Check
} from 'lucide-react'
import { format } from 'date-fns'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export default function PayslipsPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  
  const isFinanceOrAdmin = ['admin', 'finance'].includes(user?.role || '')

  const { data, isLoading } = useQuery({
    queryKey: ['payslips', search],
    queryFn: () => payslipsApi.list({ search: search || undefined }) as any,
  })

  const payslips = data?.data || []

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
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
            { label: 'Pending Approval', value: payslips.filter((p:any) => p.status === 'draft').length, icon: Clock, color: 'text-orange-500', bg: 'bg-orange-500/10' },
            { label: 'Paid this Month', value: payslips.filter((p:any) => p.status === 'paid').length, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
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
            <p>No payslips found</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-950/[0.06] dark:divide-white/10">
            {payslips.map((p: any) => (
              <div key={p.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group cursor-pointer">
                
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
                      <p className="text-sm font-bold text-slate-900 dark:text-white truncate">
                        {p.employee?.full_name}
                      </p>
                      <p className="text-[10px] font-mono text-slate-500 truncate">
                        {p.employee?.employee_id}
                      </p>
                    </div>
                  </div>
                )}

                {/* Amounts */}
                <div className="flex-1 grid grid-cols-3 gap-4">
                  <div>
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Net Pay</p>
                    <p className="text-sm font-bold text-slate-900 dark:text-white">₹{p.net_salary.toLocaleString()}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Gross</p>
                    <p className="text-sm font-medium text-slate-700 dark:text-slate-300">₹{p.gross_salary.toLocaleString()}</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">Deductions</p>
                    <p className="text-sm font-medium text-rose-600 dark:text-rose-400">₹{p.total_deductions.toLocaleString()}</p>
                  </div>
                </div>

                {/* Status */}
                <div className="w-28 text-right">
                  <Badge variant="outline" className={`
                    text-[10px] py-0.5 font-bold uppercase tracking-wider
                    ${p.status === 'paid' ? 'border-emerald-200 text-emerald-600 bg-emerald-50 dark:border-emerald-500/30 dark:text-emerald-400 dark:bg-emerald-500/10' : ''}
                    ${p.status === 'approved' ? 'border-blue-200 text-blue-600 bg-blue-50 dark:border-blue-500/30 dark:text-blue-400 dark:bg-blue-500/10' : ''}
                    ${p.status === 'draft' ? 'border-orange-200 text-orange-600 bg-orange-50 dark:border-orange-500/30 dark:text-orange-400 dark:bg-orange-500/10' : ''}
                  `}>
                    {p.status}
                  </Badge>
                  {p.status === 'paid' && p.payment_date && (
                    <p className="text-[9px] text-slate-400 mt-1 font-medium">
                      {format(new Date(p.payment_date), 'MMM d, yyyy')}
                    </p>
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
