'use client'
import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { aiApi } from '@/lib/api'
import { Send, Bot, User, Sparkles, Loader2, Zap, FileText, CheckSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card } from '@/components/ui/card'
import { toast } from 'sonner'
import { useAuthStore } from '@/lib/store'

interface Message { role: 'user' | 'assistant'; content: string; timestamp: Date }

const QUICK_PROMPTS = [
  { icon: CheckSquare, text: 'Suggest tasks for my project' },
  { icon: FileText, text: 'Generate a project proposal' },
  { icon: Zap, text: 'How to improve team productivity?' },
  { icon: Bot, text: 'Explain invoice GST calculation' },
]

export default function AIPage() {
  const { user } = useAuthStore()
  const [messages, setMessages] = useState<Message[]>([{
    role: 'assistant',
    content: `Hello ${user?.full_name?.split(' ')[0] || 'there'}! 👋 I'm your AI assistant powered by Gemini. I can help you with:\n\n• Project planning and task suggestions\n• Writing project proposals\n• Invoice and payment queries\n• Team management tips\n\nWhat would you like help with today?`,
    timestamp: new Date(),
  }])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim()
    if (!msg || isLoading) return
    setInput('')

    const userMsg: Message = { role: 'user', content: msg, timestamp: new Date() }
    setMessages(prev => [...prev, userMsg])
    setIsLoading(true)

    try {
      const res: any = await aiApi.chat(msg, { userRole: user?.role, company: user?.company })
      setMessages(prev => [...prev, { role: 'assistant', content: res.reply, timestamp: new Date() }])
    } catch {
      toast.error('AI service unavailable. Please check your Gemini API key.')
      setMessages(prev => [...prev, { role: 'assistant', content: 'Sorry, I encountered an error. Please check your Gemini API key configuration.', timestamp: new Date() }])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto h-full flex flex-col">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-xl gradient-brand flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">AI Assistant</h1>
            <p className="text-xs text-gray-400">Powered by Google Gemini (Free Tier)</p>
          </div>
        </div>
      </div>

      {/* Quick prompts */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        {QUICK_PROMPTS.map((q, i) => (
          <button key={i} onClick={() => sendMessage(q.text)}
            className="glass-card p-3 text-left rounded-xl hover:border-indigo-500/30 transition-all group">
            <q.icon className="w-4 h-4 text-indigo-400 mb-2 group-hover:scale-110 transition-transform" />
            <p className="text-xs text-gray-300">{q.text}</p>
          </button>
        ))}
      </div>

      {/* Messages */}
      <Card className="flex-1 glass-card border-white/10 flex flex-col overflow-hidden" style={{ minHeight: 0 }}>
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <AnimatePresence>
            {messages.map((msg, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-indigo-500/20' : 'gradient-brand'}`}>
                  {msg.role === 'user' ? <User className="w-4 h-4 text-indigo-400" /> : <Bot className="w-4 h-4 text-white" />}
                </div>
                <div className={`max-w-[80%] ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  <div className={`px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
                    msg.role === 'user' ? 'bg-indigo-500/20 text-white rounded-tr-sm' : 'bg-white/5 text-gray-200 rounded-tl-sm'
                  }`}>
                    {msg.content}
                  </div>
                  <span className="text-[10px] text-gray-500 mt-1 px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isLoading && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex gap-3">
              <div className="w-8 h-8 rounded-full gradient-brand flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 px-4 py-3 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <Loader2 className="w-4 h-4 text-indigo-400 animate-spin" />
                <span className="text-sm text-gray-400">Thinking...</span>
              </div>
            </motion.div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-white/5">
          <div className="flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
              placeholder="Ask anything about your projects, invoices, or team..." className="flex-1 bg-white/5 border-white/10" disabled={isLoading} />
            <Button onClick={() => sendMessage()} disabled={!input.trim() || isLoading} className="gradient-brand border-0 text-white px-4">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
