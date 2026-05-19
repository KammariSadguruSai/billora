import axios from 'axios'

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api',
  timeout: 30000,
  withCredentials: false,
})

// Request interceptor – attach token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('pm_token')
    if (token) config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor – handle auth errors
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const status = error?.response?.status
    if (status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('pm_token')
      localStorage.removeItem('pm_user')
      window.location.href = '/auth/login'
    }
    return Promise.reject(error?.response?.data || error)
  }
)

export default api

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: any) => api.post('/auth/register', data),
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me'),
  forgotPassword: (email: string) => api.post('/auth/forgot-password', { email }),
  updateProfile: (data: any) => api.patch('/users/me', data),
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export const dashboardApi = {
  get: () => api.get('/dashboard'),
}

// ─── Projects ─────────────────────────────────────────────────────────────────
export const projectsApi = {
  list: (params?: any) => api.get('/projects', { params }),
  get: (id: string) => api.get(`/projects/${id}`),
  create: (data: any) => api.post('/projects', data),
  update: (id: string, data: any) => api.patch(`/projects/${id}`, data),
  delete: (id: string) => api.delete(`/projects/${id}`),
  stats: (id: string) => api.get(`/projects/${id}/stats`),
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasksApi = {
  list: (params?: any) => api.get('/tasks', { params }),
  get: (id: string) => api.get(`/tasks/${id}`),
  create: (data: any) => api.post('/tasks', data),
  update: (id: string, data: any) => api.patch(`/tasks/${id}`, data),
  bulkUpdate: (updates: any[]) => api.patch('/tasks/bulk-update', { updates }),
  delete: (id: string) => api.delete(`/tasks/${id}`),
  addComment: (id: string, data: any) => api.post(`/tasks/${id}/comments`, data),
  logTime: (id: string, data: any) => api.post(`/tasks/${id}/time`, data),
}

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoicesApi = {
  list: (params?: any) => api.get('/invoices', { params }),
  get: (id: string) => api.get(`/invoices/${id}`),
  create: (data: any) => api.post('/invoices', data),
  update: (id: string, data: any) => api.patch(`/invoices/${id}`, data),
  send: (id: string) => api.post(`/invoices/${id}/send`),
  delete: (id: string) => api.delete(`/invoices/${id}`),
}

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentsApi = {
  list: (params?: any) => api.get('/payments', { params }),
  create: (data: any) => api.post('/payments', data),
  verify: (id: string) => api.patch(`/payments/${id}/verify`),
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clientsApi = {
  list: (params?: any) => api.get('/clients', { params }),
  get: (id: string) => api.get(`/clients/${id}`),
  create: (data: any) => api.post('/clients', data),
  update: (id: string, data: any) => api.patch(`/clients/${id}`, data),
  delete: (id: string) => api.delete(`/clients/${id}`),
}

// ─── Users ────────────────────────────────────────────────────────────────────
export const usersApi = {
  list: (params?: any) => api.get('/users', { params }),
  update: (id: string, data: any) => api.patch(`/users/${id}`, data),
}

// ─── Files ────────────────────────────────────────────────────────────────────
export const filesApi = {
  list: (params?: any) => api.get('/files', { params }),
  upload: (file: File, entityType?: string, entityId?: string) => {
    const form = new FormData()
    form.append('file', file)
    if (entityType) form.append('entity_type', entityType)
    if (entityId) form.append('entity_id', entityId)
    return api.post('/files/upload', form, { headers: { 'Content-Type': 'multipart/form-data' } })
  },
  delete: (id: string) => api.delete(`/files/${id}`),
}

// ─── Chat ─────────────────────────────────────────────────────────────────────
export const chatApi = {
  getRooms: () => api.get('/chat/rooms'),
  getUsers: () => api.get('/chat/users'),
  getMessages: (roomId: string, params?: any) => api.get(`/chat/rooms/${roomId}/messages`, { params }),
  sendMessage: (roomId: string, data: any) => api.post(`/chat/rooms/${roomId}/messages`, data),
  createRoom: (data: any) => api.post('/chat/rooms', data),
}

// ─── Notifications ────────────────────────────────────────────────────────────
export const notificationsApi = {
  list: (params?: any) => api.get('/notifications', { params }),
  markRead: (id: string) => api.patch(`/notifications/${id}/read`),
  markAllRead: () => api.patch('/notifications/read-all'),
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export const analyticsApi = {
  revenue: (params?: any) => api.get('/analytics/revenue', { params }),
  projects: () => api.get('/analytics/projects'),
  team: () => api.get('/analytics/team'),
}

// ─── AI ───────────────────────────────────────────────────────────────────────
export const aiApi = {
  chat: (message: string, context?: any) => api.post('/ai/chat', { message, context }),
  generateProposal: (data: any) => api.post('/ai/generate-proposal', data),
  taskSuggestions: (data: any) => api.post('/ai/task-suggestions', data),
}
