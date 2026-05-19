'use client'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { dashboardApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import {
  TrendingUp, Users, FileText, CreditCard, CheckSquare,
  BarChart3, ArrowUpRight, Clock, FolderKanban, AlertCircle
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts'
import Link from 'next/link'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

const STATUS_COLOR: Record<string, string> = {
  active: 'text-green-600 dark:text-green-400 bg-green-500/10',
  completed: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10',
  planning: 'text-yellow-600 dark:text-yellow-400 bg-yellow-500/10',
  on_hold: 'text-orange-600 dark:text-orange-400 bg-orange-500/10',
  cancelled: 'text-red-600 dark:text-red-400 bg-red-500/10',
}

function StatCard({ icon: Icon, label, value, sub, color, href }: any) {
  return (
    <motion.div whileHover={{ y: -2 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Link href={href || '#'}>
        <Card className="glass-card border-border cursor-pointer hover:border-indigo-500/40 transition-all">
          <CardContent className="p-4 sm:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}20` }}>
                <Icon className="w-4 h-4 sm:w-5 sm:h-5" style={{ color }} />
              </div>
              <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground" />
            </div>
            <div className="text-xl sm:text-2xl font-bold mb-0.5">{value}</div>
            <div className="text-xs sm:text-sm text-muted-foreground">{label}</div>
            {sub && <div className="text-xs text-muted-foreground/70 mt-0.5">{sub}</div>}
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  )
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
      <Icon className="w-8 h-8 mb-2 opacity-30" />
      <p className="text-sm">{message}</p>
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
    <div className="space-y-6 max-w-7xl">
      <div>
        <Skeleton className="h-8 w-40 mb-2" />
        <Skeleton className="h-4 w-56" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 sm:h-32 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Skeleton className="h-64 rounded-xl col-span-2" />
        <Skeleton className="h-64 rounded-xl" />
      </div>
    </div>
  )

  if (isError) return (
    <div className="max-w-7xl space-y-4">
      <div className="flex items-center gap-3 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
        <AlertCircle className="w-5 h-5 flex-shrink-0" />
        <p className="text-sm">Failed to load dashboard data. Please refresh the page.</p>
      </div>
    </div>
  )

  const stats = data?.stats || {}
  const recentProjects = data?.recentProjects || []
  const pendingPayments = data?.pendingPayments || []

  // Build real monthly revenue from available data (current month only from API)
  // Use projectStats for pie chart
  const pieData = [
    { name: 'Active', value: stats.projectStats?.active || 0 },
    { name: 'Planning', value: stats.projectStats?.planning || 0 },
    { name: 'Completed', value: stats.projectStats?.completed || 0 },
  ].filter(d => d.value > 0)

  const hasPieData = pieData.length > 0

  // ── Client view ──────────────────────────────────────────
  if (user?.role === 'client') {
    const clientProjects = data?.projects?.data || []
    const clientInvoices = data?.invoices?.data || []

    return (
      <div className="space-y-6 max-w-7xl">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">My Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <StatCard icon={FolderKanban} label="My Projects" value={data?.projects?.total || 0} color="#6366f1" href="/dashboard/projects" />
          <StatCard icon={FileText} label="Invoices" value={data?.invoices?.total || 0} color="#10b981" href="/dashboard/invoices" />
          <StatCard icon={CreditCard} label="Pending Dues" value={fmt(data?.invoices?.pending || 0)} color="#ef4444" href="/dashboard/payments" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          <Card className="glass-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold">My Projects</CardTitle>
              <Link href="/dashboard/projects" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientProjects.length === 0 ? (
                <EmptyState icon={FolderKanban} message="No projects yet" />
              ) : clientProjects.map((p: any) => (
                <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="flex items-center gap-3 group">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate group-hover:text-indigo-300 transition-colors">{p.name}</p>
                    <Progress value={p.progress || 0} className="h-1 mt-1" />
                  </div>
                  <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full ${STATUS_COLOR[p.status] || 'text-gray-400'}`}>
                    {p.status?.replace('_', ' ')}
                  </span>
                </Link>
              ))}
            </CardContent>
          </Card>

          <Card className="glass-card border-border">
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-sm sm:text-base font-semibold">My Invoices</CardTitle>
              <Link href="/dashboard/invoices" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
            </CardHeader>
            <CardContent className="space-y-3">
              {clientInvoices.length === 0 ? (
                <EmptyState icon={FileText} message="No invoices yet" />
              ) : clientInvoices.map((inv: any) => (
                <div key={inv.id} className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">₹{parseFloat(inv.total || 0).toLocaleString('en-IN')}</p>
                  </div>
                  <Badge className={`text-[10px] ${inv.status === 'paid' ? 'bg-green-500/15 text-green-700 dark:text-green-400' : 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400'}`}>
                    {inv.status}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // ── Admin / Manager view ──────────────────────────────────
  return (
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">Dashboard</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <StatCard icon={TrendingUp} label="Total Revenue" value={fmt(stats.totalRevenue || 0)}
          sub={`${fmt(stats.monthlyRevenue || 0)} this month`} color="#10b981" href="/dashboard/analytics" />
        <StatCard icon={BarChart3} label="Active Projects" value={stats.projectStats?.active || 0}
          sub={`${stats.projectStats?.total || 0} total`} color="#6366f1" href="/dashboard/projects" />
        <StatCard icon={CheckSquare} label="Open Tasks"
          value={(stats.taskStats?.todo || 0) + (stats.taskStats?.in_progress || 0)}
          sub={`${stats.taskStats?.done || 0} completed`} color="#f59e0b" href="/dashboard/tasks" />
        <StatCard icon={Users} label="Clients" value={stats.totalClients || 0}
          sub={`${stats.totalUsers || 0} team members`} color="#8b5cf6" href="/dashboard/clients" />
      </div>

      {/* Pending Revenue Banner */}
      {(stats.pendingRevenue || 0) > 0 && (
        <div className="flex items-center justify-between p-4 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
          <div className="flex items-center gap-3">
            <CreditCard className="w-4 h-4 text-yellow-600 dark:text-yellow-400 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium text-yellow-700 dark:text-yellow-300">Pending Revenue</p>
              <p className="text-xs text-yellow-600/70 dark:text-yellow-400/70">Outstanding payments from clients</p>
            </div>
          </div>
          <p className="text-lg font-bold text-yellow-700 dark:text-yellow-300">{fmt(stats.pendingRevenue)}</p>
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">

        {/* Project Status Pie */}
        <Card className="glass-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold">Project Status</CardTitle>
          </CardHeader>
          <CardContent>
            {!hasPieData ? (
              <EmptyState icon={FolderKanban} message="No projects yet" />
            ) : (
              <>
                <ResponsiveContainer width="100%" height={180}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={COLORS[i]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 8, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex flex-col gap-2 mt-2">
                  {pieData.map((d, i) => (
                    <div key={i} className="flex items-center justify-between text-xs sm:text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: COLORS[i] }} />
                        <span className="text-muted-foreground capitalize">{d.name}</span>
                      </div>
                      <span className="font-semibold">{d.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Task Stats */}
        <Card className="glass-card border-border lg:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm sm:text-base font-semibold">Task Overview</CardTitle>
          </CardHeader>
          <CardContent>
            {!stats.taskStats?.total ? (
              <EmptyState icon={CheckSquare} message="No tasks yet" />
            ) : (
              <div className="space-y-4">
                {[
                  { label: 'To Do', value: stats.taskStats?.todo || 0, total: stats.taskStats?.total, color: '#64748b' },
                  { label: 'In Progress', value: stats.taskStats?.in_progress || 0, total: stats.taskStats?.total, color: '#f59e0b' },
                  { label: 'Completed', value: stats.taskStats?.done || 0, total: stats.taskStats?.total, color: '#10b981' },
                ].map(item => (
                  <div key={item.label}>
                    <div className="flex justify-between text-xs sm:text-sm mb-1.5">
                      <span className="text-muted-foreground">{item.label}</span>
                      <span className="font-semibold">{item.value} <span className="text-muted-foreground font-normal">/ {item.total}</span></span>
                    </div>
                    <div className="h-2 rounded-full bg-white/5">
                      <div className="h-2 rounded-full transition-all duration-700"
                        style={{ width: `${item.total ? (item.value / item.total) * 100 : 0}%`, background: item.color }} />
                    </div>
                  </div>
                ))}
                <div className="pt-2 border-t border-border grid grid-cols-3 text-center">
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-yellow-600 dark:text-yellow-400">{stats.taskStats?.todo || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">To Do</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-orange-600 dark:text-orange-400">{stats.taskStats?.in_progress || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">In Progress</p>
                  </div>
                  <div>
                    <p className="text-lg sm:text-2xl font-bold text-green-600 dark:text-green-400">{stats.taskStats?.done || 0}</p>
                    <p className="text-[10px] sm:text-xs text-muted-foreground">Done</p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Projects + Pending Payments */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <Card className="glass-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm sm:text-base font-semibold">Recent Projects</CardTitle>
            <Link href="/dashboard/projects" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentProjects.length === 0 ? (
              <EmptyState icon={FolderKanban} message="No projects yet — create your first project!" />
            ) : recentProjects.map((p: any) => (
              <Link key={p.id} href={`/dashboard/projects/${p.id}`} className="flex items-center gap-3 group">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-4 h-4 text-indigo-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-sm font-medium truncate group-hover:text-indigo-300 transition-colors">{p.name}</p>
                    <span className={`text-[10px] font-semibold capitalize px-2 py-0.5 rounded-full flex-shrink-0 ${STATUS_COLOR[p.status] || 'text-gray-400'}`}>
                      {p.status?.replace('_', ' ')}
                    </span>
                  </div>
                  {p.client?.name && <p className="text-xs text-muted-foreground truncate">{p.client.name}</p>}
                  <Progress value={p.progress || 0} className="h-1 mt-1.5" />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="glass-card border-border">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-sm sm:text-base font-semibold">Pending Payments</CardTitle>
            <Link href="/dashboard/payments" className="text-xs text-indigo-400 hover:text-indigo-300">View all</Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {pendingPayments.length === 0 ? (
              <EmptyState icon={CreditCard} message="No pending payments 🎉" />
            ) : pendingPayments.map((p: any) => (
              <div key={p.id} className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{p.invoice?.invoice_number || 'Payment'}</p>
                  <p className="text-xs text-muted-foreground capitalize">{p.payment_method?.replace('_', ' ')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-semibold text-green-600 dark:text-green-400">₹{parseFloat(p.amount).toLocaleString('en-IN')}</p>
                  <Badge className="text-[10px] bg-yellow-500/15 text-yellow-700 dark:text-yellow-400 border-0">Pending</Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
