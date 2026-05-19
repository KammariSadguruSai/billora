'use client'
import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { usersApi } from '@/lib/api'
import { Users, Search, Shield, Crown, UserCheck, Building2 } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { motion } from 'framer-motion'

const ROLE_CONFIG: Record<string, { icon: any; color: string; badge: string }> = {
  admin:   { icon: Crown,     color: 'text-red-400',    badge: 'bg-red-500/20 text-red-400' },
  manager: { icon: Shield,    color: 'text-purple-400', badge: 'bg-purple-500/20 text-purple-400' },
  member:  { icon: UserCheck, color: 'text-blue-400',   badge: 'bg-blue-500/20 text-blue-400' },
  client:  { icon: Building2, color: 'text-green-400',  badge: 'bg-green-500/20 text-green-400' },
}

export default function TeamPage() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')

  const { data, isLoading } = useQuery({
    queryKey: ['team', search, roleFilter],
    queryFn: () => usersApi.list({ search: search || undefined, role: roleFilter || undefined }) as any,
  })

  const users = data?.data || []
  const byRole = ['admin', 'manager', 'member', 'client'].reduce((acc: any, r) => {
    acc[r] = users.filter((u: any) => u.role === r).length
    return acc
  }, {})

  return (
    <div className="space-y-6 max-w-6xl">
      <div>
        <h1 className="text-2xl font-bold">Team</h1>
        <p className="text-gray-400 text-sm mt-1">{data?.total || 0} total members</p>
      </div>

      {/* Role counts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {Object.entries(ROLE_CONFIG).map(([role, cfg]) => (
          <button key={role} onClick={() => setRoleFilter(roleFilter === role ? '' : role)}
            className={`glass-card border rounded-xl p-4 text-left transition-all ${roleFilter === role ? 'border-indigo-500 bg-indigo-500/10' : 'border-white/10 hover:border-white/20'}`}>
            <cfg.icon className={`w-5 h-5 mb-2 ${cfg.color}`} />
            <p className="text-2xl font-bold">{byRole[role] || 0}</p>
            <p className="text-xs text-gray-400 capitalize mt-0.5">{role}s</p>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <Input placeholder="Search members..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-28 rounded-xl" />)}</div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><Users className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No members found</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {users.map((u: any, i: number) => {
            const cfg = ROLE_CONFIG[u.role] || ROLE_CONFIG.member
            return (
              <motion.div key={u.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}
                className="glass-card border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:border-indigo-500/30 transition-all">
                <Avatar className="w-12 h-12">
                  <AvatarImage src={u.avatar_url} />
                  <AvatarFallback className="bg-indigo-500/20 text-indigo-300 text-lg">{u.full_name?.charAt(0) || '?'}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold truncate">{u.full_name}</p>
                    <cfg.icon className={`w-3.5 h-3.5 flex-shrink-0 ${cfg.color}`} />
                  </div>
                  <p className="text-xs text-gray-400 truncate">{u.email}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <Badge className={`text-[10px] py-0 capitalize ${cfg.badge}`}>{u.role}</Badge>
                    {u.company && <span className="text-[10px] text-gray-500 truncate">{u.company}</span>}
                  </div>
                </div>
                <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${u.is_active ? 'bg-green-400' : 'bg-gray-600'}`} title={u.is_active ? 'Active' : 'Inactive'} />
              </motion.div>
            )
          })}
        </div>
      )}
    </div>
  )
}
