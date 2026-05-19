'use client'
import { motion, AnimatePresence } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { 
  ArrowRight, CheckCircle, BarChart3, FileText, Users, Zap, 
  Shield, Globe, Star, Menu, X, ChevronDown, Sparkles, 
  Play, Check, RefreshCw
} from 'lucide-react'
import { Button } from '@/components/ui/button'

const features = [
  { icon: BarChart3, title: 'Project Analytics', desc: 'Real-time dashboards with Kanban boards and burndown charts.', color: '#6366f1' },
  { icon: FileText, title: 'GST Invoicing', desc: 'Professional invoices with auto GST calculation and PDF export.', color: '#10b981' },
  { icon: Users, title: 'Client Portal', desc: 'Clients can track progress, approve work and make payments.', color: '#f59e0b' },
  { icon: Zap, title: 'Realtime Updates', desc: 'Live notifications, team chat and task updates via Socket.IO.', color: '#ef4444' },
  { icon: Shield, title: 'Role-Based Access', desc: 'Admin, Manager, Team Member and Client roles with granular permissions.', color: '#8b5cf6' },
  { icon: Globe, title: 'AI Assistant', desc: 'AI-powered proposal generation, task suggestions, and smart insights.', color: '#06b6d4' },
]

const testimonials = [
  { name: 'Priya Sharma', role: 'CEO, TechVentures', text: 'Billora transformed how we manage projects. Invoice automation saved us 10+ hours a month!', rating: 5 },
  { name: 'Rahul Mehta', role: 'Freelance Designer', text: 'Finally an all-in-one tool. Client portal + invoicing + project tracking in one place.', rating: 5 },
  { name: 'Anjali Patel', role: 'Project Manager', text: 'The Kanban board is incredibly intuitive. My team adopted it in a day.', rating: 5 },
]

const pricingPlans = [
  { name: 'Starter', monthlyPrice: 0, desc: 'Perfect for freelancers', features: ['3 Projects', '5 Clients', 'PDF Invoices', 'Basic Analytics', 'Email Support'], cta: 'Start Free', highlight: false },
  { name: 'Professional', monthlyPrice: 999, desc: 'For growing teams', features: ['Unlimited Projects', 'Unlimited Clients', 'GST Invoicing', 'Advanced Analytics', 'AI Assistant', 'Priority Support'], cta: 'Get Started', highlight: true },
  { name: 'Enterprise', monthlyPrice: 2999, desc: 'For large organizations', features: ['Everything in Pro', 'Custom Domain', 'White Label', 'API Access', 'Dedicated Manager'], cta: 'Contact Sales', highlight: false },
]

const faqs = [
  { q: 'Is Billora really free to start?', a: 'Yes! Our Starter plan is completely free with no credit card required. You get 3 projects and 5 clients at no cost.' },
  { q: 'Does it support GST invoicing?', a: 'Yes, full GST support with CGST, SGST, and IGST calculations. Auto invoice numbering and PDF export included.' },
  { q: 'Can clients track project progress?', a: 'Absolutely! Clients get a dedicated portal to view milestones, approve work, download invoices, and chat with the team.' },
  { q: 'Is there a mobile app?', a: 'Billora is a fully responsive Web App that can be pinned to your home screen and works perfectly on all devices.' },
  { q: 'What payment methods are supported?', a: 'UPI, bank transfer, Razorpay, Stripe (test mode), and manual payment upload with screenshot verification.' },
]

// Mock Interactive Data
const initialKanbanTasks = [
  { id: 1, text: 'Design login system', col: 'todo', tag: 'UI/UX' },
  { id: 2, text: 'Integrate Gemini API', col: 'progress', tag: 'AI' },
  { id: 3, text: 'Fix Vercel configuration', col: 'done', tag: 'DevOps' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)
  
  // Interactive Showcases State
  const [activeTab, setActiveTab] = useState<'kanban' | 'invoice' | 'ai'>('kanban')
  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  
  // Interactive Kanban State
  const [kanbanTasks, setKanbanTasks] = useState(initialKanbanTasks)
  
  // Interactive Invoice State
  const [invoiceQty, setInvoiceQty] = useState(2)
  const [invoiceRate, setInvoiceRate] = useState(2500)
  const gstRate = 0.18 // 18% GST

  // Interactive AI Assistant State
  const [aiChat, setAiChat] = useState<{ role: 'user' | 'assistant'; text: string }[]>([
    { role: 'assistant', text: 'Hello! I am your AI project assistant. Try asking me something or click a prompt below!' }
  ])
  const [aiTyping, setAiTyping] = useState(false)

  // Move Kanban tasks around
  const cycleTask = (id: number) => {
    setKanbanTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextCol = t.col === 'todo' ? 'progress' : t.col === 'progress' ? 'done' : 'todo'
        return { ...t, col: nextCol }
      }
      return t
    }))
  }

  // AI Mock responses
  const triggerAiResponse = (promptText: string) => {
    if (aiTyping) return
    setAiChat(prev => [...prev, { role: 'user', text: promptText }])
    setAiTyping(true)
    
    setTimeout(() => {
      let reply = ""
      if (promptText.includes('tasks')) {
        reply = "Here are suggested milestones for your SaaS launch:\n\n1. Setup production environments (DevOps)\n2. Run automated test suites (Quality)\n3. Verify billing triggers & invoice workflows (Finance)\n4. Execute security compliance audit (Security)"
      } else if (promptText.includes('proposal')) {
        reply = "Draft Proposal Summary:\n\nClient: TechVentures\nObjective: Rebrand and optimize client invoice workflows.\nTimeline: 3 weeks.\nEstimated Cost: ₹75,000"
      } else {
        reply = "I'm ready to assist you. You can automate task creation, review team workload, or generate invoices automatically from this terminal."
      }
      setAiChat(prev => [...prev, { role: 'assistant', text: reply }])
      setAiTyping(false)
    }, 1200)
  }

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-300">
      
      {/* Dynamic glow overlays */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[600px] pointer-events-none overflow-hidden z-0">
        <div className="absolute -top-[200px] left-1/4 w-[40%] h-[400px] bg-indigo-500/10 rounded-full blur-[120px]" />
        <div className="absolute -top-[150px] right-1/4 w-[35%] h-[350px] bg-cyan-500/10 rounded-full blur-[120px]" />
      </div>

      {/* ─── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center flex-shrink-0 transition-transform group-hover:scale-105">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-foreground to-foreground/80 bg-clip-text text-transparent">
                Billora<span className="text-indigo-500">.ai</span>
              </span>
            </Link>

            {/* Desktop Nav Links */}
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Interactive-Demo', 'Pricing', 'FAQ'].map(item => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`} 
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors relative py-1"
                >
                  {item.replace('-', ' ')}
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/auth/login">
                <Button variant="ghost" size="sm" className="font-semibold text-sm hover:bg-accent/55 rounded-xl">
                  Sign In
                </Button>
              </Link>
              <Link href="/auth/register">
                <Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm px-5 py-5 rounded-xl border-0 shadow-lg shadow-indigo-500/20 hover:shadow-indigo-500/35 transition-all">
                  Get Started Free
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2.5 rounded-xl bg-accent/20 border border-border text-muted-foreground hover:text-foreground transition-colors" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu panel */}
        <AnimatePresence>
          {menuOpen && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }} 
              animate={{ opacity: 1, y: 0 }} 
              exit={{ opacity: 0, y: -10 }}
              className="md:hidden absolute top-16 left-0 right-0 bg-background/95 backdrop-blur-xl border-b border-border px-6 py-6 flex flex-col gap-4 shadow-xl z-50"
            >
              {['Features', 'Interactive-Demo', 'Pricing', 'FAQ'].map(item => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase()}`} 
                  className="text-foreground font-semibold py-2.5 text-base border-b border-border/40 hover:text-indigo-400 transition-colors" 
                  onClick={() => setMenuOpen(false)}
                >
                  {item.replace('-', ' ')}
                </a>
              ))}
              <div className="flex flex-col gap-3 pt-4 mt-2">
                <Link href="/auth/login" onClick={() => setMenuOpen(false)}>
                  <Button variant="outline" className="w-full py-6 rounded-xl font-bold border-border">Sign In</Button>
                </Link>
                <Link href="/auth/register" onClick={() => setMenuOpen(false)}>
                  <Button className="w-full py-6 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-500 text-white border-0">Get Started Free</Button>
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Hero Section ───────────────────────────────────── */}
      <section className="relative flex items-center justify-center min-h-[90dvh] pt-24 px-4 overflow-hidden">
        {/* Animated grid overlay */}
        <div className="absolute inset-0 hero-grid-bg opacity-35 z-0 pointer-events-none" />
        
        <div className="relative z-10 max-w-5xl mx-auto text-center w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs sm:text-sm font-semibold mb-6 border border-indigo-500/25 text-indigo-600 dark:text-indigo-400 bg-indigo-500/8 backdrop-blur-md animate-float">
              <Sparkles className="w-3.5 h-3.5" /> Experience The Next Generation AI Platform
            </span>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black leading-[1.1] mb-6 tracking-tight">
              Manage Projects.<br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-400 bg-clip-text text-transparent">Autopilot Invoices.</span><br />
              Grow Your Agency.
            </h1>

            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 px-4 leading-relaxed font-medium">
              Say goodbye to juggling multiple legacy tools. Automate Kanban tasks, generate dynamic GST invoices, and consult your smart AI agent — in one premium, unified workspace.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white border-0 text-sm sm:text-base px-8 py-7 rounded-2xl shadow-xl shadow-indigo-500/25 font-bold hover:scale-[1.02] transition-all">
                  Get Started Free <ArrowRight className="ml-2 w-4.5 h-4.5" />
                </Button>
              </Link>
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base px-8 py-7 rounded-2xl border-border bg-accent/10 hover:bg-accent/40 backdrop-blur-md font-bold transition-all">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
            
            <div className="mt-8 flex justify-center items-center gap-6 text-xs text-muted-foreground font-semibold">
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> Free Forever Plan</span>
              <span className="w-1 h-1 rounded-full bg-border" />
              <span className="flex items-center gap-1.5"><Check className="w-4 h-4 text-emerald-500" /> No Credit Card</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats Section ──────────────────────────────────── */}
      <section className="py-16 border-y border-border bg-muted/20 backdrop-blur-sm relative z-10">
        <div className="max-w-6xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {[
            { value: '1,200+', label: 'Active Teams' },
            { value: '99.9%', label: 'SLA Uptime' },
            { value: '150K+', label: 'Milestones Completed' },
            { value: '₹50M+', label: 'Payments Handled' },
          ].map((s, i) => (
            <motion.div key={i} whileInView={{ opacity: 1, y: 0 }} initial={{ opacity: 0, y: 15 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}>
              <div className="text-3xl sm:text-4xl font-extrabold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">{s.value}</div>
              <div className="text-xs sm:text-sm font-semibold text-muted-foreground mt-2 uppercase tracking-wider">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Interactive Feature Showcase ─────────────────── */}
      <section id="interactive-demo" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">Interactive Lab</span>
          <h2 className="text-3xl sm:text-5xl font-black mt-4 mb-4 tracking-tight">Try it yourself in <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">real-time</span></h2>
          <p className="text-muted-foreground text-sm sm:text-base max-w-xl mx-auto">Click and interact with these live widgets to preview the premium user interface we created for you.</p>
        </div>

        {/* Showcases Tabs container */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column Tabs */}
          <div className="lg:col-span-4 flex flex-row lg:flex-col gap-2.5 overflow-x-auto lg:overflow-visible pb-4 lg:pb-0">
            {[
              { id: 'kanban', label: 'Interactive Kanban Board', desc: 'Manage your tasks visually. Click any task to cycle its columns.' },
              { id: 'invoice', label: 'Real-time GST Invoicing', desc: 'Instantly calculate items, rates, CGST/SGST and grand total.' },
              { id: 'ai', label: 'Gemini AI Assistant', desc: 'Consult an interactive agent for immediate project planning.' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`w-full text-left p-4 sm:p-5 rounded-2xl border transition-all duration-300 flex-shrink-0 lg:flex-shrink ${
                  activeTab === tab.id 
                    ? 'bg-indigo-500/8 border-indigo-500/50 shadow-md' 
                    : 'bg-card/40 border-border/80 hover:bg-card/85'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div className={`w-2 h-2 rounded-full ${activeTab === tab.id ? 'bg-indigo-500 animate-pulse' : 'bg-muted-foreground/30'}`} />
                  <h3 className="font-bold text-sm sm:text-base">{tab.label}</h3>
                </div>
                <p className="text-xs text-muted-foreground mt-2 leading-relaxed hidden sm:block">{tab.desc}</p>
              </button>
            ))}
          </div>

          {/* Right Column Showcase screen */}
          <div className="lg:col-span-8 glass-card bg-card/25 border-border rounded-3xl p-4 sm:p-6 lg:p-8 min-h-[420px] flex flex-col justify-between shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/5 rounded-full blur-2xl" />
            
            <AnimatePresence mode="wait">
              {/* Kanban Showcase */}
              {activeTab === 'kanban' && (
                <motion.div 
                  key="kanban"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-border/40">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold">Workspace Kanban Board</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Click any task below to move it through columns.</p>
                    </div>
                    <Button size="sm" variant="ghost" onClick={() => setKanbanTasks(initialKanbanTasks)} className="text-xs font-semibold text-indigo-400 gap-1.5">
                      <RefreshCw className="w-3.5 h-3.5" /> Reset
                    </Button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 py-4 flex-1">
                    {/* Columns */}
                    {['todo', 'progress', 'done'].map(colName => (
                      <div key={colName} className="bg-accent/15 border border-border/40 rounded-2xl p-3 flex flex-col gap-2 min-h-[160px]">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider capitalize text-muted-foreground">
                            {colName === 'progress' ? 'In Progress' : colName}
                          </span>
                          <span className="text-[10px] bg-accent px-1.5 py-0.5 rounded font-semibold text-muted-foreground">
                            {kanbanTasks.filter(t => t.col === colName).length}
                          </span>
                        </div>

                        <div className="flex-1 flex flex-col gap-2">
                          {kanbanTasks.filter(t => t.col === colName).map(task => (
                            <motion.div 
                              layoutId={`task-${task.id}`}
                              key={task.id}
                              onClick={() => cycleTask(task.id)}
                              className="bg-card border border-border/60 hover:border-indigo-500/40 p-3 rounded-xl cursor-pointer hover:shadow-md transition-all flex flex-col gap-2 group relative"
                            >
                              <span className="text-[9px] font-bold text-indigo-400 bg-indigo-500/8 px-2 py-0.5 rounded-full w-max">{task.tag}</span>
                              <p className="text-xs sm:text-sm font-medium text-foreground/90">{task.text}</p>
                              <div className="flex justify-end pt-1">
                                <span className="text-[9px] text-muted-foreground/60 group-hover:text-indigo-400 transition-colors flex items-center gap-1 font-semibold">
                                  Move <Play className="w-2.5 h-2.5 fill-current animate-pulse" />
                                </span>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* Invoice Showcase */}
              {activeTab === 'invoice' && (
                <motion.div 
                  key="invoice"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center pb-3 border-b border-border/40">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold">Interactive GST Invoice Estimator</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Adjust items to calculate taxes dynamically.</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 py-4 flex-1">
                    {/* Controls */}
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Item Qty</label>
                        <div className="flex items-center gap-3">
                          <button onClick={() => setInvoiceQty(q => Math.max(1, q - 1))} className="w-8 h-8 rounded-lg bg-accent hover:bg-accent/80 border border-border flex items-center justify-center font-bold text-lg">-</button>
                          <span className="font-bold text-base w-8 text-center">{invoiceQty}</span>
                          <button onClick={() => setInvoiceQty(q => q + 1)} className="w-8 h-8 rounded-lg bg-accent hover:bg-accent/80 border border-border flex items-center justify-center font-bold text-lg">+</button>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Rate per Unit (₹)</label>
                        <input 
                          type="range" 
                          min="1000" 
                          max="10000" 
                          step="500"
                          value={invoiceRate}
                          onChange={(e) => setInvoiceRate(parseInt(e.target.value))}
                          className="w-full accent-indigo-500 h-1.5 bg-accent rounded-lg appearance-none cursor-pointer"
                        />
                        <div className="text-sm font-bold">₹{invoiceRate.toLocaleString('en-IN')}</div>
                      </div>
                    </div>

                    {/* Receipt Sheet */}
                    <div className="bg-card/40 border border-border/60 rounded-2xl p-4 sm:p-5 flex flex-col justify-between text-xs sm:text-sm font-medium gap-3">
                      <div className="border-b border-border/40 pb-2">
                        <div className="font-bold text-foreground">BILLORA WORK ESTIMATE</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5">AUTO GST CONFIG</div>
                      </div>

                      <div className="space-y-2 py-1">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Subtotal ({invoiceQty} x ₹{invoiceRate.toLocaleString()})</span>
                          <span>₹{(invoiceQty * invoiceRate).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">CGST (9%)</span>
                          <span>₹{(invoiceQty * invoiceRate * 0.09).toLocaleString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">SGST (9%)</span>
                          <span>₹{(invoiceQty * invoiceRate * 0.09).toLocaleString()}</span>
                        </div>
                      </div>

                      <div className="border-t border-border/40 pt-2 flex justify-between font-bold text-base text-indigo-500">
                        <span>Total (Incl. GST)</span>
                        <span>₹{(invoiceQty * invoiceRate * (1 + gstRate)).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* AI Showcase */}
              {activeTab === 'ai' && (
                <motion.div 
                  key="ai"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-4 flex-1 flex flex-col justify-between"
                >
                  <div className="flex justify-between items-center pb-2 border-b border-border/40">
                    <div>
                      <h4 className="text-base sm:text-lg font-bold">Gemini Assistant Console</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Automate and plan milestones in one click.</p>
                    </div>
                  </div>

                  {/* Terminal Chat area */}
                  <div className="bg-black/25 border border-border/60 rounded-2xl p-4 flex-1 min-h-[160px] flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-3">
                      {aiChat.map((chat, idx) => (
                        <div key={idx} className={`flex gap-2.5 ${chat.role === 'user' ? 'justify-end' : ''}`}>
                          {chat.role === 'assistant' && (
                            <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-400">
                              <Sparkles className="w-3.5 h-3.5" />
                            </div>
                          )}
                          <div className={`p-2.5 rounded-2xl text-xs whitespace-pre-wrap leading-relaxed max-w-[85%] ${
                            chat.role === 'user' 
                              ? 'bg-indigo-500/20 text-white rounded-tr-none' 
                              : 'bg-accent/40 text-muted-foreground rounded-tl-none'
                          }`}>
                            {chat.text}
                          </div>
                        </div>
                      ))}

                      {aiTyping && (
                        <div className="flex gap-2.5 items-center">
                          <div className="w-6 h-6 rounded-md bg-indigo-500/10 flex items-center justify-center flex-shrink-0 text-indigo-400">
                            <Sparkles className="w-3.5 h-3.5 animate-spin" />
                          </div>
                          <span className="text-[10px] text-muted-foreground">Agent is drafting response...</span>
                        </div>
                      )}
                    </div>

                    {/* Pre-written quick prompts buttons */}
                    <div className="flex flex-wrap gap-2 pt-4 border-t border-border/20">
                      {[
                        'Suggest tasks for my SaaS launch',
                        'Generate a project proposal'
                      ].map((promptText, i) => (
                        <button 
                          key={i} 
                          disabled={aiTyping}
                          onClick={() => triggerAiResponse(promptText)}
                          className="text-[10px] sm:text-xs font-semibold text-indigo-400 bg-indigo-500/10 border border-indigo-500/20 hover:bg-indigo-500/15 p-2 rounded-xl transition-all"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* ─── Features Grid Section ──────────────────────────── */}
      <section id="features" className="py-20 sm:py-28 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-16 sm:mb-24">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">Features Suite</span>
          <h2 className="text-3xl sm:text-5xl font-black mt-4 mb-4 tracking-tight">Everything you need to <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">scale</span></h2>
          <p className="text-muted-foreground text-sm sm:text-base">An all-in-one professional kit replacing multiple expensive sub-services.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((f, i) => (
            <motion.div 
              key={i} 
              whileInView={{ opacity: 1, y: 0 }} 
              initial={{ opacity: 0, y: 15 }} 
              transition={{ delay: i * 0.05 }} 
              viewport={{ once: true }}
              className="p-6 sm:p-8 rounded-3xl border border-border/80 bg-card/35 hover:bg-card/75 shadow-sm hover:shadow-lg hover:border-indigo-500/30 transition-all duration-300 group"
            >
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-105 transition-transform" style={{ background: `${f.color}12` }}>
                <f.icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: f.color }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-3">{f.title}</h3>
              <p className="text-muted-foreground text-xs sm:text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Testimonials Section ───────────────────────────── */}
      <section id="testimonials" className="py-20 sm:py-28 border-y border-border/85 bg-muted/15 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-16 sm:mb-20">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">Social Proof</span>
            <h2 className="text-3xl sm:text-5xl font-black mt-4 mb-4 tracking-tight">Loved by <span className="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">teams</span></h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
            {testimonials.map((t, i) => (
              <motion.div 
                key={i} 
                whileInView={{ opacity: 1, scale: 1 }} 
                initial={{ opacity: 0, scale: 0.96 }} 
                transition={{ delay: i * 0.08 }} 
                viewport={{ once: true }}
                className="p-6 sm:p-8 rounded-3xl border border-border/60 bg-card/45 shadow-sm hover:shadow-md transition-all flex flex-col justify-between min-h-[220px]"
              >
                <div>
                  <div className="flex gap-1.5 mb-5">
                    {[...Array(t.rating)].map((_, j) => (
                      <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-foreground/90 text-xs sm:text-sm leading-relaxed italic mb-6">"{t.text}"</p>
                </div>
                
                <div>
                  <div className="font-extrabold text-sm text-foreground">{t.name}</div>
                  <div className="text-muted-foreground text-xs mt-0.5">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ────────────────────────────────── */}
      <section id="pricing" className="py-20 sm:py-28 max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        <div className="text-center mb-12 sm:mb-16">
          <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">Flexible Plans</span>
          <h2 className="text-3xl sm:text-5xl font-black mt-4 mb-4 tracking-tight"><span className="bg-gradient-to-r from-indigo-500 to-cyan-400 bg-clip-text text-transparent">Transparent</span> Pricing</h2>
          <p className="text-muted-foreground text-sm sm:text-base mb-8">Start free, scale on demand.</p>

          {/* Pricing Toggle */}
          <div className="inline-flex items-center gap-3 bg-accent/20 border border-border p-1.5 rounded-2xl">
            <button 
              onClick={() => setBillingPeriod('monthly')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all ${
                billingPeriod === 'monthly' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Monthly
            </button>
            <button 
              onClick={() => setBillingPeriod('yearly')}
              className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition-all flex items-center gap-1.5 ${
                billingPeriod === 'yearly' 
                  ? 'bg-indigo-600 text-white shadow-sm' 
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              Yearly 
              <span className="bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 text-[10px] font-extrabold px-1.5 py-0.5 rounded-md">Save 20%</span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8 items-stretch">
          {pricingPlans.map((plan, i) => {
            const displayPrice = billingPeriod === 'yearly' ? Math.round(plan.monthlyPrice * 0.8) : plan.monthlyPrice
            
            return (
              <motion.div 
                key={i} 
                whileInView={{ opacity: 1, y: 0 }} 
                initial={{ opacity: 0, y: 15 }} 
                transition={{ delay: i * 0.08 }} 
                viewport={{ once: true }}
                className={`relative p-6 sm:p-8 rounded-3xl border flex flex-col justify-between ${
                  plan.highlight 
                    ? 'border-indigo-500 bg-indigo-500/5 shadow-xl shadow-indigo-500/8' 
                    : 'border-border bg-card/35 shadow-sm'
                }`}
              >
                {plan.highlight && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                
                <div className="mb-8">
                  <h3 className="text-xl sm:text-2xl font-extrabold mb-2.5 text-foreground">{plan.name}</h3>
                  <p className="text-muted-foreground text-xs sm:text-sm mb-6">{plan.desc}</p>
                  <div className="flex items-end gap-1 mb-6">
                    <span className="text-4xl sm:text-5xl font-black text-foreground">₹{displayPrice.toLocaleString('en-IN')}</span>
                    <span className="text-muted-foreground text-xs sm:text-sm font-semibold mb-1">/mo</span>
                  </div>
                  
                  <ul className="space-y-4">
                    {plan.features.map((f, j) => (
                      <li key={j} className="flex items-center gap-3 text-xs sm:text-sm font-semibold text-foreground/90">
                        <CheckCircle className="w-4.5 h-4.5 text-indigo-500 flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </div>
                
                <Button className={`w-full py-6 rounded-2xl font-bold transition-transform hover:scale-[1.01] ${
                  plan.highlight 
                    ? 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-md border-0' 
                    : 'bg-accent/40 hover:bg-accent/80 text-foreground border border-border'
                }`}>
                  {plan.cta}
                </Button>
              </motion.div>
            )
          })}
        </div>
      </section>

      {/* ─── FAQ Section ────────────────────────────────────── */}
      <section id="faq" className="py-20 sm:py-28 border-t border-border/80 bg-muted/15 relative z-10">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <span className="text-xs font-bold text-indigo-500 uppercase tracking-widest bg-indigo-500/10 px-3 py-1.5 rounded-full border border-indigo-500/20">Questions</span>
            <h2 className="text-3xl sm:text-4xl font-black mt-4 mb-4 tracking-tight">Frequently Asked Questions</h2>
          </div>
          
          <div className="space-y-3.5">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border/80 rounded-2xl bg-card/35 overflow-hidden">
                <button 
                  onClick={() => setOpenFaq(openFaq === i ? null : i)} 
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-bold text-sm sm:text-base hover:bg-accent/50 transition-colors"
                >
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                
                {openFaq === i && (
                  <div className="px-4 sm:px-5 pb-5 text-xs sm:text-sm text-muted-foreground leading-relaxed border-t border-border/40 pt-4 bg-accent/5">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border/80 bg-background/95 relative z-10 py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2.5 mb-6 group">
            <div className="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center transition-transform group-hover:rotate-6">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              Billora<span className="text-indigo-500">.ai</span>
            </span>
          </div>
          <p className="text-xs sm:text-sm text-muted-foreground mb-6">
            © {new Date().getFullYear()} Billora Platform. All rights reserved. Made for professional freelancers and agencies.
          </p>
        </div>
      </footer>
    </div>
  )
}
