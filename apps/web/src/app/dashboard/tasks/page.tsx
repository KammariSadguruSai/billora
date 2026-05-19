'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { tasksApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { CheckSquare, Clock, AlertCircle, Eye, Filter, Search, Plus, Calendar } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Progress } from '@/components/ui/progress'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import Link from 'next/link'

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  todo:        { label: 'To Do',       color: 'bg-gray-500/20 text-gray-400',   icon: Clock },
  in_progress: { label: 'In Progress', color: 'bg-yellow-500/20 text-yellow-400', icon: AlertCircle },
  review:      { label: 'Review',      color: 'bg-purple-500/20 text-purple-400', icon: Eye },
  done:        { label: 'Done',        color: 'bg-green-500/20 text-green-400',  icon: CheckSquare },
  blocked:     { label: 'Blocked',     color: 'bg-red-500/20 text-red-400',     icon: AlertCircle },
}
const PRIORITY_COLOR: Record<string, string> = {
  urgent: 'text-red-400', high: 'text-orange-400', medium: 'text-yellow-400', low: 'text-gray-400'
}

export default function TasksPage() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['my-tasks', statusFilter],
    queryFn: () => tasksApi.list({
      assigned_to: user?.role === 'member' ? user.id : undefined,
      status: statusFilter || undefined,
      limit: 100
    }) as any,
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, status }: any) => tasksApi.update(id, { status }) as any,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-tasks'] }); toast.success('Task updated') },
  })

  const tasks = (data?.data || []).filter((t: any) =>
    !search || t.title?.toLowerCase().includes(search.toLowerCase())
  )

  const grouped = tasks.reduce((acc: any, t: any) => {
    const s = t.status || 'todo'
    if (!acc[s]) acc[s] = []
    acc[s].push(t)
    return acc
  }, {})

  const total = tasks.length
  const done = tasks.filter((t: any) => t.status === 'done').length
  const completionRate = total > 0 ? Math.round((done / total) * 100) : 0

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">My Tasks</h1>
          <p className="text-gray-400 text-sm mt-1">{done} of {total} completed · {completionRate}% done</p>
        </div>
      </div>

      {/* Completion bar */}
      <div className="glass-card p-4 rounded-xl border border-white/10">
        <div className="flex items-center justify-between mb-2 text-sm">
          <span className="text-gray-400">Overall Completion</span>
          <span className="font-semibold text-indigo-400">{completionRate}%</span>
        </div>
        <Progress value={completionRate} className="h-2" />
      </div>

      {/* Filters */}
      <div className="flex gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input placeholder="Search tasks..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200 min-w-[140px]">
          <option value="">All Status</option>
          {Object.entries(STATUS_CONFIG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
        </select>
      </div>

      {/* Quick status toggles */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([status, cfg]) => {
          const count = (grouped[status] || []).length
          return (
            <button key={status} onClick={() => setStatusFilter(statusFilter === status ? '' : status)}
              className={`p-3 rounded-xl border text-left transition-all ${statusFilter === status ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 glass-card hover:border-white/20'}`}>
              <cfg.icon className={`w-4 h-4 mb-1.5 ${cfg.color.split(' ')[1]}`} />
              <div className="text-lg font-bold">{count}</div>
              <div className="text-xs text-gray-400">{cfg.label}</div>
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(5)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : tasks.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <CheckSquare className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No tasks found</p>
          <p className="text-sm mt-1">Tasks assigned to you will appear here</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((task: any, i: number) => {
            const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo
            return (
              <motion.div key={task.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                className="glass-card border border-white/10 rounded-xl p-4 flex items-start gap-4 group hover:border-indigo-500/30 transition-all">
                {/* Status toggle */}
                <button onClick={() => updateMutation.mutate({ id: task.id, status: task.status === 'done' ? 'todo' : 'done' })}
                  className={`w-5 h-5 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-500 hover:border-indigo-400'}`}>
                  {task.status === 'done' && <svg className="w-3 h-3 m-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
                </button>

                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    <p className={`text-sm font-medium group-hover:text-indigo-300 transition-colors ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>
                      {task.title}
                    </p>
                  </Link>
                  {task.description && <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{task.description}</p>}
                  <div className="flex items-center gap-3 mt-2 flex-wrap">
                    <Badge className={`text-[10px] py-0 ${cfg.color}`}>{cfg.label}</Badge>
                    <span className={`text-xs font-medium ${PRIORITY_COLOR[task.priority] || ''}`}>{task.priority}</span>
                    {task.due_date && (
                      <span className={`text-xs flex items-center gap-1 ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-gray-500'}`}>
                        <Calendar className="w-3 h-3" />
                        {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </span>
                    )}
                    {task.logged_hours > 0 && <span className="text-xs text-gray-500">{task.logged_hours}h logged</span>}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {task.assigned && (
                    <Avatar className="w-7 h-7">
                      <AvatarImage src={task.assigned.avatar_url} />
                      <AvatarFallback className="text-[10px] bg-indigo-500/20">{task.assigned.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                  )}
                  <Link href={`/dashboard/tasks/${task.id}`}>
                    <button className="text-gray-500 hover:text-indigo-400 transition-colors opacity-0 group-hover:opacity-100">
                      <Eye className="w-4 h-4" />
                    </button>
                  </Link>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
