'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
  LayoutDashboard, FolderKanban, CheckSquare, FileText, CreditCard,
  Users, MessageSquare, Bell, Settings, LogOut, ChevronLeft,
  ChevronRight, Zap, Building2, TrendingUp, X
} from 'lucide-react'
import { useAuthStore } from '@/lib/store'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useNotificationStore } from '@/lib/store'

const NAV_GROUPS = [
  {
    label: 'Overview',
    items: [
      { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
      { href: '/dashboard/analytics', icon: TrendingUp, label: 'Analytics', roles: ['admin', 'manager'] },
    ]
  },
  {
    label: 'Work',
    items: [
      { href: '/dashboard/projects', icon: FolderKanban, label: 'Projects' },
      { href: '/dashboard/tasks', icon: CheckSquare, label: 'Tasks', roles: ['admin', 'manager', 'member'] },
    ]
  },
  {
    label: 'Finance',
    items: [
      { href: '/dashboard/invoices', icon: FileText, label: 'Invoices' },
      { href: '/dashboard/payments', icon: CreditCard, label: 'Payments' },
    ]
  },
  {
    label: 'People',
    items: [
      { href: '/dashboard/clients', icon: Building2, label: 'Clients', roles: ['admin', 'manager'] },
      { href: '/dashboard/team', icon: Users, label: 'Team', roles: ['admin', 'manager'] },
    ]
  },
  {
    label: 'Tools',
    items: [
      { href: '/dashboard/chat', icon: MessageSquare, label: 'Chat' },
      { href: '/dashboard/ai', icon: Zap, label: 'AI Assistant' },
      { href: '/dashboard/notifications', icon: Bell, label: 'Notifications' },
    ]
  },
]

const ROLE_BADGE: Record<string, { label: string; class: string }> = {
  admin: { label: 'Admin', class: 'bg-red-500/15 text-red-400' },
  manager: { label: 'Manager', class: 'bg-purple-500/15 text-purple-400' },
  member: { label: 'Member', class: 'bg-blue-500/15 text-blue-400' },
  client: { label: 'Client', class: 'bg-green-500/15 text-green-400' },
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

  const SidebarContent = () => (
    <aside
      className={`flex flex-col h-full transition-all duration-300 border-r border-border relative
        ${collapsed ? 'w-[60px]' : 'w-[220px]'}`}
      style={{ background: 'hsl(var(--card))' }}
    >
      {/* Logo */}
      <div className={`flex items-center h-14 border-b border-border px-3 gap-2 flex-shrink-0 ${collapsed ? 'justify-center' : ''}`}>
        <div className="w-7 h-7 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
          <FileText className="w-4 h-4 text-white" />
        </div>
        {!collapsed && (
          <span className="font-semibold text-sm tracking-tight text-foreground">Billora</span>
        )}
        <button onClick={onClose} className={`ml-auto lg:hidden text-muted-foreground hover:text-foreground transition-colors ${collapsed ? 'hidden' : ''}`}>
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-4">
        {NAV_GROUPS.map(group => {
          const visible = group.items.filter(i => !i.roles || i.roles.includes(user?.role || ''))
          if (!visible.length) return null
          return (
            <div key={group.label}>
              {!collapsed && (
                <p className="text-[10px] font-semibold text-muted-foreground/50 uppercase tracking-widest px-2 mb-1">
                  {group.label}
                </p>
              )}
              <div className="space-y-0.5">
                {visible.map(item => {
                  const active = isActive(item.href)
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-all duration-150 relative group
                        ${active
                          ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'
                          : 'text-muted-foreground hover:text-foreground hover:bg-accent'
                        }
                        ${collapsed ? 'justify-center' : ''}
                      `}
                    >
                      <item.icon className={`w-4 h-4 flex-shrink-0 ${active ? 'text-indigo-500 dark:text-indigo-400' : ''}`} />
                      {!collapsed && <span className="truncate">{item.label}</span>}
                      {/* Notification dot */}
                      {item.href === '/dashboard/notifications' && unreadCount > 0 && (
                        collapsed
                          ? <span className="absolute top-1 right-1 w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                          : <span className="ml-auto text-[10px] bg-indigo-500 text-white rounded-full px-1.5 py-0.5 font-bold leading-none">
                              {unreadCount > 9 ? '9+' : unreadCount}
                            </span>
                      )}
                      {/* Tooltip on collapsed */}
                      {collapsed && (
                        <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md text-xs text-foreground whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity shadow-md z-50">
                          {item.label}
                        </div>
                      )}
                    </Link>
                  )
                })}
              </div>
            </div>
          )
        })}
      </nav>

      {/* Bottom: Settings + User */}
      <div className="border-t border-border p-2 space-y-0.5 flex-shrink-0">
        <Link href="/dashboard/settings"
          className={`flex items-center gap-2.5 px-2 py-1.5 rounded-md text-sm font-medium transition-all
            ${pathname.startsWith('/dashboard/settings')
              ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400'
              : 'text-muted-foreground hover:text-foreground hover:bg-accent'}
            ${collapsed ? 'justify-center' : ''}
          `}
          title={collapsed ? 'Settings' : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>

        {/* User row */}
        <div className={`flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent transition-all cursor-default ${collapsed ? 'justify-center' : ''}`}>
          <Avatar className="w-6 h-6 flex-shrink-0">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-[10px] bg-indigo-500/20 text-indigo-400 font-semibold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium truncate text-foreground">{user?.full_name}</p>
                <p className={`text-[10px] font-semibold capitalize px-1 rounded ${ROLE_BADGE[user?.role || '']?.class || ''}`}>
                  {ROLE_BADGE[user?.role || '']?.label || user?.role}
                </p>
              </div>
              <button onClick={logout} className="text-muted-foreground/50 hover:text-red-400 transition-colors flex-shrink-0 p-0.5">
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Collapse toggle — desktop only */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="hidden lg:flex absolute -right-3 top-[52px] w-6 h-6 bg-background border border-border rounded-full items-center justify-center text-muted-foreground hover:text-foreground shadow-sm z-10 transition-colors"
      >
        {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
      </button>
    </aside>
  )

  return (
    <>
      {/* Desktop */}
      <div className="hidden lg:block relative flex-shrink-0">
        <SidebarContent />
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          {/* Overlay */}
          <div 
            className="fixed inset-0 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
          />
          {/* Drawer */}
          <div className="relative w-[220px] h-full z-10 flex-shrink-0 animate-in slide-in-from-left duration-300">
            <SidebarContent />
          </div>
        </div>
      )}
    </>
  )
}
