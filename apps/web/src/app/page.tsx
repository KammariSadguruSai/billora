'use client'
import { motion } from 'framer-motion'
import Link from 'next/link'
import { useState } from 'react'
import { ArrowRight, CheckCircle, BarChart3, FileText, Users, Zap, Shield, Globe, Star, Menu, X, ChevronDown } from 'lucide-react'
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

const pricing = [
  { name: 'Starter', price: 0, desc: 'Perfect for freelancers', features: ['3 Projects', '5 Clients', 'PDF Invoices', 'Basic Analytics', 'Email Support'], cta: 'Start Free', highlight: false },
  { name: 'Professional', price: 999, desc: 'For growing teams', features: ['Unlimited Projects', 'Unlimited Clients', 'GST Invoicing', 'Advanced Analytics', 'AI Assistant', 'Priority Support'], cta: 'Get Started', highlight: true },
  { name: 'Enterprise', price: 2999, desc: 'For large organizations', features: ['Everything in Pro', 'Custom Domain', 'White Label', 'API Access', 'Dedicated Manager'], cta: 'Contact Sales', highlight: false },
]

const faqs = [
  { q: 'Is Billora really free to start?', a: 'Yes! Our Starter plan is completely free with no credit card required. You get 3 projects and 5 clients at no cost.' },
  { q: 'Does it support GST invoicing?', a: 'Yes, full GST support with CGST, SGST, and IGST calculations. Auto invoice numbering and PDF export included.' },
  { q: 'Can clients track project progress?', a: 'Absolutely! Clients get a dedicated portal to view milestones, approve work, download invoices, and chat with the team.' },
  { q: 'Is there a mobile app?', a: 'Billora is a fully responsive PWA (Progressive Web App) that works perfectly on all devices.' },
  { q: 'What payment methods are supported?', a: 'UPI, bank transfer, Razorpay, Stripe (test mode), and manual payment upload with screenshot verification.' },
]

export default function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [openFaq, setOpenFaq] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden transition-colors duration-300">

      {/* ─── Navbar ─────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-md border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">Billora</span>
            </Link>

            {/* Desktop nav */}
            <div className="hidden md:flex items-center gap-8">
              {['Features', 'Pricing', 'Testimonials', 'FAQ'].map(item => (
                <a key={item} href={`#${item.toLowerCase()}`} className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">{item}</a>
              ))}
            </div>
            <div className="hidden md:flex items-center gap-3">
              <Link href="/auth/login"><Button variant="ghost" size="sm" className="font-medium">Sign In</Button></Link>
              <Link href="/auth/register"><Button size="sm" className="bg-indigo-600 hover:bg-indigo-500 text-white border-0 font-medium">Get Started Free</Button></Link>
            </div>

            {/* Mobile menu button */}
            <button className="md:hidden p-2 text-muted-foreground hover:text-foreground" onClick={() => setMenuOpen(!menuOpen)}>
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="md:hidden bg-background border-t border-border px-4 py-4 flex flex-col gap-3 shadow-lg">
            {['Features', 'Pricing', 'Testimonials', 'FAQ'].map(item => (
              <a key={item} href={`#${item.toLowerCase()}`} className="text-foreground font-medium py-2 text-sm" onClick={() => setMenuOpen(false)}>{item}</a>
            ))}
            <div className="flex flex-col gap-2 pt-2 border-t border-border mt-2">
              <Link href="/auth/login" onClick={() => setMenuOpen(false)}><Button variant="outline" className="w-full">Sign In</Button></Link>
              <Link href="/auth/register" onClick={() => setMenuOpen(false)}><Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white border-0">Get Started Free</Button></Link>
            </div>
          </div>
        )}
      </nav>

      {/* ─── Hero ───────────────────────────────────────────── */}
      <section className="relative flex items-center justify-center min-h-screen pt-16 px-4 overflow-hidden">
        {/* Background glows */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 max-w-4xl mx-auto text-center w-full">
          <motion.div animate={{ y: 0 }} transition={{ duration: 0.7 }}>
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs sm:text-sm font-medium mb-6 border border-indigo-500/20 text-indigo-600 dark:text-indigo-400 bg-indigo-500/10">
              <Zap className="w-3.5 h-3.5" /> Now with AI-powered features
            </span>

            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-black leading-tight mb-4 sm:mb-6 text-foreground tracking-tight">
              Manage Projects.<br />
              <span className="bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 bg-clip-text text-transparent">Generate Invoices.</span><br />
              Delight Clients.
            </h1>

            <p className="text-base sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 sm:mb-10 px-2 leading-relaxed">
              The complete platform for freelancers and agencies. Project management, GST invoicing, client portal, realtime chat — all in one place.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link href="/auth/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-500 text-white border-0 text-sm sm:text-base px-8 py-6 rounded-xl shadow-lg shadow-indigo-500/25 font-semibold">
                  Start for Free <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
              <Link href="/auth/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto text-sm sm:text-base px-8 py-6 rounded-xl border-border hover:bg-accent font-semibold">
                  Sign In to Dashboard
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs font-medium text-muted-foreground">No credit card required · Free forever plan</p>
          </motion.div>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────── */}
      <section className="py-12 sm:py-20 border-y border-border bg-muted/30">
        <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-6 sm:gap-8 text-center">
          {[
            { value: '500+', label: 'Projects Managed' },
            { value: '98%', label: 'Client Satisfaction' },
            { value: '50K+', label: 'Tasks Completed' },
            { value: '₹2M+', label: 'Revenue Tracked' },
          ].map((s, i) => (
            <motion.div key={i} whileInView={{ y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}>
              <div className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">{s.value}</div>
              <div className="text-xs sm:text-sm font-medium text-muted-foreground mt-1">{s.label}</div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Features ───────────────────────────────────────── */}
      <section id="features" className="py-16 sm:py-24 max-w-7xl mx-auto px-4">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight">Everything you need to <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">scale</span></h2>
          <p className="text-muted-foreground text-base sm:text-xl">A complete toolkit replacing 5+ expensive SaaS tools</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {features.map((f, i) => (
            <motion.div key={i} whileInView={{ y: 0 }} transition={{ delay: i * 0.08 }} viewport={{ once: true }}
              className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm hover:shadow-md hover:border-indigo-500/30 transition-all duration-300">
              <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl flex items-center justify-center mb-5" style={{ background: `${f.color}15` }}>
                <f.icon className="w-6 h-6 sm:w-7 sm:h-7" style={{ color: f.color }} />
              </div>
              <h3 className="text-lg sm:text-xl font-bold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── Testimonials ───────────────────────────────────── */}
      <section id="testimonials" className="py-16 sm:py-24 border-y border-border bg-muted/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-20">
            <h2 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight">Loved by <span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">teams</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <motion.div key={i} whileInView={{ scale: 1 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
                className="p-6 sm:p-8 rounded-2xl border border-border bg-card shadow-sm">
                <div className="flex gap-1 mb-4">{[...Array(t.rating)].map((_, j) => <Star key={j} className="w-4 h-4 fill-yellow-400 text-yellow-400" />)}</div>
                <p className="text-foreground/90 text-sm mb-6 leading-relaxed italic">"{t.text}"</p>
                <div>
                  <div className="font-bold text-sm">{t.name}</div>
                  <div className="text-muted-foreground text-xs mt-1">{t.role}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Pricing ────────────────────────────────────────── */}
      <section id="pricing" className="py-16 sm:py-24 max-w-6xl mx-auto px-4">
        <div className="text-center mb-12 sm:mb-20">
          <h2 className="text-3xl sm:text-5xl font-bold mb-4 tracking-tight"><span className="bg-gradient-to-r from-indigo-500 to-cyan-500 bg-clip-text text-transparent">Transparent</span> Pricing</h2>
          <p className="text-muted-foreground text-base sm:text-xl">Start free, scale as you grow</p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-8">
          {pricing.map((plan, i) => (
            <motion.div key={i} whileInView={{ y: 0 }} transition={{ delay: i * 0.1 }} viewport={{ once: true }}
              className={`relative p-6 sm:p-8 rounded-2xl border bg-card ${plan.highlight ? 'border-indigo-500 shadow-xl shadow-indigo-500/10' : 'border-border shadow-sm'}`}>
              {plan.highlight && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-md">Most Popular</div>}
              <div className="mb-6">
                <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                <p className="text-muted-foreground text-sm mb-4">{plan.desc}</p>
                <div className="flex items-end gap-1">
                  <span className="text-4xl sm:text-5xl font-black">₹{plan.price.toLocaleString()}</span>
                  <span className="text-muted-foreground text-sm font-medium mb-1">/mo</span>
                </div>
              </div>
              <ul className="space-y-3 mb-8">
                {plan.features.map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-foreground/90 font-medium">
                    <CheckCircle className="w-4 h-4 text-indigo-500 flex-shrink-0" /> {f}
                  </li>
                ))}
              </ul>
              <Button className={`w-full py-6 rounded-xl font-bold ${plan.highlight ? 'bg-indigo-600 hover:bg-indigo-500 text-white' : 'bg-accent hover:bg-accent/80 text-foreground'}`}>
                {plan.cta}
              </Button>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ─── FAQ ────────────────────────────────────────────── */}
      <section id="faq" className="py-16 sm:py-24 border-t border-border bg-muted/30">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4 tracking-tight">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-border rounded-xl bg-card overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between p-4 sm:p-5 text-left font-semibold text-sm sm:text-base hover:bg-accent/50 transition-colors">
                  {faq.q}
                  <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                {openFaq === i && (
                  <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="border-t border-border bg-background py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-6">
            <div className="w-6 h-6 rounded-md bg-indigo-600 flex items-center justify-center">
              <FileText className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-lg tracking-tight">Billora</span>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            © {new Date().getFullYear()} Billora. All rights reserved. Built for freelancers and agencies.
          </p>
        </div>
      </footer>
    </div>
  )
}
