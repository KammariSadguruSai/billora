'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { tasksApi, filesApi } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Clock, Calendar, User, Flag, MessageSquare, Paperclip, Send, Timer, CheckSquare } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Progress } from '@/components/ui/progress'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400', high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400', low: 'bg-gray-500/20 text-gray-400',
}
const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-gray-500/20 text-gray-400', in_progress: 'bg-yellow-500/20 text-yellow-400',
  review: 'bg-purple-500/20 text-purple-400', done: 'bg-green-500/20 text-green-400', blocked: 'bg-red-500/20 text-red-400',
}

export default function TaskDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [comment, setComment] = useState('')
  const { register: regTime, handleSubmit: handleTime, reset: resetTime } = useForm()

  const { data: task, isLoading } = useQuery({
    queryKey: ['task', id],
    queryFn: () => tasksApi.get(id) as any,
  })

  const updateMutation = useMutation({
    mutationFn: (data: any) => tasksApi.update(id, data) as any,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', id] }); toast.success('Task updated') },
  })

  const commentMutation = useMutation({
    mutationFn: (content: string) => tasksApi.addComment(id, { content }) as any,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', id] }); setComment('') },
    onError: () => toast.error('Failed to add comment'),
  })

  const timeMutation = useMutation({
    mutationFn: (data: any) => tasksApi.logTime(id, { ...data, project_id: task?.project_id }) as any,
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['task', id] }); resetTime(); toast.success('Time logged!') },
    onError: () => toast.error('Failed to log time'),
  })

  if (isLoading) return (
    <div className="max-w-4xl space-y-6">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-56 rounded-2xl" />
      <Skeleton className="h-64 rounded-2xl" />
    </div>
  )

  if (!task) return <div className="text-center py-20 text-gray-500">Task not found</div>

  const completionPct = task.estimated_hours > 0 ? Math.min(100, Math.round((task.logged_hours / task.estimated_hours) * 100)) : 0

  return (
    <div className="max-w-4xl space-y-6">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main content */}
        <div className="lg:col-span-2 space-y-5">
          {/* Task header */}
          <div className="glass-card border border-white/10 rounded-2xl p-6">
            <div className="flex items-start gap-3 mb-4">
              <button 
                onClick={() => user?.role !== 'client' && updateMutation.mutate({ status: task.status === 'done' ? 'todo' : 'done' })}
                disabled={user?.role === 'client'}
                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 mt-0.5 transition-all ${task.status === 'done' ? 'bg-green-500 border-green-500' : 'border-gray-500'} ${user?.role !== 'client' ? 'hover:border-indigo-400 cursor-pointer' : 'opacity-50 cursor-not-allowed'}`}>
                {task.status === 'done' && <svg className="w-3.5 h-3.5 m-auto text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>}
              </button>
              <h1 className={`text-xl font-bold flex-1 ${task.status === 'done' ? 'line-through text-gray-400' : ''}`}>{task.title}</h1>
            </div>
            {task.description && <p className="text-gray-300 text-sm leading-relaxed mb-4">{task.description}</p>}
            <div className="flex flex-wrap gap-2">
              <Badge className={`text-xs ${STATUS_COLORS[task.status] || ''}`}>{task.status?.replace('_', ' ')}</Badge>
              <Badge className={`text-xs ${PRIORITY_COLORS[task.priority] || ''}`}>{task.priority} priority</Badge>
              {task.milestone && <Badge variant="outline" className="text-xs border-white/10">📍 {task.milestone.name}</Badge>}
            </div>
          </div>

          {/* Time tracking */}
          {task.estimated_hours > 0 && user?.role !== 'client' && (
            <div className="glass-card border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-3 flex items-center gap-2"><Timer className="w-4 h-4 text-indigo-400" /> Time Tracking</h3>
              <div className="flex justify-between text-xs text-gray-400 mb-2">
                <span>{task.logged_hours || 0}h logged</span>
                <span>{task.estimated_hours}h estimated ({completionPct}%)</span>
              </div>
              <Progress value={completionPct} className="h-2 mb-4" />
              <form onSubmit={handleTime(d => timeMutation.mutate(d))} className="flex gap-2">
                <Input {...regTime('hours', { required: true })} type="number" step="0.5" min="0.5" placeholder="Hours" className="bg-white/5 border-white/10 w-24" />
                <Input {...regTime('description')} placeholder="What did you work on?" className="bg-white/5 border-white/10 flex-1" />
                <Button type="submit" disabled={timeMutation.isPending} size="sm" className="gradient-brand border-0 text-white">Log</Button>
              </form>
            </div>
          )}

          {/* Comments */}
          <div className="glass-card border border-white/10 rounded-2xl p-5">
            <h3 className="text-sm font-semibold mb-4 flex items-center gap-2"><MessageSquare className="w-4 h-4 text-indigo-400" /> Comments ({(task.comments || []).length})</h3>
            <div className="space-y-4 mb-4">
              {(task.comments || []).map((c: any, i: number) => (
                <motion.div key={c.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.05 }} className="flex gap-3">
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarImage src={c.user?.avatar_url} />
                    <AvatarFallback className="text-xs bg-indigo-500/20">{c.user?.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium">{c.user?.full_name}</span>
                      <span className="text-[10px] text-gray-500">{formatDistanceToNow(new Date(c.created_at), { addSuffix: true })}</span>
                    </div>
                    <p className="text-sm text-gray-300 bg-white/3 border border-white/5 rounded-xl px-4 py-2.5">{c.content}</p>
                  </div>
                </motion.div>
              ))}
              {!(task.comments?.length) && <p className="text-sm text-gray-500 text-center py-4">No comments yet. Be the first!</p>}
            </div>
            {user?.role !== 'client' && (
              <div className="flex gap-2">
                <Avatar className="w-8 h-8 flex-shrink-0"><AvatarFallback className="text-xs bg-indigo-500/20">{user?.full_name?.charAt(0)}</AvatarFallback></Avatar>
                <div className="flex-1 flex gap-2">
                  <Input value={comment} onChange={e => setComment(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && comment.trim() && (e.preventDefault(), commentMutation.mutate(comment))}
                    placeholder="Add a comment..." className="bg-white/5 border-white/10 flex-1" />
                  <Button onClick={() => comment.trim() && commentMutation.mutate(comment)} disabled={!comment.trim() || commentMutation.isPending} size="sm" className="gradient-brand border-0 text-white px-3"><Send className="w-4 h-4" /></Button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar details */}
        <div className="space-y-4">
          <div className="glass-card border border-white/10 rounded-2xl p-5 space-y-4">
            <h3 className="text-sm font-semibold">Task Details</h3>

            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1"><User className="w-3 h-3" /> Assigned To</p>
                {task.assigned ? (
                  <div className="flex items-center gap-2">
                    <Avatar className="w-7 h-7"><AvatarImage src={task.assigned.avatar_url} /><AvatarFallback className="text-xs bg-indigo-500/20">{task.assigned.full_name?.charAt(0)}</AvatarFallback></Avatar>
                    <span className="text-sm">{task.assigned.full_name}</span>
                  </div>
                ) : <span className="text-sm text-gray-500">Unassigned</span>}
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Flag className="w-3 h-3" /> Status</p>
                {user?.role === 'client' ? (
                  <Badge variant="outline" className={`capitalize border-white/10 ${STATUS_COLORS[task.status] || ''}`}>{task.status?.replace('_', ' ')}</Badge>
                ) : (
                  <select value={task.status} onChange={e => updateMutation.mutate({ status: e.target.value })}
                    className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200">
                    {['todo', 'in_progress', 'review', 'done', 'blocked'].map(s => <option key={s} value={s}>{s.replace('_', ' ')}</option>)}
                  </select>
                )}
              </div>

              <div>
                <p className="text-xs text-gray-400 mb-1.5 flex items-center gap-1"><Flag className="w-3 h-3" /> Priority</p>
                {user?.role === 'client' ? (
                  <Badge variant="outline" className={`capitalize border-white/10 ${PRIORITY_COLORS[task.priority] || ''}`}>{task.priority}</Badge>
                ) : (
                  <select value={task.priority} onChange={e => updateMutation.mutate({ priority: e.target.value })}
                    className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200">
                    {['low', 'medium', 'high', 'urgent'].map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                )}
              </div>

              {task.due_date && (
                <div>
                  <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Due Date</p>
                  <p className={`text-sm ${new Date(task.due_date) < new Date() && task.status !== 'done' ? 'text-red-400' : 'text-gray-300'}`}>
                    {new Date(task.due_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              )}

              {task.completed_at && (
                <div>
                  <p className="text-xs text-gray-400 mb-1">Completed</p>
                  <p className="text-sm text-green-400">{formatDistanceToNow(new Date(task.completed_at), { addSuffix: true })}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-gray-400 mb-1 flex items-center gap-1"><Clock className="w-3 h-3" /> Created</p>
                <p className="text-sm text-gray-300">{formatDistanceToNow(new Date(task.created_at), { addSuffix: true })}</p>
              </div>
            </div>
          </div>

          {/* Time logs */}
          {(task.time_logs || []).length > 0 && (
            <div className="glass-card border border-white/10 rounded-2xl p-5">
              <h3 className="text-sm font-semibold mb-3">Recent Time Logs</h3>
              <div className="space-y-2">
                {task.time_logs.slice(0, 5).map((log: any) => (
                  <div key={log.id} className="flex items-center justify-between text-xs">
                    <div>
                      <p className="text-gray-300">{log.user?.full_name}</p>
                      <p className="text-gray-500">{log.description || log.logged_date}</p>
                    </div>
                    <span className="font-semibold text-indigo-400">{log.hours}h</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
