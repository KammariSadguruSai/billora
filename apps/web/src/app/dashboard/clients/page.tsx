'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { clientsApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Search, Plus, Building2, Mail, Phone, MoreVertical, TrendingUp, FileText, Trash2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Skeleton } from '@/components/ui/skeleton'
import { toast } from 'sonner'
import { useForm } from 'react-hook-form'
import Link from 'next/link'

function CreateClientDialog({ onSuccess }: { onSuccess: () => void }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { register, handleSubmit, reset } = useForm()
  const { mutate, isPending } = useMutation({
    mutationFn: (data: any) => clientsApi.create(data) as any,
    onSuccess: () => { toast.success('Client added!'); qc.invalidateQueries({ queryKey: ['clients'] }); setOpen(false); reset(); onSuccess() },
    onError: () => toast.error('Failed to create client'),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button className="gradient-brand border-0 text-white gap-2 font-bold" />}>
        <Plus className="w-4 h-4" /> Add Client
      </DialogTrigger>
      <DialogContent className="glass border-slate-950/[0.06] dark:border-white/10 bg-white dark:bg-card max-w-lg shadow-2xl rounded-2xl">
        <DialogHeader><DialogTitle className="text-lg font-extrabold text-foreground">Add New Client</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-slate-700 dark:text-gray-300 mb-1.5 block font-bold">Name *</label><Input {...register('name', { required: true })} placeholder="John Doe" className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground font-semibold" /></div>
            <div><label className="text-sm text-slate-700 dark:text-gray-300 mb-1.5 block font-bold">Email *</label><Input {...register('email', { required: true })} type="email" placeholder="john@company.com" className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground font-semibold" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-slate-700 dark:text-gray-300 mb-1.5 block font-bold">Company</label><Input {...register('company')} placeholder="Company Ltd." className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground font-semibold" /></div>
            <div><label className="text-sm text-slate-700 dark:text-gray-300 mb-1.5 block font-bold">Phone</label><Input {...register('phone')} placeholder="+91 9999999999" className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground font-semibold" /></div>
          </div>
          <div><label className="text-sm text-slate-700 dark:text-gray-300 mb-1.5 block font-bold">GSTIN</label><Input {...register('gstin')} placeholder="22AAAAA0000A1Z5" className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground font-semibold" /></div>
          <div><label className="text-sm text-slate-700 dark:text-gray-300 mb-1.5 block font-bold">Address</label>
            <textarea {...register('address')} rows={2} placeholder="Full address..." className="w-full rounded-lg bg-slate-950/[0.01] dark:bg-white/5 border border-slate-950/[0.06] dark:border-white/10 text-sm px-3 py-2 text-foreground font-semibold placeholder-muted-foreground/50 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500" />
          </div>
          <div><label className="text-sm text-slate-700 dark:text-gray-300 mb-1.5 block font-bold">Notes</label><Input {...register('notes')} placeholder="Any notes..." className="bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground font-semibold" /></div>
          <Button type="submit" disabled={isPending} className="w-full gradient-brand border-0 text-white font-bold">{isPending ? 'Adding...' : 'Add Client'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ClientsPage() {
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')
  const qc = useQueryClient()
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsApi.list({ search: search || undefined }) as any,
    staleTime: 30000,
  })

  const clients = data?.data || []
  const totalBilled = clients.reduce((s: number, c: any) => s + parseFloat(c.total_billed || 0), 0)
  const totalPaid = clients.reduce((s: number, c: any) => s + parseFloat(c.total_paid || 0), 0)

  const deleteMutation = useMutation({
    mutationFn: (id: string) => clientsApi.delete(id),
    onSuccess: () => {
      toast.success('Client deleted successfully')
      qc.invalidateQueries({ queryKey: ['clients'] })
    },
    onError: () => toast.error('Failed to delete client'),
  })

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.preventDefault()
    if (window.confirm('Are you sure you want to delete this client? All associated projects and invoices might be affected.')) {
      deleteMutation.mutate(id)
    }
  }

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Clients</h1>
          <p className="text-slate-500 dark:text-gray-400 text-sm mt-1 font-semibold">{data?.total || 0} clients · ₹{(totalBilled/1000).toFixed(0)}K billed · ₹{(totalPaid/1000).toFixed(0)}K paid</p>
        </div>
        <CreateClientDialog onSuccess={refetch} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Clients', value: data?.total || 0, color: 'text-indigo-600 dark:text-indigo-400' },
          { label: 'Total Billed', value: `₹${(totalBilled/1000).toFixed(1)}K`, color: 'text-emerald-600 dark:text-emerald-400' },
          { label: 'Outstanding', value: `₹${((totalBilled - totalPaid)/1000).toFixed(1)}K`, color: 'text-amber-600 dark:text-amber-400' },
        ].map((s, i) => (
          <div key={i} className="glass-card bg-slate-950/[0.02] dark:bg-card/25 backdrop-blur-md border border-slate-950/[0.06] dark:border-white/10 rounded-xl p-4 shadow-sm">
            <p className="text-sm text-slate-500 dark:text-gray-400 mb-1 font-semibold">{s.label}</p>
            <p className={`text-2xl font-extrabold font-mono ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500 dark:text-gray-400" />
        <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-slate-950/[0.01] dark:bg-white/5 border-slate-950/[0.06] dark:border-white/10 text-foreground font-semibold" />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{[...Array(6)].map((_, i) => <Skeleton key={i} className="h-48 rounded-xl" />)}</div>
      ) : clients.length === 0 ? (
        <div className="text-center py-20 text-gray-500"><Building2 className="w-12 h-12 mx-auto mb-4 opacity-30" /><p>No clients yet</p></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((client: any, i: number) => (
            <motion.div key={client.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <Link href={`/dashboard/clients/${client.id}`}>
                <div className="glass-card bg-slate-950/[0.01] dark:bg-white/[0.01] hover:bg-slate-950/[0.03] dark:hover:bg-white/[0.02] border border-slate-950/[0.06] dark:border-white/10 rounded-xl p-5 cursor-pointer hover:border-indigo-500/30 transition-all shadow-sm hover:shadow-md relative group">
                  {user?.role === 'admin' && (
                    <button
                      onClick={(e) => handleDelete(e, client.id)}
                      className="absolute top-3 right-3 p-2 rounded-lg opacity-0 group-hover:opacity-100 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition-all z-10"
                      title="Delete Client"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 flex items-center justify-center text-indigo-600 dark:text-indigo-400 text-lg font-extrabold border border-indigo-500/20">
                      {client.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="text-right pr-8">
                      <p className="text-xs text-slate-500 dark:text-gray-400 font-semibold">Billed</p>
                      <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">₹{parseFloat(client.total_billed || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <h3 className="font-extrabold text-sm mb-0.5 text-foreground pr-8">{client.name}</h3>
                  {client.company && <p className="text-xs text-slate-500 dark:text-gray-400 font-bold mb-3">{client.company}</p>}
                  <div className="space-y-1.5">
                    {client.email && <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 font-semibold"><Mail className="w-3.5 h-3.5 text-indigo-500/70 dark:text-indigo-400/70" /><span className="truncate">{client.email}</span></div>}
                    {client.phone && <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-gray-400 font-semibold"><Phone className="w-3.5 h-3.5 text-indigo-500/70 dark:text-indigo-400/70" /><span>{client.phone}</span></div>}
                  </div>
                  {client.gstin && <div className="mt-3 pt-3 border-t border-slate-950/[0.06] dark:border-white/5 text-xs text-slate-500 dark:text-gray-500 font-bold">GSTIN: {client.gstin}</div>}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
