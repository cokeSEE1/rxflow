# RxFlow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the RxFlow teacher framework — backend API + frontend scaffold + 1 reference page, leaving 6 pages + notification widget for the student.

**Architecture:** Monorepo with `backend/` (Node.js + Express + Prisma + SQLite) and `frontend/` (Vue 3 + TS + Pinia + Vue Router + Element Plus). Backend serves RESTful API at `:3000`, frontend dev server at `:5173` proxies `/api` to backend. Auth via JWT access/refresh tokens.

**Tech Stack:** Node.js 20, Express 4, Prisma 5, SQLite, Vue 3.5, TypeScript 5, Vite 6, Pinia 2, Vue Router 4, Element Plus 2, Axios 1

---

## 当前进度

> 最后更新：2026-06-03

### Mockup 阶段

**P0 — 关键闭环缺口（已完成 ✅）**

所有P0任务已通过子agent并行完成：

| 页面 | 文件 | 状态 |
|------|------|------|
| 登录页 | `login-mockup.html` | 完成 |
| 工作台 | `dashboard-mockup.html` | P0增强完成（4角色标签、角色切换JS） |
| 处方详情 | `detail-mockup.html` | P0增强完成（审核弹窗、助理模式、撤回倒计时、药品批注、对比视图、配送信息） |
| 处方列表 | `prescription-list-mockup.html` | P0增强完成（角色切换、快捷筛选、批量操作、超时标记、8状态） |
| 处方表单 | `prescription-form-mockup.html` | P0增强完成（模板加载/保存、患者抽屉、药品增删、自动保存） |
| 患者列表 | `patient-list-mockup.html` | 完成 |
| 患者详情 | `patient-detail-mockup.html` | P0新建完成（患者处方详情、签收确认、SMS、药品清单） |
| 配送追踪 | `patient-tracking-mockup.html` | P0新建完成（4步进度、位置、倒计时、签收） |
| 通知中心 | `notification-mockup.html` | 完成 |

**P1 — 体验增强（进行中 🔄）**

- 侧边栏角色适配（Agent 1 处理中）
- 签收分步向导（Agent 2 处理中）
- 异常照片条件显示（Agent 2 处理中）
- 重新配送按钮（Agent 2 处理中）

涉及页面：`delivery-mockup.html`（原有完成，P1增强进行中）

**P2 — 细节完善（待开始 ⬜）**

- 配送进度标签文字化
- 地图占位替换为真实地图组件
- 通知中心角色筛选

### 后端开发（待开始 ⬜）

- [ ] Task 1: 初始化后端项目
- [ ] Task 2: 数据库 Schema 和种子数据
- [ ] Task 3: 配置、JWT工具、错误处理
- [ ] Task 4: Auth 中间件和角色守卫
- [ ] Task 5: Auth 路由（登录、刷新、me）
- [ ] Task 6: 处方服务和路由
- [ ] Task 7: 患者、通知、仪表盘路由
- [ ] Task 8: Express 入口串联

### 前端开发（待开始 ⬜）

- [ ] Task 9: 脚手架 Vue 3 + TS 项目
- [ ] Task 10: Axios 客户端和 API 模块
- [ ] Task 11: Pinia 状态管理
- [ ] Task 12: 路由和权限守卫
- [ ] Task 13: 布局组件和 Composables
- [ ] Task 14: 登录页和 App 入口
- [ ] Task 15: 参考页（处方列表）
- [ ] Task 16: 学生骨架页面
- [ ] Task 17: 集成测试

---

## File Structure

```
rxflow-workspace/
├── backend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts
│   └── src/
│       ├── index.ts                  # Express entry, mount routes
│       ├── config.ts                 # env vars, JWT secret, port
│       ├── middleware/
│       │   ├── auth.ts               # JWT verify, attach req.user
│       │   ├── role.ts               # role guard middleware factory
│       │   └── errorHandler.ts       # global error handler
│       ├── routes/
│       │   ├── auth.ts               # login, refresh, me
│       │   ├── prescriptions.ts      # CRUD + state transitions
│       │   ├── patients.ts           # CRUD
│       │   ├── notifications.ts      # list, mark read, unread count
│       │   └── dashboard.ts          # role-specific stats
│       ├── services/
│       │   ├── authService.ts
│       │   ├── prescriptionService.ts
│       │   ├── patientService.ts
│       │   ├── notificationService.ts
│       │   └── dashboardService.ts
│       └── utils/
│           ├── jwt.ts                # sign, verify helpers
│           ├── prescriptionNo.ts     # PRS-YYYYMMDD-XXXXXX generator
│           └── validators.ts         # shared validation schemas
├── frontend/
│   ├── package.json
│   ├── tsconfig.json
│   ├── vite.config.ts
│   ├── index.html
│   └── src/
│       ├── main.ts                   # createApp, use router/pinia/element
│       ├── App.vue                   # <router-view> only
│       ├── api/
│       │   ├── client.ts             # axios instance, interceptors
│       │   ├── auth.ts               # login, refresh, me
│       │   ├── prescriptions.ts      # all prescription endpoints
│       │   ├── patients.ts           # CRUD endpoints
│       │   ├── notifications.ts      # notification endpoints
│       │   └── dashboard.ts          # stats endpoint
│       ├── stores/
│       │   ├── user.ts               # userInfo, role, login/logout actions
│       │   ├── prescription.ts       # list, detail, state transitions
│       │   ├── patient.ts            # list, CRUD
│       │   └── notification.ts       # list, unreadCount, markRead
│       ├── router/
│       │   ├── index.ts              # createRouter, routes, beforeEach guard
│       │   └── routes.ts             # route definitions with meta.roles
│       ├── composables/
│       │   ├── useDraft.ts           # localStorage draft save/restore/clear
│       │   ├── usePermission.ts      # check role for v-permission
│       │   └── usePagination.ts      # pagination state helper
│       ├── directives/
│       │   └── permission.ts         # v-permission directive
│       ├── components/
│       │   ├── AppLayout.vue         # sidebar + header + <router-view>
│       │   ├── SidebarMenu.vue       # role-dynamic menu items
│       │   ├── HeaderBar.vue         # notification bell + user dropdown
│       │   ├── NotificationBell.vue  # bell icon + unread badge (student fills)
│       │   ├── StatusTag.vue         # colored tag: draft/pending/approved/...
│       │   └── PrescriptionTimeline.vue # el-timeline wrapper (student fills)
│       ├── views/
│       │   ├── LoginView.vue         # teacher: full implementation
│       │   ├── DashboardView.vue     # student: role-dynamic dashboard
│       │   ├── PrescriptionListView.vue  # student: table + filters + batch
│       │   ├── PrescriptionFormView.vue  # student: dynamic form + draft
│       │   ├── PrescriptionDetailView.vue # student: detail + review + timeline
│       │   ├── PatientListView.vue       # student: CRUD table
│       │   ├── DeliveryListView.vue      # student: courier workflow
│       │   ├── NotificationCenterView.vue # student: notification list
│       │   ├── ForbiddenView.vue     # teacher: 403 page
│       │   └── NotFoundView.vue      # teacher: 404 page
│       └── styles/
│           └── global.css            # minimal resets + prescription status colors
└── docs/
    ├── requirements.md
    └── superpowers/
        └── plans/
            └── 2026-06-03-rxflow-implementation.md
```

---

## Part 1: Backend (Teacher)

### Task 1: Initialize backend project

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`

- [ ] **Step 1: Create package.json**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
mkdir -p backend/src/{middleware,routes,services,utils} backend/prisma
```

Write `backend/package.json`:

```json
{
  "name": "rxflow-backend",
  "version": "1.0.0",
  "scripts": {
    "dev": "tsx watch src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx prisma/seed.ts",
    "db:reset": "prisma migrate reset --force"
  },
  "dependencies": {
    "@prisma/client": "^5.22.0",
    "bcryptjs": "^2.4.3",
    "cors": "^2.8.5",
    "express": "^4.21.0",
    "jsonwebtoken": "^9.0.2"
  },
  "devDependencies": {
    "@types/bcryptjs": "^2.4.6",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.7",
    "prisma": "^5.22.0",
    "tsx": "^4.19.0",
    "typescript": "^5.6.0"
  }
}
```

Write `backend/tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 2: Install dependencies**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace/backend && npm install
```

Expected: installs all packages without errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git init && git add backend/package.json backend/tsconfig.json backend/package-lock.json && git commit -m "feat: init backend project with Express + Prisma + TS"
```

---

### Task 2: Define database schema and seed

**Files:**
- Create: `backend/prisma/schema.prisma`
- Create: `backend/prisma/seed.ts`

- [ ] **Step 1: Write Prisma schema**

Write `backend/prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = "file:./dev.db"
}

model User {
  id            Int       @id @default(autoincrement())
  name          String
  phone         String    @unique
  passwordHash  String
  role          String    // assistant | doctor | courier | patient
  isActive      Boolean   @default(true)
  createdAt     DateTime  @default(now())
  prescriptionsCreated Prescription[] @relation("AssistantPrescriptions")
  prescriptionsReviewed Prescription[] @relation("DoctorPrescriptions")
  prescriptionsDelivered Prescription[] @relation("CourierDeliveries")
  notifications Notification[]
}

model Patient {
  id             Int       @id @default(autoincrement())
  name           String
  gender         String    // male | female
  age            Int?
  phone          String
  address        String
  idCard         String?   // encrypted at rest
  allergyHistory String?
  createdAt      DateTime  @default(now())
  prescriptions  Prescription[]
}

model Prescription {
  id              Int       @id @default(autoincrement())
  prescriptionNo  String    @unique
  patientId       Int
  patient         Patient   @relation(fields: [patientId], references: [id])
  assistantId     Int
  assistant       User      @relation("AssistantPrescriptions", fields: [assistantId], references: [id])
  doctorId        Int?
  doctor          User?     @relation("DoctorPrescriptions", fields: [doctorId], references: [id])
  diagnosis       String
  status          String    @default("draft") // draft|pending|rejected|approved|delivering|received|returned
  rejectedReason  String?
  rejectedType    String?   // serious | normal | suggestion
  courierId       Int?
  courier         User?     @relation("CourierDeliveries", fields: [courierId], references: [id])
  trackingNo      String?
  deliveryProof   String?   // photo URL
  note            String?
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
  items           PrescriptionItem[]
  timeline        PrescriptionTimeline[]
}

model PrescriptionItem {
  id             Int      @id @default(autoincrement())
  prescriptionId Int
  prescription   Prescription @relation(fields: [prescriptionId], references: [id])
  drugName       String
  specification  String   // e.g. "5mg x 30片"
  dosage         String   // e.g. "1片"
  frequency      String   // qd | bid | tid | qn
  days           Int
  remark         String?
}

model PrescriptionTimeline {
  id             Int      @id @default(autoincrement())
  prescriptionId Int
  prescription   Prescription @relation(fields: [prescriptionId], references: [id])
  action         String   // created|submitted|approved|rejected|resubmitted|revoked|picked_up|delivered|returned
  operatorId     Int
  operatorName   String
  detail         String?  // reject reason, exception type, etc.
  createdAt      DateTime @default(now())
}

model PrescriptionTemplate {
  id          Int      @id @default(autoincrement())
  assistantId Int
  name        String
  diagnosis   String
  items       String   // JSON string of PrescriptionItem[]
  createdAt   DateTime @default(now())
}

model Notification {
  id             Int      @id @default(autoincrement())
  userId         Int
  user           User     @relation(fields: [userId], references: [id])
  type           String   // rejected|approved|delivering|received|returned|system
  title          String
  content        String
  isRead         Boolean  @default(false)
  prescriptionId Int?
  createdAt      DateTime @default(now())
}
```

- [ ] **Step 2: Run migration**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace/backend && npx prisma migrate dev --name init
```

Expected: creates `prisma/dev.db` and `prisma/migrations/` directory.

- [ ] **Step 3: Write seed script**

Write `backend/prisma/seed.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('123456', 10)

  // Create users for all 4 roles
  const assistant = await prisma.user.upsert({
    where: { phone: '13800001111' },
    update: {},
    create: { name: '李助理', phone: '13800001111', passwordHash: hash, role: 'assistant' },
  })
  const doctor = await prisma.user.upsert({
    where: { phone: '13800002222' },
    update: {},
    create: { name: '张医生', phone: '13800002222', passwordHash: hash, role: 'doctor' },
  })
  const courier = await prisma.user.upsert({
    where: { phone: '13800003333' },
    update: {},
    create: { name: '王师傅', phone: '13800003333', passwordHash: hash, role: 'courier' },
  })
  const patient = await prisma.user.upsert({
    where: { phone: '13800004444' },
    update: {},
    create: { name: '赵建国', phone: '13800004444', passwordHash: hash, role: 'patient' },
  })

  // Create sample patients
  const patient1 = await prisma.patient.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '赵建国', phone: '13800004444', gender: 'male', age: 62,
      address: '北京市朝阳区望京西园三区 401 号楼 5 单元 302',
      allergyHistory: '青霉素过敏',
    },
  })
  const patient2 = await prisma.patient.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '李奶奶', phone: '13900005555', gender: 'female', age: 72,
      address: '北京市海淀区中关村南大街 12 号院 3 号楼 101',
      allergyHistory: '头孢类过敏',
    },
  })

  // Create sample prescription with timeline
  const prescription = await prisma.prescription.upsert({
    where: { id: 1 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000001',
      patientId: patient1.id,
      assistantId: assistant.id,
      diagnosis: '高血压病 2 级，规律服药，血压控制可',
      status: 'pending',
      items: {
        create: [
          { drugName: '硝苯地平控释片', specification: '30mg x 7片', dosage: '1片', frequency: 'qd', days: 7 },
          { drugName: '厄贝沙坦片', specification: '150mg x 7片', dosage: '1片', frequency: 'qd', days: 7 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方' },
          { action: 'submitted', operatorId: assistant.id, operatorName: '李助理', detail: '提交审核' },
        ],
      },
    },
  })

  console.log('Seed complete. Login accounts (password: 123456):')
  console.log('  assistant: 13800001111')
  console.log('  doctor:    13800002222')
  console.log('  courier:   13800003333')
  console.log('  patient:   13800004444')
}

main().catch(console.error).finally(() => prisma.$disconnect())
```

- [ ] **Step 4: Run seed**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace/backend && npx tsx prisma/seed.ts
```

Expected: outputs seed confirmation with login accounts.

- [ ] **Step 5: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add backend/prisma/ backend/package.json && git commit -m "feat: add Prisma schema, migration, and seed data"
```

---

### Task 3: Backend config, JWT utils, and error handler

**Files:**
- Create: `backend/src/config.ts`
- Create: `backend/src/utils/jwt.ts`
- Create: `backend/src/utils/prescriptionNo.ts`
- Create: `backend/src/middleware/errorHandler.ts`

- [ ] **Step 1: Write config**

Write `backend/src/config.ts`:

```typescript
export const config = {
  port: parseInt(process.env.PORT || '3000'),
  jwtSecret: process.env.JWT_SECRET || 'rxflow-dev-secret-change-in-production',
  jwtExpiresIn: '2h',
  jwtRefreshExpiresIn: '7d',
}
```

- [ ] **Step 2: Write JWT utils**

Write `backend/src/utils/jwt.ts`:

```typescript
import jwt from 'jsonwebtoken'
import { config } from '../config'

export interface TokenPayload {
  userId: number
  role: string
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtExpiresIn })
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: config.jwtRefreshExpiresIn })
}

export function verifyToken(token: string): TokenPayload {
  return jwt.verify(token, config.jwtSecret) as TokenPayload
}
```

- [ ] **Step 3: Write prescription number generator**

Write `backend/src/utils/prescriptionNo.ts`:

```typescript
export function generatePrescriptionNo(id: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  return `PRS-${date}-${String(id).padStart(6, '0')}`
}
```

- [ ] **Step 4: Write error handler**

Write `backend/src/middleware/errorHandler.ts`:

```typescript
import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message)
    this.name = 'AppError'
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message })
  } else {
    console.error('Unhandled error:', err)
    res.status(500).json({ error: '服务器内部错误' })
  }
}
```

- [ ] **Step 5: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add backend/src/ && git commit -m "feat: add config, JWT utils, prescription number generator, error handler"
```

---

### Task 4: Auth middleware and role guard

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/middleware/role.ts`

- [ ] **Step 1: Write auth middleware**

Write `backend/src/middleware/auth.ts`:

```typescript
import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../utils/jwt'
import { AppError } from './errorHandler'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, '未登录或 Token 已过期')
  }
  req.user = verifyToken(header.slice(7))
  next()
}
```

- [ ] **Step 2: Write role guard middleware**

Write `backend/src/middleware/role.ts`:

```typescript
import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, '无权限执行此操作')
    }
    next()
  }
}
```

- [ ] **Step 3: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add backend/src/middleware/ && git commit -m "feat: add auth middleware and role guard"
```

---

### Task 5: Auth routes (login, refresh, me)

**Files:**
- Create: `backend/src/services/authService.ts`
- Create: `backend/src/routes/auth.ts`

- [ ] **Step 1: Write auth service**

Write `backend/src/services/authService.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { signAccessToken, signRefreshToken, verifyToken, TokenPayload } from '../utils/jwt'
import { AppError } from '../middleware/errorHandler'

const prisma = new PrismaClient()

export async function login(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user || !user.isActive) {
    throw new AppError(401, '账号不存在或已停用')
  }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw new AppError(401, '密码错误')
  }
  const payload: TokenPayload = { userId: user.id, role: user.role }
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyToken(refreshToken)
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || !user.isActive) {
    throw new AppError(401, '账号不存在或已停用')
  }
  return signAccessToken({ userId: user.id, role: user.role })
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, '用户不存在')
  return { id: user.id, name: user.name, phone: user.phone, role: user.role }
}
```

- [ ] **Step 2: Write auth routes**

Write `backend/src/routes/auth.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { login, refreshAccessToken, getMe } from '../services/authService'
import { auth } from '../middleware/auth'

const router = Router()

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      res.status(400).json({ error: '手机号和密码不能为空' })
      return
    }
    const result = await login(phone, password)
    res.json(result)
  } catch (e) { next(e) }
})

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken 不能为空' })
      return
    }
    const accessToken = await refreshAccessToken(refreshToken)
    res.json({ accessToken })
  } catch (e) { next(e) }
})

router.get('/me', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getMe(req.user!.userId)
    res.json(user)
  } catch (e) { next(e) }
})

export default router
```

- [ ] **Step 3: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add backend/src/services/ backend/src/routes/ && git commit -m "feat: add auth routes - login, refresh, me"
```

---

### Task 6: Prescription service and routes

**Files:**
- Create: `backend/src/services/prescriptionService.ts`
- Create: `backend/src/routes/prescriptions.ts`

- [ ] **Step 1: Write prescription service**

Write `backend/src/services/prescriptionService.ts`:

```typescript
import { PrismaClient, Prisma } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'
import { generatePrescriptionNo } from '../utils/prescriptionNo'

const prisma = new PrismaClient()

// Role-based query filter
function getListFilter(role: string, userId: number, query: any) {
  const where: any = {}
  if (role === 'assistant') where.assistantId = userId
  if (role === 'doctor') {} // all
  if (role === 'courier') where.courierId = userId
  if (role === 'patient') {
    // patient sees prescriptions linked to their patient record
    return { where: { patient: { phone: { equals: undefined } } }, _patientPhone: '' }
    // handled below with patient phone lookup
  }
  if (query.status) where.status = { in: query.status.split(',') }
  if (query.patientName) where.patient = { name: { contains: query.patientName } }
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {}
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom)
    if (query.dateTo) where.createdAt.lte = new Date(query.dateTo + 'T23:59:59')
  }
  return where
}

export async function listPrescriptions(role: string, userId: number, query: any) {
  const where = getListFilter(role, userId, query)
  const [data, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true } },
        assistant: { select: { name: true } },
        doctor: { select: { name: true } },
        courier: { select: { name: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize || 0,
      take: query.pageSize || 20,
    }),
    prisma.prescription.count({ where }),
  ])
  return { data, total, page: query.page || 1, pageSize: query.pageSize || 20 }
}

export async function getPrescription(id: number, role: string, userId: number) {
  const p = await prisma.prescription.findUnique({
    where: { id },
    include: {
      patient: true,
      assistant: { select: { name: true, phone: true } },
      doctor: { select: { name: true } },
      courier: { select: { name: true, phone: true } },
      items: true,
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!p) throw new AppError(404, '处方不存在')
  // Patient can only view own prescriptions (linked by patient phone)
  if (role === 'patient') {
    // For patient, we need to check if this prescription's patient phone matches their user phone
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || p.patient.phone !== user.phone) {
      throw new AppError(403, '无权限查看此处方')
    }
  }
  return p
}

export async function createPrescription(data: {
  patientId: number
  assistantId: number
  diagnosis: string
  note?: string
  items: { drugName: string; specification: string; dosage: string; frequency: string; days: number; remark?: string }[]
}) {
  const p = await prisma.prescription.create({
    data: {
      patientId: data.patientId,
      assistantId: data.assistantId,
      diagnosis: data.diagnosis,
      note: data.note || '',
      status: 'draft',
      items: { create: data.items },
      timeline: {
        create: { action: 'created', operatorId: data.assistantId, operatorName: '', detail: '创建处方' },
      },
    },
  })
  const prescriptionNo = generatePrescriptionNo(p.id)
  const updated = await prisma.prescription.update({
    where: { id: p.id },
    data: { prescriptionNo },
  })
  // Update timeline with assistant name
  const assistant = await prisma.user.findUnique({ where: { id: data.assistantId } })
  await prisma.prescriptionTimeline.updateMany({
    where: { prescriptionId: p.id, action: 'created' },
    data: { operatorName: assistant?.name || '' },
  })
  return updated
}

export async function updateDraft(id: number, assistantId: number, data: any) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'draft') throw new AppError(400, '只能编辑草稿状态的处方')
  if (p.assistantId !== assistantId) throw new AppError(403, '只能编辑自己创建的处方')

  // Delete old items and create new ones
  await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: id } })
  return prisma.prescription.update({
    where: { id },
    data: {
      patientId: data.patientId,
      diagnosis: data.diagnosis,
      note: data.note,
      items: { create: data.items },
    },
  })
}

export async function submitForReview(id: number, assistantId: number) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'draft' && p.status !== 'rejected') throw new AppError(400, '当前状态不可提交审核')
  if (p.assistantId !== assistantId) throw new AppError(403, '只能提交自己创建的处方')

  const assistant = await prisma.user.findUnique({ where: { id: assistantId } })
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'pending',
      rejectedReason: null,
      rejectedType: null,
      timeline: {
        create: {
          action: p.status === 'rejected' ? 'resubmitted' : 'submitted',
          operatorId: assistantId,
          operatorName: assistant?.name || '',
          detail: p.status === 'rejected' ? '修改后重新提交' : '提交审核',
        },
      },
    },
  })
}

export async function approve(id: number, doctorId: number) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'pending') throw new AppError(400, '当前状态不可审核')

  const doctor = await prisma.user.findUnique({ where: { id: doctorId } })
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'approved',
      doctorId,
      timeline: {
        create: {
          action: 'approved', operatorId: doctorId,
          operatorName: doctor?.name || '', detail: '审核通过',
        },
      },
    },
  })
}

export async function reject(id: number, doctorId: number, reason: string, type: string) {
  if (!reason || reason.length < 10) throw new AppError(400, '驳回理由不能少于10个字')
  if (!['serious', 'normal', 'suggestion'].includes(type)) throw new AppError(400, '无效的驳回类型')

  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'pending') throw new AppError(400, '当前状态不可驳回')

  const doctor = await prisma.user.findUnique({ where: { id: doctorId } })
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'rejected',
      doctorId,
      rejectedReason: reason,
      rejectedType: type,
      timeline: {
        create: {
          action: 'rejected', operatorId: doctorId,
          operatorName: doctor?.name || '', detail: reason,
        },
      },
    },
  })
}

export async function revokeApproval(id: number, doctorId: number, reason: string) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'approved') throw new AppError(400, '当前状态不可撤回')
  const elapsed = Date.now() - p.updatedAt.getTime()
  if (elapsed > 30 * 60 * 1000) throw new AppError(400, '审核通过超过30分钟，不可撤回')

  const doctor = await prisma.user.findUnique({ where: { id: doctorId } })
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'pending',
      doctorId: null,
      timeline: {
        create: {
          action: 'revoked', operatorId: doctorId,
          operatorName: doctor?.name || '', detail: reason,
        },
      },
    },
  })
}

export async function pickup(id: number, courierId: number) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'approved') throw new AppError(400, '当前状态不可取件')

  const courier = await prisma.user.findUnique({ where: { id: courierId } })
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'delivering',
      courierId,
      timeline: {
        create: {
          action: 'picked_up', operatorId: courierId,
          operatorName: courier?.name || '', detail: '快递员取件',
        },
      },
    },
  })
}

export async function confirmDelivery(id: number, courierId: number, proof: string) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'delivering') throw new AppError(400, '当前状态不可签收')
  if (!proof) throw new AppError(400, '签收凭证不能为空')

  const courier = await prisma.user.findUnique({ where: { id: courierId } })
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'received',
      deliveryProof: proof,
      timeline: {
        create: {
          action: 'delivered', operatorId: courierId,
          operatorName: courier?.name || '', detail: '患者签收',
        },
      },
    },
  })
}

export async function reportException(id: number, courierId: number, exType: string, desc: string, photo?: string) {
  const validTypes = ['patient_reject', 'wrong_address', 'unreachable', 'damaged']
  if (!validTypes.includes(exType)) throw new AppError(400, '无效的异常类型')
  if (!desc) throw new AppError(400, '异常描述不能为空')
  if (exType === 'damaged' && !photo) throw new AppError(400, '药品破损需上传照片')

  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'delivering') throw new AppError(400, '当前状态不可上报异常')

  const typeLabels: Record<string, string> = {
    patient_reject: '患者拒收', wrong_address: '地址错误',
    unreachable: '联系不上', damaged: '药品破损',
  }
  const courier = await prisma.user.findUnique({ where: { id: courierId } })
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'returned',
      deliveryProof: photo || p.deliveryProof,
      timeline: {
        create: {
          action: 'returned', operatorId: courierId,
          operatorName: courier?.name || '',
          detail: `${typeLabels[exType]}: ${desc}`,
        },
      },
    },
  })
}

export async function saveTemplate(assistantId: number, name: string, diagnosis: string, items: any[]) {
  return prisma.prescriptionTemplate.create({
    data: { assistantId, name, diagnosis, items: JSON.stringify(items) },
  })
}

export async function getTemplates(assistantId: number) {
  return prisma.prescriptionTemplate.findMany({ where: { assistantId }, orderBy: { createdAt: 'desc' } })
}
```

- [ ] **Step 2: Write prescription routes**

Write `backend/src/routes/prescriptions.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import * as service from '../services/prescriptionService'

const router = Router()
router.use(auth)

// GET /api/prescriptions
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const result = await service.listPrescriptions(req.user!.role, req.user!.userId, req.query)
    res.json(result)
  } catch (e) { next(e) }
})

// GET /api/prescriptions/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await service.getPrescription(parseInt(req.params.id), req.user!.role, req.user!.userId)
    res.json(p)
  } catch (e) { next(e) }
})

// POST /api/prescriptions
router.post('/', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await service.createPrescription({ ...req.body, assistantId: req.user!.userId })
    res.status(201).json(p)
  } catch (e) { next(e) }
})

// PUT /api/prescriptions/:id
router.put('/:id', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await service.updateDraft(parseInt(req.params.id), req.user!.userId, req.body)
    res.json(p)
  } catch (e) { next(e) }
})

// DELETE /api/prescriptions/:id
router.delete('/:id', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    const p = await prisma.prescription.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!p) { res.status(404).json({ error: '处方不存在' }); return }
    if (p.status !== 'draft') { res.status(400).json({ error: '只能删除草稿' }); return }
    if (p.assistantId !== req.user!.userId) { res.status(403).json({ error: '只能删除自己的处方' }); return }
    await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: p.id } })
    await prisma.prescriptionTimeline.deleteMany({ where: { prescriptionId: p.id } })
    await prisma.prescription.delete({ where: { id: p.id } })
    res.json({ success: true })
  } catch (e) { next(e) }
})

// POST /api/prescriptions/:id/submit
router.post('/:id/submit', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await service.submitForReview(parseInt(req.params.id), req.user!.userId)
    res.json(p)
  } catch (e) { next(e) }
})

// POST /api/prescriptions/:id/approve
router.post('/:id/approve', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await service.approve(parseInt(req.params.id), req.user!.userId)
    res.json(p)
  } catch (e) { next(e) }
})

// POST /api/prescriptions/:id/reject
router.post('/:id/reject', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await service.reject(parseInt(req.params.id), req.user!.userId, req.body.reason, req.body.type || 'normal')
    res.json(p)
  } catch (e) { next(e) }
})

// POST /api/prescriptions/:id/revoke
router.post('/:id/revoke', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await service.revokeApproval(parseInt(req.params.id), req.user!.userId, req.body.reason || '医生主动撤回')
    res.json(p)
  } catch (e) { next(e) }
})

// POST /api/prescriptions/:id/pickup
router.post('/:id/pickup', requireRole('courier'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await service.pickup(parseInt(req.params.id), req.user!.userId)
    res.json(p)
  } catch (e) { next(e) }
})

// POST /api/prescriptions/:id/deliver
router.post('/:id/deliver', requireRole('courier'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await service.confirmDelivery(parseInt(req.params.id), req.user!.userId, req.body.proof)
    res.json(p)
  } catch (e) { next(e) }
})

// POST /api/prescriptions/:id/exception
router.post('/:id/exception', requireRole('courier'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const p = await service.reportException(
      parseInt(req.params.id), req.user!.userId,
      req.body.exType, req.body.desc, req.body.photo
    )
    res.json(p)
  } catch (e) { next(e) }
})

// POST /api/prescriptions/templates
router.post('/templates', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const t = await service.saveTemplate(req.user!.userId, req.body.name, req.body.diagnosis, req.body.items)
    res.status(201).json(t)
  } catch (e) { next(e) }
})

// GET /api/prescriptions/templates
router.get('/templates', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const templates = await service.getTemplates(req.user!.userId)
    res.json(templates)
  } catch (e) { next(e) }
})

export default router
```

- [ ] **Step 3: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add backend/src/ && git commit -m "feat: add prescription service and routes - full CRUD + state machine"
```

---

### Task 7: Patient, notification, and dashboard routes

**Files:**
- Create: `backend/src/services/patientService.ts`
- Create: `backend/src/routes/patients.ts`
- Create: `backend/src/services/notificationService.ts`
- Create: `backend/src/routes/notifications.ts`
- Create: `backend/src/services/dashboardService.ts`
- Create: `backend/src/routes/dashboard.ts`

- [ ] **Step 1: Write patient service and routes**

Write `backend/src/services/patientService.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function listPatients(query: any) {
  const where: any = {}
  if (query.name) where.name = { contains: query.name }
  if (query.phone) where.phone = { contains: query.phone }
  const [data, total] = await Promise.all([
    prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize || 0,
      take: query.pageSize || 20,
    }),
    prisma.patient.count({ where }),
  ])
  return { data, total }
}

export async function getPatient(id: number) {
  const p = await prisma.patient.findUnique({ where: { id } })
  return p
}

export async function createPatient(data: any) {
  return prisma.patient.create({ data })
}

export async function updatePatient(id: number, data: any) {
  return prisma.patient.update({ where: { id }, data })
}

export async function deletePatient(id: number) {
  return prisma.patient.delete({ where: { id } })
}
```

Write `backend/src/routes/patients.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import * as service from '../services/patientService'

const router = Router()
router.use(auth)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.listPatients(req.query)) } catch (e) { next(e) }
})
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getPatient(parseInt(req.params.id))) } catch (e) { next(e) }
})
router.post('/', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await service.createPatient(req.body)) } catch (e) { next(e) }
})
router.put('/:id', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.updatePatient(parseInt(req.params.id), req.body)) } catch (e) { next(e) }
})
router.delete('/:id', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.deletePatient(parseInt(req.params.id))) } catch (e) { next(e) }
})

export default router
```

- [ ] **Step 2: Write notification service and routes**

Write `backend/src/services/notificationService.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function listNotifications(userId: number, query: any) {
  const where: any = { userId }
  if (query.type) where.type = query.type
  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (query.page - 1) * query.pageSize || 0,
      take: query.pageSize || 20,
    }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])
  return { data, total, unreadCount }
}

export async function markAsRead(id: number, userId: number) {
  return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } })
}

export async function markAllRead(userId: number) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
}

export async function createNotification(data: {
  userId: number; type: string; title: string; content: string; prescriptionId?: number;
}) {
  return prisma.notification.create({ data })
}
```

Write `backend/src/routes/notifications.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import * as service from '../services/notificationService'

const router = Router()
router.use(auth)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.listNotifications(req.user!.userId, req.query)) } catch (e) { next(e) }
})
router.put('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.markAsRead(parseInt(req.params.id), req.user!.userId)) } catch (e) { next(e) }
})
router.put('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.markAllRead(req.user!.userId)) } catch (e) { next(e) }
})

export default router
```

- [ ] **Step 3: Write dashboard service and routes**

Write `backend/src/services/dashboardService.ts`:

```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function getDashboardStats(userId: number, role: string) {
  if (role === 'assistant') {
    const [draft, pending, rejected, todayApproved] = await Promise.all([
      prisma.prescription.count({ where: { assistantId: userId, status: 'draft' } }),
      prisma.prescription.count({ where: { assistantId: userId, status: 'pending' } }),
      prisma.prescription.count({ where: { assistantId: userId, status: 'rejected' } }),
      prisma.prescription.count({
        where: { assistantId: userId, status: { in: ['approved', 'delivering', 'received'] },
          updatedAt: { gte: new Date(new Date().toDateString()) } },
      }),
    ])
    return { draft, pending, rejected, todayApproved }
  }
  if (role === 'doctor') {
    const [pending, todayReviewed, rejected] = await Promise.all([
      prisma.prescription.count({ where: { status: 'pending' } }),
      prisma.prescription.count({
        where: { doctorId: userId, updatedAt: { gte: new Date(new Date().toDateString()) } },
      }),
      prisma.prescription.count({ where: { status: 'rejected' } }),
    ])
    return { pending, todayReviewed, rejected }
  }
  if (role === 'courier') {
    const [toPickup, delivering, todayDelivered] = await Promise.all([
      prisma.prescription.count({ where: { status: 'approved' } }),
      prisma.prescription.count({ where: { courierId: userId, status: 'delivering' } }),
      prisma.prescription.count({
        where: { courierId: userId, status: 'received', updatedAt: { gte: new Date(new Date().toDateString()) } },
      }),
    ])
    return { toPickup, delivering, todayDelivered }
  }
  if (role === 'patient') {
    // Find patient record by phone matching user phone
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { myPrescriptions: 0, delivering: 0 }
    const patient = await prisma.patient.findFirst({ where: { phone: user.phone } })
    if (!patient) return { myPrescriptions: 0, delivering: 0 }
    const [total, delivering] = await Promise.all([
      prisma.prescription.count({ where: { patientId: patient.id } }),
      prisma.prescription.count({ where: { patientId: patient.id, status: 'delivering' } }),
    ])
    return { myPrescriptions: total, delivering }
  }
  return {}
}
```

Write `backend/src/routes/dashboard.ts`:

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import * as service from '../services/dashboardService'

const router = Router()
router.use(auth)

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const stats = await service.getDashboardStats(req.user!.userId, req.user!.role)
    res.json(stats)
  } catch (e) { next(e) }
})

export default router
```

- [ ] **Step 4: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add backend/src/ && git commit -m "feat: add patient, notification, and dashboard routes"
```

---

### Task 8: Wire up Express entry point

**Files:**
- Create: `backend/src/index.ts`

- [ ] **Step 1: Write Express entry point**

Write `backend/src/index.ts`:

```typescript
import express from 'express'
import cors from 'cors'
import { config } from './config'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth'
import prescriptionRoutes from './routes/prescriptions'
import patientRoutes from './routes/patients'
import notificationRoutes from './routes/notifications'
import dashboardRoutes from './routes/dashboard'

const app = express()
app.use(cors())
app.use(express.json({ limit: '10mb' }))

app.use('/api/auth', authRoutes)
app.use('/api/prescriptions', prescriptionRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/dashboard', dashboardRoutes)

app.use(errorHandler)

app.listen(config.port, () => {
  console.log(`RxFlow backend running on http://localhost:${config.port}`)
})
```

- [ ] **Step 2: Test backend starts**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace/backend && npx tsx src/index.ts
```

Expected: "RxFlow backend running on http://localhost:3000". Kill with Ctrl+C.

- [ ] **Step 3: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add backend/src/index.ts && git commit -m "feat: wire up Express entry point"
```

---

## Part 2: Frontend Framework (Teacher)

### Task 9: Scaffold Vue 3 + TS project

**Files:**
- Create: `frontend/` via Vite scaffolding

- [ ] **Step 1: Create Vite project**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
npm create vite@latest frontend -- --template vue-ts
cd frontend && npm install
```

- [ ] **Step 2: Install additional dependencies**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace/frontend
npm install vue-router@4 pinia axios element-plus @element-plus/icons-vue
```

- [ ] **Step 3: Configure Vite proxy**

Read `frontend/vite.config.ts`, then replace with:

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: { '@': resolve(__dirname, 'src') },
  },
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
})
```

- [ ] **Step 4: Clean up template files**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace/frontend
rm -f src/components/HelloWorld.vue src/style.css
rm -f src/assets/vue.svg public/vite.svg
mkdir -p src/{api,stores,router,composables,directives,components,views,styles}
```

- [ ] **Step 5: Write global styles**

Write `frontend/src/styles/global.css`:

```css
* { margin: 0; padding: 0; box-sizing: border-box; }

body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; }

/* Prescription status colors */
.status-draft       { color: #909399; }
.status-pending     { color: #e6a23c; }
.status-rejected    { color: #f56c6c; }
.status-approved    { color: #67c23a; }
.status-delivering  { color: #409eff; }
.status-received    { color: #9b59b6; }
.status-returned    { color: #e45656; }

/* Dashboard stat cards */
.stat-cards { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px; margin-bottom: 24px; }
.stat-card { padding: 20px; border-radius: 8px; background: #fff; box-shadow: 0 1px 4px rgba(0,0,0,0.08); }
.stat-card .number { font-size: 32px; font-weight: 700; }
.stat-card .label { font-size: 13px; color: #909399; margin-top: 4px; }
```

- [ ] **Step 6: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add frontend/ && git commit -m "feat: scaffold Vue 3 + TS project with Vite, Pinia, Router, Element Plus"
```

---

### Task 10: Axios client and API modules

**Files:**
- Create: `frontend/src/api/client.ts`
- Create: `frontend/src/api/auth.ts`
- Create: `frontend/src/api/prescriptions.ts`
- Create: `frontend/src/api/patients.ts`
- Create: `frontend/src/api/notifications.ts`
- Create: `frontend/src/api/dashboard.ts`

- [ ] **Step 1: Write Axios client with interceptors**

Write `frontend/src/api/client.ts`:

```typescript
import axios from 'axios'
import { ElMessage } from 'element-plus'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let refreshQueue: ((token: string) => void)[] = []

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(client(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        localStorage.setItem('accessToken', data.accessToken)
        refreshQueue.forEach((cb) => cb(data.accessToken))
        refreshQueue = []
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return client(originalRequest)
      } catch {
        localStorage.clear()
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 403) {
      ElMessage.error('无权限执行此操作')
    } else if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    }

    return Promise.reject(error)
  }
)

export default client
```

- [ ] **Step 2: Write auth API**

Write `frontend/src/api/auth.ts`:

```typescript
import client from './client'

export interface LoginParams { phone: string; password: string }
export interface LoginResult {
  accessToken: string; refreshToken: string;
  user: { id: number; name: string; phone: string; role: string }
}
export interface UserInfo { id: number; name: string; phone: string; role: string }

export async function login(params: LoginParams): Promise<LoginResult> {
  const { data } = await client.post('/auth/login', params)
  return data
}
export async function refreshToken(token: string): Promise<{ accessToken: string }> {
  const { data } = await client.post('/auth/refresh', { refreshToken: token })
  return data
}
export async function getMe(): Promise<UserInfo> {
  const { data } = await client.get('/auth/me')
  return data
}
```

- [ ] **Step 3: Write prescription API**

Write `frontend/src/api/prescriptions.ts`:

```typescript
import client from './client'

export interface PrescriptionQuery {
  page?: number; pageSize?: number
  status?: string; patientName?: string; dateFrom?: string; dateTo?: string
}

export function listPrescriptions(query: PrescriptionQuery) {
  return client.get('/prescriptions', { params: query }).then(r => r.data)
}
export function getPrescription(id: number) {
  return client.get(`/prescriptions/${id}`).then(r => r.data)
}
export function createPrescription(data: any) {
  return client.post('/prescriptions', data).then(r => r.data)
}
export function updateDraft(id: number, data: any) {
  return client.put(`/prescriptions/${id}`, data).then(r => r.data)
}
export function deleteDraft(id: number) {
  return client.delete(`/prescriptions/${id}`).then(r => r.data)
}
export function submitForReview(id: number) {
  return client.post(`/prescriptions/${id}/submit`).then(r => r.data)
}
export function approve(id: number) {
  return client.post(`/prescriptions/${id}/approve`).then(r => r.data)
}
export function reject(id: number, reason: string, type: string) {
  return client.post(`/prescriptions/${id}/reject`, { reason, type }).then(r => r.data)
}
export function revokeApproval(id: number, reason: string) {
  return client.post(`/prescriptions/${id}/revoke`, { reason }).then(r => r.data)
}
export function pickup(id: number) {
  return client.post(`/prescriptions/${id}/pickup`).then(r => r.data)
}
export function confirmDelivery(id: number, proof: string) {
  return client.post(`/prescriptions/${id}/deliver`, { proof }).then(r => r.data)
}
export function reportException(id: number, exType: string, desc: string, photo?: string) {
  return client.post(`/prescriptions/${id}/exception`, { exType, desc, photo }).then(r => r.data)
}
export function getTemplates() {
  return client.get('/prescriptions/templates').then(r => r.data)
}
export function saveTemplate(name: string, diagnosis: string, items: any[]) {
  return client.post('/prescriptions/templates', { name, diagnosis, items }).then(r => r.data)
}
```

- [ ] **Step 4: Write patient, notification, dashboard API**

Write `frontend/src/api/patients.ts`:

```typescript
import client from './client'
export function listPatients(query: any) { return client.get('/patients', { params: query }).then(r => r.data) }
export function getPatient(id: number) { return client.get(`/patients/${id}`).then(r => r.data) }
export function createPatient(data: any) { return client.post('/patients', data).then(r => r.data) }
export function updatePatient(id: number, data: any) { return client.put(`/patients/${id}`, data).then(r => r.data) }
export function deletePatient(id: number) { return client.delete(`/patients/${id}`).then(r => r.data) }
```

Write `frontend/src/api/notifications.ts`:

```typescript
import client from './client'
export function listNotifications(query?: any) { return client.get('/notifications', { params: query }).then(r => r.data) }
export function markAsRead(id: number) { return client.put(`/notifications/${id}/read`).then(r => r.data) }
export function markAllRead() { return client.put('/notifications/read-all').then(r => r.data) }
```

Write `frontend/src/api/dashboard.ts`:

```typescript
import client from './client'
export function getStats() { return client.get('/dashboard/stats').then(r => r.data) }
```

- [ ] **Step 5: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add frontend/src/api/ && git commit -m "feat: add Axios client and all API modules"
```

---

### Task 11: Pinia stores

**Files:**
- Create: `frontend/src/stores/user.ts`
- Create: `frontend/src/stores/prescription.ts`
- Create: `frontend/src/stores/patient.ts`
- Create: `frontend/src/stores/notification.ts`

- [ ] **Step 1: Write user store**

Write `frontend/src/stores/user.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getMe } from '@/api/auth'
import type { UserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserInfo | null>(null)
  const token = ref(localStorage.getItem('accessToken') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.role || '')

  async function login(phone: string, password: string) {
    const result = await loginApi({ phone, password })
    token.value = result.accessToken
    refreshToken.value = result.refreshToken
    user.value = result.user
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
  }

  async function fetchUser() {
    if (!token.value) return
    user.value = await getMe()
  }

  function logout() {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.clear()
  }

  return { user, token, refreshToken, isLoggedIn, role, login, fetchUser, logout }
})
```

- [ ] **Step 2: Write prescription store**

Write `frontend/src/stores/prescription.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/prescriptions'

export const usePrescriptionStore = defineStore('prescription', () => {
  const list = ref<any[]>([])
  const current = ref<any>(null)
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(query: api.PrescriptionQuery = {}) {
    loading.value = true
    try {
      const result = await api.listPrescriptions(query)
      list.value = result.data
      total.value = result.total
      return result
    } finally { loading.value = false }
  }

  async function fetchDetail(id: number) {
    current.value = await api.getPrescription(id)
    return current.value
  }

  async function create(data: any) { return api.createPrescription(data) }
  async function update(id: number, data: any) { return api.updateDraft(id, data) }
  async function remove(id: number) { await api.deleteDraft(id); await fetchList() }
  async function submit(id: number) { await api.submitForReview(id); await fetchList() }
  async function approve(id: number) { await api.approve(id); await fetchDetail(id) }
  async function reject(id: number, reason: string, type: string) { await api.reject(id, reason, type); await fetchDetail(id) }
  async function revoke(id: number, reason: string) { await api.revokeApproval(id, reason); await fetchDetail(id) }
  async function pickup(id: number) { await api.pickup(id); await fetchDetail(id) }
  async function deliver(id: number, proof: string) { await api.confirmDelivery(id, proof); await fetchDetail(id) }
  async function reportEx(id: number, exType: string, desc: string, photo?: string) { await api.reportException(id, exType, desc, photo); await fetchDetail(id) }

  return { list, current, total, loading, fetchList, fetchDetail, create, update, remove, submit, approve, reject, revoke, pickup, deliver, reportEx }
})
```

- [ ] **Step 3: Write patient and notification stores**

Write `frontend/src/stores/patient.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/patients'

export const usePatientStore = defineStore('patient', () => {
  const list = ref<any[]>([])
  const total = ref(0)
  async function fetchList(query: any = {}) {
    const result = await api.listPatients(query)
    list.value = result.data
    total.value = result.total
  }
  async function create(data: any) { return api.createPatient(data) }
  async function update(id: number, data: any) { return api.updatePatient(id, data) }
  async function remove(id: number) { await api.deletePatient(id); await fetchList() }
  return { list, total, fetchList, create, update, remove }
})
```

Write `frontend/src/stores/notification.ts`:

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/notifications'

export const useNotificationStore = defineStore('notification', () => {
  const list = ref<any[]>([])
  const unreadCount = ref(0)
  async function fetchList(query: any = {}) {
    const result = await api.listNotifications(query)
    list.value = result.data
    unreadCount.value = result.unreadCount
  }
  async function markRead(id: number) { await api.markAsRead(id); unreadCount.value-- }
  async function markAll() { await api.markAllRead(); unreadCount.value = 0; await fetchList() }
  return { list, unreadCount, fetchList, markRead, markAll }
})
```

- [ ] **Step 4: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add frontend/src/stores/ && git commit -m "feat: add Pinia stores - user, prescription, patient, notification"
```

---

### Task 12: Router with permission guards

**Files:**
- Create: `frontend/src/router/routes.ts`
- Create: `frontend/src/router/index.ts`
- Create: `frontend/src/directives/permission.ts`

- [ ] **Step 1: Define routes**

Write `frontend/src/router/routes.ts`:

```typescript
import type { RouteRecordRaw } from 'vue-router'

export const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/LoginView.vue'),
    meta: { guest: true },
  },
  {
    path: '/',
    component: () => import('@/components/AppLayout.vue'),
    children: [
      {
        path: '',
        name: 'Dashboard',
        component: () => import('@/views/DashboardView.vue'),
        meta: { title: '工作台', roles: ['assistant', 'doctor', 'courier', 'patient'] },
      },
      {
        path: 'prescriptions',
        name: 'PrescriptionList',
        component: () => import('@/views/PrescriptionListView.vue'),
        meta: { title: '处方管理', roles: ['assistant', 'doctor', 'patient'] },
      },
      {
        path: 'prescriptions/new',
        name: 'PrescriptionCreate',
        component: () => import('@/views/PrescriptionFormView.vue'),
        meta: { title: '新建处方', roles: ['assistant'] },
      },
      {
        path: 'prescriptions/:id/edit',
        name: 'PrescriptionEdit',
        component: () => import('@/views/PrescriptionFormView.vue'),
        meta: { title: '编辑处方', roles: ['assistant'] },
      },
      {
        path: 'prescriptions/:id',
        name: 'PrescriptionDetail',
        component: () => import('@/views/PrescriptionDetailView.vue'),
        meta: { title: '处方详情', roles: ['assistant', 'doctor', 'courier', 'patient'] },
      },
      {
        path: 'patients',
        name: 'PatientList',
        component: () => import('@/views/PatientListView.vue'),
        meta: { title: '患者管理', roles: ['assistant', 'doctor'] },
      },
      {
        path: 'delivery',
        name: 'DeliveryList',
        component: () => import('@/views/DeliveryListView.vue'),
        meta: { title: '配送管理', roles: ['courier'] },
      },
      {
        path: 'notifications',
        name: 'NotificationCenter',
        component: () => import('@/views/NotificationCenterView.vue'),
        meta: { title: '通知中心', roles: ['assistant', 'doctor', 'courier', 'patient'] },
      },
      {
        path: 'forbidden',
        name: 'Forbidden',
        component: () => import('@/views/ForbiddenView.vue'),
        meta: { roles: ['assistant', 'doctor', 'courier', 'patient'] },
      },
      {
        path: '/:pathMatch(.*)*',
        name: 'NotFound',
        component: () => import('@/views/NotFoundView.vue'),
        meta: { roles: ['assistant', 'doctor', 'courier', 'patient'] },
      },
    ],
  },
]
```

- [ ] **Step 2: Write router with navigation guard**

Write `frontend/src/router/index.ts`:

```typescript
import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  // Allow guest routes (login)
  if (to.meta.guest) {
    if (userStore.isLoggedIn) return next('/')
    return next()
  }

  // Check login
  if (!userStore.isLoggedIn) {
    return next('/login')
  }

  // Fetch user if not loaded
  if (!userStore.user) {
    await userStore.fetchUser()
  }

  // Check role permission
  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && !allowedRoles.includes(userStore.role)) {
    return next('/forbidden')
  }

  next()
})

export default router
```

- [ ] **Step 3: Write permission directive**

Write `frontend/src/directives/permission.ts`:

```typescript
import type { Directive } from 'vue'
import { useUserStore } from '@/stores/user'

export const vPermission: Directive = {
  mounted(el, binding) {
    const userStore = useUserStore()
    const roles = binding.value as string[]
    if (!roles.includes(userStore.role)) {
      el.style.display = 'none'
    }
  },
}
```

- [ ] **Step 4: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add frontend/src/router/ frontend/src/directives/ && git commit -m "feat: add router with role guards and v-permission directive"
```

---

### Task 13: Layout components and composables

**Files:**
- Create: `frontend/src/composables/useDraft.ts`
- Create: `frontend/src/composables/usePermission.ts`
- Create: `frontend/src/components/AppLayout.vue`
- Create: `frontend/src/components/SidebarMenu.vue`
- Create: `frontend/src/components/HeaderBar.vue`
- Create: `frontend/src/components/StatusTag.vue`
- Create: `frontend/src/components/NotificationBell.vue`

- [ ] **Step 1: Write composables**

Write `frontend/src/composables/useDraft.ts`:

```typescript
import { ref, watch } from 'vue'

export function useDraft(key: string) {
  const draft = ref<any>(null)

  // Restore draft on mount
  const saved = localStorage.getItem(`rxflow_draft_${key}`)
  if (saved) {
    try { draft.value = JSON.parse(saved) } catch { /* corrupted, ignore */ }
  }

  // Auto-save every 30 seconds
  let timer: ReturnType<typeof setInterval> | null = null

  function startAutoSave(getData: () => any) {
    timer = setInterval(() => {
      const data = getData()
      if (data) localStorage.setItem(`rxflow_draft_${key}`, JSON.stringify(data))
    }, 30000)
  }

  function stopAutoSave() { if (timer) clearInterval(timer) }
  function clearDraft() { localStorage.removeItem(`rxflow_draft_${key}`) }

  return { draft, startAutoSave, stopAutoSave, clearDraft }
}
```

Write `frontend/src/composables/usePermission.ts`:

```typescript
import { useUserStore } from '@/stores/user'
import { computed } from 'vue'

export function usePermission() {
  const userStore = useUserStore()
  const role = computed(() => userStore.role)
  function can(...roles: string[]) { return roles.includes(userStore.role) }
  function isRole(r: string) { return userStore.role === r }
  return { role, can, isRole }
}
```

- [ ] **Step 2: Write layout shell**

Write `frontend/src/components/SidebarMenu.vue`:

```vue
<template>
  <el-menu :default-active="route.path" router :collapse="false" background-color="#304156" text-color="#bfcbd9" active-text-color="#409eff">
    <el-menu-item index="/">
      <el-icon><HomeFilled /></el-icon>
      <span>工作台</span>
    </el-menu-item>

    <el-menu-item v-if="can('assistant','doctor')" index="/patients">
      <el-icon><User /></el-icon>
      <span>患者管理</span>
    </el-menu-item>

    <template v-if="can('assistant','doctor','patient')">
      <el-sub-menu index="rx">
        <template #title>
          <el-icon><Document /></el-icon>
          <span>处方管理</span>
        </template>
        <el-menu-item index="/prescriptions">处方列表</el-menu-item>
        <el-menu-item v-if="can('assistant')" index="/prescriptions/new">新建处方</el-menu-item>
      </el-sub-menu>
    </template>

    <el-menu-item v-if="can('courier')" index="/delivery">
      <el-icon><Van /></el-icon>
      <span>配送管理</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { useRoute } from 'vue-router'
import { usePermission } from '@/composables/usePermission'
const route = useRoute()
const { can } = usePermission()
</script>
```

Write `frontend/src/components/HeaderBar.vue`:

```vue
<template>
  <div class="header-bar">
    <div class="header-left">
      <h1 class="logo">RxFlow</h1>
      <span class="subtitle">处方配送管理平台</span>
    </div>
    <div class="header-right">
      <NotificationBell />
      <el-dropdown trigger="click">
        <span class="user-info">
          {{ userStore.user?.name }}
          <el-tag size="small" :type="roleTagType">{{ roleLabel }}</el-tag>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="$router.push('/notifications')">通知中心</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import NotificationBell from './NotificationBell.vue'

const router = useRouter()
const userStore = useUserStore()

const roleLabels: Record<string, string> = {
  assistant: '医生助理', doctor: '医生', courier: '快递员', patient: '病人',
}
const roleLabel = computed(() => roleLabels[userStore.role] || userStore.role)

const roleTagType = computed(() => {
  const map: Record<string, string> = { assistant: 'warning', doctor: 'success', courier: '', patient: 'info' }
  return map[userStore.role] || ''
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header-bar {
  display: flex; align-items: center; justify-content: space-between;
  height: 60px; padding: 0 20px; background: #fff;
  border-bottom: 1px solid #e6e6e6;
}
.header-left { display: flex; align-items: baseline; gap: 12px; }
.logo { font-size: 20px; color: #409eff; }
.subtitle { font-size: 13px; color: #909399; }
.header-right { display: flex; align-items: center; gap: 20px; }
.user-info { cursor: pointer; display: flex; align-items: center; gap: 8px; }
</style>
```

Write `frontend/src/components/AppLayout.vue`:

```vue
<template>
  <div class="app-layout">
    <aside class="sidebar">
      <SidebarMenu />
    </aside>
    <div class="main-area">
      <HeaderBar />
      <main class="content">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import SidebarMenu from './SidebarMenu.vue'
import HeaderBar from './HeaderBar.vue'
</script>

<style scoped>
.app-layout { display: flex; height: 100vh; }
.sidebar { width: 220px; background: #304156; overflow-y: auto; flex-shrink: 0; }
.main-area { flex: 1; display: flex; flex-direction: column; overflow: hidden; }
.content { flex: 1; overflow-y: auto; padding: 24px; background: #f5f7fa; }
</style>
```

- [ ] **Step 3: Write StatusTag and NotificationBell components (skeleton)**

Write `frontend/src/components/StatusTag.vue`:

```vue
<template>
  <el-tag :type="tagType" size="small">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const statusMap: Record<string, { label: string; type: string }> = {
  draft:     { label: '草稿',     type: 'info' },
  pending:   { label: '待审核',   type: 'warning' },
  rejected:  { label: '已驳回',   type: 'danger' },
  approved:  { label: '已通过',   type: 'success' },
  delivering:{ label: '配送中',   type: '' },
  received:  { label: '已签收',   type: '' },
  returned:  { label: '异常退回', type: 'danger' },
}

const label = computed(() => statusMap[props.status]?.label || props.status)
const tagType = computed(() => statusMap[props.status]?.type || 'info')
</script>
```

Write `frontend/src/components/NotificationBell.vue` (skeleton — student fills detail):

```vue
<template>
  <el-badge :value="unreadCount" :hidden="unreadCount === 0" :max="99">
    <el-icon :size="20" style="cursor:pointer" @click="$router.push('/notifications')">
      <Bell />
    </el-icon>
  </el-badge>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'

const notifStore = useNotificationStore()
const unreadCount = computed(() => notifStore.unreadCount)

onMounted(() => { notifStore.fetchList({ page: 1, pageSize: 5 }) })
</script>
```

- [ ] **Step 4: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add frontend/src/components/ frontend/src/composables/ && git commit -m "feat: add layout components, composables, StatusTag, and NotificationBell"
```

---

### Task 14: Login page and App entry

**Files:**
- Create: `frontend/src/views/LoginView.vue`
- Modify: `frontend/src/App.vue`
- Modify: `frontend/src/main.ts`
- Create: `frontend/src/views/ForbiddenView.vue`
- Create: `frontend/src/views/NotFoundView.vue`

- [ ] **Step 1: Write LoginView**

Write `frontend/src/views/LoginView.vue`:

```vue
<template>
  <div class="login-page">
    <div class="login-card">
      <h1>RxFlow</h1>
      <p class="subtitle">处方配送管理平台</p>
      <el-form ref="formRef" :model="form" :rules="rules" @submit.prevent="handleLogin">
        <el-form-item prop="phone">
          <el-input v-model="form.phone" placeholder="手机号" size="large" />
        </el-form-item>
        <el-form-item prop="password">
          <el-input v-model="form.password" type="password" placeholder="密码" size="large" show-password />
        </el-form-item>
        <el-button type="primary" size="large" :loading="loading" native-type="submit" style="width:100%">
          登录
        </el-button>
      </el-form>
      <div class="test-accounts">
        <p>测试账号（密码：123456）</p>
        <p>助理 13800001111 | 医生 13800002222</p>
        <p>快递员 13800003333 | 病人 13800004444</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { ElMessage } from 'element-plus'

const router = useRouter()
const userStore = useUserStore()
const loading = ref(false)

const form = reactive({ phone: '13800001111', password: '123456' })
const rules = {
  phone: [{ required: true, message: '请输入手机号', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
}

async function handleLogin() {
  loading.value = true
  try {
    await userStore.login(form.phone, form.password)
    ElMessage.success(`欢迎回来，${userStore.user?.name}`)
    router.push('/')
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '登录失败')
  } finally { loading.value = false }
}
</script>

<style scoped>
.login-page {
  display: flex; align-items: center; justify-content: center; height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
.login-card {
  background: #fff; padding: 40px; border-radius: 12px; width: 400px;
  box-shadow: 0 10px 40px rgba(0,0,0,0.15);
}
.login-card h1 { text-align: center; color: #409eff; margin-bottom: 4px; }
.subtitle { text-align: center; color: #909399; margin-bottom: 32px; font-size: 14px; }
.test-accounts { margin-top: 20px; font-size: 12px; color: #c0c4cc; text-align: center; line-height: 1.8; }
</style>
```

- [ ] **Step 2: Write ForbiddenView and NotFoundView**

Write `frontend/src/views/ForbiddenView.vue`:

```vue
<template>
  <div class="error-page">
    <h1>403</h1>
    <p>抱歉，您没有权限访问此页面</p>
    <el-button type="primary" @click="$router.push('/')">返回工作台</el-button>
  </div>
</template>
<style scoped>
.error-page { text-align: center; padding: 80px 0; }
.error-page h1 { font-size: 64px; color: #e6a23c; }
.error-page p { font-size: 16px; color: #909399; margin: 16px 0 32px; }
</style>
```

Write `frontend/src/views/NotFoundView.vue`:

```vue
<template>
  <div class="error-page">
    <h1>404</h1>
    <p>页面不存在</p>
    <el-button type="primary" @click="$router.push('/')">返回工作台</el-button>
  </div>
</template>
<style scoped>
.error-page { text-align: center; padding: 80px 0; }
.error-page h1 { font-size: 64px; color: #909399; }
.error-page p { font-size: 16px; color: #909399; margin: 16px 0 32px; }
</style>
```

- [ ] **Step 3: Wire up main.ts and App.vue**

Read `frontend/src/main.ts` then replace with:

```typescript
import { createApp } from 'vue'
import { createPinia } from 'pinia'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'
import * as ElementPlusIconsVue from '@element-plus/icons-vue'
import App from './App.vue'
import router from './router'
import { vPermission } from './directives/permission'
import './styles/global.css'

const app = createApp(App)
app.use(createPinia())
app.use(router)
app.use(ElementPlus)
app.directive('permission', vPermission)

// Register all icons
for (const [key, component] of Object.entries(ElementPlusIconsVue)) {
  app.component(key, component)
}

app.mount('#app')
```

Write `frontend/src/App.vue`:

```vue
<template>
  <router-view />
</template>
```

- [ ] **Step 4: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add frontend/src/ && git commit -m "feat: add login page, error pages, wire up main.ts and App.vue"
```

---

## Part 3: Reference Page (Teacher)

### Task 15: Reference prescription list page

**Files:**
- Create: `frontend/src/views/PrescriptionListView.vue` (reference implementation)

- [ ] **Step 1: Write reference PrescriptionListView**

Write `frontend/src/views/PrescriptionListView.vue` (student's work — teacher provides a simplified working version as reference):

```vue
<template>
  <div class="page">
    <div class="page-header">
      <h2>处方管理</h2>
      <el-button v-permission="['assistant']" type="primary" @click="$router.push('/prescriptions/new')">
        新建处方
      </el-button>
    </div>

    <el-card>
      <!-- Filters -->
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" clearable @change="handleSearch">
            <el-option label="草稿" value="draft" />
            <el-option label="待审核" value="pending" />
            <el-option label="已驳回" value="rejected" />
            <el-option label="已通过" value="approved" />
            <el-option label="配送中" value="delivering" />
            <el-option label="已签收" value="received" />
            <el-option label="异常退回" value="returned" />
          </el-select>
        </el-form-item>
        <el-form-item label="患者">
          <el-input v-model="filters.patientName" placeholder="患者姓名" clearable />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">查询</el-button>
          <el-button @click="handleReset">重置</el-button>
        </el-form-item>
      </el-form>

      <!-- Table -->
      <el-table :data="prescriptionStore.list" v-loading="prescriptionStore.loading" stripe>
        <el-table-column prop="prescriptionNo" label="处方编号" width="180" />
        <el-table-column label="患者" width="120">
          <template #default="{ row }">{{ row.patient?.name }}</template>
        </el-table-column>
        <el-table-column label="电话" width="120">
          <template #default="{ row }">{{ row.patient?.phone }}</template>
        </el-table-column>
        <el-table-column prop="diagnosis" label="诊断" show-overflow-tooltip />
        <el-table-column label="药品数" width="80" align="center">
          <template #default="{ row }">{{ row.items?.length || 0 }}</template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <StatusTag :status="row.status" />
          </template>
        </el-table-column>
        <el-table-column label="创建人" width="100">
          <template #default="{ row }">{{ row.assistant?.name }}</template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">{{ new Date(row.createdAt).toLocaleString() }}</template>
        </el-table-column>
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="$router.push(`/prescriptions/${row.id}`)">详情</el-button>
            <el-button v-if="row.status === 'draft'" size="small" type="warning" @click="handleSubmit(row.id)">提交</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- Pagination -->
      <el-pagination
        v-model:current-page="page" v-model:page-size="pageSize"
        :total="prescriptionStore.total" :page-sizes="[10, 20, 50]"
        layout="total, sizes, prev, pager, next" @change="handleSearch"
        style="margin-top:16px; justify-content:flex-end"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { usePrescriptionStore } from '@/stores/prescription'
import { ElMessage } from 'element-plus'
import StatusTag from '@/components/StatusTag.vue'

const prescriptionStore = usePrescriptionStore()
const page = ref(1)
const pageSize = ref(20)
const filters = reactive({ status: '', patientName: '' })

async function handleSearch() {
  await prescriptionStore.fetchList({ page: page.value, pageSize: pageSize.value, ...filters })
}
function handleReset() { filters.status = ''; filters.patientName = ''; handleSearch() }
async function handleSubmit(id: number) {
  await prescriptionStore.submit(id)
  ElMessage.success('已提交审核')
  handleSearch()
}

onMounted(() => handleSearch())
</script>

<style scoped>
.page { max-width: 1400px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add frontend/src/views/ && git commit -m "feat: add reference PrescriptionListView for student"
```

---

## Part 4: Student Pages (Skeleton Views)

### Task 16: Create skeleton views for student

**Files:**
- Create or overwrite: `frontend/src/views/DashboardView.vue`
- Create or overwrite: `frontend/src/views/PrescriptionFormView.vue`
- Create or overwrite: `frontend/src/views/PrescriptionDetailView.vue`
- Create or overwrite: `frontend/src/views/PatientListView.vue`
- Create or overwrite: `frontend/src/views/DeliveryListView.vue`
- Create or overwrite: `frontend/src/views/NotificationCenterView.vue`

- [ ] **Step 1: Write skeleton views with TODO markers**

These are skeleton pages with the page header and basic structure, marked with `<!-- TODO: student -->` comments so the student knows where to build.

Write `frontend/src/views/DashboardView.vue`:

```vue
<template>
  <div class="page">
    <h2>工作台</h2>
    <!-- TODO: student - implement role-dynamic dashboard
         Assistant: stat cards (draft/pending/rejected/approved) + rejected list + today's prescriptions
         Doctor: stat cards (pending/today reviewed/rejected) + sorted pending list with overdue/urgent flags
         Courier: stat cards (to pickup/delivering/delivered) + task cards + returned list
         Patient: my prescriptions status card + delivering with ETA + history link
         Use: import { getStats } from '@/api/dashboard'
              import { usePermission } from '@/composables/usePermission'
    -->
    <el-empty description="工作台 — 学生待实现" />
  </div>
</template>

<style scoped>
.page { max-width: 1400px; }
</style>
```

Write `frontend/src/views/PrescriptionFormView.vue`:

```vue
<template>
  <div class="page">
    <h2>{{ isEdit ? '编辑处方' : '新建处方' }}</h2>
    <!-- TODO: student - implement dynamic prescription form
         Sections:
         1. Patient selector (searchSelect: name + phone tail + ID card last 4)
            - Selected patient card (name, gender, age, phone, address, allergy in RED)
            - "Add patient" button → drawer with patient form
         2. Diagnosis textarea
            - "Load template" dropdown → fills diagnosis + items
            - "Save as template" button
         3. Drug items (dynamic add/remove rows):
            - drugName (searchSelect) + specification + dosage + frequency (qd/bid/tid/qn) + days + remark
            - At least 1 item, max 20
            - Validation: drug required, dosage number, days 1-90
         4. Note
         Draft auto-save: use useDraft() composable, save every 30s to localStorage
         Submit: call prescriptionStore.create() or prescriptionStore.update()
         Use: import { usePrescriptionStore } from '@/stores/prescription'
              import { usePatientStore } from '@/stores/patient'
              import { useDraft } from '@/composables/useDraft'
    -->
    <el-empty description="新建处方 — 学生待实现" />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
const route = useRoute()
const isEdit = computed(() => route.name === 'PrescriptionEdit')
</script>

<style scoped>
.page { max-width: 1000px; }
</style>
```

Write `frontend/src/views/PrescriptionDetailView.vue`:

```vue
<template>
  <div class="page">
    <h2>处方详情</h2>
    <!-- TODO: student - implement prescription detail + review page
         Sections:
         1. Basic info card (prescriptionNo, status, creator, create time)
         2. Patient info card (name, gender, age, phone, address, allergy RED)
         3. Diagnosis section
         4. Drug items table
         5. Status timeline (el-timeline): created→submitted→approved/rejected→picked_up→delivered→received
            Each node: operator, time, detail. Rejection shown in red.
         6. Review actions (only for doctor + status=pending):
            - "Approve" button (green, confirm dialog)
            - "Reject" button (red, opens form):
              - reject type: serious/normal/suggestion
              - reject reason: required ≥10 chars, template library (dose error/diagnosis mismatch/drug contraindication/missing check/incomplete patient info)
              - Drug item annotation (inline per-row remarks)
         7. Modification diff view (for resubmitted prescriptions):
            - Side-by-side: original rejected vs modified
            - Changed fields highlighted green
            - "Show changes only" toggle
         8. Delivery info (visible when approved/delivering/received):
            - Courier name, phone (masked), tracking number
            - Patient address
            - Delivery proof photo
         Use: import { usePrescriptionStore } from '@/stores/prescription'
              import { useRoute } from 'vue-router'
              Call prescriptionStore.fetchDetail(id) on mount
    -->
    <el-empty description="处方详情 — 学生待实现" />
  </div>
</template>

<style scoped>
.page { max-width: 1200px; }
</style>
```

Write `frontend/src/views/PatientListView.vue`:

```vue
<template>
  <div class="page">
    <div class="page-header">
      <h2>患者管理</h2>
      <el-button type="primary" @click="showCreateDialog = true">新增患者</el-button>
    </div>
    <!-- TODO: student - implement patient CRUD page
         Filters: name, phone
         Table: name, gender, age, phone, address, allergy (red), created time
         Actions: edit (dialog), delete (confirm), view prescriptions
         Create/Edit dialog form:
           - name (required), gender, age
           - phone (required, regex validate), address (required)
           - idCard (optional, regex validate)
           - allergyHistory (important, red "required" hint)
         Use: import { usePatientStore } from '@/stores/patient'
              Call patientStore.fetchList() on mount
    -->
    <el-empty description="患者管理 — 学生待实现" />
  </div>
</template>

<style scoped>
.page { max-width: 1400px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
```

Write `frontend/src/views/DeliveryListView.vue`:

```vue
<template>
  <div class="page">
    <h2>配送管理</h2>
    <!-- TODO: student - implement courier delivery management
         Filters: status (to pickup/delivering/received/returned)
         Table: prescriptionNo, patient name, address, phone (clickable tel: link), drug count, status
         Actions per status:
           - approved → "Pick up" button
           - delivering → "Deliver" button + "Report exception" button
         Deliver flow:
           1. Show drug checklist (drug name × qty)
           2. Upload photo (camera) or enter SMS code
           3. Confirm → status → received
         Exception flow:
           1. Select type: patient_reject/wrong_address/unreachable/damaged
           2. If damaged → upload photo required
           3. Fill description → submit → status → returned
         Use: import { usePrescriptionStore } from '@/stores/prescription'
    -->
    <el-empty description="配送管理 — 学生待实现" />
  </div>
</template>

<style scoped>
.page { max-width: 1400px; }
</style>
```

Write `frontend/src/views/NotificationCenterView.vue`:

```vue
<template>
  <div class="page">
    <div class="page-header">
      <h2>通知中心</h2>
      <el-button type="primary" text @click="handleMarkAll">全部已读</el-button>
    </div>
    <!-- TODO: student - implement notification center
         Filters: type (rejected/approved/delivering/received/returned/system)
         List: notification cards with title, content, time, read status
         Click to mark as read + navigate to related prescription
         "Mark all read" button
         Use: import { useNotificationStore } from '@/stores/notification'
              Call notificationStore.fetchList() on mount
    -->
    <el-empty description="通知中心 — 学生待实现" />
  </div>
</template>

<script setup lang="ts">
import { useNotificationStore } from '@/stores/notification'
const notifStore = useNotificationStore()
async function handleMarkAll() { await notifStore.markAll(); location.reload() }
</script>

<style scoped>
.page { max-width: 800px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add frontend/src/views/ && git commit -m "feat: add skeleton views for student pages with detailed TODO guides"
```

---

### Task 17: Final integration test

- [ ] **Step 1: Start backend and frontend**

```bash
# Terminal 1
cd /Users/lanzhang/Desktop/rxflow-workspace/backend && npm run dev

# Terminal 2
cd /Users/lanzhang/Desktop/rxflow-workspace/frontend && npm run dev
```

- [ ] **Step 2: Smoke test**

1. Open `http://localhost:5173` → redirects to `/login`
2. Login as assistant (13800001111 / 123456) → lands on Dashboard skeleton
3. Navigate to 处方管理 → see reference prescription list with seed data
4. Navigate to 处方详情 → see skeleton
5. Navigate to 患者管理 → see skeleton
6. Navigate to 配送管理 → see skeleton (as courier role, login with 13800003333)
7. Navigate to 通知中心 → see skeleton
8. Try accessing forbidden page directly → see 403
9. Try accessing nonexistent page → see 404

- [ ] **Step 3: Commit any fixes**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace && git add -A && git commit -m "chore: integration test fixes"
```

---

## Student Handoff Checklist

After completing all 17 tasks, the teacher should verify:

- [ ] 4 seed users exist (assistant/doctor/courier/patient), all password `123456`
- [ ] Login with each role works and lands on correct Dashboard
- [ ] Sidebar menu differs by role (courier sees 配送管理, patient sees only 处方+通知)
- [ ] Reference prescription list page loads and shows seed prescription
- [ ] State machine APIs work (submit → approve → pickup → deliver via curl or Postman)
- [ ] Token refresh works (wait 2h or manually expire token)
- [ ] Permission guard blocks unprivileged routes (try /patients as courier)
- [ ] All 6 student skeleton views load without errors
- [ ] Each skeleton view has clear TODO comments describing what to build

**Student instructions:**
1. Read `docs/requirements.md` for full feature specification
2. Study the reference `PrescriptionListView.vue` to understand patterns (API calls, store usage, table setup, StatusTag, v-permission)
3. Replace each `<!-- TODO: student -->` skeleton with real implementation
4. Follow the detailed TODO comments in each skeleton for implementation guidance
5. Run `npm run dev` in both `backend/` and `frontend/` to test

---

## Self-Review

- **Spec coverage**: All modules from requirements.md sections 4.3-4.9 are covered by skeleton views or reference implementation
- **Placeholder scan**: No TBD or TODO in teacher code — student skeletons intentionally use `<!-- TODO: student -->` as handoff markers
- **Type consistency**: PrescriptionStatus enum consistent between Prisma schema, API routes, StatusTag component, and all stores
- **State machine**: All 9 state transitions (submit/approve/reject/revoke/pickup/deliver/exception) implemented in both service and routes
