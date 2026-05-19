'use client'
import { useQuery } from '@tanstack/react-query'
import { invoicesApi } from '@/lib/api'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, Send, CheckCircle, FileText, Building2, User, CreditCard } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const STATUS_COLORS: Record<string, string> = {
  draft: 'bg-gray-500/20 text-gray-700 border-gray-500/30',
  sent: 'bg-blue-500/20 text-blue-700 border-blue-500/30',
  viewed: 'bg-purple-500/20 text-purple-700 border-purple-500/30',
  partial: 'bg-yellow-500/20 text-yellow-700 border-yellow-500/30',
  paid: 'bg-green-500/20 text-green-700 border-green-500/30',
  overdue: 'bg-red-500/20 text-red-700 border-red-500/30',
  cancelled: 'bg-gray-500/20 text-gray-700 border-gray-500/30',
}

export default function InvoiceDetailPage() {
  const { id } = useParams() as { id: string }
  const router = useRouter()

  const { data: invoice, isLoading } = useQuery({
    queryKey: ['invoice', id],
    queryFn: () => invoicesApi.get(id) as any,
  })

  if (isLoading) return (
    <div className="space-y-6 max-w-5xl mx-auto mt-10">
      <Skeleton className="h-10 w-48" />
      <Skeleton className="h-[800px] rounded-2xl" />
    </div>
  )

  if (!invoice) return <div className="text-center py-20 text-gray-500">Invoice not found</div>

  let managerData: any = { name: 'Your Company Name', email: 'billing@company.com', address: '', gstin: '' }
  if (invoice?.admin_company) {
    managerData.name = invoice.admin_company.full_name || managerData.name
    managerData.email = invoice.admin_company.email || managerData.email
    if (invoice.admin_company.company) {
      try {
        const parsed = JSON.parse(invoice.admin_company.company)
        managerData = { ...managerData, ...parsed }
      } catch(e) {
        managerData.name = invoice.admin_company.company
      }
    }
  }

  const downloadInvoicePDF = () => {
    const doc = new jsPDF()
    
    // Header Background
    doc.setFillColor(30, 33, 57) // Dark professional blue
    doc.rect(0, 0, 210, 45, 'F')
    
    // Header Text
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(28)
    doc.setFont('helvetica', 'bold')
    doc.text('INVOICE', 20, 28)
    
    doc.setFontSize(10)
    doc.setFont('helvetica', 'normal')
    doc.text(`Invoice Number: ${invoice.invoice_number || ''}`, 130, 22)
    doc.text(`Issue Date: ${invoice.issue_date || ''}`, 130, 28)
    doc.text(`Due Date: ${invoice.due_date || ''}`, 130, 34)

    // From (Manager Details)
    doc.setTextColor(60, 60, 60)
    doc.setFontSize(10)
    doc.setFont('helvetica', 'bold')
    doc.text('From:', 20, 60)
    doc.setFont('helvetica', 'normal')
    doc.text(managerData.name || '', 20, 66)
    if(managerData.address) doc.text(managerData.address, 20, 72)
    if(managerData.email) doc.text(managerData.email, 20, 78)
    if(managerData.gstin) doc.text(`GSTIN: ${managerData.gstin}`, 20, 84)

    // To (Client Details)
    doc.setFont('helvetica', 'bold')
    doc.text('Bill To:', 130, 60)
    doc.setFont('helvetica', 'normal')
    doc.text(invoice.client?.name || '', 130, 66)
    if (invoice.client?.company) doc.text(invoice.client.company, 130, 72)
    doc.text(invoice.client?.email || '', 130, invoice.client?.company ? 78 : 72)
    if (invoice.client?.gstin) doc.text(`GSTIN: ${invoice.client.gstin}`, 130, invoice.client?.company ? 84 : 78)

    // Items table
    const tableData = (invoice.items || []).map((item: any) => [
      item.description, item.quantity, `Rs. ${parseFloat(item.rate || 0).toLocaleString()}`, `Rs. ${parseFloat(item.amount || 0).toLocaleString()}`
    ])

    autoTable(doc, {
      head: [['Description', 'Qty', 'Rate', 'Amount']],
      body: tableData,
      startY: 95,
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [240, 240, 245], textColor: [40, 40, 40], fontStyle: 'bold' },
      alternateRowStyles: { fillColor: [252, 252, 255] },
      theme: 'grid',
      columnStyles: { 0: { cellWidth: 80 }, 2: { halign: 'right' }, 3: { halign: 'right' } }
    })

    let finalY = (doc as any).lastAutoTable.finalY + 10

    // Totals Section
    const totals = [
      ['Subtotal', `Rs. ${parseFloat(invoice.subtotal || 0).toLocaleString()}`],
      ...(parseFloat(invoice.discount_amount) > 0 ? [['Discount', `-Rs. ${parseFloat(invoice.discount_amount).toLocaleString()}`]] : []),
      ...(parseFloat(invoice.cgst_amount) > 0 ? [`CGST (${invoice.cgst_rate || 0}%)`, `Rs. ${parseFloat(invoice.cgst_amount).toLocaleString()}`] : []),
      ...(parseFloat(invoice.sgst_amount) > 0 ? [`SGST (${invoice.sgst_rate || 0}%)`, `Rs. ${parseFloat(invoice.sgst_amount).toLocaleString()}`] : []),
      ...(parseFloat(invoice.igst_amount) > 0 ? [`IGST (${invoice.igst_rate || 0}%)`, `Rs. ${parseFloat(invoice.igst_amount).toLocaleString()}`] : []),
    ]

    let yPos = finalY
    totals.forEach(([label, val]: any) => {
      doc.setFont('helvetica', 'normal')
      doc.text(label, 130, yPos)
      doc.text(val, 190, yPos, { align: 'right' })
      yPos += 7
    })

    // Total Box
    doc.setFillColor(30, 33, 57)
    doc.rect(120, yPos, 75, 12, 'F')
    doc.setTextColor(255, 255, 255)
    doc.setFont('helvetica', 'bold')
    doc.text('TOTAL', 125, yPos + 8)
    doc.text(`Rs. ${parseFloat(invoice.total || 0).toLocaleString()}`, 190, yPos + 8, { align: 'right' })
    
    // Amount Due
    if (parseFloat(invoice.amount_due) > 0) {
      doc.setTextColor(220, 38, 38)
      doc.setFontSize(11)
      doc.text(`Amount Due: Rs. ${parseFloat(invoice.amount_due || 0).toLocaleString()}`, 190, yPos + 20, { align: 'right' })
    } else {
      doc.setTextColor(22, 163, 74)
      doc.setFontSize(12)
      doc.text(`PAID IN FULL`, 190, yPos + 20, { align: 'right' })
    }

    finalY = yPos + 35

    // Payments Table
    if (invoice.payments && invoice.payments.length > 0) {
      doc.setTextColor(40, 40, 40)
      doc.setFontSize(12)
      doc.setFont('helvetica', 'bold')
      doc.text('Payment History', 20, finalY)
      
      const paymentData = invoice.payments.map((p: any) => [
        p.payment_date, p.payment_method?.toUpperCase(), p.transaction_id || '-', `Rs. ${parseFloat(p.amount).toLocaleString()}`, p.status?.toUpperCase()
      ])

      autoTable(doc, {
        head: [['Date', 'Method', 'Transaction ID', 'Amount', 'Status']],
        body: paymentData,
        startY: finalY + 5,
        styles: { fontSize: 9, cellPadding: 5 },
        headStyles: { fillColor: [240, 240, 245], textColor: [40, 40, 40] },
      })
      finalY = (doc as any).lastAutoTable.finalY + 15
    }

    // Notes
    if (invoice.notes) {
      doc.setTextColor(100, 100, 100)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(10)
      doc.text('Notes & Terms:', 20, finalY)
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text(invoice.notes, 20, finalY + 7)
    }

    doc.save(`${invoice.invoice_number || 'invoice'}.pdf`)
  }

  return (
    <div className="space-y-8 max-w-5xl mx-auto mb-20">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <button onClick={() => router.back()} className="flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors font-medium">
          <ArrowLeft className="w-4 h-4" /> Back to Invoices
        </button>
        <div className="flex items-center gap-3">
          <Button onClick={downloadInvoicePDF} className="gap-2 bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20">
            <Download className="w-4 h-4" /> Download PDF
          </Button>
        </div>
      </div>

      {/* Invoice Document Wrapper */}
      <div className="bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-200">
        
        {/* Top Header Section */}
        <div className="bg-[#1e2139] p-10 flex justify-between items-start text-white">
          <div>
            <h1 className="text-4xl font-bold tracking-wider mb-2">INVOICE</h1>
            <p className="text-indigo-200/80 font-mono"># {invoice.invoice_number}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-sm text-indigo-200/80">Issue Date</p>
            <p className="font-semibold">{invoice.issue_date}</p>
            <div className="pt-2">
              <p className="text-sm text-indigo-200/80">Due Date</p>
              <p className="font-semibold text-red-400">{invoice.due_date}</p>
            </div>
          </div>
        </div>

        {/* Info Section (From / To) */}
        <div className="p-10 grid grid-cols-2 gap-10 border-b border-gray-100">
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><Building2 className="w-4 h-4"/> From</p>
            <div className="space-y-1 text-gray-600 text-sm">
              <p className="text-lg font-bold text-gray-900">{managerData.name}</p>
              {managerData.address && <p>{managerData.address}</p>}
              {managerData.email && <p>{managerData.email}</p>}
              {managerData.gstin && <p className="pt-1 font-mono text-xs">GSTIN: {managerData.gstin}</p>}
            </div>
          </div>
          <div>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2"><User className="w-4 h-4"/> Bill To</p>
            <div className="space-y-1 text-gray-600 text-sm">
              <p className="text-lg font-bold text-gray-900">{invoice.client?.name}</p>
              {invoice.client?.company && <p>{invoice.client.company}</p>}
              <p>{invoice.client?.email}</p>
              {invoice.client?.gstin && <p className="pt-1 font-mono text-xs">GSTIN: {invoice.client.gstin}</p>}
            </div>
          </div>
        </div>

        {/* Invoice Status Banner */}
        <div className="px-10 py-4 bg-gray-50 flex items-center justify-between border-b border-gray-100">
          <div className="flex items-center gap-4">
            <span className="text-sm font-semibold text-gray-500">Status:</span>
            <Badge variant="outline" className={`uppercase tracking-wider text-[10px] font-bold ${STATUS_COLORS[invoice.status] || ''}`}>
              {invoice.status?.replace('_', ' ')}
            </Badge>
          </div>
          {parseFloat(invoice.amount_due) === 0 && (
            <div className="flex items-center gap-2 text-green-600 font-bold">
              <CheckCircle className="w-5 h-5" /> PAID IN FULL
            </div>
          )}
        </div>

        {/* Items Table */}
        <div className="p-10">
          <table className="w-full mb-8">
            <thead>
              <tr className="bg-gray-50 border-y border-gray-200 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">
                <th className="py-4 px-4 rounded-tl-lg">Description</th>
                <th className="py-4 px-4 text-center">Qty</th>
                <th className="py-4 px-4 text-right">Rate</th>
                <th className="py-4 px-4 text-right rounded-tr-lg">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {(invoice.items || []).map((item: any, i: number) => (
                <tr key={i} className="hover:bg-gray-50/50 transition-colors">
                  <td className="py-5 px-4 text-sm text-gray-900">{item.description}</td>
                  <td className="py-5 px-4 text-sm text-gray-600 text-center">{item.quantity}</td>
                  <td className="py-5 px-4 text-sm text-gray-600 text-right">₹{parseFloat(item.rate || 0).toLocaleString()}</td>
                  <td className="py-5 px-4 text-sm text-gray-900 text-right font-semibold">₹{parseFloat(item.amount || 0).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Totals Box */}
          <div className="flex justify-end mb-12">
            <div className="w-80 space-y-3 text-sm bg-gray-50 p-6 rounded-xl border border-gray-100">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal</span>
                <span className="font-medium text-gray-900">₹{parseFloat(invoice.subtotal || 0).toLocaleString()}</span>
              </div>
              {parseFloat(invoice.discount_amount || 0) > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount</span>
                  <span className="font-medium">-₹{parseFloat(invoice.discount_amount).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(invoice.cgst_amount || 0) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>CGST ({invoice.cgst_rate}%)</span>
                  <span className="font-medium text-gray-900">₹{parseFloat(invoice.cgst_amount).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(invoice.sgst_amount || 0) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>SGST ({invoice.sgst_rate}%)</span>
                  <span className="font-medium text-gray-900">₹{parseFloat(invoice.sgst_amount).toLocaleString()}</span>
                </div>
              )}
              {parseFloat(invoice.igst_amount || 0) > 0 && (
                <div className="flex justify-between text-gray-600">
                  <span>IGST ({invoice.igst_rate}%)</span>
                  <span className="font-medium text-gray-900">₹{parseFloat(invoice.igst_amount).toLocaleString()}</span>
                </div>
              )}
              
              <div className="border-t border-gray-200 my-3 pt-3 flex justify-between font-bold text-xl text-gray-900">
                <span>Total</span>
                <span className="text-[#1e2139]">₹{parseFloat(invoice.total || 0).toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between items-center pt-2 mt-2 border-t border-gray-200 border-dashed">
                <span className="text-gray-500 font-medium">Amount Due</span>
                <span className={`text-lg font-bold ${parseFloat(invoice.amount_due) > 0 ? 'text-red-600' : 'text-green-600'}`}>
                  ₹{parseFloat(invoice.amount_due || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </div>

          {/* Payments History Table */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="mb-12">
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-indigo-500" /> Payment History
              </h3>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <table className="w-full text-sm text-left">
                  <thead className="bg-gray-50 text-gray-600 font-semibold border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3">Date</th>
                      <th className="px-4 py-3">Method</th>
                      <th className="px-4 py-3">Transaction ID</th>
                      <th className="px-4 py-3 text-right">Amount</th>
                      <th className="px-4 py-3 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {invoice.payments.map((p: any, i: number) => (
                      <tr key={i} className="hover:bg-gray-50/50">
                        <td className="px-4 py-3 text-gray-700">{p.payment_date}</td>
                        <td className="px-4 py-3 text-gray-700 font-medium uppercase">{p.payment_method?.replace('_', ' ')}</td>
                        <td className="px-4 py-3 text-gray-500 font-mono text-xs">{p.transaction_id || '-'}</td>
                        <td className="px-4 py-3 text-gray-900 font-bold text-right">₹{parseFloat(p.amount).toLocaleString()}</td>
                        <td className="px-4 py-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${p.status === 'verified' ? 'bg-green-100 text-green-700' : p.status === 'rejected' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Notes */}
          {invoice.notes && (
            <div className="pt-8 border-t border-gray-200">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">Notes & Terms</p>
              <div className="bg-blue-50/50 p-6 rounded-xl border border-blue-100">
                <p className="text-gray-700 text-sm whitespace-pre-line leading-relaxed">{invoice.notes}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
