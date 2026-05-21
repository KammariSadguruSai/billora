'use client'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import Sidebar from '@/components/dashboard/Sidebar'
import Topbar from '@/components/dashboard/Topbar'
import { toast } from 'sonner'

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, token, _hasHydrated } = useAuthStore()
  const router = useRouter()
  const [mobileOpen, setMobileOpen] = useState(false)

  useEffect(() => {
    // Only redirect AFTER Zustand has finished restoring from localStorage
    if (_hasHydrated && !token && !user) {
      router.push('/auth/login')
    }
  }, [_hasHydrated, token, user, router])

  // Show spinner while Zustand is still rehydrating from localStorage
  if (!_hasHydrated) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <img src="/logo.svg" alt="Billora" className="h-12 w-auto opacity-80" />
          <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    )
  }

  // Already hydrated but no user — redirect happening, show minimal spinner
  if (!user) {
    return (
      <div className="min-h-screen gradient-hero flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="flex h-[100dvh] overflow-hidden bg-background">
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <Topbar onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 bg-background relative">
          {user.role === 'client' && !user.phone ? (
            <WhatsAppGate />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  )
}

function WhatsAppGate() {
  const [phoneInput, setPhoneInput] = useState('')
  const [isUpdatingPhone, setIsUpdatingPhone] = useState(false)
  const { updateUserProfile } = useAuthStore()
  
  const handleUpdatePhone = async () => {
    if (phoneInput.length < 10) {
      toast.error('Please enter a valid WhatsApp number')
      return
    }
    setIsUpdatingPhone(true)
    try {
      // Need to use the actual store method name
      const store = useAuthStore.getState()
      await store.updateProfile({ phone: phoneInput })
      toast.success('WhatsApp number updated!')
    } catch (err: any) {
      toast.error(err?.error || 'Failed to update phone number')
    } finally {
      setIsUpdatingPhone(false)
    }
  }

  return (
    <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="glass border-slate-950/[0.06] dark:border-white/10 bg-white dark:bg-card max-w-md w-full p-8 rounded-2xl text-center shadow-2xl">
        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-foreground mb-2">WhatsApp Required</h2>
        <p className="text-sm text-muted-foreground mb-6">
          To provide you with real-time updates and seamless communication, a valid WhatsApp number is required before accessing the dashboard.
        </p>
        <div className="space-y-4">
          <input 
            type="text"
            placeholder="+91 9876543210" 
            value={phoneInput} 
            onChange={(e) => setPhoneInput(e.target.value)}
            className="w-full rounded-lg bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-center text-lg py-4 text-foreground font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
          <button 
            onClick={handleUpdatePhone} 
            disabled={isUpdatingPhone} 
            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white border-0 font-bold py-4 rounded-xl transition-colors disabled:opacity-50"
          >
            {isUpdatingPhone ? 'Updating...' : 'Continue to Dashboard'}
          </button>
        </div>
      </div>
    </div>
  )
}
