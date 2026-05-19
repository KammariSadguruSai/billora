'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { projectsApi, tasksApi } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, CheckSquare, Users, Calendar, Settings, Kanban, List, Clock, TrendingUp, MessageCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useAuthStore } from '@/lib/store'

const STATUS_COLORS: Record<string, string> = {
  planning: 'bg-yellow-500/20 text-yellow-400',
  active: 'bg-green-500/20 text-green-400',
  on_hold: 'bg-orange-500/20 text-orange-400',
  completed: 'bg-indigo-500/20 text-indigo-400',
  cancelled: 'bg-red-500/20 text-red-400',
}

function ApproveProjectDialog({ project, onSuccess }: { project: any, onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const [budget, setBudget] = useState(project.budget || '')
  const qc = useQueryClient()

  const { mutate, isPending } = useMutation({
    mutationFn: () => projectsApi.update(project.id, { status: 'active', budget: parseFloat(budget) }) as any,
    onSuccess: () => {
      toast.success('Project approved and activated!')
      qc.invalidateQueries({ queryKey: ['project', project.id] })
      qc.invalidateQueries({ queryKey: ['projects'] })
      setOpen(false)
      onSuccess()
    },
    onError: () => toast.error('Failed to approve project')
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold gap-2 shadow-lg shadow-green-500/20">
          <CheckSquare className="w-4 h-4" /> Approve & Activate
        </Button>
      </DialogTrigger>
      <DialogContent className="glass border-white/10 max-w-sm">
        <DialogHeader><DialogTitle>Approve Project</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Approved Budget (₹)</label>
            <Input type="number" placeholder="e.g. 50000" value={budget} onChange={(e) => setBudget(e.target.value)} className="bg-white/5 border-white/10" />
          </div>
          <Button disabled={isPending} onClick={() => mutate()} className="w-full gradient-brand border-0 text-white">
            {isPending ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useAuthStore()

  const { data: project, isLoading } = useQuery({
    queryKey: ['project', id],
    queryFn: () => projectsApi.get(id) as any,
  })

  const { data: stats } = useQuery({
    queryKey: ['project-stats', id],
    queryFn: () => projectsApi.stats(id) as any,
  })

  const { data: tasksData } = useQuery({
    queryKey: ['project-tasks', id],
    queryFn: () => tasksApi.list({ project_id: id, limit: 50 }) as any,
  })

  if (isLoading) return (
    <div className="space-y-6 max-w-5xl">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-40 rounded-2xl" />
      <Skeleton className="h-80 rounded-2xl" />
    </div>
  )

  if (!project) return <div className="text-center py-20 text-gray-500">Project not found</div>

  const tasks = tasksData?.data || []
  const members = project.project_members || []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      {/* Header */}
      <div className="glass-card border border-white/10 rounded-2xl p-6">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center" style={{ background: project.color + '20' }}>
              <BarChart3 className="w-7 h-7" style={{ color: project.color || '#6366f1' }} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge className={`text-xs capitalize ${STATUS_COLORS[project.status] || ''}`}>{project.status?.replace('_', ' ')}</Badge>
                <Badge variant="outline" className="text-xs border-white/10 capitalize">{project.priority}</Badge>
              </div>
              <p className="text-gray-400 text-sm mt-1 max-w-lg">{project.description}</p>
              {project.client && <p className="text-xs text-gray-500 mt-1">Client: <span className="text-gray-300">{project.client.name}</span></p>}
            </div>
          </div>
          <div className="flex flex-col sm:flex-row items-center gap-2 w-full sm:w-auto">
            {['admin', 'manager'].includes(user?.role || '') && project.status === 'planning' && (
              <ApproveProjectDialog project={project} onSuccess={() => {}} />
            )}
            {['admin', 'manager'].includes(user?.role || '') && project.client && (
              <Button onClick={() => {
                const msg = encodeURIComponent(`Hi ${project.client.name}, quick update on "${project.name}": The project is currently ${project.progress || 0}% complete and is marked as ${project.status?.replace('_', ' ')}.`);
                window.open(`https://wa.me/?text=${msg}`, '_blank');
              }} variant="outline" className="w-full sm:w-auto border-green-500/30 text-green-600 dark:text-green-500 hover:bg-green-500/10 gap-1.5 font-medium">
                <MessageCircle className="w-4 h-4" /> Notify Client
              </Button>
            )}
            <Link href={`/dashboard/projects/${id}/kanban`} className="w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white border-0 gap-2"><Kanban className="w-4 h-4" /> Open Kanban</Button>
            </Link>
          </div>
        </div>

        {/* Progress */}
        <div className="mt-5">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-400">Progress</span>
            <span className="font-semibold text-indigo-400">{project.progress || 0}%</span>
          </div>
          <Progress value={project.progress || 0} className="h-2" />
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-5">
          {[
            { icon: CheckSquare, label: 'Tasks', value: stats?.tasks?.total || 0, sub: `${stats?.tasks?.done || 0} done`, color: '#6366f1' },
            { icon: Clock, label: 'Hours Logged', value: `${stats?.totalHours?.toFixed(1) || 0}h`, color: '#10b981' },
            { icon: TrendingUp, label: 'Billed', value: `₹${((stats?.totalBilled || 0)/1000).toFixed(1)}K`, color: '#f59e0b' },
            { icon: Users, label: 'Members', value: members.length, color: '#8b5cf6' },
          ].map((s, i) => (
            <div key={i} className="bg-white/3 border border-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span className="text-xs text-gray-400">{s.label}</span>
              </div>
              <div className="text-lg font-bold">{s.value}</div>
              {s.sub && <div className="text-xs text-gray-500">{s.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList className="bg-white/5 border border-white/10">
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({(project.milestones || []).length})</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-3 mt-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-gray-500"><CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No tasks yet</p><Link href={`/dashboard/projects/${id}/kanban`}><Button size="sm" variant="outline" className="mt-3">Open Kanban</Button></Link></div>
          ) : tasks.map((task: any, i: number) => (
            <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
              <Link href={`/dashboard/tasks/${task.id}`}>
                <div className="glass-card border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-all">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-green-400' : task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-gray-500' : ''}`}>{task.title}</p>
                    <p className="text-xs text-gray-400 capitalize">{task.status?.replace('_', ' ')} · {task.priority} priority</p>
                  </div>
                  {task.assigned && <Avatar className="w-7 h-7"><AvatarFallback className="text-[10px] bg-indigo-500/20">{task.assigned.full_name?.charAt(0)}</AvatarFallback></Avatar>}
                  {task.due_date && <span className="text-xs text-gray-500 hidden sm:block">{new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </Link>
            </motion.div>
          ))}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((m: any) => (
              <div key={m.user_id} className="glass-card border border-white/10 rounded-xl p-4 flex items-center gap-3">
                <Avatar className="w-10 h-10"><AvatarImage src={m.profiles?.avatar_url} /><AvatarFallback className="bg-indigo-500/20 text-indigo-300">{m.profiles?.full_name?.charAt(0)}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-medium">{m.profiles?.full_name}</p>
                  <p className="text-xs text-gray-400">{m.profiles?.email}</p>
                </div>
                <Badge variant="outline" className="ml-auto border-white/10 text-xs capitalize">{m.role}</Badge>
              </div>
            ))}
            {project.manager && (
              <div className="glass-card border border-indigo-500/30 bg-indigo-500/5 rounded-xl p-4 flex items-center gap-3">
                <Avatar className="w-10 h-10"><AvatarImage src={project.manager.avatar_url} /><AvatarFallback className="bg-indigo-500/20 text-indigo-300">{project.manager.full_name?.charAt(0)}</AvatarFallback></Avatar>
                <div><p className="text-sm font-medium">{project.manager.full_name}</p><p className="text-xs text-gray-400">{project.manager.email}</p></div>
                <Badge className="ml-auto bg-indigo-500/20 text-indigo-400 text-xs">Manager</Badge>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="mt-4 space-y-3">
          {(project.milestones || []).length === 0 ? (
            <div className="text-center py-12 text-gray-500"><Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No milestones yet</p></div>
          ) : (project.milestones || []).map((m: any) => (
            <div key={m.id} className="glass-card border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${m.status === 'completed' ? 'bg-green-400' : m.status === 'in_progress' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  {m.due_date && <p className="text-xs text-gray-400">Due: {new Date(m.due_date).toLocaleDateString('en-IN')}</p>}
                </div>
              </div>
              <div className="text-right">
                {m.amount && <p className="text-sm font-semibold text-green-400">₹{parseFloat(m.amount).toLocaleString()}</p>}
                <Badge variant="outline" className="text-xs border-white/10 capitalize">{m.status}</Badge>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          <div className="glass-card border border-white/10 rounded-2xl p-6 space-y-4">
            {[
              { label: 'Start Date', value: project.start_date || '—' },
              { label: 'End Date', value: project.end_date || '—' },
              { label: 'Budget', value: project.budget ? `₹${parseFloat(project.budget).toLocaleString()}` : '—' },
              { label: 'Client', value: project.client?.name || '—' },
              { label: 'Manager', value: project.manager?.full_name || '—' },
              { label: 'Team', value: project.team?.name || '—' },
              { label: 'Created', value: new Date(project.created_at).toLocaleDateString('en-IN') },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                <span className="text-sm text-gray-400">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
