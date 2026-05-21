'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FolderKanban, CheckSquare, FileText, CreditCard,
  Users, MessageSquare, Bell, Settings, LogOut, ChevronLeft,
  ChevronRight, Building2, TrendingUp, X, Sparkles, Bot, Receipt
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useNotificationStore } from '@/lib/store'

// roles that CAN see each item (empty = everyone with dashboard access)
const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard',           icon: LayoutDashboard, label: 'Dashboard',  color: '#818cf8', roles: ['admin','manager','finance','hr','member','client'] },
      { href: '/dashboard/analytics', icon: TrendingUp,      label: 'Analytics',  color: '#34d399', roles: ['admin','manager'] },
    ]
  },
  {
    label: 'Workspace',
    items: [
      { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects', color: '#818cf8', roles: ['admin','manager','member','client'] },
      { href: '/dashboard/tasks',    icon: CheckSquare,  label: 'Tasks',    color: '#fbbf24', roles: ['admin','manager','member'] },
    ]
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/invoices',  icon: FileText,   label: 'Invoices',  color: '#34d399', roles: ['admin','finance','client'] },
      { href: '/dashboard/payments',  icon: CreditCard, label: 'Payments',  color: '#60a5fa', roles: ['admin','finance'] },
      { href: '/dashboard/payslips',  icon: Receipt,    label: 'Payslips',  color: '#a78bfa', roles: ['admin','finance','hr','member'] },
    ]
  },
  {
    label: 'People',
    items: [
      { href: '/dashboard/clients', icon: Building2, label: 'Clients', color: '#c084fc', roles: ['admin','manager'] },
      { href: '/dashboard/team',    icon: Users,     label: 'Team',    color: '#f472b6', roles: ['admin','manager','hr'] },
    ]
  },
  {
    label: 'Tools',
    items: [
      { href: '/dashboard/chat',          icon: MessageSquare, label: 'Team Chat',    color: '#38bdf8', roles: ['admin','manager','finance','hr','member','client'] },
      { href: '/dashboard/ai',            icon: Bot,           label: 'AI Assistant', color: '#a78bfa', roles: ['admin','manager'] },
      { href: '/dashboard/notifications', icon: Bell,          label: 'Alerts',       color: '#fb923c', roles: ['admin','manager','finance','hr','member','client'] },
    ]
  },
]

const ROLE_BADGE: Record<string, { label: string; darkBg: string; darkText: string; lightBg: string; lightText: string }> = {
  admin:   { label: 'Admin',   darkBg: 'rgba(239,68,68,0.12)',   darkText: '#f87171', lightBg: 'rgba(239,68,68,0.1)',   lightText: '#dc2626' },
  manager: { label: 'Manager', darkBg: 'rgba(167,139,250,0.12)', darkText: '#c084fc', lightBg: 'rgba(167,139,250,0.1)', lightText: '#7c3aed' },
  finance: { label: 'Finance', darkBg: 'rgba(52,211,153,0.12)',  darkText: '#34d399', lightBg: 'rgba(52,211,153,0.1)',  lightText: '#059669' },
  hr:      { label: 'HR',      darkBg: 'rgba(244,114,182,0.12)', darkText: '#f472b6', lightBg: 'rgba(244,114,182,0.1)', lightText: '#db2777' },
  member:  { label: 'Member',  darkBg: 'rgba(56,189,248,0.12)',  darkText: '#38bdf8', lightBg: 'rgba(56,189,248,0.1)',  lightText: '#0284c7' },
  client:  { label: 'Client',  darkBg: 'rgba(251,191,36,0.12)',  darkText: '#fbbf24', lightBg: 'rgba(251,191,36,0.1)',  lightText: '#d97706' },
}

interface SidebarProps {
  mobileOpen: boolean
  onClose: () => void
}

export default function Sidebar({ mobileOpen, onClose }: SidebarProps) {
  const pathname = usePathname()
  const { user, logout } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const [collapsed, setCollapsed] = useState(false)

  useEffect(() => { onClose() }, [pathname])

  const isActive = (href: string) =>
    href === '/dashboard' ? pathname === href : pathname.startsWith(href)

  const badge = ROLE_BADGE[user?.role || '']

  const SidebarContent = () => (
    <aside
      className={`flex flex-col h-full relative z-20 transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] sidebar-glass
        ${collapsed ? 'w-[64px]' : 'w-[224px]'}`}
    >
      {/* Top glow line — dark only */}
      <div className="absolute top-0 left-0 right-0 h-px dark:block hidden bg-gradient-to-r from-transparent via-indigo-500/30 to-transparent" />

      {/* ── Brand ── */}
      <div className={`flex items-center h-16 px-4 gap-3 flex-shrink-0 border-b border-border/50 ${collapsed ? 'justify-center px-2' : ''}`}>
        <Link href="/dashboard" className="flex items-center gap-2.5 shrink-0 group">
          <div
            className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-transform duration-300 group-hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 60%, #06b6d4 100%)',
              boxShadow: '0 0 16px rgba(99,102,241,0.35), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <Sparkles className="w-4 h-4 text-white drop-shadow" />
          </div>
          {!collapsed && (
            <span className="font-black text-[14px] tracking-tight text-foreground">
              Billora<span className="text-indigo-500 dark:text-indigo-400">.ai</span>
            </span>
          )}
        </Link>

        {!collapsed && (
          <button
            onClick={onClose}
            className="ml-auto lg:hidden w-7 h-7 flex items-center justify-center rounded-lg text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-4 custom-scrollbar">
        {NAV_GROUPS.map(group => {
          const visible = group.items.filter(i => !i.roles || i.roles.includes(user?.role || ''))
          if (!visible.length) return null
          return (
            <div key={group.label} className="space-y-0.5">
              {!collapsed && (
                <p className="text-[9px] font-black uppercase tracking-[0.12em] px-2.5 pb-1.5 text-muted-foreground/50">
                  {group.label}
                </p>
              )}
              {visible.map(item => {
                const active = isActive(item.href)
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    title={collapsed ? item.label : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-200 relative group
                      ${collapsed ? 'justify-center px-2' : ''}
                      ${active
                        ? 'text-indigo-600 dark:text-indigo-300'
                        : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'
                      }
                    `}
                    style={active ? {
                      background: `${item.color}14`,
                      boxShadow: `inset 0 0 0 1px ${item.color}20`,
                    } : {}}
                  >
                    {/* Icon */}
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-lg flex items-center justify-center transition-all duration-200 ${active ? 'scale-105' : ''}`}
                      style={active ? { background: `${item.color}18` } : {}}
                    >
                      <item.icon
                        className="w-3.5 h-3.5"
                        style={active ? { color: item.color } : {}}
                      />
                    </div>

                    {!collapsed && <span className="truncate">{item.label}</span>}

                    {/* Notification badge */}
                    {item.href === '/dashboard/notifications' && unreadCount > 0 && (
                      collapsed
                        ? <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full animate-pulse bg-orange-400" />
                        : <span
                            className="ml-auto text-[9px] font-black rounded-full px-1.5 py-0.5 leading-none"
                            style={{ background: `${item.color}20`, color: item.color, border: `1px solid ${item.color}30` }}
                          >
                            {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                    )}

                    {/* Collapsed tooltip */}
                    {collapsed && (
                      <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-2xl z-50 bg-popover text-popover-foreground border border-border">
                        {item.label}
                      </div>
                    )}
                  </Link>
                )
              })}
            </div>
          )
        })}
      </nav>

      {/* ── Bottom ── */}
      <div className="flex-shrink-0 p-2.5 border-t border-border/50 space-y-1">
        {/* Settings */}
        <Link
          href="/dashboard/settings"
          title={collapsed ? 'Settings' : undefined}
          className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-[12.5px] font-semibold transition-all duration-200 group
            ${collapsed ? 'justify-center px-2' : ''}
            ${pathname.startsWith('/dashboard/settings')
              ? 'text-indigo-600 dark:text-indigo-300 bg-indigo-500/10'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent/60'}
          `}
        >
          <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0">
            <Settings className="w-3.5 h-3.5" />
          </div>
          {!collapsed && <span>Settings</span>}

          {collapsed && (
            <div className="absolute left-full ml-3 px-2.5 py-1.5 rounded-xl text-[11px] font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-all duration-200 shadow-2xl z-50 bg-popover text-popover-foreground border border-border">
              Settings
            </div>
          )}
        </Link>

        {/* User Card */}
        <div
          className={`rounded-xl p-2.5 transition-all duration-200 border border-border/60 bg-muted/30 hover:bg-muted/50
            ${collapsed ? 'flex justify-center p-2 border-0 bg-transparent hover:bg-transparent' : 'flex items-center gap-2.5'}
          `}
        >
          <Avatar className="w-7 h-7 flex-shrink-0 ring-1 ring-border">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-[10px] font-black bg-indigo-500/15 text-indigo-600 dark:text-indigo-300">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-[11.5px] font-bold truncate text-foreground leading-tight">{user?.full_name}</p>
                {badge && (
                  <span className="text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-md leading-none mt-0.5 inline-block">
                    {/* Light / dark badge colors via Tailwind */}
                    <span
                      className="text-[8.5px] font-black uppercase px-1.5 py-0.5 rounded-md"
                      style={{ background: badge.darkBg, color: badge.darkText }}
                    >
                      {badge.label}
                    </span>
                  </span>
                )}
              </div>
              <button
                onClick={logout}
                title="Sign out"
                className="flex-shrink-0 p-1.5 rounded-lg text-muted-foreground/50 hover:text-red-500 hover:bg-red-500/10 transition-all duration-200"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Collapse toggle ── */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3.5 top-[72px] w-7 h-7 rounded-full items-center justify-center z-30 transition-all duration-200 cursor-pointer bg-card border border-border text-muted-foreground hover:text-foreground hover:border-indigo-500/40 shadow-lg"
      >
        {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
      </button>
    </aside>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block relative flex-shrink-0 h-full">
        <SidebarContent />
      </div>

      {/* Mobile */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 backdrop-blur-sm animate-in fade-in duration-200 bg-black/60"
            onClick={onClose}
          />
          <div className="relative w-[224px] h-full z-10 flex-shrink-0 animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
