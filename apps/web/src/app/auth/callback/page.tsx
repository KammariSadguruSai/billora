'use client'
import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { createClient } from '@/utils/supabase/client'
import api from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { toast } from 'sonner'

import { Suspense } from 'react'

function AuthCallbackContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { setToken, setUser } = useAuthStore()
  const [error, setError] = useState('')

  useEffect(() => {
    const handleAuth = async () => {
      try {
        const supabase = createClient()
        let refreshToken = null

        // 1. Check for PKCE code in URL query params
        const code = searchParams.get('code')
        
        if (code) {
          const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)
          if (exchangeError) throw exchangeError
          refreshToken = data.session?.refresh_token
        } 
        // 2. Check for Implicit flow in URL hash (#access_token=...&refresh_token=...)
        else if (window.location.hash) {
          const params = new URLSearchParams(window.location.hash.substring(1))
          refreshToken = params.get('refresh_token')
          const accessToken = params.get('access_token')
          
          if (accessToken && refreshToken) {
            await supabase.auth.setSession({ access_token: accessToken, refresh_token: refreshToken })
          }
        }

        if (!refreshToken) {
          throw new Error('No authentication token found in URL.')
        }

        // 3. Exchange Supabase refresh_token for our Custom Express JWT (pm_token)
        const res: any = await api.post('/auth/refresh', { refresh_token: refreshToken })
        
        if (res.token && res.user) {
          setToken(res.token)
          setUser(res.user)
          toast.success('Successfully logged in!')
          router.push('/dashboard')
        } else {
          throw new Error('Failed to retrieve application token.')
        }

      } catch (err: any) {
        console.error('Auth callback error:', err)
        setError(err.message || 'Authentication failed. Please try logging in again.')
        setTimeout(() => {
          router.push('/auth/login')
        }, 3000)
      }
    }

    handleAuth()
  }, [searchParams, router, setToken, setUser])

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4 text-center">
      <div className="glass-card p-10 rounded-2xl max-w-md w-full">
        {error ? (
          <div>
            <div className="text-red-400 mb-4 text-lg font-medium">Authentication Error</div>
            <p className="text-gray-400 text-sm">{error}</p>
            <p className="text-gray-500 text-xs mt-4">Redirecting to login...</p>
          </div>
        ) : (
          <div>
            <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" />
            <h2 className="text-xl font-bold text-white mb-2">Authenticating...</h2>
            <p className="text-gray-400 text-sm">Please wait while we log you in securely.</p>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen gradient-hero flex items-center justify-center p-4 text-center">
        <Loader2 className="w-12 h-12 text-indigo-400 mx-auto animate-spin" />
      </div>
    }>
      <AuthCallbackContent />
    </Suspense>
  )
}
