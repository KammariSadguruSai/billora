'use client'
import { Bell, Search, Sun, Moon, Plus, Menu, Command } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore, useNotificationStore } from '@/lib/store'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/dashboard/projects': 'Projects',
  '/dashboard/tasks': 'Tasks',
  '/dashboard/invoices': 'Invoices',
  '/dashboard/payments': 'Payments',
  '/dashboard/clients': 'Clients',
  '/dashboard/team': 'Team',
  '/dashboard/analytics': 'Analytics',
  '/dashboard/chat': 'Chat',
  '/dashboard/ai': 'AI Assistant',
  '/dashboard/notifications': 'Notifications',
  '/dashboard/settings': 'Settings',
}

interface TopbarProps {
  onMenuClick: () => void
}

export default function Topbar({ onMenuClick }: TopbarProps) {
  const { user } = useAuthStore()
  const { unreadCount } = useNotificationStore()
  const { theme, setTheme } = useTheme()
  const pathname = usePathname()

  // Resolve current page title
  const pageTitle = Object.entries(PAGE_TITLES)
    .filter(([path]) => pathname.startsWith(path) && path !== '/dashboard')
    .sort((a, b) => b[0].length - a[0].length)[0]?.[1]
    || (pathname === '/dashboard' ? 'Dashboard' : '')

  return (
    <header className="h-14 flex items-center justify-between px-4 sm:px-5 border-b border-border gap-3 flex-shrink-0"
      style={{ background: 'hsl(var(--background))' }}>

      {/* Left */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Mobile hamburger */}
        <button onClick={onMenuClick}
          className="lg:hidden w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors flex-shrink-0">
          <Menu className="w-4 h-4" />
        </button>

        {/* Page title — shown on desktop */}
        {pageTitle && (
          <h1 className="text-sm font-semibold text-foreground hidden sm:block truncate">{pageTitle}</h1>
        )}
      </div>

      {/* Right */}
      <div className="flex items-center gap-1 sm:gap-2">

        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
          <input
            placeholder="Search…"
            className="pl-8 pr-3 w-44 lg:w-56 bg-accent border border-border h-8 text-xs rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all"
          />
          <kbd className="absolute right-2 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 text-[10px] text-muted-foreground/50 font-mono">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </div>

        {/* New Project */}
        {['admin', 'manager'].includes(user?.role || '') && (
          <Link href="/dashboard/projects/new" className="hidden sm:block">
            <Button size="sm" className="h-8 text-xs px-3 gap-1.5 bg-indigo-600 hover:bg-indigo-500 text-white border-0 font-medium">
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden md:inline">New Project</span>
            </Button>
          </Link>
        )}

        {/* Theme toggle */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
          title="Toggle theme"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4" />
            : <Moon className="w-4 h-4" />}
        </button>

        {/* Notifications */}
        <Link href="/dashboard/notifications"
          className="relative w-8 h-8 flex items-center justify-center rounded-md hover:bg-accent text-muted-foreground hover:text-foreground transition-colors">
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-indigo-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold leading-none">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Divider */}
        <div className="w-px h-5 bg-border mx-1 hidden sm:block" />

        {/* Avatar */}
        <Link href="/dashboard/settings" className="flex items-center gap-2 group">
          <Avatar className="w-7 h-7 ring-1 ring-border group-hover:ring-indigo-500/40 transition-all">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-[11px] bg-indigo-500/15 text-indigo-400 font-semibold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-medium text-foreground truncate max-w-[80px] hidden lg:block">
            {user?.full_name?.split(' ')[0]}
          </span>
        </Link>
      </div>
    </header>
  )
}
