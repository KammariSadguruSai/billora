'use client'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Lock, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { createClient } from '@/utils/supabase/client'

type PageState = 'loading' | 'ready' | 'success' | 'error'

export default function ResetPasswordPage() {
  const router = useRouter()
  const [pageState, setPageState] = useState<PageState>('loading')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    // Supabase puts the recovery token in the URL hash:
    // #access_token=...&refresh_token=...&type=recovery
    const hash = window.location.hash
    if (!hash) {
      setErrorMsg('No reset token found. Please request a new password reset link.')
      setPageState('error')
      return
    }

    const params = new URLSearchParams(hash.substring(1))
    const type = params.get('type')
    const accessToken = params.get('access_token')
    const refreshToken = params.get('refresh_token')

    if (type !== 'recovery' || !accessToken) {
      setErrorMsg('Invalid or expired reset link. Please request a new password reset.')
      setPageState('error')
      return
    }

    // Set the Supabase session using the recovery tokens
    const supabase = createClient()
    supabase.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken || '',
    }).then(({ error }) => {
      if (error) {
        setErrorMsg('This reset link has expired or is invalid. Please request a new one.')
        setPageState('error')
      } else {
        setPageState('ready')
      }
    })
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (password.length < 8) {
      toast.error('Password must be at least 8 characters')
      return
    }
    if (password !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setSubmitting(true)
    try {
      const supabase = createClient()
      const { error } = await supabase.auth.updateUser({ password })

      if (error) throw error

      setPageState('success')
      toast.success('Password updated successfully!')

      // Redirect to login after 3 seconds
      setTimeout(() => router.push('/auth/login'), 3000)
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update password. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  const passwordStrength = () => {
    if (password.length === 0) return null
    if (password.length < 6) return { label: 'Too short', color: 'bg-red-500', width: '25%' }
    if (password.length < 8) return { label: 'Weak', color: 'bg-orange-500', width: '50%' }
    if (password.length < 12 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) return { label: 'Good', color: 'bg-yellow-500', width: '75%' }
    return { label: 'Strong', color: 'bg-green-500', width: '100%' }
  }
  const strength = passwordStrength()

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Billora</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Set New Password</h1>
          <p className="text-gray-400">Choose a strong password for your account</p>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          {/* Loading state */}
          {pageState === 'loading' && (
            <div className="text-center py-10">
              <Loader2 className="w-12 h-12 text-indigo-400 mx-auto mb-4 animate-spin" />
              <p className="text-gray-400">Verifying your reset link...</p>
            </div>
          )}

          {/* Error state */}
          {pageState === 'error' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-4">
                <AlertCircle className="w-8 h-8 text-red-400" />
              </div>
              <h2 className="text-xl font-bold mb-2 text-red-300">Link Invalid or Expired</h2>
              <p className="text-gray-400 text-sm mb-6">{errorMsg}</p>
              <div className="flex flex-col gap-3">
                <Link href="/auth/forgot-password">
                  <Button className="w-full gradient-brand border-0 text-white">
                    Request New Reset Link
                  </Button>
                </Link>
                <Link href="/auth/login">
                  <Button variant="outline" className="w-full border-white/10">
                    Back to Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          )}

          {/* Success state */}
          {pageState === 'success' && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-6">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle className="w-8 h-8 text-green-400" />
              </div>
              <h2 className="text-xl font-bold mb-2">Password Updated!</h2>
              <p className="text-gray-400 text-sm mb-2">Your password has been changed successfully.</p>
              <p className="text-gray-500 text-xs mb-6">Redirecting to sign in page...</p>
              <Link href="/auth/login">
                <Button className="w-full gradient-brand border-0 text-white">
                  Sign In Now
                </Button>
              </Link>
            </motion.div>
          )}

          {/* Form state */}
          {pageState === 'ready' && (
            <motion.form
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onSubmit={handleSubmit}
              className="space-y-5"
            >
              {/* New password */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">New Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="pl-10 pr-10 bg-white/5 border-white/10"
                    required
                    minLength={8}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {/* Password strength bar */}
                {strength && (
                  <div className="mt-2">
                    <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full ${strength.color} transition-all duration-300 rounded-full`}
                        style={{ width: strength.width }}
                      />
                    </div>
                    <p className="text-xs text-gray-400 mt-1">{strength.label}</p>
                  </div>
                )}
              </div>

              {/* Confirm password */}
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Confirm Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input
                    type={showConfirm ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="Repeat your new password"
                    className={`pl-10 pr-10 bg-white/5 border-white/10 ${confirmPassword && password !== confirmPassword ? 'border-red-500/50' : confirmPassword && password === confirmPassword ? 'border-green-500/50' : ''}`}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-3 text-gray-400 hover:text-white transition-colors"
                  >
                    {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {confirmPassword && password !== confirmPassword && (
                  <p className="text-red-400 text-xs mt-1">Passwords do not match</p>
                )}
                {confirmPassword && password === confirmPassword && (
                  <p className="text-green-400 text-xs mt-1">✓ Passwords match</p>
                )}
              </div>

              <Button
                type="submit"
                disabled={submitting || !password || !confirmPassword || password !== confirmPassword}
                className="w-full gradient-brand border-0 text-white py-5 text-base"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Updating Password...
                  </span>
                ) : (
                  'Update Password'
                )}
              </Button>

              <Link
                href="/auth/login"
                className="flex items-center justify-center text-sm text-gray-400 hover:text-white transition-colors"
              >
                Back to Sign In
              </Link>
            </motion.form>
          )}
        </div>
      </motion.div>
    </div>
  )
}
