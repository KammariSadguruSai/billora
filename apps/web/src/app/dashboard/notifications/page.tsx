'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { notificationsApi } from '@/lib/api'
import { useNotificationStore } from '@/lib/store'
import { Bell, CheckCheck, Info, AlertTriangle, CheckCircle, XCircle, MessageSquare, CreditCard, FolderKanban } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { formatDistanceToNow } from 'date-fns'

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  info:    { icon: Info,         color: 'text-blue-400 bg-blue-500/20' },
  success: { icon: CheckCircle,  color: 'text-green-400 bg-green-500/20' },
  warning: { icon: AlertTriangle,color: 'text-yellow-400 bg-yellow-500/20' },
  error:   { icon: XCircle,      color: 'text-red-400 bg-red-500/20' },
  task:    { icon: CheckCircle,  color: 'text-indigo-400 bg-indigo-500/20' },
  invoice: { icon: CreditCard,   color: 'text-purple-400 bg-purple-500/20' },
  payment: { icon: CreditCard,   color: 'text-green-400 bg-green-500/20' },
  chat:    { icon: MessageSquare,color: 'text-pink-400 bg-pink-500/20' },
  project: { icon: FolderKanban, color: 'text-cyan-400 bg-cyan-500/20' },
}

export default function NotificationsPage() {
  const qc = useQueryClient()
  const { setNotifications, markRead, markAllRead } = useNotificationStore()

  const { data, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: async () => {
      const res: any = await notificationsApi.list({ limit: 50 })
      setNotifications(res.data || [], res.unread || 0)
      return res
    },
  })

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id) as any,
    onSuccess: (_, id) => { markRead(id); qc.invalidateQueries({ queryKey: ['notifications'] }) },
  })

  const markAllMutation = useMutation({
    mutationFn: () => notificationsApi.markAllRead() as any,
    onSuccess: () => { markAllRead(); qc.invalidateQueries({ queryKey: ['notifications'] }); toast.success('All marked as read') },
  })

  const notifications = data?.data || []
  const unread = notifications.filter((n: any) => !n.is_read).length

  return (
    <div className="max-w-3xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-gray-400 text-sm mt-1">{unread} unread · {notifications.length} total</p>
        </div>
        {unread > 0 && (
          <Button onClick={() => markAllMutation.mutate()} variant="outline" size="sm" className="gap-2 border-white/10">
            <CheckCheck className="w-4 h-4" /> Mark all read
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 rounded-xl" />)}</div>
      ) : notifications.length === 0 ? (
        <div className="text-center py-20 text-gray-500">
          <Bell className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium">No notifications yet</p>
          <p className="text-sm mt-1">You'll see task updates, payments, and messages here</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif: any, i: number) => {
            const cfg = TYPE_CONFIG[notif.type] || TYPE_CONFIG.info
            return (
              <motion.div key={notif.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.02 }}
                className={`glass-card border rounded-xl p-4 flex items-start gap-4 cursor-pointer transition-all ${notif.is_read ? 'border-white/5 opacity-70' : 'border-indigo-500/20 bg-indigo-500/3'}`}
                onClick={() => !notif.is_read && markReadMutation.mutate(notif.id)}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${cfg.color}`}>
                  <cfg.icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <p className={`text-sm font-medium ${notif.is_read ? 'text-gray-300' : 'text-white'}`}>{notif.title}</p>
                    {!notif.is_read && <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />}
                  </div>
                  <p className="text-xs text-gray-400 mt-0.5">{notif.message}</p>
                  <p className="text-xs text-gray-500 mt-1.5">
                    {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                  </p>
                </div>
                {notif.action_url && (
                  <Link href={notif.action_url} className="text-indigo-400 hover:text-indigo-300 text-xs flex-shrink-0" onClick={e => e.stopPropagation()}>
                    View →
                  </Link>
                )}
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
