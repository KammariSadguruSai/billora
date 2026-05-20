'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { projectsApi, tasksApi, usersApi } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, BarChart3, CheckSquare, Users, Calendar, Settings, Kanban, List, Clock, TrendingUp, MessageCircle, Plus, ChevronRight, FileCheck, ClipboardList, HelpCircle } from 'lucide-react'
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
      <DialogTrigger render={
        <Button className="w-full sm:w-auto bg-green-600 hover:bg-green-500 text-white font-bold gap-2 shadow-lg shadow-green-500/20" />
      }>
        <CheckSquare className="w-4 h-4" /> Approve & Activate
      </DialogTrigger>
      <DialogContent className="glass bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/10 max-w-sm">
        <DialogHeader><DialogTitle>Approve Project</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-medium text-slate-700 dark:text-gray-300 mb-1.5 block">Approved Budget (₹)</label>
            <Input type="number" placeholder="e.g. 50000" value={budget} onChange={(e) => setBudget(e.target.value)} className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground" />
          </div>
          <Button disabled={isPending} onClick={() => mutate()} className="w-full gradient-brand border-0 text-white">
            {isPending ? 'Approving...' : 'Confirm Approval'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function ManageMembersDialog({ project, onSuccess }: { project: any, onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  
  // Fetch active platform members
  const { data: membersList } = useQuery({
    queryKey: ['platform-members'],
    queryFn: () => usersApi.listMembers() as any,
    enabled: open
  })

  const [selectedMembers, setSelectedMembers] = useState<Record<string, { user_id: string; role: string }>>({})

  // Initialize selected members when modal opens or membersList changes
  useEffect(() => {
    if (open && project.project_members) {
      const initial: Record<string, { user_id: string; role: string }> = {}
      project.project_members.forEach((m: any) => {
        initial[m.user_id] = { user_id: m.user_id, role: m.role || 'member' }
      })
      setSelectedMembers(initial)
    }
  }, [open, project.project_members])

  const { mutate, isPending } = useMutation({
    mutationFn: (list: any[]) => projectsApi.updateMembers(project.id, list) as any,
    onSuccess: () => {
      toast.success('Project members updated!')
      qc.invalidateQueries({ queryKey: ['project', project.id] })
      setOpen(false)
      onSuccess()
    },
    onError: () => toast.error('Failed to update project members')
  })

  const toggleMember = (user: any) => {
    setSelectedMembers(prev => {
      const next = { ...prev }
      if (next[user.id]) {
        delete next[user.id]
      } else {
        next[user.id] = { user_id: user.id, role: 'member' }
      }
      return next
    })
  }

  const updateRole = (userId: string, role: string) => {
    setSelectedMembers(prev => ({
      ...prev,
      [userId]: { ...prev[userId], role }
    }))
  }

  const handleSave = () => {
    const list = Object.values(selectedMembers)
    mutate(list)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <Button size="sm" variant="outline" className="border-indigo-500/20 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-bold gap-2">
          <Users className="w-4 h-4" /> Manage Members
        </Button>
      }>
        <span className="flex items-center gap-2 cursor-pointer bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold transition-all shadow-md"><Users className="w-4 h-4" /> Manage Members</span>
      </DialogTrigger>
      <DialogContent className="glass bg-white dark:bg-card border border-slate-950/[0.06] dark:border-white/10 max-w-lg max-h-[80vh] overflow-y-auto shadow-2xl rounded-2xl">
        <DialogHeader><DialogTitle className="text-lg font-extrabold">Manage Project Members</DialogTitle></DialogHeader>
        <div className="space-y-4 pt-4">
          <p className="text-xs text-slate-500 dark:text-gray-400">
            Select the team members for this project and assign their development roles.
          </p>
          <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
            {(membersList?.data || []).map((m: any) => {
              const isChecked = !!selectedMembers[m.id]
              const currentRole = selectedMembers[m.id]?.role || 'member'

              return (
                <div key={m.id} className={`flex items-center justify-between p-3 rounded-xl border transition-all ${isChecked ? 'bg-indigo-500/[0.03] dark:bg-indigo-500/5 border-indigo-500/30' : 'bg-slate-950/[0.01] dark:bg-white/3 border-slate-950/[0.06] dark:border-white/5'}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={isChecked} onChange={() => toggleMember(m)} className="rounded border-gray-300 dark:border-white/10 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer" />
                    <Avatar className="w-8 h-8"><AvatarFallback className="text-xs bg-indigo-500/20">{m.full_name?.charAt(0)}</AvatarFallback></Avatar>
                    <div>
                      <p className="text-sm font-bold text-foreground">{m.full_name}</p>
                      <p className="text-xs text-slate-500 dark:text-gray-400">{m.email}</p>
                    </div>
                  </div>
                  {isChecked && (
                    <select value={currentRole} onChange={(e) => updateRole(m.id, e.target.value)} className="rounded-lg bg-slate-950/[0.02] dark:bg-slate-950 border border-slate-950/[0.06] dark:border-white/10 text-xs px-2 py-1.5 text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-indigo-500">
                      <option value="member">Member</option>
                      <option value="developer">Developer</option>
                      <option value="testing">Testing</option>
                      <option value="r&d">R&D</option>
                    </select>
                  )}
                </div>
              )
            })}
          </div>
          <Button disabled={isPending} onClick={handleSave} className="w-full gradient-brand border-0 text-white font-bold">
            {isPending ? 'Saving...' : 'Save Member Roles'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function NewRequestDialog({ projectId, onSuccess }: { projectId: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const [requestType, setRequestType] = useState('testing_request')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')

  const { data: membersList } = useQuery({
    queryKey: ['platform-members'],
    queryFn: () => usersApi.listMembers() as any,
    enabled: open
  })

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => tasksApi.create(data) as any,
    onSuccess: () => {
      toast.success('Request sent successfully!')
      qc.invalidateQueries({ queryKey: ['project-tasks', projectId] })
      setOpen(false)
      setTitle('')
      setDescription('')
      setAssignedTo('')
      onSuccess()
    },
    onError: () => toast.error('Failed to submit request')
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !assignedTo) {
      toast.error('Please fill in all required fields')
      return
    }
    mutate({
      project_id: projectId,
      title,
      description,
      assigned_to: assignedTo,
      tags: [requestType],
      priority: 'medium',
      status: 'todo'
    })
  }

  const sortedMembers = [...(membersList?.data || [])].sort((a, b) => {
    const valMap: Record<string, number> = { free: 0, busy: 1, loaded: 2 }
    return (valMap[a.availability] || 0) - (valMap[b.availability] || 0)
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gradient-brand border-0 text-white font-bold gap-2 self-start" />}>
        <span className="flex items-center gap-2 cursor-pointer gradient-brand border-0 text-white px-3 py-2 rounded-lg text-xs font-bold transition-all shadow-md"><Plus className="w-4 h-4" /> New Request</span>
      </DialogTrigger>
      <DialogContent className="glass bg-white dark:bg-card border border-slate-950/[0.06] dark:border-white/10 max-w-md shadow-2xl rounded-2xl">
        <DialogHeader><DialogTitle className="text-lg font-extrabold">New Testing or Collaboration Request</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 pt-4">
          <div>
            <label className="text-sm font-bold text-foreground mb-1 block">Request Type *</label>
            <select value={requestType} onChange={(e) => setRequestType(e.target.value)} className="w-full rounded-lg bg-slate-950/[0.01] dark:bg-slate-950 border border-slate-950/[0.06] dark:border-white/10 text-sm px-3 py-2 text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500">
              <option value="testing_request">Testing Report Request</option>
              <option value="collaboration_request">Collaboration / Work Request</option>
            </select>
          </div>
          <div>
            <label className="text-sm font-bold text-foreground mb-1 block">Title *</label>
            <Input placeholder="e.g. Test checkout page reliability" value={title} onChange={(e) => setTitle(e.target.value)} className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground font-semibold" required />
          </div>
          <div>
            <label className="text-sm font-bold text-foreground mb-1 block">Instructions / Description</label>
            <textarea placeholder="Write instructions or requirements..." value={description} onChange={(e) => setDescription(e.target.value)} rows={3} className="w-full rounded-lg bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-sm px-3 py-2 text-foreground font-semibold resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div>
            <label className="text-sm font-bold text-foreground mb-1 block">Assign To (Tester/Team Member) *</label>
            <select value={assignedTo} onChange={(e) => setAssignedTo(e.target.value)} className="w-full rounded-lg bg-slate-950/[0.01] dark:bg-slate-950 border border-slate-950/[0.06] dark:border-white/10 text-sm px-3 py-2 text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500" required>
              <option value="">Select a free member...</option>
              {sortedMembers.map((m: any) => {
                const badge = m.availability?.toUpperCase()
                return (
                  <option key={m.id} value={m.id} className="text-foreground dark:bg-slate-950">
                    {m.full_name} ({m.role}) — {badge} ({m.active_tasks_count} active tasks)
                  </option>
                )
              })}
            </select>
          </div>
          <Button type="submit" disabled={isPending} className="w-full gradient-brand border-0 text-white font-bold">
            {isPending ? 'Sending...' : 'Send Request'}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProjectDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()
  const { user } = useAuthStore()
  const qc = useQueryClient()

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

  if (!project) return <div className="text-center py-20 text-slate-500 dark:text-gray-500">Project not found</div>

  const allTasks = tasksData?.data || []
  const tasks = allTasks.filter((t: any) => !t.tags?.includes('testing_request') && !t.tags?.includes('collaboration_request'))
  const requestTasks = allTasks.filter((t: any) => t.tags?.includes('testing_request') || t.tags?.includes('collaboration_request'))
  const members = project.project_members || []

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Back button */}
      <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 dark:text-gray-400 dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back to Projects
      </button>

      {/* Header */}
      <div className="glass-card bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/10 rounded-2xl p-6 shadow-xl">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl gradient-brand flex items-center justify-center" style={{ background: project.color + '20' }}>
              <BarChart3 className="w-7 h-7" style={{ color: project.color || '#6366f1' }} />
            </div>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl font-bold">{project.name}</h1>
                <Badge className={`text-xs capitalize ${STATUS_COLORS[project.status] || ''}`}>{project.status?.replace('_', ' ')}</Badge>
                <Badge variant="outline" className="text-xs border-slate-950/[0.06] dark:border-white/10 capitalize">{project.priority}</Badge>
              </div>
              <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 max-w-lg">{project.description}</p>
              {project.client && <p className="text-xs text-slate-400 dark:text-gray-500 mt-1">Client: <span className="text-slate-700 dark:text-gray-300">{project.client.name}</span></p>}
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
            <span className="text-slate-500 dark:text-gray-400">Progress</span>
            <span className="font-semibold text-indigo-500 dark:text-indigo-400">{project.progress || 0}%</span>
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
            <div key={i} className="bg-slate-950/[0.02] dark:bg-white/3 border border-slate-950/[0.06] dark:border-white/5 rounded-xl p-3">
              <div className="flex items-center gap-2 mb-1">
                <s.icon className="w-3.5 h-3.5" style={{ color: s.color }} />
                <span className="text-xs text-slate-500 dark:text-gray-400">{s.label}</span>
              </div>
              <div className="text-lg font-bold">{s.value}</div>
              {s.sub && <div className="text-xs text-slate-400 dark:text-gray-500">{s.sub}</div>}
            </div>
          ))}
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks">
        <TabsList className="bg-slate-950/[0.02] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 flex-wrap h-auto p-1 gap-1">
          <TabsTrigger value="tasks">Tasks ({tasks.length})</TabsTrigger>
          <TabsTrigger value="members">Members ({members.length})</TabsTrigger>
          <TabsTrigger value="testing">Testing & Collab ({requestTasks.length})</TabsTrigger>
          <TabsTrigger value="milestones">Milestones ({(project.milestones || []).length})</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-3 mt-4">
          {tasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-gray-500"><CheckSquare className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No tasks yet</p><Link href={`/dashboard/projects/${id}/kanban`}><Button size="sm" variant="outline" className="mt-3">Open Kanban</Button></Link></div>
          ) : tasks.map((task: any, i: number) => (
            <motion.div key={task.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}>
              <Link href={`/dashboard/tasks/${task.id}`}>
                <div className="glass-card bg-slate-950/[0.01] dark:bg-white/[0.01] hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.02] border border-slate-950/[0.06] dark:border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-all">
                  <div className={`w-2 h-2 rounded-full flex-shrink-0 ${task.status === 'done' ? 'bg-green-400' : task.status === 'in_progress' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium ${task.status === 'done' ? 'line-through text-slate-400 dark:text-gray-500' : ''}`}>{task.title}</p>
                    <p className="text-xs text-slate-500 dark:text-gray-400 capitalize">{task.status?.replace('_', ' ')} · {task.priority} priority</p>
                  </div>
                  {task.assigned && <Avatar className="w-7 h-7"><AvatarFallback className="text-[10px] bg-indigo-500/20">{task.assigned.full_name?.charAt(0)}</AvatarFallback></Avatar>}
                  {task.due_date && <span className="text-xs text-slate-400 dark:text-gray-500 hidden sm:block">{new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>}
                </div>
              </Link>
            </motion.div>
          ))}
        </TabsContent>

        {/* Members Tab */}
        <TabsContent value="members" className="mt-4 space-y-4">
          {['admin', 'manager'].includes(user?.role || '') && (
            <div className="flex justify-between items-center bg-slate-950/[0.01] dark:bg-white/3 p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5">
              <div>
                <p className="text-sm font-bold text-foreground">Project Resources</p>
                <p className="text-xs text-muted-foreground font-medium">Assign developers, testers, and R&D resources to this workspace.</p>
              </div>
              <ManageMembersDialog project={project} onSuccess={() => {}} />
            </div>
          )}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {members.map((m: any) => (
              <div key={m.user_id} className="glass-card bg-slate-950/[0.01] dark:bg-card border border-slate-950/[0.06] dark:border-white/10 rounded-xl p-4 flex items-center gap-3">
                <Avatar className="w-10 h-10"><AvatarImage src={m.profiles?.avatar_url} /><AvatarFallback className="bg-indigo-500/20 text-indigo-300">{m.profiles?.full_name?.charAt(0)}</AvatarFallback></Avatar>
                <div>
                  <p className="text-sm font-medium">{m.profiles?.full_name}</p>
                  <p className="text-xs text-slate-500 dark:text-gray-400">{m.profiles?.email}</p>
                </div>
                <Badge variant="outline" className="ml-auto border-slate-950/[0.06] dark:border-white/10 text-xs capitalize">{m.role}</Badge>
              </div>
            ))}
            {project.manager && (
              <div className="glass-card border border-indigo-500/30 bg-indigo-500/[0.03] dark:bg-indigo-500/5 rounded-xl p-4 flex items-center gap-3">
                <Avatar className="w-10 h-10"><AvatarImage src={project.manager.avatar_url} /><AvatarFallback className="bg-indigo-500/20 text-indigo-300">{project.manager.full_name?.charAt(0)}</AvatarFallback></Avatar>
                <div><p className="text-sm font-medium">{project.manager.full_name}</p><p className="text-xs text-slate-500 dark:text-gray-400">{project.manager.email}</p></div>
                <Badge className="ml-auto bg-indigo-500/20 text-indigo-400 text-xs">Manager</Badge>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Testing & Collab Tab */}
        <TabsContent value="testing" className="space-y-4 mt-4">
          <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 bg-slate-950/[0.01] dark:bg-white/3 p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5">
            <div>
              <p className="text-sm font-bold text-foreground">Testing & Collaboration Matrix</p>
              <p className="text-xs text-muted-foreground font-medium">Request independent testing reports or peer collaboration from available resources.</p>
            </div>
            {['admin', 'manager', 'member'].includes(user?.role || '') && (
              <NewRequestDialog projectId={project.id} onSuccess={() => qc.invalidateQueries({ queryKey: ['project-tasks', project.id] })} />
            )}
          </div>

          {requestTasks.length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-gray-500">
              <ClipboardList className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm font-medium">No active testing or collaboration requests recorded</p>
              <p className="text-xs text-muted-foreground mt-1">Submit a request to collaborate with other team members.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {requestTasks.map((task: any) => {
                const isTesting = task.tags?.includes('testing_request')
                const stages = [
                  { id: 'todo', label: 'Requested' },
                  { id: 'in_progress', label: 'In Progress' },
                  { id: 'review', label: 'Under Review' },
                  { id: 'done', label: 'Completed' }
                ]
                
                const currentStageIdx = stages.findIndex(s => s.id === task.status)
                const currentStage = currentStageIdx >= 0 ? stages[currentStageIdx].label : 'Requested'

                return (
                  <div key={task.id} className="glass-card bg-slate-950/[0.01] dark:bg-card border border-slate-950/[0.06] dark:border-white/10 rounded-2xl p-5 space-y-4 shadow-md hover:shadow-lg transition-all duration-300">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-md leading-none border ${isTesting ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' : 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20'}`}>
                            {isTesting ? 'Testing' : 'Collaboration'}
                          </span>
                          <span className="text-xs text-muted-foreground font-medium">Task #{task.id?.slice(0, 5)}</span>
                        </div>
                        <h3 className="text-sm sm:text-base font-extrabold text-foreground">{task.title}</h3>
                        <p className="text-xs text-muted-foreground font-medium max-w-2xl">{task.description}</p>
                      </div>
                      
                      {task.assigned && (
                        <div className="flex items-center gap-2.5 bg-slate-500/5 dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/5 p-2 rounded-xl">
                          <Avatar className="w-8 h-8"><AvatarFallback className="text-xs font-bold bg-indigo-500/20 text-indigo-300">{task.assigned.full_name?.charAt(0)}</AvatarFallback></Avatar>
                          <div className="text-left">
                            <p className="text-xs font-bold text-foreground">{task.assigned.full_name}</p>
                            <p className="text-[10px] text-muted-foreground font-semibold">Assignee</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Highly visual timeline tracker */}
                    <div className="pt-2">
                      <p className="text-[10px] uppercase font-extrabold text-muted-foreground/60 tracking-wider mb-3">Live Progress Timeline</p>
                      <div className="relative flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-0">
                        {/* Connecting Line */}
                        <div className="absolute left-[15px] sm:left-0 sm:top-1/2 sm:-translate-y-1/2 w-0.5 h-[calc(100%-30px)] sm:w-full sm:h-0.5 bg-slate-200 dark:bg-white/10 z-0" />
                        <div 
                          className="absolute left-[15px] sm:left-0 sm:top-1/2 sm:-translate-y-1/2 w-0.5 sm:h-0.5 bg-indigo-500 transition-all duration-500 z-0" 
                          style={{
                            height: '2px',
                            width: '100%'
                          }}
                        />

                        {stages.map((stage, idx) => {
                          const isPast = idx < currentStageIdx
                          const isCurrent = idx === currentStageIdx
                          const isUpcoming = idx > currentStageIdx

                          return (
                            <div key={stage.id} className="relative z-10 flex sm:flex-col items-center gap-3 sm:gap-2 w-full sm:w-auto">
                              <div 
                                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 font-mono text-xs font-extrabold
                                  ${isPast 
                                    ? 'bg-indigo-500 border-indigo-500 text-white shadow-md shadow-indigo-500/20' 
                                    : isCurrent 
                                    ? 'bg-card border-indigo-500 text-indigo-500 dark:text-indigo-400 ring-4 ring-indigo-500/20 scale-110 font-black' 
                                    : 'bg-card border-slate-200 dark:border-white/10 text-muted-foreground'}`}
                              >
                                {isPast ? '✓' : idx + 1}
                              </div>
                              <div className="text-left sm:text-center">
                                <p className={`text-[11px] font-bold tracking-tight leading-none ${isCurrent ? 'text-indigo-600 dark:text-indigo-400 font-extrabold' : 'text-muted-foreground'}`}>{stage.label}</p>
                                {isCurrent && <span className="text-[8px] uppercase tracking-wider text-indigo-500 animate-pulse font-extrabold block sm:inline sm:ml-1 mt-0.5">Active</span>}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="mt-4 space-y-3">
          {(project.milestones || []).length === 0 ? (
            <div className="text-center py-12 text-slate-500 dark:text-gray-500"><Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" /><p>No milestones yet</p></div>
          ) : (project.milestones || []).map((m: any) => (
            <div key={m.id} className="glass-card bg-slate-950/[0.01] dark:bg-card border border-slate-950/[0.06] dark:border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${m.status === 'completed' ? 'bg-green-400' : m.status === 'in_progress' ? 'bg-yellow-400' : 'bg-gray-500'}`} />
                <div>
                  <p className="text-sm font-medium">{m.name}</p>
                  {m.due_date && <p className="text-xs text-slate-500 dark:text-gray-400">Due: {new Date(m.due_date).toLocaleDateString('en-IN')}</p>}
                </div>
              </div>
              <div className="text-right">
                {m.amount && <p className="text-sm font-semibold text-green-500 dark:text-green-400">₹{parseFloat(m.amount).toLocaleString()}</p>}
                <Badge variant="outline" className="text-xs border-slate-950/[0.06] dark:border-white/10 capitalize">{m.status}</Badge>
              </div>
            </div>
          ))}
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-4">
          <div className="glass-card bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/10 rounded-2xl p-6 space-y-4">
            {[
              { label: 'Start Date', value: project.start_date || '—' },
              { label: 'End Date', value: project.end_date || '—' },
              { label: 'Budget', value: project.budget ? `₹${parseFloat(project.budget).toLocaleString()}` : '—' },
              { label: 'Client', value: project.client?.name || '—' },
              { label: 'Manager', value: project.manager?.full_name || '—' },
              { label: 'Team', value: project.team?.name || '—' },
              { label: 'Created', value: new Date(project.created_at).toLocaleDateString('en-IN') },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-slate-950/[0.06] dark:border-white/5 last:border-0">
                <span className="text-sm text-slate-500 dark:text-gray-400">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
