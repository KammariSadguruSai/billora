'use client'
import { useQuery } from '@tanstack/react-query'
import { analyticsApi } from '@/lib/api'
import { BarChart, Bar, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { TrendingUp, TrendingDown, BarChart3 } from 'lucide-react'
import { Skeleton } from '@/components/ui/skeleton'

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6']

function MetricCard({ label, value, trend }: any) {
  return (
    <Card className="bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/10 shadow-xl rounded-2xl">
      <CardContent className="p-5">
        <p className="text-xs sm:text-sm font-bold text-muted-foreground mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <span className="text-xl sm:text-2xl font-extrabold text-foreground font-mono">{value}</span>
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-xs sm:text-sm font-extrabold ${trend >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
              {Math.abs(trend)}%
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export default function AnalyticsPage() {
  const { data: revenue, isLoading: revLoading } = useQuery({ queryKey: ['analytics-revenue'], queryFn: () => analyticsApi.revenue() as any })
  const { data: projects, isLoading: projLoading } = useQuery({ queryKey: ['analytics-projects'], queryFn: () => analyticsApi.projects() as any })
  const { data: team, isLoading: teamLoading } = useQuery({ queryKey: ['analytics-team'], queryFn: () => analyticsApi.team() as any })

  const isLoading = revLoading || projLoading || teamLoading
  const monthly = revenue?.monthly || []
  const totalRevenue = revenue?.total || 0
  const statusData = projects?.statusGroups ? Object.entries(projects.statusGroups).map(([k, v]) => ({ name: k.charAt(0).toUpperCase() + k.slice(1), value: v as number })) : []

  return (
    <div className="space-y-6 max-w-7xl px-4 sm:px-0">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-1 font-semibold">Business insights and performance metrics</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl bg-slate-950/[0.05] dark:bg-white/5" />)}</div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Total Revenue" value={`₹${(totalRevenue/1000).toFixed(0)}K`} trend={12} />
          <MetricCard label="Avg Completion" value={`${Math.round(projects?.avgProgress || 0)}%`} trend={5} />
          <MetricCard label="Task Completion" value={`${Math.round(projects?.taskCompletion || 0)}%`} trend={8} />
          <MetricCard label="Team Hours" value={`${team?.teamData?.reduce((s: number, t: any) => s + t.totalHours, 0)?.toFixed(0) || 0}h`} trend={3} />
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Chart */}
        <Card className="bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/10 shadow-xl rounded-2xl lg:col-span-2">
          <CardHeader className="pb-3 border-b border-slate-950/[0.06] dark:border-white/5"><CardTitle className="text-sm sm:text-base font-bold text-foreground">Monthly Revenue ({revenue?.year})</CardTitle></CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,0,0,0.04)" className="dark:stroke-white/[0.04]" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 11, fontWeight: 600 }} tickFormatter={v => `₹${v/1000}K`} />
                <Tooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Pie */}
        <Card className="bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/10 shadow-xl rounded-2xl">
          <CardHeader className="pb-3 border-b border-slate-950/[0.06] dark:border-white/5"><CardTitle className="text-sm sm:text-base font-bold text-foreground">Project Status</CardTitle></CardHeader>
          <CardContent className="pt-6">
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 12, boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }} labelStyle={{ color: 'hsl(var(--foreground))', fontWeight: 600 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Productivity */}
      <Card className="bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/10 shadow-xl rounded-2xl">
        <CardHeader className="pb-3 border-b border-slate-950/[0.06] dark:border-white/5"><CardTitle className="text-sm sm:text-base font-bold text-foreground">Team Productivity (Hours Logged)</CardTitle></CardHeader>
        <CardContent className="pt-6">
          {isLoading ? <Skeleton className="h-48 bg-slate-950/[0.05] dark:bg-white/5" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(team?.teamData || []).slice(0, 6).map((member: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-950/[0.06] dark:border-white/5 bg-slate-950/[0.01] dark:bg-white/[0.01] hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.02] transition-colors">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 font-bold text-sm">
                    {member.user?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-bold text-foreground">{member.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-muted-foreground font-semibold mt-0.5">{member.totalHours.toFixed(1)}h logged</p>
                  </div>
                  <BarChart3 className="w-4 h-4 text-indigo-500 dark:text-indigo-400" />
                </div>
              ))}
              {(!team?.teamData?.length) && <p className="text-muted-foreground/60 text-sm font-semibold">No time logs yet</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
