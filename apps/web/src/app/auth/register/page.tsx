'use client'
import { useState } from 'react'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { BarChart3, Mail, Lock, User, Building, Eye, EyeOff, Phone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'

const schema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email'),
  phone: z.string().min(10, 'WhatsApp number is required for account creation'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  company: z.string().optional(),
})

export default function RegisterPage() {
  const router = useRouter()
  const { register: registerUser, isLoading } = useAuthStore()
  const [showPassword, setShowPassword] = useState(false)
  const { register, handleSubmit, formState: { errors } } = useForm({ resolver: zodResolver(schema) })

  const onSubmit = async (data: any) => {
    try {
      await registerUser({ ...data, role: 'client' })
      toast.success('Account created! Welcome aboard!')
      router.push('/dashboard')
    } catch (err: any) {
      toast.error(err?.error || 'Registration failed')
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
          <h1 className="text-3xl font-bold mb-2">Create your account</h1>
          <p className="text-gray-400">Start managing projects for free</p>
        </div>

        <div className="glass-card p-8 rounded-2xl">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Full Name</label>
              <div className="relative">
                <User className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input {...register('full_name')} placeholder="John Doe" className="pl-10 bg-white/5 border-white/10" />
              </div>
              {errors.full_name && <p className="text-red-400 text-xs mt-1">{errors.full_name.message as string}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input {...register('email')} type="email" placeholder="you@example.com" className="pl-10 bg-white/5 border-white/10" />
              </div>
              {errors.email && <p className="text-red-400 text-xs mt-1">{errors.email.message as string}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">WhatsApp Number *</label>
              <div className="relative">
                <Phone className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input {...register('phone')} placeholder="+91 9876543210" className="pl-10 bg-white/5 border-white/10" />
              </div>
              {errors.phone && <p className="text-red-400 text-xs mt-1">{errors.phone.message as string}</p>}
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Company (Optional)</label>
              <div className="relative">
                <Building className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input {...register('company')} placeholder="Your Company" className="pl-10 bg-white/5 border-white/10" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-300 mb-2 block">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
                <Input {...register('password')} type={showPassword ? 'text' : 'password'} placeholder="Min 8 characters" className="pl-10 pr-10 bg-white/5 border-white/10" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3 text-gray-400">
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && <p className="text-red-400 text-xs mt-1">{errors.password.message as string}</p>}
            </div>

            <Button type="submit" disabled={isLoading} className="w-full gradient-brand border-0 text-white py-5 text-base">
              {isLoading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Already have an account?{' '}
            <Link href="/auth/login" className="text-indigo-400 hover:text-indigo-300 font-medium">Sign in</Link>
          </p>
        </div>
      </motion.div>
    </div>
  )
}

