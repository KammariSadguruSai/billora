'use client'
import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useAuthStore } from '@/lib/store'
import { authApi } from '@/lib/api'
import {
  User, Mail, Phone, Building, Bell, Shield, Moon, Sun, LogOut, Camera,
  Palette, Lock, ChevronRight, CheckCircle2, Globe
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import { useTheme } from 'next-themes'
import { Badge } from '@/components/ui/badge'
import { motion, AnimatePresence } from 'framer-motion'

const ROLE_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  admin:   { bg: 'bg-red-500/15',    text: 'text-red-400',    dot: 'bg-red-400' },
  manager: { bg: 'bg-purple-500/15', text: 'text-purple-400', dot: 'bg-purple-400' },
  member:  { bg: 'bg-blue-500/15',   text: 'text-blue-400',   dot: 'bg-blue-400' },
  client:  { bg: 'bg-green-500/15',  text: 'text-green-400',  dot: 'bg-green-400' },
}

const NAV = [
  { id: 'profile',       label: 'Profile',       icon: User,    desc: 'Personal info & company' },
  { id: 'notifications', label: 'Notifications', icon: Bell,    desc: 'Alerts & preferences' },
  { id: 'appearance',    label: 'Appearance',    icon: Palette, desc: 'Theme & display' },
  { id: 'security',      label: 'Security',      icon: Lock,    desc: 'Password & sessions' },
]

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

export default function SettingsPage() {
  const { user, setUser, logout } = useAuthStore()
  const { theme, setTheme } = useTheme()
  const [active, setActive] = useState('profile')

  let companyData: any = {}
  if (user?.role === 'admin' && user?.company) {
    try { companyData = JSON.parse(user.company) } catch { companyData = { name: user.company } }
  }

  const { register, handleSubmit } = useForm({
    values: {
      full_name: user?.full_name || '',
      phone: user?.phone || '',
      company: user?.role === 'admin' ? '' : (user?.company || ''),
      company_name: companyData.name || '',
      company_email: companyData.email || '',
      company_address: companyData.address || '',
      company_gstin: companyData.gstin || '',
    }
  })

  const { mutate: updateProfile, isPending } = useMutation({
    mutationFn: (data: any) => authApi.updateProfile(data) as any,
    onSuccess: (updated: any) => { setUser(updated); toast.success('Profile updated!') },
    onError: () => toast.error('Failed to update profile'),
  })

  const onSubmit = (d: any) => {
    const finalData = { ...d }
    if (user?.role === 'admin') {
      finalData.company = JSON.stringify({
        name: d.company_name, address: d.company_address,
        gstin: d.company_gstin, email: d.company_email,
      })
      delete finalData.company_name
      delete finalData.company_address
      delete finalData.company_gstin
      delete finalData.company_email
    }
    updateProfile(finalData)
  }

  const roleStyle = ROLE_COLORS[user?.role || ''] || ROLE_COLORS.member

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-slate-500 dark:text-gray-400 text-sm mt-1">Manage your account and preferences</p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">

        {/* ── Sidebar Nav ── */}
        <div className="w-full lg:w-64 shrink-0">
          {/* Nav tabs — horizontal scroll on mobile, vertical list on desktop */}
          <div className="flex lg:flex-col gap-1 overflow-x-auto pb-1 lg:pb-0">
            {NAV.map(item => {
              const Icon = item.icon
              const isActive = active === item.id
              return (
                <button
                  key={item.id}
                  onClick={() => setActive(item.id)}
                  className={`flex-shrink-0 lg:w-full flex items-center gap-2 lg:gap-3 px-3 lg:px-4 py-2.5 lg:py-3 rounded-xl text-left transition-all duration-200 group cursor-pointer
                    ${isActive
                      ? 'bg-indigo-500/10 dark:bg-indigo-500/15 text-indigo-600 dark:text-white border border-indigo-500/20 dark:border-indigo-500/30'
                      : 'text-slate-500 dark:text-gray-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-950/[0.03] dark:hover:bg-white/5 border border-transparent'}`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all shrink-0
                    ${isActive ? 'bg-indigo-500 text-white' : 'bg-slate-950/[0.04] dark:bg-white/5 text-slate-500 dark:text-gray-400 group-hover:bg-slate-950/[0.08] dark:group-hover:bg-white/10 group-hover:text-slate-850 dark:group-hover:text-white'}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium whitespace-nowrap">{item.label}</p>
                    <p className="text-[10px] text-slate-500 dark:text-gray-500 truncate hidden lg:block">{item.desc}</p>
                  </div>
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400 shrink-0 hidden lg:block" />}
                </button>
              )
            })}
          </div>

          {/* Sign Out — only shown on desktop sidebar */}
          <button
            onClick={logout}
            className="hidden lg:flex w-full items-center gap-3 px-4 py-3 rounded-xl text-left transition-all duration-200 group text-rose-600 dark:text-rose-400 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 mt-2 cursor-pointer"
          >
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-rose-500/10 text-rose-600 dark:text-rose-400">
              <LogOut className="w-4 h-4" />
            </div>
            <p className="text-sm font-medium">Sign Out</p>
          </button>
        </div>

        {/* ── Content Panel ── */}
        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={active}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.18 }}
            >

              {/* ── PROFILE ── */}
              {active === 'profile' && (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                  {/* Personal Info Card */}
                  <div className="rounded-2xl p-6 space-y-6 bg-slate-950/[0.02] dark:bg-slate-950/20 border border-slate-950/[0.06] dark:border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-950/[0.06] dark:border-white/10">
                      <User className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h2 className="font-semibold text-slate-900 dark:text-white">Personal Information</h2>
                    </div>

                    {/* Avatar Row */}
                    <div className="flex items-center gap-5">
                      <div className="relative shrink-0">
                        <Avatar className="w-20 h-20 ring-4 ring-indigo-500/20">
                          <AvatarImage src={user?.avatar_url} />
                          <AvatarFallback className="text-2xl font-bold bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-white">
                            {user?.full_name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <button type="button"
                          className="absolute -bottom-1 -right-1 w-7 h-7 bg-indigo-500 rounded-full flex items-center justify-center text-white hover:bg-indigo-400 transition-colors shadow-lg cursor-pointer">
                          <Camera className="w-3.5 h-3.5" />
                        </button>
                      </div>
                      <div>
                        <p className="font-bold text-slate-900 dark:text-white text-lg">{user?.full_name || 'Your Name'}</p>
                        <p className="text-slate-500 dark:text-gray-400 text-sm">{user?.email}</p>
                        <p className="text-slate-450 dark:text-gray-500 text-xs mt-1">Click the camera icon to update your photo</p>
                      </div>
                    </div>

                    {/* Fields */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Field label="Full Name">
                        <Input {...register('full_name')}
                          className="bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-450 dark:placeholder:text-gray-600 h-10 rounded-xl" />
                      </Field>
                      <Field label="Email Address">
                        <Input value={user?.email} disabled
                          className="bg-slate-950/[0.02] dark:bg-white/3 border border-slate-950/[0.04] dark:border-white/5 text-slate-400 dark:text-gray-500 cursor-not-allowed h-10 rounded-xl" />
                      </Field>
                      <Field label="Phone Number">
                        <Input {...register('phone')} placeholder="+91 9999999999"
                          className="bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-450 dark:placeholder:text-gray-600 h-10 rounded-xl" />
                      </Field>
                      {user?.role !== 'admin' && (
                        <Field label="Company">
                          <Input {...register('company')} placeholder="Your Company"
                            className="bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-450 dark:placeholder:text-gray-600 h-10 rounded-xl" />
                        </Field>
                      )}
                    </div>
                  </div>

                  {/* Company Details — Admin only */}
                  {user?.role === 'admin' && (
                    <div className="rounded-2xl p-6 space-y-5 bg-slate-950/[0.02] dark:bg-slate-950/20 border border-slate-950/[0.06] dark:border-white/5 backdrop-blur-md">
                      <div className="flex items-center gap-2 pb-4 border-b border-slate-950/[0.06] dark:border-white/10">
                        <Building className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                        <div>
                          <h2 className="font-semibold text-slate-900 dark:text-white">Company Details</h2>
                          <p className="text-xs text-slate-450 dark:text-gray-550 mt-0.5">Shown on all generated invoices</p>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="Company Name">
                          <Input {...register('company_name')} placeholder="PM Portal Services"
                            className="bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-450 dark:placeholder:text-gray-600 h-10 rounded-xl" />
                        </Field>
                        <Field label="Billing Email">
                          <Input {...register('company_email')} placeholder="billing@company.com"
                            className="bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-450 dark:placeholder:text-gray-600 h-10 rounded-xl" />
                        </Field>
                        <Field label="Company Address">
                          <Input {...register('company_address')} placeholder="123 Business Park, City, State"
                            className="bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-450 dark:placeholder:text-gray-600 h-10 rounded-xl" />
                        </Field>
                        <Field label="GSTIN / Tax ID">
                          <Input {...register('company_gstin')} placeholder="22AAAAA0000A1Z5"
                            className="bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-slate-900 dark:text-white placeholder:text-slate-450 dark:placeholder:text-gray-600 h-10 rounded-xl font-mono" />
                        </Field>
                      </div>
                    </div>
                  )}

                  <Button type="submit" disabled={isPending}
                    className="h-11 px-8 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl shadow-lg shadow-indigo-500/25 border-0 transition-all">
                    {isPending ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Saving...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4" /> Save Changes
                      </span>
                    )}
                  </Button>
                </form>
              )}

              {/* ── NOTIFICATIONS ── */}
              {active === 'notifications' && (
                <div className="rounded-2xl p-6 space-y-6 bg-slate-950/[0.02] dark:bg-slate-950/20 border border-slate-950/[0.06] dark:border-white/5 backdrop-blur-md">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-950/[0.06] dark:border-white/10">
                    <Bell className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="font-semibold text-slate-900 dark:text-white">Notification Preferences</h2>
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">Channels</p>
                    {[
                      { key: 'notification_email',    label: 'Email Notifications', desc: 'Receive updates for tasks, invoices & payments', icon: Mail },
                      { key: 'notification_whatsapp', label: 'WhatsApp Alerts',     desc: 'Get critical alerts on WhatsApp (requires phone)', icon: Phone },
                    ].map(item => {
                      const Icon = item.icon
                      return (
                        <div key={item.key}
                          className="flex items-center justify-between p-4 rounded-xl hover:bg-slate-950/[0.04] dark:hover:bg-white/5 border border-slate-950/[0.06] dark:border-white/5 transition-colors"
                        >
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-lg bg-indigo-500/10 dark:bg-indigo-500/15 flex items-center justify-center">
                              <Icon className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-slate-900 dark:text-white">{item.label}</p>
                              <p className="text-xs text-slate-450 dark:text-gray-500 mt-0.5">{item.desc}</p>
                            </div>
                          </div>
                          <Switch
                            defaultChecked={(user as any)?.[item.key]}
                            onCheckedChange={v => updateProfile({ [item.key]: v })}
                          />
                        </div>
                      )
                    })}
                  </div>

                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">Events</p>
                    {[
                      'New task assigned to me',
                      'Invoice sent or paid',
                      'Payment received / verified',
                      'New chat message',
                      'Project status change',
                    ].map(item => (
                      <div key={item}
                        className="flex items-center justify-between px-4 py-3 rounded-xl hover:bg-slate-950/[0.04] dark:hover:bg-white/5 border border-slate-950/[0.06] dark:border-white/5 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-indigo-650 dark:bg-indigo-400 shrink-0" />
                          <p className="text-sm text-slate-700 dark:text-gray-300">{item}</p>
                        </div>
                        <Switch defaultChecked />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* ── APPEARANCE ── */}
              {active === 'appearance' && (
                <div className="rounded-2xl p-6 space-y-6 bg-slate-950/[0.02] dark:bg-slate-950/20 border border-slate-950/[0.06] dark:border-white/5 backdrop-blur-md">
                  <div className="flex items-center gap-2 pb-4 border-b border-slate-950/[0.06] dark:border-white/10">
                    <Palette className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                    <h2 className="font-semibold text-slate-900 dark:text-white">Appearance</h2>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-4">Theme</p>
                    <div className="grid grid-cols-3 gap-3">
                      {[
                        { id: 'dark',   label: 'Dark',   preview: 'linear-gradient(135deg, #0f1117 50%, #1e2139 100%)' },
                        { id: 'light',  label: 'Light',  preview: 'linear-gradient(135deg, #f0f4ff 50%, #e8edf8 100%)' },
                        { id: 'system', label: 'System', preview: 'linear-gradient(135deg, #0f1117 50%, #f0f4ff 50%)' },
                      ].map(t => (
                        <button
                          key={t.id}
                          onClick={() => setTheme(t.id)}
                          className={`relative p-4 rounded-2xl text-sm font-medium capitalize flex flex-col items-center gap-3 transition-all duration-200 border cursor-pointer
                            ${theme === t.id
                              ? 'bg-indigo-500/10 dark:bg-indigo-500/15 border-indigo-500 text-indigo-650 dark:text-white shadow-md dark:shadow-indigo-500/10'
                              : 'border-slate-950/[0.06] dark:border-white/10 text-slate-500 dark:text-gray-400 hover:border-indigo-500/50 dark:hover:border-white/20 hover:text-slate-800 dark:hover:text-white hover:bg-slate-950/[0.02] dark:hover:bg-white/3'}`}
                        >
                          {theme === t.id && (
                            <span className="absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center">
                              <CheckCircle2 className="w-3 h-3 text-white" />
                            </span>
                          )}
                          <div className="w-full h-10 rounded-lg shadow-md" style={{ background: t.preview }} />
                          {t.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-4">Language & Region</p>
                    <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950/[0.02] dark:bg-white/3 border border-slate-950/[0.06] dark:border-white/5">
                      <div className="flex items-center gap-3">
                        <Globe className="w-4 h-4 text-slate-450 dark:text-gray-400" />
                        <div>
                          <p className="text-sm text-slate-900 dark:text-white font-medium">Language</p>
                          <p className="text-xs text-slate-500 dark:text-gray-500">English (India)</p>
                        </div>
                      </div>
                      <Badge className="bg-slate-950/[0.04] dark:bg-white/5 text-slate-500 dark:text-gray-400 text-xs border border-slate-950/[0.06] dark:border-white/10">Default</Badge>
                    </div>
                  </div>
                </div>
              )}

              {/* ── SECURITY ── */}
              {active === 'security' && (
                <div className="space-y-4">
                  <div className="rounded-2xl p-6 space-y-5 bg-slate-950/[0.02] dark:bg-slate-950/20 border border-slate-950/[0.06] dark:border-white/5 backdrop-blur-md">
                    <div className="flex items-center gap-2 pb-4 border-b border-slate-950/[0.06] dark:border-white/10">
                      <Lock className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
                      <h2 className="font-semibold text-slate-900 dark:text-white">Security Settings</h2>
                    </div>

                    <div className="p-5 rounded-xl flex items-start gap-4 bg-indigo-500/5 dark:bg-indigo-500/[0.08] border border-indigo-500/20 dark:border-indigo-500/30">
                      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center shrink-0">
                        <Lock className="w-5 h-5 text-indigo-655 dark:text-indigo-400" />
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold text-slate-900 dark:text-white text-sm">Change Password</p>
                        <p className="text-xs text-slate-500 dark:text-gray-400 mt-1 leading-relaxed">
                          For security, password changes are handled via email verification through Supabase Auth.
                        </p>
                        <Button size="sm" variant="outline"
                          className="mt-3 border-indigo-500/30 text-indigo-600 dark:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 text-xs h-8 cursor-pointer"
                          onClick={() => toast.info('Password reset email sent!')}>
                          Send Reset Link
                        </Button>
                      </div>
                    </div>

                    <div>
                      <p className="text-xs font-semibold text-slate-400 dark:text-gray-500 uppercase tracking-wider mb-3">Active Sessions</p>
                      <div className="p-4 rounded-xl flex items-center justify-between bg-slate-950/[0.02] dark:bg-white/3 border border-slate-950/[0.06] dark:border-white/5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-lg bg-green-500/10 dark:bg-green-500/15 flex items-center justify-center">
                            <Shield className="w-4 h-4 text-green-650 dark:text-green-400" />
                          </div>
                          <div>
                            <p className="text-sm text-slate-900 dark:text-white font-medium">Current Browser</p>
                            <p className="text-xs text-slate-550 dark:text-gray-500">Last active: just now</p>
                          </div>
                        </div>
                        <Badge className="bg-green-500/10 dark:bg-green-500/15 text-green-655 dark:text-green-400 border border-green-500/20 dark:border-green-500/30 text-[10px] font-bold">
                          ● ACTIVE
                        </Badge>
                      </div>
                    </div>
                  </div>

                  {/* Danger Zone */}
                  <div className="rounded-2xl p-6 bg-rose-500/5 dark:bg-rose-500/[0.04] border border-rose-500/10 dark:border-rose-500/20">
                    <p className="text-sm font-semibold text-rose-600 dark:text-rose-400 mb-1">Danger Zone</p>
                    <p className="text-xs text-slate-450 dark:text-gray-500 mb-4">These actions cannot be undone. Please be careful.</p>
                    <Button onClick={logout} variant="destructive" size="sm" className="gap-2 h-9 text-xs font-semibold cursor-pointer">
                      <LogOut className="w-3.5 h-3.5" /> Sign Out of All Devices
                    </Button>
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        </div>

      </div>
    </div>
  )
}
