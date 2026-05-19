# 🚀 PM Portal – Project Management & Invoice SaaS

A **complete, production-ready, full-stack SaaS** built with **100% free & open-source** tools.

---

## ✨ Features

| Feature | Description |
|---|---|
| 📊 **Project Management** | Kanban board (drag & drop), Calendar, Gantt, Milestones |
| 🧾 **Invoice Generator** | GST (CGST/SGST/IGST), PDF export, auto-numbering, email |
| 👥 **Client Portal** | Project tracking, invoice download, payment upload |
| 💬 **Realtime Chat** | Socket.IO team chat with typing indicators |
| 🔔 **Notifications** | Live push notifications, email alerts |
| 🤖 **AI Assistant** | Gemini-powered chatbot, proposal generator, task suggester |
| 📈 **Analytics** | Revenue, project, and team productivity dashboards |
| 🔐 **Auth** | JWT + Supabase Auth, role-based access (Admin/Manager/Member/Client) |
| 📁 **File Uploads** | Multer + Supabase Storage (50MB limit) |
| 💳 **Payments** | Manual upload, UPI, Razorpay/Stripe test mode |

---

## 🛠️ Tech Stack

```
Frontend:  Next.js 14 · Tailwind CSS · ShadCN UI · Framer Motion · React Query · Zustand
Backend:   Node.js · Express · Socket.IO
Database:  Supabase (PostgreSQL) with Row Level Security
Auth:      Supabase Auth + JWT
Storage:   Supabase Storage
Email:     Nodemailer (Gmail SMTP)
PDF:       jsPDF + jsPDF-AutoTable
Charts:    Recharts
AI:        Google Gemini 1.5 Flash (Free Tier)
Deploy:    Vercel (web) · Render (server) · Docker
```

---

## 📦 Installation

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) account (free)
- A [Gemini API key](https://aistudio.google.com/apikey) (free)

### 1. Clone & Install
```bash
git clone <repo-url>
cd PM_INVOICE
npm install
```

### 2. Database Setup
1. Create a new Supabase project at https://supabase.com
2. Go to **SQL Editor** and run `database/schema.sql`
3. Go to **Storage** and create a public bucket named `pm-files`

### 3. Configure Environment Variables

**Frontend** (`apps/web/.env.local`):
```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOi...
NEXT_PUBLIC_API_URL=http://localhost:5000/api
NEXT_PUBLIC_SOCKET_URL=http://localhost:5000
NEXT_PUBLIC_GEMINI_API_KEY=AIzaSy...
NEXTAUTH_SECRET=your-32-char-secret
NEXTAUTH_URL=http://localhost:3000
```

**Backend** (`apps/server/.env`):
```env
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
JWT_SECRET=your-very-long-secret
CORS_ORIGIN=http://localhost:3000
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASS=your-app-password
GEMINI_API_KEY=AIzaSy...
```

### 4. Run Development Servers
```bash
# Terminal 1 – Frontend
cd apps/web && npm run dev

# Terminal 2 – Backend
cd apps/server && npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 🐳 Docker Deployment

```bash
# Copy env files
cp apps/web/.env.example apps/web/.env
cp apps/server/.env.example apps/server/.env
# Fill in your values, then:

docker-compose up -d
```

---

## ☁️ Cloud Deployment (Free)

### Frontend → Vercel
```bash
cd apps/web
npx vercel --prod
```

### Backend → Render
1. Connect GitHub repo to [render.com](https://render.com)
2. Set **Build Command**: `npm install`
3. Set **Start Command**: `node src/index.js`
4. Add all environment variables

---

## 📐 Project Structure

```
PM_INVOICE/
├── apps/
│   ├── web/                  # Next.js frontend
│   │   └── src/
│   │       ├── app/          # App Router pages
│   │       │   ├── page.tsx  # Landing page
│   │       │   ├── auth/     # Login / Register
│   │       │   └── dashboard/# All dashboard pages
│   │       ├── components/   # Reusable components
│   │       └── lib/          # API client, stores
│   └── server/               # Express backend
│       └── src/
│           ├── routes/       # All API endpoints
│           ├── middleware/   # Auth, validation
│           ├── lib/          # Supabase client
│           └── socket.js     # Socket.IO
└── database/
    └── schema.sql            # Full DB schema
```

---

## 🔑 User Roles

| Role | Access |
|---|---|
| **Admin** | Full access – users, projects, invoices, analytics, settings |
| **Manager** | Projects, tasks, clients, invoices, team |
| **Member** | Assigned tasks, time tracking, chat |
| **Client** | Own projects, invoices, payments, chat with manager |

---

## 📡 API Documentation

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login |
| GET | `/api/auth/me` | Get current user |
| POST | `/api/auth/forgot-password` | Send reset email |

### Projects
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/projects` | List projects |
| POST | `/api/projects` | Create project |
| GET | `/api/projects/:id` | Get project details |
| PATCH | `/api/projects/:id` | Update project |
| GET | `/api/projects/:id/stats` | Project statistics |

### Tasks
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/tasks?project_id=xxx` | List tasks (Kanban) |
| POST | `/api/tasks` | Create task |
| PATCH | `/api/tasks/:id` | Update / move task |
| POST | `/api/tasks/:id/comments` | Add comment |
| POST | `/api/tasks/:id/time` | Log time |

### Invoices
| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/invoices` | List invoices |
| POST | `/api/invoices` | Create invoice (with GST) |
| GET | `/api/invoices/:id` | Invoice detail |
| POST | `/api/invoices/:id/send` | Send via email |

### AI
| Method | Endpoint | Description |
|---|---|---|
| POST | `/api/ai/chat` | Chat with Gemini AI |
| POST | `/api/ai/generate-proposal` | Generate project proposal |
| POST | `/api/ai/task-suggestions` | AI task suggestions |

---

## 🔧 Free Services Used

| Service | What For | Free Limit |
|---|---|---|
| [Supabase](https://supabase.com) | Database + Auth + Storage | 500MB DB, 1GB Storage |
| [Vercel](https://vercel.com) | Frontend Hosting | Unlimited hobby |
| [Render](https://render.com) | Backend Hosting | 750 hrs/month |
| [Google Gemini](https://aistudio.google.com) | AI Features | 15 req/min |
| [Gmail SMTP](https://gmail.com) | Email | 500/day |

---

## 🤝 Contributing

PRs welcome! Please open an issue first for major changes.

## 📄 License

MIT License – Free to use, modify, and distribute.
