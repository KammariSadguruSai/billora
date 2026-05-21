'use client'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { dashboardApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  TrendingUp, Users, FileText, CreditCard, CheckSquare,
  BarChart3, ArrowUpRight, Clock, FolderKanban, AlertCircle,
  Sparkles, ShieldCheck, Zap, Activity, ArrowRight, Building2, Receipt
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { Button } from '@/components/ui/button'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#6366f1', '#06b6d4', '#f59e0b', '#ef4444', '#8b5cf6']

const STATUS_COLOR: Record<string, string> = {
  active: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
  completed: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border border-indigo-500/20',
  planning: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20',
  on_hold: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border border-orange-500/20',
  cancelled: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20',
}

const INVOICE_STATUS_COLOR: Record<string, string> = {
  paid: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20',
  pending: 'text-amber-600 dark:text-amber-400 bg-emerald-500/10 border border-amber-500/20',
  overdue: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border border-rose-500/20',
}

function StatCard({ icon: Icon, label, value, sub, color, href }: any) {
  return (
    <motion.div 
      whileHover={{ y: -3, scale: 1.01 }} 
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="relative group"
    >
      <Link href={href || '#'}>
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-cyan-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        <Card className="bg-slate-950/[0.02] dark:bg-slate-950/20 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 group-hover:border-indigo-500/20 transition-all duration-300 rounded-2xl overflow-hidden shadow-sm hover:shadow-md dark:shadow-xl">
          <CardContent className="p-5 sm:p-6 relative z-10">
            <div className="flex items-start justify-between mb-4">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105 duration-300" 
                style={{ 
                  background: `${color}12`,
                  border: `1px solid ${color}25`
                }}
              >
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <div className="w-6 h-6 rounded-lg bg-slate-500/5 dark:bg-white/5 flex items-center justify-center text-muted-foreground group-hover:text-foreground group-hover:bg-slate-500/10 dark:group-hover:bg-white/10 transition-colors duration-300">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </div>
            </div>
            <div className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground mb-1 font-mono">{value}</div>
            <div className="text-xs sm:text-sm font-medium text-muted-foreground group-hover:text-foreground/80 transition-colors duration-300">{label}</div>
            {sub && (
              <div className="text-[11px] text-muted-foreground/60 mt-1 flex items-center gap-1">
                <span className="w-1 h-1 rounded-full bg-indigo-500/60" />
                {sub}
              </div>
            )}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-muted-foreground/50 border border-dashed border-slate-200 dark:border-white/5 rounded-2xl bg-slate-500/[0.01] dark:bg-white/[0.01]">
      <div className="w-12 h-12 rounded-full bg-slate-500/5 dark:bg-white/5 flex items-center justify-center mb-3">
        <Icon className="w-6 h-6 opacity-40" />
      </div>
      <p className="text-sm font-medium">{message}</p>
    </div>
  )
}

export default function DashboardPage() {
  const { user } = useAuthStore()
  const { data, isLoading, isError } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => dashboardApi.get() as any,
  })

  const fmt = (n: number) => {
    if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`
    if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`
    if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`
    return `₹${Math.round(n).toLocaleString('en-IN')}`
  }

  if (isLoading) return (
    <div className="space-y-6 max-w-7xl animate-fade-in-up">
      <div className="flex justify-between items-center">
        <div>
          <Skeleton className="h-8 w-44 bg-white/5 rounded-lg mb-2" />
          <Skeleton className="h-4 w-60 bg-white/5 rounded-lg" />
        </div>
        <Skeleton className="h-10 w-32 bg-white/5 rounded-xl hidden sm:block" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 bg-white/5 rounded-2xl border border-white/5" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="h-80 bg-white/5 rounded-2xl border border-white/5 lg:col-span-2" />
        <Skeleton className="h-80 bg-white/5 rounded-2xl border border-white/5" />
      </div>
    </div>
  )

  if (isError) return (
    <div className="max-w-7xl space-y-4 animate-fade-in-up">
      <div className="flex items-center gap-3 p-5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <div>
          <h3 className="font-semibold text-sm">System connection error</h3>
          <p className="text-xs text-rose-400/80 mt-0.5">Failed to fetch live dashboard telemetry. Please ensure your backend is accessible and refresh.</p>
        </div>
      </div>
    </div>
  )

  const stats = data?.stats || {}
  const recentProjects = data?.recentProjects || []
  const pendingPayments = data?.pendingPayments || []

  const pieData = [
    { name: 'Active', value: stats.projectStats?.active || 0 },
    { name: 'Planning', value: stats.projectStats?.planning || 0 },
    { name: 'Completed', value: stats.projectStats?.completed || 0 },
  ].filter(d => d.value > 0)

  const hasPieData = pieData.length > 0

  // ─── Client View ──────────────────────────────────────────
  if (user?.role === 'client') {
    const clientProjects = data?.projects?.data || []
    const clientInvoices = data?.invoices?.data || []

    return (
      <div className="space-y-6 max-w-7xl relative min-h-screen pb-12 animate-fade-in-up">
        {/* Glow Effects */}
        <div className="absolute top-[-250px] left-[10%] w-[350px] h-[350px] bg-indigo-500/8 rounded-full blur-[100px] pointer-events-none z-0" />
        <div className="absolute top-[-100px] right-[5%] w-[300px] h-[300px] bg-cyan-500/6 rounded-full blur-[90px] pointer-events-none z-0" />

        {/* Welcome Area */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] tracking-wider uppercase font-extrabold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full">Realtime active</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Welcome back, {user?.full_name?.split(' ')[0]} <span className="animate-pulse">✨</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>

          <div className="flex gap-2">
            <Link href="/dashboard/chat">
              <Button size="sm" className="h-9 px-4 rounded-xl glass border-slate-200/80 dark:border-white/10 hover:bg-slate-500/5 dark:hover:bg-white/5 hover:border-slate-300 dark:hover:border-white/20 transition-all font-semibold text-xs flex items-center gap-1.5">
                <Zap className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Team Chat
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
          <StatCard icon={FolderKanban} label="Active Workspaces" value={data?.projects?.total || 0} sub="Managed deliverables" color="#6366f1" href="/dashboard/projects" />
          <StatCard icon={FileText} label="Total Billings" value={data?.invoices?.total || 0} sub="Pending & paid statements" color="#06b6d4" href="/dashboard/invoices" />
          <StatCard icon={CreditCard} label="Outstanding Dues" value={fmt(data?.invoices?.pending || 0)} sub="Immediate payout required" color="#ef4444" href="/dashboard/payments" />
        </div>

        {/* Project Lists and Bills */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          
          {/* Projects */}
          <Card className="bg-slate-950/[0.02] dark:bg-card/20 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-950/[0.06] dark:border-white/5 px-6 pt-5">
              <div className="flex items-center gap-2">
                <FolderKanban className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">Assigned Workspaces</CardTitle>
              </div>
              <Link href="/dashboard/projects" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {clientProjects.length === 0 ? (
                <EmptyState icon={FolderKanban} message="No active projects allocated to your client portal." />
              ) : clientProjects.map((p: any) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5 bg-slate-950/[0.01] dark:bg-white/[0.01] hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.02] hover:border-slate-950/15 dark:hover:border-white/10 transition-all duration-300 group">
                  <Link href={`/dashboard/projects/${p.id}`} className="block space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-sm font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{p.name}</p>
                      <span className={`text-[10px] font-extrabold capitalize px-2.5 py-0.5 rounded-full border ${STATUS_COLOR[p.status] || 'text-gray-500 dark:text-gray-400 bg-slate-500/10 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
                        {p.status?.replace('_', ' ')}
                      </span>
                    </div>
                    <div>
                      <div className="flex items-center justify-between text-[11px] text-muted-foreground font-semibold mb-1">
                        <span>Milestone Progress</span>
                        <span className="font-mono">{p.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-slate-950/[0.05] dark:bg-white/5 overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500" style={{ width: `${p.progress || 0}%` }} />
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Invoices */}
          <Card className="bg-slate-950/[0.02] dark:bg-card/20 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-4 border-b border-slate-950/[0.06] dark:border-white/5 px-6 pt-5">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-500 dark:text-cyan-400" />
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">Recent Invoices</CardTitle>
              </div>
              <Link href="/dashboard/invoices" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {clientInvoices.length === 0 ? (
                <EmptyState icon={FileText} message="No invoices generated for your account yet." />
              ) : clientInvoices.map((inv: any) => (
                <div key={inv.id} className="p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5 bg-slate-950/[0.01] dark:bg-white/[0.01] hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.02] transition-colors flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-2 font-medium">
                      <span>Issued: {new Date(inv.created_at || Date.now()).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}</span>
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-foreground font-mono">₹{parseFloat(inv.total || 0).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">GST Inc.</p>
                    </div>
                    <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${INVOICE_STATUS_COLOR[inv.status] || 'bg-slate-500/10 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
                      {inv.status}
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

        </div>
      </div>
    )
  }

  // ─── Finance View ──────────────────────────────────────────
  if (user?.role === 'finance') {
    return (
      <div className="space-y-6 max-w-7xl relative min-h-screen pb-12 animate-fade-in-up">
        <div className="absolute top-[-250px] left-[10%] w-[350px] h-[350px] bg-emerald-500/8 rounded-full blur-[100px] pointer-events-none z-0" />
        
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Finance Dashboard <span className="animate-pulse">💸</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard/invoices">
              <Button size="sm" className="h-9 px-4 rounded-xl gradient-brand text-white border-0 font-bold text-xs">
                New Invoice
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <StatCard icon={TrendingUp} label="Total Revenue" value={fmt(stats.totalRevenue || 0)} sub="All-time paid" color="#34d399" href="/dashboard/payments" />
          <StatCard icon={CreditCard} label="Pending Revenue" value={fmt(stats.pendingRevenue || 0)} sub="Awaiting payment" color="#ef4444" href="/dashboard/invoices" />
          <StatCard icon={BarChart3} label="Monthly Revenue" value={fmt(stats.monthlyRevenue || 0)} sub="This month" color="#0ea5e9" href="/dashboard/payments" />
          <StatCard icon={FileText} label="Monthly Payroll" value={fmt(stats.payrollStats?.monthlyPayroll || 0)} sub={`${stats.payrollStats?.totalPaid || 0} paid payslips`} color="#8b5cf6" href="/dashboard/payslips" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        {(
          <Card className="bg-slate-950/[0.02] dark:bg-card/20 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl shadow-xl">
            <CardHeader className="pb-4 border-b border-slate-950/[0.06] dark:border-white/5 px-6 pt-5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-rose-500" />
                <CardTitle className="text-sm font-bold text-foreground">Pending Payments</CardTitle>
              </div>
              <Link href="/dashboard/payments" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">View all</Link>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {pendingPayments.length === 0 ? (
                <EmptyState icon={CreditCard} message="No pending payments." />
              ) : pendingPayments.map((p: any) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5 bg-slate-950/[0.01] dark:bg-white/[0.01] flex justify-between items-center">
                  <div>
                    <p className="font-bold text-sm text-foreground">INV-{p.invoice?.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">{p.client?.client?.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-rose-600 font-mono">₹{p.amount?.toLocaleString('en-IN')}</p>
                    <Badge variant="outline" className="text-[10px] mt-1 bg-rose-500/10 text-rose-500 border-rose-500/20 uppercase">Pending</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
        </div>
      </div>
    )
  }

  // ─── Member View ──────────────────────────────────────────
  if (user?.role === 'member') {
    const tasks = data?.recentTasks || []
    const myProjectsCount = stats.projectCount || 0
    const taskStats = stats.taskStats || {}

    return (
      <div className="space-y-6 max-w-7xl relative min-h-screen pb-12 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              Welcome back, {user?.full_name?.split(' ')[0]} <span className="animate-pulse">👋</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <StatCard icon={CheckSquare} label="My Tasks" value={taskStats.total || 0} sub={`${taskStats.todo || 0} todo`} color="#6366f1" href="/dashboard/tasks" />
          <StatCard icon={Activity} label="In Progress" value={taskStats.in_progress || 0} sub="Tasks being worked on" color="#f59e0b" href="/dashboard/tasks" />
          <StatCard icon={ShieldCheck} label="Completed" value={taskStats.done || 0} sub="Tasks finished" color="#10b981" href="/dashboard/tasks" />
          <StatCard icon={FolderKanban} label="My Projects" value={myProjectsCount} sub="Assigned to me" color="#8b5cf6" href="/dashboard/projects" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          <Card className="bg-slate-950/[0.02] dark:bg-card/20 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl shadow-xl">
            <CardHeader className="pb-4 border-b border-slate-950/[0.06] dark:border-white/5 px-6 pt-5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckSquare className="w-4 h-4 text-indigo-500" />
                <CardTitle className="text-sm font-bold text-foreground">Recent Tasks</CardTitle>
              </div>
              <Link href="/dashboard/tasks" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">View all</Link>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {tasks.length === 0 ? (
                <EmptyState icon={CheckSquare} message="No tasks assigned to you." />
              ) : tasks.map((t: any) => (
                <div key={t.id} className="p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5 bg-slate-950/[0.01] dark:bg-white/[0.01] flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-sm text-foreground">{t.title}</p>
                    <Badge variant="outline" className={`text-[10px] mt-1 uppercase ${
                      t.priority === 'high' ? 'bg-rose-500/10 text-rose-500 border-rose-500/20' : 
                      t.priority === 'medium' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                      'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>{t.priority}</Badge>
                  </div>
                  <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                    t.status === 'done' ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 
                    t.status === 'in_progress' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' : 
                    'bg-slate-500/10 text-slate-500 border border-slate-500/20'
                  }`}>
                    {t.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── HR View ──────────────────────────────────────────────
  if (user?.role === 'hr') {
    const hrStats = data?.stats || {}
    const recentPayslips = data?.recentPayslips || []

    return (
      <div className="space-y-6 max-w-7xl relative min-h-screen pb-12 animate-fade-in-up">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
              HR Operations <span className="animate-pulse">👋</span>
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-medium">
              {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
          <StatCard icon={Users} label="Active Employees" value={hrStats.activeEmployees || 0} sub="Currently employed" color="#6366f1" href="/dashboard/team" />
          <StatCard icon={Building2} label="Departments" value={hrStats.departments || 0} sub="Active departments" color="#f59e0b" href="/dashboard/team" />
          <StatCard icon={Receipt} label="Monthly Payroll" value={fmt(hrStats.payrollStats?.monthlyPayroll || 0)} sub="Total paid out" color="#10b981" href="/dashboard/payslips" />
          <StatCard icon={FileText} label="Draft Payslips" value={hrStats.payrollStats?.totalDraft || 0} sub="Pending finalization" color="#8b5cf6" href="/dashboard/payslips" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
          <Card className="bg-slate-950/[0.02] dark:bg-card/20 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl shadow-xl">
            <CardHeader className="pb-4 border-b border-slate-950/[0.06] dark:border-white/5 px-6 pt-5 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Receipt className="w-4 h-4 text-indigo-500" />
                <CardTitle className="text-sm font-bold text-foreground">Recent Payslips</CardTitle>
              </div>
              <Link href="/dashboard/payslips" className="text-xs font-semibold text-indigo-600 hover:text-indigo-500">View all</Link>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {recentPayslips.length === 0 ? (
                <EmptyState icon={Receipt} message="No payslips generated recently." />
              ) : recentPayslips.map((p: any) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5 bg-slate-950/[0.01] dark:bg-white/[0.01] flex justify-between items-center group">
                  <div>
                    <p className="font-bold text-sm text-foreground">{p.employee?.full_name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold font-mono">₹{p.net_salary?.toLocaleString('en-IN')}</p>
                    <Badge variant="outline" className={`text-[10px] mt-1 uppercase ${
                      p.status === 'paid' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                      'bg-slate-500/10 text-slate-500 border-slate-500/20'
                    }`}>{p.status}</Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ─── Admin / Manager View ────────────────────────
  const role = user?.role as string
  if (role === 'manager') {
    stats.totalRevenue = undefined
    stats.pendingRevenue = undefined
    stats.monthlyRevenue = undefined
  }
  return (
    <div className="space-y-6 max-w-7xl relative min-h-screen pb-12 animate-fade-in-up">
      {/* Background radial overlays */}
      <div className="absolute top-[-280px] left-[15%] w-[400px] h-[400px] bg-indigo-500/6 rounded-full blur-[110px] pointer-events-none z-0" />
      <div className="absolute top-[-150px] right-[8%] w-[350px] h-[350px] bg-cyan-500/5 rounded-full blur-[100px] pointer-events-none z-0" />

      {/* Top Welcome Panel */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 relative z-10 border border-slate-950/[0.06] dark:border-white/5 p-5 rounded-2xl bg-slate-950/[0.02] dark:bg-card/15 backdrop-blur-md">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] tracking-wider uppercase font-extrabold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
              <Activity className="w-2.5 h-2.5" /> Workspace Live
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, {user?.full_name?.split(' ')[0]} <span className="animate-pulse">✨</span>
          </h1>
          <p className="text-muted-foreground text-xs sm:text-sm mt-1 font-semibold flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400/70" />
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link href="/dashboard/ai">
            <Button size="sm" className="h-9 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all duration-300">
              <Sparkles className="w-3.5 h-3.5 text-white animate-spin-slow" />
              AI Proposal Generator
            </Button>
          </Link>
          <Link href="/dashboard/projects/new">
            <Button size="sm" className="h-9 px-4 rounded-xl bg-slate-950/[0.02] dark:bg-white/5 border border-slate-950/10 dark:border-white/10 hover:bg-slate-950/[0.05] dark:hover:bg-white/5 hover:border-slate-950/20 dark:hover:border-white/20 transition-all font-bold text-xs flex items-center gap-1.5">
              Create Project
            </Button>
          </Link>
        </div>
      </div>

      {/* Four Core Telemetry Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {user?.role !== 'manager' && (
          <StatCard icon={TrendingUp} label="Aggregated Revenue" value={fmt(stats.totalRevenue || 0)}
            sub={`${fmt(stats.monthlyRevenue || 0)} current month`} color="#10b981" href="/dashboard/analytics" />
        )}
        <StatCard icon={BarChart3} label="Active Workspaces" value={stats.projectStats?.active || 0}
          sub={`${stats.projectStats?.total || 0} absolute projects`} color="#6366f1" href="/dashboard/projects" />
        <StatCard icon={CheckSquare} label="Pending Tasks"
          value={(stats.taskStats?.todo || 0) + (stats.taskStats?.in_progress || 0)}
          sub={`${stats.taskStats?.done || 0} completed tasks`} color="#f59e0b" href="/dashboard/tasks" />
        <StatCard icon={Users} label="Client Roster" value={stats.totalClients || 0}
          sub={`${stats.totalUsers || 0} internal accounts`} color="#8b5cf6" href="/dashboard/clients" />
      </div>

      {/* Floating Pending Banner */}
      {user?.role !== 'manager' && (stats.pendingRevenue || 0) > 0 && (
        <div className="flex items-center justify-between p-4 rounded-2xl bg-amber-500/5 dark:bg-amber-500/8 border border-amber-500/15 relative z-10 shadow-lg backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 dark:bg-amber-500/25 flex items-center justify-center">
              <CreditCard className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0" />
            </div>
            <div>
              <p className="text-xs sm:text-sm font-bold text-amber-800 dark:text-amber-300">Pending Receivables</p>
              <p className="text-[10px] sm:text-xs text-amber-700/80 dark:text-amber-300/60 font-medium">Accumulated client invoices awaiting confirmation</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-base sm:text-lg font-extrabold text-amber-800 dark:text-amber-300 font-mono">{fmt(stats.pendingRevenue)}</p>
          </div>
        </div>
      )}

      {/* Analytics Visualization Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 relative z-10">

        {/* Project Status Gauge */}
        <Card className="bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <CardHeader className="pb-3 px-6 pt-5 border-b border-slate-950/[0.06] dark:border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">Workspace Metrics</CardTitle>
            <ShieldCheck className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
          </CardHeader>
          <CardContent className="p-6">
            {!hasPieData ? (
              <EmptyState icon={FolderKanban} message="No projects yet. Gauge will render on project creation." />
            ) : (
              <div className="space-y-4">
                <div className="relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height={170}>
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={4} dataKey="value">
                        {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 11 }} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute flex flex-col items-center justify-center">
                    <span className="text-2xl font-extrabold text-foreground font-mono">{stats.projectStats?.total || 0}</span>
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total</span>
                  </div>
                </div>
                <div className="flex flex-col gap-2 pt-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-950/[0.01] dark:bg-white/[0.01] border border-slate-950/[0.06] dark:border-white/5 hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.02] transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i % COLORS.length] }} />
                        <span className="text-muted-foreground font-semibold capitalize">{d.name} Workspaces</span>
                      </div>
                      <span className="font-extrabold text-foreground font-mono">{d.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Task Tracking console */}
        <Card className="bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl overflow-hidden shadow-xl lg:col-span-2">
          <CardHeader className="pb-3 px-6 pt-5 border-b border-slate-950/[0.06] dark:border-white/5 flex flex-row items-center justify-between">
            <CardTitle className="text-sm sm:text-base font-bold text-foreground">Internal Task Matrix</CardTitle>
            <CheckSquare className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          </CardHeader>
          <CardContent className="p-6">
            {!stats.taskStats?.total ? (
              <EmptyState icon={CheckSquare} message="No tasks assigned. Create deliverables in projects." />
            ) : (
              <div className="space-y-6">
                {[
                  { label: 'Unassigned & Backlog', value: stats.taskStats?.todo || 0, total: stats.taskStats?.total, color: 'linear-gradient(90deg, #64748b, #475569)' },
                  { label: 'Active Work In Progress', value: stats.taskStats?.in_progress || 0, total: stats.taskStats?.total, color: 'linear-gradient(90deg, #f59e0b, #d97706)' },
                  { label: 'Completed Deliverables', value: stats.taskStats?.done || 0, total: stats.taskStats?.total, color: 'linear-gradient(90deg, #10b981, #059669)' },
                ].map((item, idx) => (
                  <div key={idx} className="space-y-2">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-extrabold text-foreground font-mono">{item.value} <span className="text-muted-foreground font-normal">/ {item.total}</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-950/[0.05] dark:bg-white/5 overflow-hidden">
                      <div 
                        className="h-full rounded-full transition-all duration-700"
                        style={{ 
                           width: `${item.total ? (item.value / item.total) * 100 : 0}%`, 
                           background: item.color 
                        }} 
                      />
                    </div>
                  </div>
                ))}
                
                <div className="pt-4 border-t border-slate-950/[0.06] dark:border-white/5 grid grid-cols-3 gap-2 text-center bg-slate-950/[0.01] dark:bg-white/[0.01] p-3 rounded-xl">
                  <div>
                    <p className="text-xl sm:text-2xl font-extrabold text-slate-600 dark:text-slate-400 font-mono">{stats.taskStats?.todo || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Backlog</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">{stats.taskStats?.in_progress || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">In Progress</p>
                  </div>
                  <div>
                    <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">{stats.taskStats?.done || 0}</p>
                    <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">Resolved</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bottom Layout - Projects + Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 relative z-10">
        
        {/* Projects Stream */}
        <Card className="bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-5 border-b border-slate-950/[0.06] dark:border-white/5">
            <div className="flex items-center gap-2">
              <FolderKanban className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
              <CardTitle className="text-sm sm:text-base font-bold text-foreground">Recent Projects</CardTitle>
            </div>
            <Link href="/dashboard/projects" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors flex items-center gap-1">
              View all <ArrowRight className="w-3 h-3" />
            </Link>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {recentProjects.length === 0 ? (
              <EmptyState icon={FolderKanban} message="No projects recorded yet. Create a workspace to start." />
            ) : recentProjects.map((p: any) => (
              <div key={p.id} className="p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5 bg-slate-950/[0.01] dark:bg-white/[0.01] hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.02] hover:border-slate-950/15 dark:hover:border-white/10 transition-all duration-300 group">
                <Link href={`/dashboard/projects/${p.id}`} className="block space-y-3">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-bold text-foreground group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors truncate">{p.name}</p>
                    <span className={`text-[10px] font-extrabold capitalize px-2.5 py-0.5 rounded-full border ${STATUS_COLOR[p.status] || 'text-gray-500 dark:text-gray-400 bg-slate-500/10 dark:bg-white/5 border-slate-200 dark:border-white/5'}`}>
                      {p.status?.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-muted-foreground font-semibold">
                    {p.client?.name ? (
                      <span className="truncate flex items-center gap-1">
                        <Users className="w-3.5 h-3.5 text-indigo-500/70 dark:text-indigo-400/70" /> {p.client.name}
                      </span>
                    ) : (
                      <span className="opacity-0">Placeholder</span>
                    )}
                    <span className="font-mono text-[11px] text-foreground">{p.progress || 0}%</span>
                  </div>
                  <div className="h-1 rounded-full bg-slate-950/[0.05] dark:bg-white/5 overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-indigo-500 to-cyan-500 transition-all duration-500" style={{ width: `${p.progress || 0}%` }} />
                  </div>
                </Link>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Financial Flow */}
        {user?.role !== 'manager' && (
          <Card className="bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl overflow-hidden shadow-xl">
            <CardHeader className="flex flex-row items-center justify-between pb-3 px-6 pt-5 border-b border-slate-950/[0.06] dark:border-white/5">
              <div className="flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                <CardTitle className="text-sm sm:text-base font-bold text-foreground">Pending Payments</CardTitle>
              </div>
              <Link href="/dashboard/payments" className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 dark:hover:text-indigo-300 transition-colors flex items-center gap-1">
                View all <ArrowRight className="w-3 h-3" />
              </Link>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              {pendingPayments.length === 0 ? (
                <EmptyState icon={CreditCard} message="No pending transactions recorded." />
              ) : pendingPayments.map((p: any) => (
                <div key={p.id} className="p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5 bg-slate-950/[0.01] dark:bg-white/[0.01] hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.02] hover:border-slate-950/15 dark:hover:border-white/10 transition-all duration-300 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground truncate">{p.invoice?.invoice_number || 'Transaction Pending'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize font-medium flex items-center gap-1">
                      <Zap className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      {p.payment_method?.replace('_', ' ')}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0 flex items-center gap-3">
                    <div>
                      <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">₹{parseFloat(p.amount).toLocaleString('en-IN')}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5 font-medium">Awaiting check</p>
                    </div>
                    <span className="text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-full">
                      Awaiting
                    </span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
