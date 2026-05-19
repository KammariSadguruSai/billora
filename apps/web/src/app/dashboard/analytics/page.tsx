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
    <Card className="glass-card border-white/10">
      <CardContent className="p-5">
        <p className="text-sm text-gray-400 mb-1">{label}</p>
        <div className="flex items-end justify-between">
          <span className="text-2xl font-bold">{value}</span>
          {trend !== undefined && (
            <span className={`flex items-center gap-1 text-sm ${trend >= 0 ? 'text-green-400' : 'text-red-400'}`}>
              {trend >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
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
    <div className="space-y-6 max-w-7xl">
      <div>
        <h1 className="text-2xl font-bold">Analytics</h1>
        <p className="text-gray-400 text-sm mt-1">Business insights and performance metrics</p>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{[...Array(4)].map((_, i) => <Skeleton key={i} className="h-24 rounded-xl" />)}</div>
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
        <Card className="glass-card border-white/10 lg:col-span-2">
          <CardHeader><CardTitle className="text-base">Monthly Revenue ({revenue?.year})</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={monthly}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis dataKey="month" stroke="#64748b" tick={{ fontSize: 12 }} />
                <YAxis stroke="#64748b" tick={{ fontSize: 12 }} tickFormatter={v => `₹${v/1000}K`} />
                <Tooltip formatter={(v: any) => [`₹${v.toLocaleString()}`, 'Revenue']} contentStyle={{ background: '#1e2139', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                <Bar dataKey="revenue" fill="#6366f1" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Project Status Pie */}
        <Card className="glass-card border-white/10">
          <CardHeader><CardTitle className="text-base">Project Status</CardTitle></CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={statusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, value }) => `${name}: ${value}`} labelLine={false}>
                  {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ background: '#1e2139', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Team Productivity */}
      <Card className="glass-card border-white/10">
        <CardHeader><CardTitle className="text-base">Team Productivity (Hours Logged)</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? <Skeleton className="h-48" /> : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(team?.teamData || []).slice(0, 6).map((member: any, i: number) => (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/3 border border-white/5">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-300 font-semibold text-sm">
                    {member.user?.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{member.user?.full_name || 'Unknown'}</p>
                    <p className="text-xs text-gray-400">{member.totalHours.toFixed(1)}h logged</p>
                  </div>
                  <BarChart3 className="w-4 h-4 text-gray-500" />
                </div>
              ))}
              {(!team?.teamData?.length) && <p className="text-gray-500 text-sm">No time logs yet</p>}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
