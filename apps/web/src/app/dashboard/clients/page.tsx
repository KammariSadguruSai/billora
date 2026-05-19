'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState } from 'react'
import { motion } from 'framer-motion'
import { clientsApi } from '@/lib/api'
import { Search, Plus, Building2, Mail, Phone, MoreVertical, TrendingUp, FileText } from 'lucide-react'
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
      <DialogTrigger render={<Button className="gradient-brand border-0 text-white gap-2" />}>
        <Plus className="w-4 h-4" /> Add Client
      </DialogTrigger>
      <DialogContent className="glass border-white/10 max-w-lg">
        <DialogHeader><DialogTitle>Add New Client</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit(d => mutate(d))} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-300 mb-1.5 block">Name *</label><Input {...register('name', { required: true })} placeholder="John Doe" className="bg-white/5 border-white/10" /></div>
            <div><label className="text-sm text-gray-300 mb-1.5 block">Email *</label><Input {...register('email', { required: true })} type="email" placeholder="john@company.com" className="bg-white/5 border-white/10" /></div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div><label className="text-sm text-gray-300 mb-1.5 block">Company</label><Input {...register('company')} placeholder="Company Ltd." className="bg-white/5 border-white/10" /></div>
            <div><label className="text-sm text-gray-300 mb-1.5 block">Phone</label><Input {...register('phone')} placeholder="+91 9999999999" className="bg-white/5 border-white/10" /></div>
          </div>
          <div><label className="text-sm text-gray-300 mb-1.5 block">GSTIN</label><Input {...register('gstin')} placeholder="22AAAAA0000A1Z5" className="bg-white/5 border-white/10" /></div>
          <div><label className="text-sm text-gray-300 mb-1.5 block">Address</label>
            <textarea {...register('address')} rows={2} placeholder="Full address..." className="w-full rounded-lg bg-white/5 border border-white/10 text-sm px-3 py-2 text-gray-200 placeholder-gray-500 resize-none" />
          </div>
          <div><label className="text-sm text-gray-300 mb-1.5 block">Notes</label><Input {...register('notes')} placeholder="Any notes..." className="bg-white/5 border-white/10" /></div>
          <Button type="submit" disabled={isPending} className="w-full gradient-brand border-0 text-white">{isPending ? 'Adding...' : 'Add Client'}</Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default function ClientsPage() {
  const [search, setSearch] = useState('')
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['clients', search],
    queryFn: () => clientsApi.list({ search: search || undefined }) as any,
    staleTime: 30000,
  })

  const clients = data?.data || []
  const totalBilled = clients.reduce((s: number, c: any) => s + parseFloat(c.total_billed || 0), 0)
  const totalPaid = clients.reduce((s: number, c: any) => s + parseFloat(c.total_paid || 0), 0)

  return (
    <div className="space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Clients</h1>
          <p className="text-gray-400 text-sm mt-1">{data?.total || 0} clients · ₹{(totalBilled/1000).toFixed(0)}K billed · ₹{(totalPaid/1000).toFixed(0)}K paid</p>
        </div>
        <CreateClientDialog onSuccess={refetch} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Total Clients', value: data?.total || 0, color: '#6366f1' },
          { label: 'Total Billed', value: `₹${(totalBilled/1000).toFixed(1)}K`, color: '#10b981' },
          { label: 'Outstanding', value: `₹${((totalBilled - totalPaid)/1000).toFixed(1)}K`, color: '#f59e0b' },
        ].map((s, i) => (
          <div key={i} className="glass-card border border-white/10 rounded-xl p-4">
            <p className="text-sm text-gray-400 mb-1">{s.label}</p>
            <p className="text-2xl font-bold" style={{ color: s.color }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
        <Input placeholder="Search clients..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-white/5 border-white/10" />
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
                <div className="glass-card border border-white/10 rounded-xl p-5 cursor-pointer hover:border-indigo-500/30 transition-all">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-12 h-12 rounded-xl bg-indigo-500/20 flex items-center justify-center text-indigo-300 text-lg font-bold">
                      {client.name?.charAt(0)?.toUpperCase()}
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400">Billed</p>
                      <p className="text-sm font-semibold text-green-400">₹{parseFloat(client.total_billed || 0).toLocaleString()}</p>
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm mb-0.5">{client.name}</h3>
                  {client.company && <p className="text-xs text-gray-400 mb-3">{client.company}</p>}
                  <div className="space-y-1.5">
                    {client.email && <div className="flex items-center gap-2 text-xs text-gray-400"><Mail className="w-3.5 h-3.5" /><span className="truncate">{client.email}</span></div>}
                    {client.phone && <div className="flex items-center gap-2 text-xs text-gray-400"><Phone className="w-3.5 h-3.5" /><span>{client.phone}</span></div>}
                  </div>
                  {client.gstin && <div className="mt-3 pt-3 border-t border-white/5 text-xs text-gray-500">GSTIN: {client.gstin}</div>}
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
