# 📘 Personal CRM - PRD (Claude Code Optimized)
**Version:** 1.0.0  
**Target Agentic Tool:** Claude Code (Anthropic)  
**Framework:** Next.js 15 (App Router) | **Language:** TypeScript  
**Hosting:** Vercel Free Tier | **DB:** PostgreSQL (Neon/Supabase)  
**Auth:** Auth.js v5 | **Styling:** Tailwind CSS + `shadcn/ui` | **State:** Server Actions + `react-hook-form`

---

## 🤖 Claude Code Execution Protocol
> **How to use this PRD with Claude Code:**
> 1. Save this document as `PRD.md` in your project root.
> 2. Start Claude Code in the project directory.
> 3. Run: `@PRD.md` to load context.
> 4. Prompt: `Execute Phase 1. Generate files exactly as specified. Run validation commands. Wait for my approval before Phase 2.`
> 5. Claude Code will output exact file paths, run CLI commands, and enforce strict TypeScript/ESLint rules. Do not skip acceptance criteria.

### 📜 Claude Code Rules & Conventions
- **Strict TypeScript:** `"strict": true` in `tsconfig.json`. No `any`. Use `zod` for all inputs.
- **Server Actions First:** CRUD goes in `app/actions/`. Never expose raw Prisma to client.
- **File Naming:** `kebab-case` for routes, `PascalCase` for components, `camelCase` for utils.
- **Styling:** `shadcn/ui` components only. No inline CSS. Tailwind utility classes preferred.
- **Error Handling:** `try/catch` in all server actions. Return `{ success: boolean, error?: string, data? }`.
- **AI Safety:** Never hardcode secrets. Use `process.env` with `@typecheck` validation.
- **Testing:** Validate after each phase with `npm run lint && npm run build`.

---

## 📁 Exact Project Structure
personal-crm/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── (dashboard)/
│   │   ├── layout.tsx
│   │   ├── page.tsx (Dashboard/Analytics)
│   │   ├── kanban/page.tsx
│   │   └── contacts/
│   │       ├── page.tsx (Table View)
│   │       └── [id]/edit/page.tsx
│   ├── api/
│   │   ├── auth/[...nextauth]/route.ts
│   │   ├── push/subscribe/route.ts
│   │   ├── push/send/route.ts
│   │   └── export/csv/route.ts
│   ├── actions/contacts.ts
│   ├── actions/analytics.ts
│   └── layout.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── layout/sidebar.tsx
│   ├── layout/bottom-nav.tsx
│   ├── contacts/contact-sheet.tsx
│   ├── contacts/kanban-board.tsx
│   ├── contacts/data-table.tsx
│   ├── dashboard/analytics-cards.tsx
│   └── dashboard/source-chart.tsx
├── lib/
│   ├── prisma.ts
│   ├── utils.ts
│   └── constants.ts
├── prisma/schema.prisma
├── public/
│   ├── manifest.json
│   └── icons/
├── next.config.ts
├── vercel.json
├── .env.local
└── tailwind.config.ts

---

## ⚙️ Pinned Tech Stack & Dependencies
npx create-next-app@latest . --typescript --tailwind --app --eslint
npm install @auth/nextjs@beta @prisma/client@latest prisma@latest
npm install @hookform/resolvers@latest react-hook-form@latest zod@latest
npm install @tanstack/react-table@latest @dnd-kit/core@latest @dnd-kit/sortable@latest @dnd-kit/utilities@latest
npm install recharts@latest date-fns@latest sonner@latest lucide-react@latest
npm install web-push@latest @ducanh-next/pwa@latest next-themes@latest
npx shadcn@latest init

---

## 🗄️ Database Schema (`prisma/schema.prisma`)
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

enum Stage {
  LEAD
  POTENTIAL
  CUSTOMER
  REJECTED
}

enum Priority {
  LOW
  MEDIUM
  HIGH
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String?
  avatar    String?
  contacts  Contact[]
  pushSubs  PushSubscription[]
  createdAt DateTime @default(now())
}

model Contact {
  id             String   @id @default(cuid())
  userId         String
  user           User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  stage          Stage    @default(LEAD)
  name           String
  phone          String?
  email          String?
  moneyValue     Decimal  @default(0) @db.Decimal(10, 2)
  priority       Priority @default(MEDIUM)
  reminderAt     DateTime?
  notes          String?  @db.Text
  attachments    String[] @db.Text[]
  tags           String[] @db.Text[]
  source         String?
  followUpCount  Int      @default(0)
  lastContactedAt DateTime?
  isArchived     Boolean  @default(false)
  
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt
  
  @@index([userId, stage])
  @@index([userId, reminderAt])
}

model PushSubscription {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  endpoint  String   @unique
  p256dh    String
  auth      String
  createdAt DateTime @default(now())
}

---

## 🔄 Phase-by-Phase Implementation Plan

### 🟢 Phase 1: Project Scaffolding, Auth & DB Setup
**Files to Generate:** `next.config.ts`, `tailwind.config.ts`, `prisma/schema.prisma`, `lib/prisma.ts`, `app/api/auth/[...nextauth]/route.ts`, `middleware.ts`, `.env.example`
**Tasks:**
1. Init Next.js app with TypeScript, App Router, Tailwind, ESLint.
2. Run `npx shadcn@latest init` + add `button`, `input`, `card`, `dialog`, `sheet`, `dropdown-menu`, `badge`, `toast`, `select`, `checkbox`.
3. Configure Auth.js v5 with Google provider. Set session strategy to `jwt`.
4. Setup Prisma, run `prisma generate && prisma db push`.
5. Create singleton `lib/prisma.ts` with global cache for dev.
**Acceptance Criteria:**
- `npm run dev` starts without errors.
- `/api/auth/signin` redirects to Google.
- Protected route returns 401 if unauthenticated.
- `prisma studio` opens with empty tables.
- `npm run lint && npm run build` passes.

### 🟢 Phase 2: Server Actions & Contact CRUD
**Files to Generate:** `app/actions/contacts.ts`, `lib/validations.ts`, `components/contacts/contact-sheet.tsx`
**Tasks:**
1. Create Zod schemas for `createContactSchema` & `updateContactSchema`.
2. Implement server actions: `createContact`, `updateContact`, `deleteContact`, `changeStage`, `logContact`, `toggleArchive`.
3. All actions must validate `getServerSession()` and scope to `session.user.id`.
4. Build `ContactSheet` with `react-hook-form` + `zodResolver`. Include all fields from PRD.
**Acceptance Criteria:**
- Form validates correctly (phone/email optional but validated if provided).
- Server actions return `{ success, error, data }` format.
- Submitting updates DB instantly without full page reload.
- Error states show in `sonner` toast.

### 🟢 Phase 3: Table View & Kanban Pipeline
**Files to Generate:** `components/contacts/data-table.tsx`, `components/contacts/kanban-board.tsx`, `app/(dashboard)/contacts/page.tsx`, `app/(dashboard)/kanban/page.tsx`
**Tasks:**
1. Build DataTable using `@tanstack/react-table`. Add sorting, filtering, pagination.
2. Build KanbanBoard using `@dnd-kit/core`. Columns: LEAD, POTENTIAL, CUSTOMER, REJECTED.
3. Drag triggers `changeStage` server action. Add touch support & drop animations.
4. Add WhatsApp deep link: `https://wa.me/${cleanPhone}?text=${encodeURIComponent("Hi, following up on our conversation.")}`. Click triggers `logContact` action.
**Acceptance Criteria:**
- Table filters by stage, priority, tags.
- Kanban drag updates stage in DB & UI updates optimistically.
- WhatsApp link opens correctly & increments `followUpCount`.
- Mobile responsive (cards stack, touch DnD works).

### 🟢 Phase 4: Analytics & CSV Export
**Files to Generate:** `app/actions/analytics.ts`, `components/dashboard/analytics-cards.tsx`, `app/(dashboard)/page.tsx`, `app/api/export/csv/route.ts`
**Tasks:**
1. Create `getAnalytics()` server action: pipeline value, converted value, avg deal size, conversion rates, source breakdown.
2. Build Dashboard with `shadcn` Cards + `recharts` (Bar: stage conversion, Pie: source).
3. Create `/api/export/csv/route.ts`. Stream CSV with headers: `id,name,stage,phone,email,moneyValue,priority,tags,source,followUpCount,lastContactedAt,createdAt`.
**Acceptance Criteria:**
- Dashboard loads < 2s. Data cached with `revalidate: 300`.
- Charts render correctly with dummy data.
- CSV export downloads instantly. Headers match schema. Filters respected.
- No hydration mismatches.

### 🟢 Phase 5: PWA & Web Push Notifications
**Files to Generate:** `next.config.ts` (PWA config), `public/manifest.json`, `app/api/push/subscribe/route.ts`, `app/api/push/send/route.ts`, `app/api/cron/reminders/route.ts`, `vercel.json`, `app/layout.tsx` (push subscription hook)
**Tasks:**
1. Configure `@ducanh-next/pwa` in `next.config.ts`. Add `manifest.json` & icons.
2. Implement Web Push subscription flow in `layout.tsx`. Request permission on mount.
3. Store subscription in `PushSubscription` table.
4. Create VAPID keys setup script. Generate VAPID private/public keys.
5. Create `/api/cron/reminders` route. Query `reminderAt <= NOW() + 15m`. Send push via `web-push`.
6. Add `vercel.json` cron: `"crons": [{"path": "/api/cron/reminders", "schedule": "*/30 * * * *"}]`.
**Acceptance Criteria:**
- `Add to Home Screen` prompt appears on Android Chrome.
- App opens in standalone mode. Works offline for cached assets.
- Push permission granted. Subscription saved to DB.
- Cron triggers, sends notification to Android. Notification shows even when PWA is closed.
- `npm run build` passes with PWA warnings resolved.

---

## 🌐 Environment Variables Template (`.env.example`)
# Auth
AUTH_SECRET=your-32-char-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
NEXTAUTH_URL=http://localhost:3000

# Database
DATABASE_URL="postgresql://user:pass@host:5432/dbname?sslmode=require"

# Push Notifications
NEXT_PUBLIC_VAPID_PUBLIC_KEY=your-vapid-public-key
VAPID_PRIVATE_KEY=your-vapid-private-key
VAPID_SUBJECT=mailto:your@email.com

# Storage (Optional for attachments)
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

---

## ✅ Quality Gates & Validation Commands
Run after **every phase** before proceeding:
# 1. Type Check
npx tsc --noEmit

# 2. Lint & Format
npm run lint
npx prettier --write .

# 3. Build Check
npm run build

# 4. Prisma Integrity
npx prisma validate
npx prisma generate

**Claude Code must report zero errors, zero warnings, and successful build before phase approval.**

🤖 **Next Step for Claude Code:**  
@PRD.md
Execute Phase 1 exactly as specified. Generate files in the correct directories. Run validation commands. Do not proceed to Phase 2 until I confirm Phase 1 acceptance criteria are met.
  