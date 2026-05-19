'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect } from 'react'
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd'
import { tasksApi } from '@/lib/api'
import { Plus, Clock, AlertCircle, CheckCircle2, Eye, User } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import Link from 'next/link'

const COLUMNS = [
  { id: 'todo', label: 'To Do', color: '#64748b', icon: Clock },
  { id: 'in_progress', label: 'In Progress', color: '#f59e0b', icon: AlertCircle },
  { id: 'review', label: 'Review', color: '#6366f1', icon: Eye },
  { id: 'done', label: 'Done', color: '#10b981', icon: CheckCircle2 },
]

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'bg-red-500/20 text-red-400',
  high: 'bg-orange-500/20 text-orange-400',
  medium: 'bg-yellow-500/20 text-yellow-400',
  low: 'bg-gray-500/20 text-gray-400',
}

function TaskCard({ task, index, isClient = false }: { task: any; index: number, isClient?: boolean }) {
  return (
    <Draggable draggableId={task.id} index={index} isDragDisabled={isClient}>
      {(provided, snapshot) => (
        <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps}
          className={`kanban-card mb-3 ${snapshot.isDragging ? 'shadow-2xl shadow-indigo-500/30 rotate-2' : ''}`}>
          <Link href={`/dashboard/tasks/${task.id}`} onClick={e => snapshot.isDragging && e.preventDefault()}>
            <div className="flex items-start justify-between mb-2 gap-2">
              <p className="text-sm font-medium line-clamp-2">{task.title}</p>
              <Badge className={`text-[10px] py-0 px-1.5 flex-shrink-0 ${PRIORITY_COLORS[task.priority] || ''}`}>
                {task.priority}
              </Badge>
            </div>
            {task.description && <p className="text-xs text-gray-400 line-clamp-2 mb-3">{task.description}</p>}
            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1.5">
                {task.assigned && (
                  <Avatar className="w-6 h-6">
                    <AvatarImage src={task.assigned.avatar_url} />
                    <AvatarFallback className="text-[10px] bg-indigo-500/20">{task.assigned.full_name?.charAt(0)}</AvatarFallback>
                  </Avatar>
                )}
                {task.due_date && (
                  <span className={`text-[10px] ${new Date(task.due_date) < new Date() ? 'text-red-400' : 'text-gray-500'}`}>
                    {new Date(task.due_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                  </span>
                )}
              </div>
              {task._count?.count > 0 && (
                <span className="text-[10px] text-gray-500">{task._count.count} comments</span>
              )}
            </div>
          </Link>
        </div>
      )}
    </Draggable>
  )
}

function AddTaskButton({ projectId, status, onSuccess }: { projectId: string; status: string; onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm()

  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => tasksApi.create({ ...data, project_id: projectId, status }) as any,
    onSuccess: () => { toast.success('Task added!'); qc.invalidateQueries({ queryKey: ['kanban-tasks'] }); setOpen(false); reset(); onSuccess() },
    onError: () => toast.error('Failed to create task'),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<button className="w-full text-left text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1.5 py-2 px-1 rounded transition-colors" />}>
        <Plus className="w-3.5 h-3.5" /> Add task
      </DialogTrigger>
      <DialogContent className="glass border-white/10 max-w-md">
        <DialogHeader><DialogTitle>Add Task</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
          <Input {...register('title', { required: true })} placeholder="Task title" className="bg-white/5 border-white/10" autoFocus />
          <textarea {...register('description')} placeholder="Description (optional)" rows={2}
            className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200 placeholder-gray-500 resize-none" />
          <div className="grid grid-cols-2 gap-3">
            <select {...register('priority')} className="rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200">
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
              <option value="urgent">Urgent</option>
            </select>
            <Input {...register('due_date')} type="date" className="bg-white/5 border-white/10 text-sm" />
          </div>
          <Button type="submit" disabled={isPending} className="w-full gradient-brand border-0 text-white">Add Task</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

import { useAuthStore } from '@/lib/store'

import { useParams } from 'next/navigation'

export default function KanbanPage() {
  const { id } = useParams() as { id: string }
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tasks, setTasks] = useState<Record<string, any[]>>({})
  const isClient = user?.role === 'client'

  const { data, isLoading } = useQuery({
    queryKey: ['kanban-tasks', id],
    queryFn: () => tasksApi.list({ project_id: id, limit: 200 }) as any,
  })

  useEffect(() => {
    if (data?.data) {
      const grouped: Record<string, any[]> = { todo: [], in_progress: [], review: [], done: [] }
      data.data.forEach((task: any) => {
        if (grouped[task.status]) grouped[task.status].push(task)
        else grouped.todo.push(task)
      })
      Object.keys(grouped).forEach(key => grouped[key].sort((a, b) => a.position - b.position))
      setTasks(grouped)
    }
  }, [data])

  const onDragEnd = async (result: DropResult) => {
    const { destination, source, draggableId } = result
    if (!destination || (destination.droppableId === source.droppableId && destination.index === source.index)) return

    const newTasks = { ...tasks }
    const sourceCol = [...(newTasks[source.droppableId] || [])]
    const destCol = source.droppableId === destination.droppableId ? sourceCol : [...(newTasks[destination.droppableId] || [])]

    const [moved] = sourceCol.splice(source.index, 1)
    moved.status = destination.droppableId
    destCol.splice(destination.index, 0, moved)

    newTasks[source.droppableId] = sourceCol
    newTasks[destination.droppableId] = destCol
    setTasks(newTasks)

    try {
      await tasksApi.update(draggableId, { status: destination.droppableId, position: destination.index })
    } catch { toast.error('Failed to move task') }
  }

  if (isLoading) return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {COLUMNS.map(col => <div key={col.id} className="w-72 flex-shrink-0 h-96 rounded-xl animate-shimmer" />)}
    </div>
  )

  return (
    <div className="h-full">
      <DragDropContext onDragEnd={onDragEnd}>
        <div className="flex gap-4 overflow-x-auto pb-4 h-full">
          {COLUMNS.map(col => {
            const colTasks = tasks[col.id] || []
            return (
              <div key={col.id} className="w-72 flex-shrink-0 flex flex-col" style={{ maxHeight: 'calc(100vh - 160px)' }}>
                <div className="flex items-center gap-2 mb-3 px-1">
                  <col.icon className="w-4 h-4" style={{ color: col.color }} />
                  <span className="font-medium text-sm">{col.label}</span>
                  <span className="ml-auto w-5 h-5 rounded-full bg-white/10 text-xs flex items-center justify-center text-gray-400">
                    {colTasks.length}
                  </span>
                </div>
                <Droppable droppableId={col.id}>
                  {(provided, snapshot) => (
                    <div ref={provided.innerRef} {...provided.droppableProps}
                      className={`kanban-column flex-1 overflow-y-auto transition-colors ${snapshot.isDraggingOver ? 'bg-indigo-500/5 border border-dashed border-indigo-500/30' : 'bg-white/[0.02] border border-white/5'}`}>
                      {colTasks.map((task, idx) => <TaskCard key={task.id} task={task} index={idx} isClient={isClient} />)}
                      {provided.placeholder}
                      {!isClient && <AddTaskButton projectId={id} status={col.id} onSuccess={() => qc.invalidateQueries({ queryKey: ['kanban-tasks'] })} />}
                    </div>
                  )}
                </Droppable>
              </div>
            )
          })}
        </div>
      </DragDropContext>
    </div>
  )
}
