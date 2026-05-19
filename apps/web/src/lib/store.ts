import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { authApi } from './api'

interface User {
  id: string
  email: string
  full_name: string
  role: 'admin' | 'manager' | 'member' | 'client'
  avatar_url?: string
  phone?: string
  company?: string
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  _hasHydrated: boolean
  setHasHydrated: (v: boolean) => void
  login: (email: string, password: string) => Promise<void>
  register: (data: any) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
  setToken: (token: string) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      _hasHydrated: false,
      setHasHydrated: (v: boolean) => set({ _hasHydrated: v }),

      login: async (email: string, password: string) => {
        set({ isLoading: true })
        try {
          const res: any = await authApi.login(email, password)
          localStorage.setItem('pm_token', res.token)
          set({ user: res.user, token: res.token, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      register: async (data: any) => {
        set({ isLoading: true })
        try {
          const res: any = await authApi.register(data)
          localStorage.setItem('pm_token', res.token)
          set({ user: res.user, token: res.token, isLoading: false })
        } catch (err) {
          set({ isLoading: false })
          throw err
        }
      },

      logout: () => {
        localStorage.removeItem('pm_token')
        localStorage.removeItem('pm-auth')
        set({ user: null, token: null })
        window.location.href = '/auth/login'
      },

      setUser: (user: User) => set({ user }),
      setToken: (token: string) => {
        localStorage.setItem('pm_token', token)
        set({ token })
      },
    }),
    {
      name: 'pm-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true)
      },
    }
  )
)

// ─── Notification Store ───────────────────────────────────────────────────────
interface NotificationState {
  notifications: any[]
  unreadCount: number
  addNotification: (n: any) => void
  setNotifications: (notifications: any[], unread: number) => void
  markRead: (id: string) => void
  markAllRead: () => void
}

export const useNotificationStore = create<NotificationState>((set) => ({
  notifications: [],
  unreadCount: 0,
  addNotification: (n) => set((state) => ({
    notifications: [n, ...state.notifications].slice(0, 50),
    unreadCount: state.unreadCount + 1,
  })),
  setNotifications: (notifications, unread) => set({ notifications, unreadCount: unread }),
  markRead: (id) => set((state) => ({
    notifications: state.notifications.map(n => n.id === id ? { ...n, is_read: true } : n),
    unreadCount: Math.max(0, state.unreadCount - 1),
  })),
  markAllRead: () => set((state) => ({
    notifications: state.notifications.map(n => ({ ...n, is_read: true })),
    unreadCount: 0,
  })),
}))
