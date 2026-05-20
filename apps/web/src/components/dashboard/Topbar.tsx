'use client'
import { Bell, Search, Sun, Moon, Plus, Menu, Command, Sparkles } from 'lucide-react'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { useAuthStore, useNotificationStore } from '@/lib/store'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

const PAGE_TITLES: Record<string, string> = {
  '/dashboard': 'Dashboard Metrics',
  '/dashboard/projects': 'Workspaces & Projects',
  '/dashboard/tasks': 'Deliverable Matrix',
  '/dashboard/invoices': 'Invoices & Billing',
  '/dashboard/payments': 'Financial Ledgers',
  '/dashboard/clients': 'Client Roster',
  '/dashboard/team': 'Internal Resources',
  '/dashboard/analytics': 'Business Analytics',
  '/dashboard/chat': 'Team Communications',
  '/dashboard/ai': 'AI Intelligence Assistant',
  '/dashboard/notifications': 'Notifications Hub',
  '/dashboard/settings': 'System Settings',
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
    || (pathname === '/dashboard' ? 'Dashboard Metrics' : '')

  return (
    <header className="h-16 flex items-center justify-between px-4 sm:px-6 gap-3 flex-shrink-0 relative z-30 topbar-glass">

      {/* Left section: mobile hamburger + page title */}
      <div className="flex items-center gap-4 min-w-0">
        {/* Mobile menu trigger */}
        <button onClick={onMenuClick}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl bg-slate-500/5 dark:bg-white/5 border border-slate-200/60 dark:border-white/10 hover:bg-slate-500/10 dark:hover:bg-white/10 text-muted-foreground hover:text-foreground transition-all duration-200 flex-shrink-0 cursor-pointer">
          <Menu className="w-4 h-4" />
        </button>

        {/* Dynamic Title */}
        {pageTitle && (
          <div className="hidden sm:flex items-center gap-2 animate-fade-in-up">
            <span className="h-1.5 w-1.5 rounded-full bg-indigo-500/50" />
            <h1 className="text-sm font-extrabold text-foreground tracking-tight truncate">{pageTitle}</h1>
          </div>
        )}
      </div>

      {/* Right section: search, quick actions, toggles, profile */}
      <div className="flex items-center gap-2">

        {/* Spotlight Search Box */}
        <div className="relative hidden md:block group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/60 group-hover:text-muted-foreground transition-colors" />
          <input
            placeholder="Quick search..."
            className="pl-9 pr-10 w-48 lg:w-56 bg-slate-500/[0.03] dark:bg-white/[0.02] hover:bg-slate-500/[0.06] dark:hover:bg-white/[0.04] focus:bg-slate-500/[0.08] dark:focus:bg-white/[0.06] border border-slate-200/60 dark:border-white/5 focus:border-indigo-500/30 h-9 text-xs rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all duration-300"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden lg:flex items-center gap-0.5 text-[9px] text-muted-foreground/35 font-mono bg-slate-500/5 dark:bg-white/5 px-1.5 py-0.5 rounded-md border border-slate-200 dark:border-white/5 select-none font-bold">
            <Command className="w-2.5 h-2.5" />K
          </kbd>
        </div>

        {/* Quick Creator CTA */}
        {['admin', 'manager'].includes(user?.role || '') && (
          <Link href="/dashboard/projects/new" className="hidden sm:block">
            <Button size="sm" className="h-9 text-xs px-3.5 gap-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 border-0 text-white font-bold rounded-xl shadow-md shadow-indigo-500/10 hover:shadow-indigo-500/20 transition-all duration-300">
              <Plus className="w-3.5 h-3.5 text-white" />
              <span>Add Workspace</span>
            </Button>
          </Link>
        )}

        {/* Theme Controller */}
        <button
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="w-9 h-9 flex items-center justify-center rounded-xl bg-slate-500/[0.02] dark:bg-white/[0.02] hover:bg-slate-500/[0.05] dark:hover:bg-white/[0.05] border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 text-muted-foreground hover:text-foreground transition-all duration-200 cursor-pointer"
          title="Switch appearance scheme"
        >
          {theme === 'dark'
            ? <Sun className="w-4 h-4 text-indigo-400" />
            : <Moon className="w-4 h-4 text-purple-400" />}
        </button>
 
        {/* Alerts Center */}
        <Link href="/dashboard/notifications"
          className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-slate-500/[0.02] dark:bg-white/[0.02] hover:bg-slate-500/[0.05] dark:hover:bg-white/[0.05] border border-slate-200/60 dark:border-white/5 hover:border-slate-300 dark:hover:border-white/10 text-muted-foreground hover:text-foreground transition-all duration-200"
          title="Activity notifications"
        >
          <Bell className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-indigo-500 border border-slate-900 rounded-full text-[9px] text-white flex items-center justify-center font-extrabold shadow-md shadow-indigo-500/20 animate-pulse">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Divider bar */}
        <div className="w-px h-5 bg-slate-200 dark:bg-white/5 mx-1 hidden sm:block" />
 
        {/* Spotlight Profile Link */}
        <Link href="/dashboard/settings" className="flex items-center gap-2 group p-1 pr-2 rounded-xl hover:bg-slate-500/[0.02] dark:hover:bg-white/[0.02] border border-transparent hover:border-slate-200/60 dark:hover:border-white/5 transition-all duration-200">
          <Avatar className="w-7 h-7 border border-slate-200 dark:border-white/15 ring-2 ring-transparent group-hover:ring-indigo-500/25 transition-all shadow-sm">
            <AvatarImage src={user?.avatar_url} />
            <AvatarFallback className="text-[10px] bg-gradient-to-br from-indigo-500/10 to-purple-500/10 text-indigo-600 dark:text-indigo-300 font-extrabold">
              {user?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs font-bold text-muted-foreground group-hover:text-foreground transition-colors duration-200 truncate max-w-[85px] hidden lg:block">
            {user?.full_name?.split(' ')[0]}
          </span>
        </Link>
      </div>
    </header>
  )
}
