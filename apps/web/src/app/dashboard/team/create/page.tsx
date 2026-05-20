'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthStore } from '@/lib/store'
import { hrApi } from '@/lib/api'
import {
  User, Mail, Lock, Droplets, Briefcase, Building2,
  ChevronRight, Sparkles, RefreshCw, Copy, Check, Eye, EyeOff,
  BadgeCheck, ArrowLeft
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

// ── Role/Dept config ──────────────────────────────────────────────────────────
const ROLES = [
  { value: 'manager', label: 'Manager',  prefix: 'MGR', color: '#c084fc', desc: 'Team management, project oversight' },
  { value: 'finance', label: 'Finance',  prefix: 'FIN', color: '#34d399', desc: 'Invoices, payments, payslip management' },
  { value: 'member',  label: 'Member',   prefix: 'EMP', color: '#60a5fa', desc: 'Developer, Tester, R&D, Operations, etc.' },
]

const DEPARTMENTS = [
  'Developer', 'Frontend', 'Backend', 'Full Stack', 'Mobile',
  'Testing / QA', 'R&D', 'Finance', 'HR', 'Operations',
  'Design / UI-UX', 'Marketing', 'Sales', 'Customer Support',
]

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-']

function generatePassword(len = 12) {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$'
  return Array.from(crypto.getRandomValues(new Uint8Array(len)))
    .map(b => chars[b % chars.length]).join('')
}

function getPreviewId(role: string) {
  const map: Record<string, string> = { manager: 'MGR', finance: 'FIN', member: 'EMP' }
  return `${map[role] || 'EMP'}-XXX`
}

export default function CreateEmployeePage() {
  const router = useRouter()
  const { user } = useAuthStore()

  const [form, setForm] = useState({
    full_name: '', email: '', password: generatePassword(),
    role: 'member', department: '', blood_group: '', phone: '',
    salary: '', send_email: true,
  })
  const [showPass, setShowPass] = useState(false)
  const [copied, setCopied] = useState(false)
  const [loading, setLoading] = useState(false)
  const [created, setCreated] = useState<any>(null)

  if (user?.role !== 'admin') {
    return (
      <div className="flex items-center justify-center h-96">
        <p className="text-muted-foreground">Access denied — Admin only</p>
      </div>
    )
  }

  const set = (k: string, v: any) => setForm(prev => ({ ...prev, [k]: v }))

  const refreshPassword = () => set('password', generatePassword())

  const copyPassword = async () => {
    await navigator.clipboard.writeText(form.password)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!form.full_name || !form.email || !form.password || !form.role) {
      toast.error('Name, email, password and role are required')
      return
    }
    setLoading(true)
    try {
      const res: any = await hrApi.createEmployee({
        ...form,
        salary: form.salary ? parseFloat(form.salary) : 0,
      })
      setCreated(res.employee)
      toast.success(`${res.employee.full_name} added! Employee ID: ${res.employee.employee_id}`)
      if (!res.emailSent && form.send_email) {
        toast.warning('Email could not be sent — SMTP not configured. Share credentials manually.')
      }
    } catch (err: any) {
      toast.error(err?.error || 'Failed to create employee')
    } finally {
      setLoading(false)
    }
  }

  const selectedRole = ROLES.find(r => r.value === form.role)

  if (created) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="w-full max-w-md">
          <div className="glass-card rounded-2xl p-8 text-center space-y-6 border border-border">
            <div className="w-16 h-16 rounded-2xl mx-auto flex items-center justify-center"
              style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
              <BadgeCheck className="w-8 h-8 text-indigo-400" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-foreground mb-1">Employee Created!</h2>
              <p className="text-muted-foreground text-sm">Account is ready and credentials have been sent.</p>
            </div>

            <div className="space-y-3 text-left">
              {[
                { label: 'Employee ID', value: created.employee_id, highlight: true },
                { label: 'Name', value: created.full_name },
                { label: 'Email', value: created.email },
                { label: 'Role', value: created.role },
                { label: 'Department', value: created.department || '—' },
              ].map(row => (
                <div key={row.label} className="flex justify-between items-center py-2 border-b border-border/50 last:border-0">
                  <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">{row.label}</span>
                  <span className={`text-sm font-bold ${row.highlight ? 'text-indigo-400' : 'text-foreground'}`}>{row.value}</span>
                </div>
              ))}
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => { setCreated(null); setForm({ full_name:'',email:'',password:generatePassword(),role:'member',department:'',blood_group:'',phone:'',salary:'',send_email:true }) }}
                className="flex-1 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-accent transition-all"
              >
                Add Another
              </button>
              <Link href="/dashboard/team" className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white text-center transition-all"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                View Team →
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen p-4 sm:p-6 lg:p-8">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <Link href="/dashboard/team"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Team
          </Link>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-black text-foreground tracking-tight">Add Employee</h1>
              <p className="text-sm text-muted-foreground">Create an account and send credentials via email</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">

          {/* Role selector */}
          <div className="glass-card rounded-2xl p-5 border border-border">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Select Role</p>
            <div className="grid grid-cols-3 gap-3">
              {ROLES.map(r => (
                <button type="button" key={r.value}
                  onClick={() => set('role', r.value)}
                  className={`p-3.5 rounded-xl border text-left transition-all duration-200 ${
                    form.role === r.value
                      ? 'border-transparent shadow-lg'
                      : 'border-border hover:border-border/80 hover:bg-accent/40'
                  }`}
                  style={form.role === r.value ? {
                    background: `${r.color}14`,
                    border: `1px solid ${r.color}40`,
                    boxShadow: `0 0 20px ${r.color}15`
                  } : {}}
                >
                  <p className="font-black text-sm text-foreground">{r.label}</p>
                  <p className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{r.desc}</p>
                  <p className="mt-2 text-[10px] font-mono font-bold"
                    style={{ color: r.color }}>{getPreviewId(r.value)}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Personal Info */}
          <div className="glass-card rounded-2xl p-5 border border-border space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Personal Info</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Full Name *</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input required value={form.full_name} onChange={e => set('full_name', e.target.value)}
                    placeholder="John Smith"
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Phone</label>
                <input value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-4 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Department</label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select value={form.department} onChange={e => set('department', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none">
                    <option value="">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Blood Group</label>
                <div className="relative">
                  <Droplets className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <select value={form.blood_group} onChange={e => set('blood_group', e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring transition-all appearance-none">
                    <option value="">Select blood group</option>
                    {BLOOD_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Credentials */}
          <div className="glass-card rounded-2xl p-5 border border-border space-y-4">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground">Login Credentials</p>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Work Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input required type="email" value={form.email} onChange={e => set('email', e.target.value)}
                  placeholder="john@company.com"
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Temporary Password *</label>
              <div className="relative flex gap-2">
                <div className="relative flex-1">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input required type={showPass ? 'text' : 'password'} value={form.password}
                    onChange={e => set('password', e.target.value)}
                    className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-sm font-mono focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <button type="button" onClick={refreshPassword} title="Generate new password"
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                  <RefreshCw className="w-4 h-4" />
                </button>
                <button type="button" onClick={copyPassword} title="Copy password"
                  className="w-10 h-10 flex items-center justify-center rounded-xl border border-border bg-muted/40 text-muted-foreground hover:text-foreground hover:bg-accent transition-all">
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-1.5">Employee must change this after first login.</p>
            </div>
          </div>

          {/* Salary (optional) */}
          <div className="glass-card rounded-2xl p-5 border border-border">
            <p className="text-xs font-black uppercase tracking-widest text-muted-foreground mb-3">Compensation (Admin only)</p>
            <div className="relative">
              <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <span className="absolute left-9 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">₹</span>
              <input type="number" min="0" value={form.salary} onChange={e => set('salary', e.target.value)}
                placeholder="Monthly base salary"
                className="w-full pl-14 pr-4 py-2.5 rounded-xl border border-border bg-muted/40 text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-ring transition-all" />
            </div>
            <p className="text-[10px] text-muted-foreground mt-1.5">Only visible to Admin. Finance team cannot modify salary.</p>
          </div>

          {/* Email toggle */}
          <div className="flex items-center justify-between glass-card rounded-xl px-4 py-3 border border-border">
            <div>
              <p className="text-sm font-semibold text-foreground">Send credentials via email</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">Sends a welcome email with login details</p>
            </div>
            <button type="button" onClick={() => set('send_email', !form.send_email)}
              className={`w-11 h-6 rounded-full transition-all duration-200 relative ${form.send_email ? 'bg-indigo-500' : 'bg-muted'}`}>
              <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-200 ${form.send_email ? 'left-[22px]' : 'left-0.5'}`} />
            </button>
          </div>

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="w-full py-3.5 rounded-xl font-black text-sm text-white flex items-center justify-center gap-2 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
            style={{ background: 'linear-gradient(135deg,#6366f1 0%,#8b5cf6 60%,#06b6d4 100%)', boxShadow: '0 0 24px rgba(99,102,241,0.35)' }}>
            {loading ? (
              <><RefreshCw className="w-4 h-4 animate-spin" /> Creating account…</>
            ) : (
              <>Create Employee Account <ChevronRight className="w-4 h-4" /></>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}
