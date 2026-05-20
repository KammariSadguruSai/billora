'use client'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { hrApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Users, Search, Shield, Crown, UserCheck, Briefcase, Plus } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'
import Link from 'next/link'

const ROLE_CONFIG: Record<string, { icon: any; color: string; badge: string }> = {
  admin:   { icon: Crown,     color: 'text-rose-600 dark:text-rose-400',    badge: 'bg-rose-500/10 dark:bg-rose-500/15 text-rose-600 dark:text-rose-400 border border-rose-500/20 dark:border-transparent font-medium' },
  manager: { icon: Shield,    color: 'text-purple-600 dark:text-purple-400', badge: 'bg-purple-500/10 dark:bg-purple-500/15 text-purple-600 dark:text-purple-400 border border-purple-500/20 dark:border-transparent font-medium' },
  finance: { icon: Briefcase, color: 'text-emerald-600 dark:text-emerald-400', badge: 'bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 dark:border-transparent font-medium' },
  member:  { icon: UserCheck, color: 'text-blue-600 dark:text-blue-400',   badge: 'bg-blue-500/10 dark:bg-blue-500/15 text-blue-600 dark:text-blue-400 border border-blue-500/20 dark:border-transparent font-medium' },
}

export default function TeamPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const { user } = useAuthStore()

  const { data, isLoading } = useQuery({
    queryKey: ['team', search, roleFilter],
    queryFn: () => hrApi.listEmployees({ search: search || undefined, role: roleFilter || undefined }) as any,
  })

  const users = data?.data || []
  const byRole = ['admin', 'manager', 'finance', 'member'].reduce((acc: any, r) => {
    acc[r] = users.filter((u: any) => u.role === r).length
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Team</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">{data?.total || 0} active employees</p>
        </div>
        {user?.role === 'admin' && (
          <Link href="/dashboard/team/create"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 14px rgba(99,102,241,0.25)' }}
          >
            <Plus className="w-4 h-4" /> Add Employee
          </Link>
        )}
      </div>

      {/* Role counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
          <button key={role} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
            className={`glass-card border rounded-xl p-4 text-left transition-all cursor-pointer ${roleFilter === role ? 'border-indigo-500 bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-white shadow-md' : 'border-slate-950/[0.06] dark:border-white/10 hover:border-indigo-500/50 dark:hover:border-white/20 hover:bg-slate-950/[0.02] dark:hover:bg-white/[0.02]'}`}>
            <cfg.icon className={`w-5 h-5 mb-2 ${cfg.color}`} />
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{byRole[role] || 0}</p>
            <p className="text-xs text-slate-500 dark:text-gray-400 capitalize mt-0.5">{role}s</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-3 w-4 h-4 text-slate-400 dark:text-gray-500" />
        <Input placeholder="Search employees..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-450 dark:placeholder:text-gray-600 rounded-xl h-10" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl bg-slate-950/[0.04] dark:bg-white/5 animate-pulse" />)}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-slate-450 dark:text-gray-550"><Users className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No employees found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u: any, i: number) => {
            const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.member
            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card border border-slate-950/[0.06] dark:border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-500/30 dark:hover:border-indigo-500/30 transition-all bg-slate-950/[0.01] dark:bg-white/[0.02] group">
                <Avatar className="w-12 h-12 ring-2 ring-slate-950/[0.04] dark:ring-white/5">
                  <AvatarImage src={u.avatar_url} />
                  <AvatarFallback className="bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-300 text-lg font-bold">{u.full_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-bold truncate text-slate-900 dark:text-white">{u.full_name}</p>
                    <cfg.icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />
                  </div>
                  <p className="text-xs text-slate-550 dark:text-gray-400 truncate mt-0.5">{u.email}</p>
                  
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <Badge className={`text-[10px] py-0 capitalize ${cfg.badge}`}>{u.role}</Badge>
                    {u.employee_id && (
                      <Badge variant="outline" className="text-[9px] py-0 font-mono text-slate-500 dark:text-gray-400 border-slate-200 dark:border-white/10">
                        {u.employee_id}
                      </Badge>
                    )}
                    {u.department && (
                      <span className="text-[10px] text-slate-400 dark:text-gray-500 ml-1 truncate">
                        • {u.department}
                      </span>
                    )}
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
