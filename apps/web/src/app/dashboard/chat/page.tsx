'use client'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useState, useEffect, useRef } from 'react'
import { chatApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store'
import { Send, MessageSquare, Plus, Hash, Users, Paperclip } from 'lucide-react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import { io, Socket } from 'socket.io-client'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

function CreateChatDialog({ onCreated }: { onCreated: (roomId: string) => void }) {
  const [open, setOpen] = useState(false)
  const qc = useQueryClient()
  const { data: users } = useQuery({ queryKey: ['chat-users'], queryFn: () => chatApi.getUsers() as any })
  
  const createMutation = useMutation({
    mutationFn: (userId: string) => chatApi.createRoom({ name: '', type: 'direct', participants: [userId] }) as any,
    onSuccess: (room: any) => { qc.invalidateQueries({ queryKey: ['chat-rooms'] }); setOpen(false); onCreated(room.id) },
    onError: () => toast.error('Failed to create chat'),
  })

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={
        <button className="w-7 h-7 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400 hover:bg-indigo-500/30 transition-colors" />
      }>
        <Plus className="w-4 h-4" />
      </DialogTrigger>
      <DialogContent className="glass border-white/10 max-w-md">
        <DialogHeader><DialogTitle>Start Chat</DialogTitle></DialogHeader>
        <div className="space-y-2 mt-4 max-h-96 overflow-y-auto">
          {(users?.data || users || []).map((u: any) => (
            <button key={u.id} onClick={() => createMutation.mutate(u.id)} disabled={createMutation.isPending}
              className="w-full text-left p-3 rounded-xl flex items-center gap-3 hover:bg-white/5 transition-colors">
              <Avatar className="w-10 h-10"><AvatarFallback className="bg-indigo-500/20 text-indigo-400">{u.full_name?.charAt(0)}</AvatarFallback></Avatar>
              <div>
                <p className="text-sm font-medium">{u.full_name}</p>
                <p className="text-xs text-gray-400 capitalize">{u.role}</p>
              </div>
            </button>
          ))}
          {(!users?.data && !users?.length) && <p className="text-center text-gray-500 text-sm py-4">No users available to chat with.</p>}
        </div>
      </DialogContent>
    </Dialog>
  )
}

export default function ChatPage() {
  const { user, token } = useAuthStore()
  const qc = useQueryClient()
  const [activeRoom, setActiveRoom] = useState<string | null>(null)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState('')
  const [isTyping, setIsTyping] = useState<string | null>(null)
  const [socket, setSocket] = useState<Socket | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null)

  const { data: rooms, isLoading: roomsLoading } = useQuery({
    queryKey: ['chat-rooms'],
    queryFn: () => chatApi.getRooms() as any,
  })

  const { data: msgData, isLoading: msgLoading } = useQuery({
    queryKey: ['chat-messages', activeRoom],
    queryFn: () => activeRoom ? chatApi.getMessages(activeRoom) as any : null,
    enabled: !!activeRoom,
    onSuccess: (data: any) => setMessages(Array.isArray(data) ? data : []),
  } as any)

  const sendMutation = useMutation({
    mutationFn: ({ content }: any) => chatApi.sendMessage(activeRoom!, { content }) as any,
    onSuccess: (newMsg: any) => {
      setMessages(prev => [...prev, newMsg])
      socket?.emit('chat:message', { roomId: activeRoom, message: newMsg })
    },
    onError: () => toast.error('Failed to send message'),
  })

  // Socket.IO connection
  useEffect(() => {
    if (!token) return
    const s = io(process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:5000', {
      auth: { token },
      transports: ['websocket', 'polling'],
    })
    s.on('connect', () => console.log('Socket connected'))
    s.on('chat:message', (data: any) => {
      if (data.roomId === activeRoom) setMessages(prev => [...prev, data.message])
    })
    s.on('chat:typing', (data: any) => {
      if (data.userId !== user?.id) {
        setIsTyping(data.isTyping ? data.userId : null)
        if (data.isTyping) setTimeout(() => setIsTyping(null), 3000)
      }
    })
    setSocket(s)
    return () => { s.disconnect() }
  }, [token])

  useEffect(() => {
    if (activeRoom && socket) {
      socket.emit('join:room', activeRoom)
    }
  }, [activeRoom, socket])

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const sendMessage = () => {
    const text = input.trim()
    if (!text || !activeRoom) return
    setInput('')
    sendMutation.mutate({ content: text })
  }

  const handleTyping = (v: string) => {
    setInput(v)
    if (socket && activeRoom) {
      socket.emit('chat:typing', { roomId: activeRoom, isTyping: v.length > 0 })
      if (typingTimeout.current) clearTimeout(typingTimeout.current)
      typingTimeout.current = setTimeout(() => socket.emit('chat:typing', { roomId: activeRoom, isTyping: false }), 2000)
    }
  }

  const roomsList = Array.isArray(rooms) ? rooms : []

  return (
    <div className="flex h-[calc(100vh-120px)] rounded-2xl overflow-hidden border border-white/10">
      {/* Sidebar */}
      <div className="w-72 flex-shrink-0 border-r border-white/5 flex flex-col" style={{ background: 'rgba(255,255,255,0.02)' }}>
        <div className="p-4 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-sm">Messages</span>
          </div>
          <CreateChatDialog onCreated={setActiveRoom} />
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {roomsLoading ? [...Array(4)].map((_, i) => <Skeleton key={i} className="h-14 rounded-xl" />) :
            roomsList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 text-sm">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-30" />
                <p>No conversations yet</p>
              </div>
            ) : roomsList.map((room: any) => (
              <button key={room.id} onClick={() => setActiveRoom(room.id)}
                className={`w-full text-left p-3 rounded-xl transition-all ${activeRoom === room.id ? 'bg-indigo-500/15 border border-indigo-500/20' : 'hover:bg-white/5'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold ${room.type === 'project' ? 'bg-indigo-500/20 text-indigo-400' : 'bg-purple-500/20 text-purple-400'}`}>
                    {room.type === 'project' ? <Hash className="w-4 h-4" /> : <Users className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{room.name || room.project?.name || 'Direct Message'}</p>
                    <p className="text-xs text-gray-500 capitalize">{room.type}</p>
                  </div>
                </div>
              </button>
            ))
          }
        </div>
      </div>

      {/* Chat area */}
      {activeRoom ? (
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <div className="h-14 border-b border-white/5 flex items-center px-4 gap-3" style={{ background: 'rgba(255,255,255,0.02)' }}>
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Hash className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-medium text-sm">{roomsList.find((r: any) => r.id === activeRoom)?.name || 'Channel'}</span>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {msgLoading ? [...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 rounded-xl" />) :
              messages.map((msg: any, i: number) => {
                const isMe = msg.user_id === user?.id
                return (
                  <motion.div key={msg.id || i} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                    className={`flex gap-3 ${isMe ? 'flex-row-reverse' : ''}`}>
                    <Avatar className="w-8 h-8 flex-shrink-0">
                      <AvatarImage src={msg.user?.avatar_url} />
                      <AvatarFallback className="text-xs bg-indigo-500/20">{msg.user?.full_name?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className={`max-w-[70%] ${isMe ? 'items-end' : 'items-start'} flex flex-col`}>
                      {!isMe && <p className="text-xs text-gray-400 mb-1 px-1">{msg.user?.full_name}</p>}
                      <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'gradient-brand text-white rounded-tr-sm' : 'bg-white/5 text-gray-200 rounded-tl-sm'}`}>
                        {msg.content}
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1 px-1">
                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </motion.div>
                )
              })
            }
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-gray-400">
                <div className="flex gap-1"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} /><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} /><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} /></div>
                Someone is typing...
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-white/5">
            <div className="flex gap-2">
              <Input value={input} onChange={e => handleTyping(e.target.value)} onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="Type a message..." className="flex-1 bg-white/5 border-white/10" />
              <Button onClick={sendMessage} disabled={!input.trim() || sendMutation.isPending} className="gradient-brand border-0 text-white px-4">
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
          <MessageSquare className="w-16 h-16 mb-4 opacity-20" />
          <p className="text-lg font-medium">Select a conversation</p>
          <p className="text-sm mt-1">Choose a channel or message to start chatting</p>
        </div>
      )}
    </div>
  )
}
