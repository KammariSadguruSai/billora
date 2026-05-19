'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { projectsApi } from '@/lib/api'
import { Plus, Search, Filter, Grid3X3, List, MoreVertical, Calendar, Users, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'
import Link from 'next/link'
import { useForm } from 'react-hook-form'

const STATUS_COLORS: Record<string, string> = {
  planning: 'border-yellow-500/30 text-yellow-400',
  active: 'border-green-500/30 text-green-400',
  on_hold: 'border-orange-500/30 text-orange-400',
  completed: 'border-indigo-500/30 text-indigo-400',
  cancelled: 'border-red-500/30 text-red-400',
}

function ProjectCard({ project }: { project: any }) {
  return (
    <motion.div whileHover={{ y: -4 }} transition={{ type: 'spring', stiffness: 300 }}>
      <Link href={`/dashboard/projects/${project.id}`}>
        <div className="glass-card p-5 rounded-xl cursor-pointer">
          <div className="flex items-start justify-between mb-4">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center" style={{ background: project.color + '20' }}>
              <BarChart3 className="w-5 h-5" style={{ color: project.color || '#6366f1' }} />
            </div>
            <Badge variant="outline" className={`text-xs ${STATUS_COLORS[project.status] || ''}`}>
              {project.status?.replace('_', ' ')}
            </Badge>
          </div>
          <h3 className="font-semibold text-sm mb-1 line-clamp-1">{project.name}</h3>
          <p className="text-xs text-gray-400 mb-4 line-clamp-2">{project.description || 'No description'}</p>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Progress</span>
              <span className="font-medium text-gray-200">{project.progress || 0}%</span>
            </div>
            <Progress value={project.progress || 0} className="h-1.5" />
          </div>

          <div className="flex items-center justify-between mt-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <Users className="w-3.5 h-3.5" />
              <span>{project.project_members?.length || 0} members</span>
            </div>
            {project.end_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                <span>{new Date(project.end_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
              </div>
            )}
          </div>

          {project.client && (
            <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-400">
              Client: <span className="text-gray-300">{project.client.name}</span>
            </div>
          )}
        </div>
      </Link>
    </motion.div>
  )
}

function CreateProjectDialog({ onSuccess, isClient = false }: { onSuccess: () => void, isClient?: boolean }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { register, handleSubmit, reset, setValue } = useForm()

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => projectsApi.create({ ...data, status: isClient ? 'planning' : data.status }) as any,
    onSuccess: () => {
      toast.success(isClient ? 'Project request submitted!' : 'Project created!')
      qc.invalidateQueries({ queryKey: ['projects'] })
      setOpen(false)
      reset()
      onSuccess()
    },
    onError: (err: any) => toast.error(err?.error || 'Failed to create project'),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gradient-brand border-0 text-white gap-2" />}>
        <Plus className="w-4 h-4" /> {isClient ? 'Request Project' : 'New Project'}
      </DialogTrigger>
      <DialogContent className="glass border-white/10 max-w-lg">
        <DialogHeader><DialogTitle>{isClient ? 'Request New Project' : 'Create New Project'}</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit((d) => mutate(d))} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Project Name *</label>
            <Input {...register('name', { required: true })} placeholder={isClient ? "E-commerce Website" : "My Awesome Project"} className="bg-white/5 border-white/10" />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Requirements & Description</label>
            <textarea {...register('description')} placeholder="Please describe your requirements..." rows={3}
              className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200 placeholder-gray-500 resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Priority</label>
              <select {...register('priority')} className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="urgent">Urgent</option>
              </select>
            </div>
            {!isClient && (
              <div>
                <label className="text-sm font-medium text-gray-300 mb-1.5 block">Status</label>
                <select {...register('status')} className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200">
                  <option value="planning">Planning</option>
                  <option value="active">Active</option>
                </select>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Expected Start Date</label>
              <Input {...register('start_date')} type="date" className="bg-white/5 border-white/10" />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-300 mb-1.5 block">Expected Delivery</label>
              <Input {...register('end_date')} type="date" className="bg-white/5 border-white/10" />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300 mb-1.5 block">Expected Budget (₹)</label>
            <Input {...register('budget')} type="number" placeholder="50000" className="bg-white/5 border-white/10" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full gradient-brand border-0 text-white">
            {isPending ? 'Submitting...' : (isClient ? 'Submit Request' : 'Create Project')}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ProjectsPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const [status, setStatus] = useState('')
  const [view, setView] = useState<'grid' | 'list'>('grid')

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['projects', search, status],
    queryFn: () => projectsApi.list({ search: search || undefined, status: status || undefined }) as any,
  })

  const projects = data?.data || []

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Projects</h1>
          <p className="text-gray-400 text-sm mt-1">{data?.total || 0} total projects</p>
        </div>
        {user?.role === 'client' ? (
          <CreateProjectDialog onSuccess={refetch} isClient={true} />
        ) : (
          ['admin', 'manager'].includes(user?.role || '') && <CreateProjectDialog onSuccess={refetch} isClient={false} />
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
          <Input placeholder="Search projects..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
        </div>
        <select value={status} onChange={e => setStatus(e.target.value)} className="rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200 min-w-[140px]">
          <option value="">All Status</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on_hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
        <div className="flex border border-white/10 rounded-lg overflow-hidden">
          <button onClick={() => setView('grid')} className={`px-3 py-2 ${view === 'grid' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white'}`}><Grid3X3 className="w-4 h-4" /></button>
          <button onClick={() => setView('list')} className={`px-3 py-2 ${view === 'list' ? 'bg-indigo-500/20 text-indigo-400' : 'text-gray-400 hover:text-white'}`}><List className="w-4 h-4" /></button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => <div key={i} className="h-52 rounded-xl animate-shimmer" />)}
        </div>
      ) : projects.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="text-lg font-medium">No projects found</p>
          <p className="text-sm mt-1">Create your first project to get started</p>
        </div>
      ) : (
        <Tabs defaultValue="approved" className="w-full">
          <TabsList className="mb-4 bg-white/5 border border-white/10">
            <TabsTrigger value="approved">Approved Projects ({projects.filter((p: any) => p.status !== 'planning').length})</TabsTrigger>
            <TabsTrigger value="requests">New Requests ({projects.filter((p: any) => p.status === 'planning').length})</TabsTrigger>
          </TabsList>
          
          <TabsContent value="approved">
            <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {projects.filter((p: any) => p.status !== 'planning').length === 0 ? (
                <div className="text-center py-12 text-gray-500">No approved projects found.</div>
              ) : projects.filter((p: any) => p.status !== 'planning').map((p: any, i: number) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </div>
          </TabsContent>
          
          <TabsContent value="requests">
            <div className={view === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}>
              {projects.filter((p: any) => p.status === 'planning').length === 0 ? (
                <div className="text-center py-12 text-gray-500">No new requests pending.</div>
              ) : projects.filter((p: any) => p.status === 'planning').map((p: any, i: number) => (
                <motion.div key={p.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                  <ProjectCard project={p} />
                </motion.div>
              ))}
            </div>
          </TabsContent>
        </Tabs>
      )}
    </div>
  )
}
