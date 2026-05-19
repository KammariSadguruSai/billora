'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { BarChart3, Mail, ArrowLeft, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { authApi } from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    try {
      await authApi.forgotPassword(email)
      setSent(true)
      toast.success('Reset email sent!')
    } catch {
      toast.error('Failed to send reset email. Check the email address.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen gradient-hero flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold gradient-text">Billora</span>
          </Link>
          <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
          <p className="text-gray-400">We'll send you a reset link</p>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          {sent ? (
            <div className="text-center py-6">
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Check your email</h2>
              <p className="text-gray-400 text-sm mb-6">We sent a password reset link to <span className="text-white font-medium">{email}</span></p>
              <Link href="/auth/login">
                <Button variant="outline" className="border-white/10">Back to Sign In</Button>
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="text-sm font-medium text-gray-300 mb-2 block">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                  <Input value={email} onChange={e => setEmail(e.target.value)} type="email" placeholder="you@example.com" className="pl-10 bg-white/5 border-white/10" required />
                </div>
              </div>
              <Button type="submit" disabled={loading} className="w-full gradient-brand border-0 text-white py-5 text-base">
                {loading ? 'Sending...' : 'Send Reset Link'}
              </Button>
              <Link href="/auth/login" className="flex items-center justify-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mt-4">
                <ArrowLeft className="w-4 h-4" /> Back to Sign In
              </Link>
            </form>
          )}
        </div>
      </motion.div>
    </div>
  )
}

