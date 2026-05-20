'use client'
import { useQuery } from '@tanstack/react-query'
import { clientsApi } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { Building2, Mail, Phone, MapPin, Briefcase, FileText, ArrowLeft, MoreVertical, CreditCard } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import Link from 'next/link'
import { motion } from 'framer-motion'

const STATUS_COLOR: Record<string, string> = {
  active: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  completed: 'text-indigo-600 dark:text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  planning: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  on_hold: 'text-orange-600 dark:text-orange-400 bg-orange-500/10 border-orange-500/20',
  paid: 'text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  pending: 'text-amber-600 dark:text-amber-400 bg-amber-500/10 border-amber-500/20',
  overdue: 'text-rose-600 dark:text-rose-400 bg-rose-500/10 border-rose-500/20',
}

export default function ClientProfilePage() {
  const params = useParams()
  const router = useRouter()
  const clientId = params?.id as string

  const { data: client, isLoading, isError } = useQuery({
    queryKey: ['client', clientId],
    queryFn: () => clientsApi.get(clientId) as any,
  })

  if (isLoading) return (
    <div className="space-y-6 max-w-5xl">
      <Skeleton className="h-10 w-32 rounded-xl mb-4" />
      <Skeleton className="h-40 rounded-2xl" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Skeleton className="h-64 rounded-2xl" />
        <Skeleton className="h-64 rounded-2xl" />
      </div>
    </div>
  )

  if (isError || !client) return (
    <div className="text-center py-20">
      <p className="text-rose-500">Failed to load client details.</p>
    </div>
  )

  const projects = client.projects || []
  const invoices = client.invoices || []

  const totalBudget = projects.reduce((sum: number, p: any) => sum + parseFloat(p.budget || 0), 0)
  const totalInvoiced = invoices.filter((i: any) => i.status !== 'cancelled').reduce((sum: number, i: any) => sum + parseFloat(i.total || 0), 0)
  const totalPaid = invoices.reduce((sum: number, i: any) => sum + parseFloat(i.amount_paid || 0), 0)
  const pendingBudget = Math.max(totalBudget - totalInvoiced, 0)

  return (
    <div className="space-y-6 max-w-6xl animate-fade-in-up">
      <Button 
        variant="ghost" 
        onClick={() => router.back()} 
        className="mb-2 hover:bg-slate-950/[0.05] dark:hover:bg-white/10 transition-colors"
      >
        <ArrowLeft className="w-4 h-4 mr-2" /> Back to Clients
      </Button>

      {/* Profile Header */}
      <div className="glass-card bg-slate-950/[0.02] dark:bg-card/20 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-3xl p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-[-50px] right-[-50px] w-[200px] h-[200px] bg-indigo-500/10 rounded-full blur-[60px] pointer-events-none" />
        
        <div className="flex flex-col md:flex-row gap-8 items-start md:items-center relative z-10">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex flex-shrink-0 items-center justify-center text-white text-4xl font-extrabold shadow-lg shadow-indigo-500/30">
            {client.name?.charAt(0)?.toUpperCase()}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">{client.name}</h1>
            {client.company && (
              <p className="text-lg text-muted-foreground font-semibold flex items-center gap-2 mt-1">
                <Building2 className="w-5 h-5 text-indigo-500/70" /> {client.company}
              </p>
            )}
            
            <div className="flex flex-wrap gap-4 mt-4 text-sm text-slate-600 dark:text-gray-300 font-medium">
              {client.email && (
                <div className="flex items-center gap-1.5"><Mail className="w-4 h-4 text-indigo-500/60" /> {client.email}</div>
              )}
              {client.phone && (
                <div className="flex items-center gap-1.5"><Phone className="w-4 h-4 text-indigo-500/60" /> {client.phone}</div>
              )}
              {client.gstin && (
                <div className="flex items-center gap-1.5"><FileText className="w-4 h-4 text-indigo-500/60" /> GSTIN: {client.gstin}</div>
              )}
            </div>
            
            {client.address && (
              <div className="mt-3 flex items-start gap-1.5 text-sm text-slate-500 dark:text-gray-400 font-medium max-w-xl">
                <MapPin className="w-4 h-4 text-indigo-500/60 flex-shrink-0 mt-0.5" /> 
                <span>{client.address}</span>
              </div>
            )}
          </div>
          
          <div className="flex gap-4 flex-wrap justify-end min-w-[300px]">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-950/[0.06] dark:border-white/5 shadow-sm min-w-[140px]">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Total Paid</p>
              <p className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                ₹{totalPaid.toLocaleString()}
              </p>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-950/[0.06] dark:border-white/5 shadow-sm min-w-[140px]">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-1">Pending Budget</p>
              <p className="text-xl font-extrabold text-amber-600 dark:text-amber-400 font-mono">
                ₹{pendingBudget.toLocaleString()}
              </p>
              <p className="text-[10px] text-muted-foreground font-semibold mt-1">of ₹{totalBudget.toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Projects Card */}
        <Card className="glass-card bg-slate-950/[0.02] dark:bg-card/20 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl shadow-lg">
          <CardHeader className="border-b border-slate-950/[0.06] dark:border-white/5 pb-4 px-6 pt-6">
            <div className="flex items-center gap-2 text-indigo-600 dark:text-indigo-400">
              <Briefcase className="w-5 h-5" />
              <CardTitle className="text-lg font-bold text-foreground">Associated Workspaces</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {projects.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground/50 border border-dashed border-slate-950/[0.06] dark:border-white/10 rounded-xl">
                <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No workspaces found</p>
              </div>
            ) : projects.map((p: any, i: number) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/dashboard/projects/${p.id}`}>
                  <div className="p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5 bg-slate-950/[0.01] dark:bg-white/[0.01] hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.03] hover:border-indigo-500/30 transition-all flex justify-between items-center group shadow-sm">
                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-indigo-600 transition-colors">{p.name}</h4>
                      <div className="flex items-center gap-3 mt-2 text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1">Progress: <span className="font-mono">{p.progress}%</span></span>
                      </div>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${STATUS_COLOR[p.status] || 'bg-slate-100 text-slate-500'}`}>
                      {p.status.replace('_', ' ')}
                    </Badge>
                  </div>
                </Link>
              </motion.div>
            ))}
          </CardContent>
        </Card>

        {/* Invoices Card */}
        <Card className="glass-card bg-slate-950/[0.02] dark:bg-card/20 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/5 rounded-2xl shadow-lg">
          <CardHeader className="border-b border-slate-950/[0.06] dark:border-white/5 pb-4 px-6 pt-6">
            <div className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400">
              <FileText className="w-5 h-5" />
              <CardTitle className="text-lg font-bold text-foreground">Invoices & Billing</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-4">
            {invoices.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground/50 border border-dashed border-slate-950/[0.06] dark:border-white/10 rounded-xl">
                <FileText className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm font-semibold">No invoices generated yet</p>
              </div>
            ) : invoices.map((inv: any, i: number) => (
              <motion.div key={inv.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <Link href={`/dashboard/invoices`}>
                  <div className="p-4 rounded-xl border border-slate-950/[0.06] dark:border-white/5 bg-slate-950/[0.01] dark:bg-white/[0.01] hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.03] hover:border-cyan-500/30 transition-all flex justify-between items-center group shadow-sm">
                    <div>
                      <h4 className="font-bold text-sm text-foreground group-hover:text-cyan-600 transition-colors">{inv.invoice_number}</h4>
                      <p className="text-xs font-semibold text-muted-foreground mt-1">
                        Amount: <span className="font-mono text-emerald-600 dark:text-emerald-400">₹{parseFloat(inv.total).toLocaleString()}</span>
                      </p>
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full border ${STATUS_COLOR[inv.status] || 'bg-slate-100 text-slate-500'}`}>
                      {inv.status}
                    </Badge>
                  </div>
                </Link>
              </motion.div>
            ))}
          </CardContent>
        </Card>

      </div>
    </div>
  )
}
