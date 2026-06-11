# Consultation Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add patient consultation (问诊) as upstream of prescription creation — Registration + Consultation models, doctor-facing pages, and prescription form integration.

**Architecture:** Two new Prisma models (Registration, Consultation) with optional FK on Prescription. Backend follows existing Route→Service→Prisma pattern. Frontend adds two new views (consultation list + form) and extends PrescriptionForm + Dashboard. Zero impact on existing prescription state machine.

**Tech Stack:** Express 4 + Prisma 5 + Vue 3 + TypeScript + Element Plus + Pinia

---

## File Structure Map

```
backend/
├── prisma/
│   ├── schema.prisma          ← MODIFY: add Registration, Consultation; extend Prescription
│   └── seed.ts                ← MODIFY: add seed data
├── src/
│   ├── index.ts               ← MODIFY: register new routes
│   ├── routes/
│   │   ├── registrations.ts   ← CREATE
│   │   └── consultations.ts   ← CREATE
│   └── services/
│       ├── registrationService.ts  ← CREATE
│       └── consultationService.ts  ← CREATE

frontend/src/
├── types/
│   ├── consultation.ts        ← CREATE
│   └── index.ts               ← MODIFY: re-export new types
├── api/
│   └── consultations.ts       ← CREATE
├── stores/
│   └── consultation.ts        ← CREATE
├── router/
│   └── routes.ts              ← MODIFY: add consultation routes
├── views/
│   ├── ConsultationListView.vue  ← CREATE
│   └── ConsultationFormView.vue  ← CREATE
```

---

### Task 1: Prisma Schema — Add Registration & Consultation models

**Files:**
- Modify: `backend/prisma/schema.prisma` (append new models)
- Modify: `backend/prisma/schema.prisma` (add `consultationId` to Prescription model)

- [ ] **Step 1: Add Registration model to schema.prisma**

Append this at the end of `backend/prisma/schema.prisma`:

```prisma
// ============================================================
// Registration — 挂号记录
// ============================================================
model Registration {
  id          Int      @id @default(autoincrement())
  patientId   Int
  patient     Patient  @relation(fields: [patientId], references: [id])
  doctorId    Int
  doctor      User     @relation(fields: [doctorId], references: [id])
  department  String   @db.VarChar(50)
  registeredAt DateTime @default(now())
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  consultations Consultation[]

  @@index([patientId])
  @@index([doctorId])
  @@index([registeredAt])
}

// ============================================================
// Consultation — 问诊记录
// ============================================================
model Consultation {
  id              Int      @id @default(autoincrement())
  registrationId  Int?
  registration    Registration? @relation(fields: [registrationId], references: [id])
  patientId       Int
  patient         Patient  @relation(fields: [patientId], references: [id])
  doctorId        Int
  doctor          User     @relation(fields: [doctorId], references: [id])
  chiefComplaint  String   @db.Text
  presentIllness  String?  @db.Text
  pastHistory     String?  @db.Text
  physicalExam    String?  @db.Text
  auxiliaryExam   String?  @db.Text
  diagnosis       String   @db.Text
  icdCode         String?  @db.VarChar(20)
  treatmentPlan   String?  @db.Text
  status          String   @default("draft") @db.VarChar(20)
  stepsCompleted  Json     @default("[\"chiefComplaint\", \"diagnosis\"]")
  completedAt     DateTime?
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  prescriptions Prescription[]

  @@index([patientId])
  @@index([doctorId])
  @@index([status])
}
```

- [ ] **Step 2: Add consultationId to Prescription model**

In the Prescription model, add this field after `assistantId`:

```prisma
  consultationId Int?
  consultation   Consultation? @relation(fields: [consultationId], references: [id])
```

Also add `@@index([consultationId])` to the Prescription indexes block.

- [ ] **Step 3: Run Prisma migration**

```bash
cd backend && npx prisma migrate dev --name add_consultation_flow
```

Expected: Migration creates `Registration` and `Consultation` tables, adds `consultationId` column to `Prescription`.

- [ ] **Step 4: Verify Prisma client regenerated**

```bash
cd backend && npx prisma generate
```

Expected: No errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add backend/prisma/schema.prisma backend/prisma/migrations/
git commit -m "feat: add Registration and Consultation models with Prescription FK
"
```

---

### Task 2: Backend — Registration Service & Routes

**Files:**
- Create: `backend/src/services/registrationService.ts`
- Create: `backend/src/routes/registrations.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Create registrationService.ts**

```typescript
import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function listRegistrations(query: any) {
  const where: any = {}
  if (query.patientId) where.patientId = parseInt(query.patientId)
  if (query.doctorId) where.doctorId = parseInt(query.doctorId)
  if (query.department) where.department = query.department
  const page = parseInt(query.page) || 1
  const pageSize = parseInt(query.pageSize) || 20
  const [data, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { patient: true, doctor: { select: { id: true, name: true } } },
      orderBy: { registeredAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.registration.count({ where }),
  ])
  return { data, total, page, pageSize }
}

export async function getRegistration(id: number) {
  return prisma.registration.findUnique({
    where: { id },
    include: { patient: true, doctor: { select: { id: true, name: true } }, consultations: true },
  })
}

export async function createRegistration(data: { patientId: number; doctorId: number; department: string }) {
  return prisma.registration.create({ data })
}
```

- [ ] **Step 2: Create registrations.ts route**

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import * as service from '../services/registrationService'

const router = Router()
router.use(auth)

router.get('/', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.listRegistrations(req.query)) } catch (e) { next(e) }
})
router.get('/:id', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getRegistration(parseInt(req.params.id))) } catch (e) { next(e) }
})
router.post('/', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await service.createRegistration(req.body)) } catch (e) { next(e) }
})

export default router
```

- [ ] **Step 3: Register routes in backend/src/index.ts**

Add these two lines after the `drugRoutes` import:

```typescript
import registrationRoutes from './routes/registrations'
```

Add this line after `app.use('/api/drugs', drugRoutes)`:

```typescript
app.use('/api/registrations', registrationRoutes)
```

- [ ] **Step 4: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add backend/src/services/registrationService.ts backend/src/routes/registrations.ts backend/src/index.ts
git commit -m "feat: add Registration service and routes
"
```

---

### Task 3: Backend — Consultation Service & Routes

**Files:**
- Create: `backend/src/services/consultationService.ts`
- Create: `backend/src/routes/consultations.ts`
- Modify: `backend/src/index.ts`

- [ ] **Step 1: Create consultationService.ts**

```typescript
import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'
const prisma = new PrismaClient()

export async function listConsultations(query: any) {
  const where: any = {}
  if (query.status) where.status = query.status
  if (query.patientName) where.patient = { name: { contains: query.patientName } }
  if (query.doctorId) where.doctorId = parseInt(query.doctorId)
  const page = parseInt(query.page) || 1
  const pageSize = parseInt(query.pageSize) || 20
  const [data, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      include: { patient: true, doctor: { select: { id: true, name: true } }, _count: { select: { prescriptions: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.consultation.count({ where }),
  ])
  return { data, total, page, pageSize }
}

export async function getConsultation(id: number) {
  const c = await prisma.consultation.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: { select: { id: true, name: true } },
      registration: true,
      prescriptions: { select: { id: true, prescriptionNo: true, status: true, createdAt: true } },
    },
  })
  if (!c) throw new AppError(404, '问诊记录不存在')
  return c
}

export async function createConsultation(data: {
  patientId: number
  doctorId: number
  chiefComplaint: string
  diagnosis: string
  registrationId?: number
  icdCode?: string
}) {
  if (!data.chiefComplaint || !data.chiefComplaint.trim()) throw new AppError(400, '主诉不能为空')
  if (!data.diagnosis || !data.diagnosis.trim()) throw new AppError(400, '诊断结论不能为空')
  return prisma.consultation.create({
    data: {
      ...data,
      status: 'draft',
      stepsCompleted: ['chiefComplaint', 'diagnosis'],
    },
  })
}

export async function updateConsultation(id: number, data: any) {
  const c = await prisma.consultation.findUnique({ where: { id } })
  if (!c) throw new AppError(404, '问诊记录不存在')
  if (c.status === 'completed') throw new AppError(400, '已完诊的记录不可修改')

  // Build stepsCompleted from provided fields
  const steps: string[] = ['chiefComplaint', 'diagnosis']
  if (data.presentIllness) steps.push('presentIllness')
  if (data.pastHistory) steps.push('pastHistory')
  if (data.physicalExam) steps.push('physicalExam')
  if (data.auxiliaryExam) steps.push('auxiliaryExam')
  if (data.treatmentPlan) steps.push('treatmentPlan')

  return prisma.consultation.update({
    where: { id },
    data: { ...data, stepsCompleted: steps },
  })
}

export async function completeConsultation(id: number) {
  const c = await prisma.consultation.findUnique({ where: { id } })
  if (!c) throw new AppError(404, '问诊记录不存在')
  if (c.status === 'completed') throw new AppError(400, '该问诊已完诊')
  return prisma.consultation.update({
    where: { id },
    data: { status: 'completed', completedAt: new Date() },
  })
}

export async function getConsultationPrescriptions(consultationId: number) {
  return prisma.prescription.findMany({
    where: { consultationId },
    include: { patient: true },
    orderBy: { createdAt: 'desc' },
  })
}
```

- [ ] **Step 2: Create consultations.ts route**

```typescript
import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import * as service from '../services/consultationService'

const router = Router()
router.use(auth)

router.get('/', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.listConsultations(req.query)) } catch (e) { next(e) }
})
router.get('/:id', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getConsultation(parseInt(req.params.id))) } catch (e) { next(e) }
})
router.post('/', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await service.createConsultation({ ...req.body, doctorId: req.user!.userId })) } catch (e) { next(e) }
})
router.put('/:id', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.updateConsultation(parseInt(req.params.id), req.body)) } catch (e) { next(e) }
})
router.post('/:id/complete', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.completeConsultation(parseInt(req.params.id))) } catch (e) { next(e) }
})
router.get('/:id/prescriptions', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getConsultationPrescriptions(parseInt(req.params.id))) } catch (e) { next(e) }
})

export default router
```

- [ ] **Step 3: Register routes in backend/src/index.ts**

Add this import:

```typescript
import consultationRoutes from './routes/consultations'
```

Add route registration:

```typescript
app.use('/api/consultations', consultationRoutes)
```

- [ ] **Step 4: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add backend/src/services/consultationService.ts backend/src/routes/consultations.ts backend/src/index.ts
git commit -m "feat: add Consultation service and routes
"
```

---

### Task 4: Backend — Extend Prescription for consultationId

**Files:**
- Modify: `backend/src/services/prescriptionService.ts`
- Modify: `backend/src/routes/prescriptions.ts`

- [ ] **Step 1: Add consultationId support to prescriptionService create/update**

Read `backend/src/services/prescriptionService.ts` and find the `createPrescription` function. Add `consultationId` to the data destructuring. When `consultationId` is provided, auto-fill patientId from the consultation:

```typescript
// Inside createPrescription, before prisma.prescription.create:
if (data.consultationId) {
  const consultation = await prisma.consultation.findUnique({ where: { id: data.consultationId } })
  if (!consultation) throw new AppError(404, '关联的问诊记录不存在')
  if (consultation.status !== 'completed') throw new AppError(400, '只能关联已完诊的问诊记录')
  // Use consultation's patient if not explicitly overridden
  if (!data.patientId) data.patientId = consultation.patientId
}
```

Ensure `consultationId` is passed to `prisma.prescription.create({ data: { ...data, consultationId: data.consultationId } })`.

- [ ] **Step 2: Include consultation in prescription detail response**

In `getPrescription`, add `consultation: { select: { id: true, diagnosis: true } }` to the `include` clause.

- [ ] **Step 3: Extend prescription list to support consultationId filter**

In `listPrescriptions`, add `if (query.consultationId) where.consultationId = parseInt(query.consultationId)`.

- [ ] **Step 4: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add backend/src/services/prescriptionService.ts backend/src/routes/prescriptions.ts
git commit -m "feat: extend Prescription with consultationId support
"
```

---

### Task 5: Backend — Seed data for consultations

**Files:**
- Modify: `backend/prisma/seed.ts`

- [ ] **Step 1: Add consultation seed data**

Read the existing seed file to understand the pattern, then append consultation seed data after existing seeds. Create 3 consultations (2 completed, 1 in_progress) for the doctor user:

```typescript
// Seed consultations (doctor user id=2)
const consultation1 = await prisma.consultation.create({
  data: {
    patientId: patient1.id,
    doctorId: 2,
    chiefComplaint: '反复头晕、头痛1月余，加重3天',
    presentIllness: '患者1月前无明显诱因出现头晕、头痛，呈持续性胀痛',
    diagnosis: '高血压病2级',
    icdCode: 'I10',
    treatmentPlan: '建议口服硝苯地平控释片30mg qd，监测血压，低盐低脂饮食',
    status: 'completed',
    completedAt: new Date(),
    stepsCompleted: ['chiefComplaint', 'diagnosis', 'presentIllness', 'treatmentPlan'],
  },
})

const consultation2 = await prisma.consultation.create({
  data: {
    patientId: patient2.id,
    doctorId: 2,
    chiefComplaint: '发热、咳嗽3天',
    diagnosis: '急性上呼吸道感染',
    icdCode: 'J06.9',
    treatmentPlan: '建议口服阿莫西林0.5g tid，布洛芬必要时服用，多饮水休息',
    status: 'completed',
    completedAt: new Date(),
  },
})

const consultation3 = await prisma.consultation.create({
  data: {
    patientId: patient1.id,
    doctorId: 2,
    chiefComplaint: '口干、多饮、多尿2周',
    diagnosis: '2型糖尿病',
    status: 'in_progress',
  },
})
```

- [ ] **Step 2: Run seed to verify**

```bash
cd backend && npm run db:seed
```

Expected: Seed completes without errors.

- [ ] **Step 3: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add backend/prisma/seed.ts
git commit -m "feat: add consultation seed data
"
```

---

### Task 6: Frontend — Types & API layer

**Files:**
- Create: `frontend/src/types/consultation.ts`
- Create: `frontend/src/api/consultations.ts`
- Modify: `frontend/src/types/index.ts`

- [ ] **Step 1: Create consultation types**

```typescript
export type ConsultationStatus = 'draft' | 'in_progress' | 'completed'

export interface Consultation {
  id: number
  patientId: number
  patient?: { id: number; name: string; gender: string; age: number; phone: string }
  doctorId: number
  doctor?: { id: number; name: string }
  registrationId?: number
  chiefComplaint: string
  presentIllness?: string
  pastHistory?: string
  physicalExam?: string
  auxiliaryExam?: string
  diagnosis: string
  icdCode?: string
  treatmentPlan?: string
  status: ConsultationStatus
  stepsCompleted: string[]
  completedAt?: string
  createdAt: string
  _count?: { prescriptions: number }
}

export interface ConsultationQuery {
  patientName?: string
  status?: ConsultationStatus
  doctorId?: number
  page?: number
  pageSize?: number
}

export interface ConsultationCreateParams {
  patientId: number
  chiefComplaint: string
  diagnosis: string
  icdCode?: string
  registrationId?: number
}

export interface ConsultationUpdateParams {
  presentIllness?: string
  pastHistory?: string
  physicalExam?: string
  auxiliaryExam?: string
  treatmentPlan?: string
}
```

- [ ] **Step 2: Create consultations API module**

```typescript
import client from './client'
import type { ConsultationQuery, ConsultationCreateParams, ConsultationUpdateParams } from '@/types'

export function listConsultations(query: ConsultationQuery = {}) {
  return client.get('/consultations', { params: query }).then((r) => r.data)
}
export function getConsultation(id: number) {
  return client.get(`/consultations/${id}`).then((r) => r.data)
}
export function createConsultation(data: ConsultationCreateParams) {
  return client.post('/consultations', data).then((r) => r.data)
}
export function updateConsultation(id: number, data: ConsultationUpdateParams) {
  return client.put(`/consultations/${id}`, data).then((r) => r.data)
}
export function completeConsultation(id: number) {
  return client.post(`/consultations/${id}/complete`).then((r) => r.data)
}
export function getConsultationPrescriptions(id: number) {
  return client.get(`/consultations/${id}/prescriptions`).then((r) => r.data)
}
```

- [ ] **Step 3: Re-export types in frontend/src/types/index.ts**

Add:

```typescript
export type { ConsultationStatus, Consultation, ConsultationQuery, ConsultationCreateParams, ConsultationUpdateParams } from './consultation'
```

- [ ] **Step 4: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add frontend/src/types/consultation.ts frontend/src/api/consultations.ts frontend/src/types/index.ts
git commit -m "feat: add consultation types and API layer
"
```

---

### Task 7: Frontend — Consultation Store

**Files:**
- Create: `frontend/src/stores/consultation.ts`

- [ ] **Step 1: Create consultation store**

```typescript
import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/consultations'
import type { Consultation, ConsultationQuery, ConsultationCreateParams, ConsultationUpdateParams } from '@/types'

export const useConsultationStore = defineStore('consultation', () => {
  const list = ref<Consultation[]>([])
  const current = ref<Consultation | null>(null)
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(query: ConsultationQuery = {}) {
    loading.value = true
    try {
      const result = await api.listConsultations(query)
      list.value = result.data
      total.value = result.total
      return result
    } finally { loading.value = false }
  }

  async function fetchDetail(id: number) {
    current.value = await api.getConsultation(id)
    return current.value
  }

  async function create(data: ConsultationCreateParams) {
    return api.createConsultation(data)
  }

  async function update(id: number, data: ConsultationUpdateParams) {
    const result = await api.updateConsultation(id, data)
    if (current.value && current.value.id === id) current.value = result
    return result
  }

  async function complete(id: number) {
    const result = await api.completeConsultation(id)
    if (current.value && current.value.id === id) current.value = result
    return result
  }

  return { list, current, total, loading, fetchList, fetchDetail, create, update, complete }
})
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add frontend/src/stores/consultation.ts
git commit -m "feat: add consultation Pinia store
"
```

---

### Task 8: Frontend — ConsultationListView

**Files:**
- Create: `frontend/src/views/ConsultationListView.vue`
- Modify: `frontend/src/router/routes.ts`

- [ ] **Step 1: Add consultation routes to router**

In `frontend/src/router/routes.ts`, add the import:

```typescript
import ConsultationListView from '@/views/ConsultationListView.vue'
```

Add these routes inside the `children` array of the `'/'` route, after the `patients` route:

```typescript
{
  path: 'consultations',
  name: 'ConsultationList',
  component: ConsultationListView,
  meta: { title: '问诊管理', roles: ['doctor'], group: '业务管理' },
},
{
  path: 'consultations/new',
  name: 'ConsultationCreate',
  component: () => import('@/views/ConsultationFormView.vue'),
  meta: { title: '新建问诊', roles: ['doctor'], sidebar: false },
},
{
  path: 'consultations/:id',
  name: 'ConsultationDetail',
  component: () => import('@/views/ConsultationFormView.vue'),
  meta: { title: '问诊详情', roles: ['doctor', 'assistant'], sidebar: false },
},
```

- [ ] **Step 2: Create ConsultationListView.vue**

```vue
<template>
  <div class="page">
    <div class="page-header">
      <h2>问诊管理</h2>
      <el-button v-permission="['doctor']" type="primary" @click="$router.push('/consultations/new')">
        新建问诊
      </el-button>
    </div>

    <el-card>
      <el-form :inline="true" :model="filters">
        <el-form-item label="状态">
          <el-select v-model="filters.status" placeholder="全部" style="width: 140px" clearable @change="handleSearch">
            <el-option label="草稿" value="draft" />
            <el-option label="问诊中" value="in_progress" />
            <el-option label="已完诊" value="completed" />
          </el-select>
        </el-form-item>
        <el-form-item label="患者">
          <el-input v-model="filters.patientName" placeholder="患者姓名" clearable @clear="handleSearch" @keyup.enter="handleSearch" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="handleSearch">搜索</el-button>
        </el-form-item>
      </el-form>

      <el-table :data="store.list" v-loading="store.loading" @row-click="(row: Consultation) => $router.push(`/consultations/${row.id}`)" style="cursor: pointer;">
        <el-table-column prop="id" label="编号" width="70" />
        <el-table-column label="患者" width="100">
          <template #default="{ row }">
            {{ (row as Consultation).patient?.name || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="主诉" min-width="180" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row as Consultation).chiefComplaint }}
          </template>
        </el-table-column>
        <el-table-column label="诊断" min-width="160" show-overflow-tooltip>
          <template #default="{ row }">
            {{ (row as Consultation).diagnosis }}
          </template>
        </el-table-column>
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="statusTagType((row as Consultation).status)" size="small">
              {{ statusLabel((row as Consultation).status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="处方数" width="80" align="center">
          <template #default="{ row }">
            {{ (row as Consultation)._count?.prescriptions || 0 }}
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ new Date((row as Consultation).createdAt).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
      </el-table>

      <el-pagination
        v-model:current-page="pagination.page"
        :page-size="pagination.pageSize"
        :total="store.total"
        layout="total, prev, pager, next"
        @current-change="handlePageChange"
        style="margin-top: 16px; justify-content: flex-end;"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, onMounted } from 'vue'
import { useConsultationStore } from '@/stores/consultation'
import type { Consultation } from '@/types'

const store = useConsultationStore()
const filters = reactive({ status: '' as string, patientName: '' })
const pagination = reactive({ page: 1, pageSize: 20 })

function statusTagType(status: string) {
  const map: Record<string, string> = { draft: 'info', in_progress: 'warning', completed: 'success' }
  return map[status] || 'info'
}
function statusLabel(status: string) {
  const map: Record<string, string> = { draft: '草稿', in_progress: '问诊中', completed: '已完诊' }
  return map[status] || status
}

async function handleSearch() {
  pagination.page = 1
  await store.fetchList({ ...filters, page: 1, pageSize: pagination.pageSize })
}
async function handlePageChange(page: number) {
  pagination.page = page
  await store.fetchList({ ...filters, page, pageSize: pagination.pageSize })
}

onMounted(async () => {
  await store.fetchList({ page: 1, pageSize: pagination.pageSize })
})
</script>

<style scoped>
.page { padding: 0; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-header h2 { font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; margin: 0; }
</style>
```

- [ ] **Step 3: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add frontend/src/views/ConsultationListView.vue frontend/src/router/routes.ts
git commit -m "feat: add ConsultationListView and routes
"
```

---

### Task 9: Frontend — ConsultationFormView

**Files:**
- Create: `frontend/src/views/ConsultationFormView.vue`

- [ ] **Step 1: Create ConsultationFormView.vue**

This is the largest file. The form supports both create (at `/consultations/new`) and view/edit (at `/consultations/:id`), determined by route:
- `route.name === 'ConsultationCreate'` → create mode, doctor fills chiefComplaint + diagnosis
- `route.name === 'ConsultationDetail'` → view/edit mode, shows all fields with step-by-step completion

```vue
<template>
  <div class="page">
    <div class="page-header">
      <h2>{{ isCreate ? '新建问诊' : '问诊详情' }}</h2>
      <div style="display: flex; gap: 8px;">
        <el-button v-if="isCreate" @click="$router.back()">取消</el-button>
        <el-button v-if="isCreate" type="primary" :loading="submitting" @click="handleCreate">保存草稿</el-button>
        <template v-if="!isCreate && store.current && store.current.status !== 'completed' && isDoctor">
          <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
          <el-button type="success" :loading="completing" @click="handleComplete">标记完诊</el-button>
        </template>
      </div>
    </div>

    <el-card v-if="!isCreate && store.current" style="margin-bottom: 16px;">
      <div class="meta-bar">
        <span>患者：<strong>{{ store.current.patient?.name }}</strong></span>
        <el-tag :type="statusTagType(store.current.status)" size="small">{{ statusLabel(store.current.status) }}</el-tag>
        <span v-if="store.current.doctor">医生：{{ store.current.doctor.name }}</span>
      </div>
    </el-card>

    <!-- Step 1: Core (always visible) -->
    <el-card>
      <template #header><h3>核心信息</h3></template>
      <el-form label-position="top">
        <el-form-item v-if="isCreate" label="选择患者" required>
          <el-select
            v-model="form.patientId"
            filterable
            remote
            reserve-keyword
            :remote-method="searchPatients"
            :loading="patientLoading"
            placeholder="输入患者姓名搜索..."
            clearable
            style="width: 100%;"
          >
            <el-option v-for="p in patientOptions" :key="p.id" :label="`${p.name} · ${p.phone || ''}`" :value="p.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="主诉" required>
          <el-input
            v-model="form.chiefComplaint"
            type="textarea"
            :rows="2"
            placeholder="患者主要症状及持续时间，如：反复头晕、头痛1月余"
            :disabled="!canEdit"
          />
        </el-form-item>
        <el-form-item label="诊断结论" required>
          <el-input
            v-model="form.diagnosis"
            type="textarea"
            :rows="2"
            placeholder="诊断结论，如：高血压病2级"
            :disabled="!canEdit"
          />
        </el-form-item>
        <el-form-item label="ICD-10编码">
          <el-input v-model="form.icdCode" placeholder="如：I10" :disabled="!canEdit" style="max-width: 200px;" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Step 2: History & Exam (visible in detail mode) -->
    <el-card v-if="!isCreate && store.current">
      <template #header><h3>病史与检查</h3></template>
      <el-form label-position="top">
        <el-form-item label="现病史">
          <el-input v-model="form.presentIllness" type="textarea" :rows="3" placeholder="疾病发生发展过程..." :disabled="!canEdit" />
        </el-form-item>
        <el-form-item label="既往史">
          <el-input v-model="form.pastHistory" type="textarea" :rows="2" placeholder="既往疾病、手术、过敏史..." :disabled="!canEdit" />
        </el-form-item>
        <el-form-item label="体格检查">
          <el-input v-model="form.physicalExam" type="textarea" :rows="2" placeholder="查体结果..." :disabled="!canEdit" />
        </el-form-item>
        <el-form-item label="辅助检查">
          <el-input v-model="form.auxiliaryExam" type="textarea" :rows="2" placeholder="实验室及影像学检查结果..." :disabled="!canEdit" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Step 3: Treatment Plan (visible in detail mode) -->
    <el-card v-if="!isCreate && store.current">
      <template #header><h3>治疗方案</h3></template>
      <el-form label-position="top">
        <el-form-item label="用药建议">
          <el-input v-model="form.treatmentPlan" type="textarea" :rows="3" placeholder="推荐用药方案..." :disabled="!canEdit" />
        </el-form-item>
      </el-form>
    </el-card>

    <!-- Linked Prescriptions -->
    <el-card v-if="!isCreate && store.current && store.current.status === 'completed'">
      <template #header><h3>关联处方</h3></template>
      <el-table :data="linkedPrescriptions" v-loading="loadingLinked" empty-text="暂无关联处方">
        <el-table-column prop="prescriptionNo" label="处方编号" />
        <el-table-column label="状态" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ row.status }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column label="创建时间" width="160">
          <template #default="{ row }">
            {{ new Date(row.createdAt).toLocaleString('zh-CN') }}
          </template>
        </el-table-column>
      </el-table>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { reactive, ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useConsultationStore } from '@/stores/consultation'
import { useUserStore } from '@/stores/user'
import { usePatientStore } from '@/stores/patient'
import * as consultationApi from '@/api/consultations'
import { ElMessage } from 'element-plus'
import type { Consultation } from '@/types'

const route = useRoute()
const router = useRouter()
const store = useConsultationStore()
const userStore = useUserStore()
const patientStore = usePatientStore()

const isCreate = computed(() => route.name === 'ConsultationCreate')
const isDoctor = computed(() => userStore.role === 'doctor')
const canEdit = computed(() => isCreate.value || (isDoctor.value && store.current?.status !== 'completed'))

const submitting = ref(false)
const saving = ref(false)
const completing = ref(false)
const loadingLinked = ref(false)
const linkedPrescriptions = ref<any[]>([])

const form = reactive({
  patientId: undefined as number | undefined,
  chiefComplaint: '',
  diagnosis: '',
  icdCode: '',
  presentIllness: '',
  pastHistory: '',
  physicalExam: '',
  auxiliaryExam: '',
  treatmentPlan: '',
})

const patientOptions = ref<any[]>([])
const patientLoading = ref(false)

async function searchPatients(query: string) {
  if (!query) { patientOptions.value = []; return }
  patientLoading.value = true
  try {
    const result = await patientStore.fetchList({ name: query, pageSize: 10 })
    patientOptions.value = result.data || []
  } finally { patientLoading.value = false }
}

function statusTagType(status: string) {
  const map: Record<string, string> = { draft: 'info', in_progress: 'warning', completed: 'success' }
  return map[status] || 'info'
}
function statusLabel(status: string) {
  const map: Record<string, string> = { draft: '草稿', in_progress: '问诊中', completed: '已完诊' }
  return map[status] || status
}

async function handleCreate() {
  if (!form.patientId || !form.chiefComplaint.trim() || !form.diagnosis.trim()) {
    ElMessage.warning('请填写患者、主诉和诊断结论')
    return
  }
  submitting.value = true
  try {
    await store.create({
      patientId: form.patientId,
      chiefComplaint: form.chiefComplaint,
      diagnosis: form.diagnosis,
      icdCode: form.icdCode || undefined,
    })
    ElMessage.success('问诊记录已创建')
    router.push('/consultations')
  } finally { submitting.value = false }
}

async function handleSave() {
  saving.value = true
  try {
    await store.update(store.current!.id, {
      presentIllness: form.presentIllness || undefined,
      pastHistory: form.pastHistory || undefined,
      physicalExam: form.physicalExam || undefined,
      auxiliaryExam: form.auxiliaryExam || undefined,
      treatmentPlan: form.treatmentPlan || undefined,
    })
    ElMessage.success('已保存')
  } finally { saving.value = false }
}

async function handleComplete() {
  completing.value = true
  try {
    await store.complete(store.current!.id)
    ElMessage.success('已标记完诊')
  } finally { completing.value = false }
}

onMounted(async () => {
  if (!isCreate.value) {
    const id = parseInt(route.params.id as string)
    await store.fetchDetail(id)
    const c = store.current!
    form.chiefComplaint = c.chiefComplaint
    form.diagnosis = c.diagnosis
    form.icdCode = c.icdCode || ''
    form.presentIllness = c.presentIllness || ''
    form.pastHistory = c.pastHistory || ''
    form.physicalExam = c.physicalExam || ''
    form.auxiliaryExam = c.auxiliaryExam || ''
    form.treatmentPlan = c.treatmentPlan || ''

    if (c.status === 'completed') {
      loadingLinked.value = true
      try {
        linkedPrescriptions.value = await consultationApi.getConsultationPrescriptions(id)
      } finally { loadingLinked.value = false }
    }
  }
})
</script>

<style scoped>
.page { padding: 0; max-width: 860px; }
.page-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
.page-header h2 { font-family: 'DM Serif Display', Georgia, serif; font-size: 20px; margin: 0; }
.meta-bar { display: flex; align-items: center; gap: 16px; font-size: 13px; color: var(--warm-700); }
</style>
```

- [ ] **Step 2: Check for `useUserStore` role property**

Verify that `useUserStore` exposes a `role` computed/ref. Read `frontend/src/stores/user.ts` to confirm. If `role` is not directly exposed, add:
```typescript
const role = computed(() => user.value?.role || '')
```
And include it in the return.

- [ ] **Step 3: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add frontend/src/views/ConsultationFormView.vue
git commit -m "feat: add ConsultationFormView with step-by-step entry
"
```

---

### Task 10: Frontend — Extend PrescriptionFormView with consultation linking

**Files:**
- Modify: `frontend/src/views/PrescriptionFormView.vue`

- [ ] **Step 1: Add consultation selector above patient selection**

First read `frontend/src/views/PrescriptionFormView.vue` fully to identify:
- The variable names used for `patientId` in the form object
- The ref name for `selectedPatient`
- The variable name for the `note`/remark field
- The function name for submitting/saving (e.g., `handleSubmit`, `handleSaveDraft`)
- Whether `consultationApi` is already imported

Then, add a new section before the patient selector section.

After the `<h1>` title and before `<div class="form-section"><div class="section-header"><h2 class="section-title">患者信息</h2>`, add:

```vue
<!-- Consultation Linking -->
<div v-if="!isEdit && !resubmitMode" class="form-section">
  <div class="section-header">
    <h2 class="section-title">关联问诊</h2>
  </div>
  <el-form-item label="选择已完诊记录（可选）">
    <el-select
      v-model="linkedConsultationId"
      filterable
      remote
      reserve-keyword
      :remote-method="searchConsultations"
      :loading="consultationLoading"
      placeholder="按患者姓名或诊断搜索..."
      clearable
      style="width: 100%;"
      @change="onConsultationSelect"
    >
      <el-option
        v-for="c in consultationOptions"
        :key="c.id"
        :label="`${c.patient?.name} — ${c.diagnosis}`"
        :value="c.id"
      />
    </el-select>
  </el-form-item>
</div>
```

- [ ] **Step 2: Add consultation-related script logic**

In the `<script setup lang="ts">` of PrescriptionFormView.vue, add these refs and functions:

```typescript
import * as consultationApi from '@/api/consultations'

const linkedConsultationId = ref<number | undefined>(undefined)
const consultationOptions = ref<any[]>([])
const consultationLoading = ref(false)

async function searchConsultations(query: string) {
  if (!query) { consultationOptions.value = []; return }
  consultationLoading.value = true
  try {
    const result = await consultationApi.listConsultations({ status: 'completed', patientName: query, pageSize: 10 })
    consultationOptions.value = result.data || []
  } finally { consultationLoading.value = false }
}

async function onConsultationSelect(consultationId: number | undefined) {
  if (!consultationId) return
  const consultation = await consultationApi.getConsultation(consultationId)

  // Auto-fill patient
  if (consultation.patient) {
    form.patientId = consultation.patient.id
    selectedPatient.value = consultation.patient
  }

  // Auto-fill diagnosis into note/remark
  if (consultation.treatmentPlan) {
    form.note = `[诊断关联] ${consultation.diagnosis}\n[用药建议] ${consultation.treatmentPlan}`
  } else {
    form.note = `[诊断关联] ${consultation.diagnosis}`
  }
}
```

- [ ] **Step 3: Pass consultationId on create**

Find the `handleSubmit` or `handleSave` function in PrescriptionFormView. When calling `store.create()`, add `consultationId: linkedConsultationId.value` to the data if `linkedConsultationId.value` is truthy.

- [ ] **Step 4: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add frontend/src/views/PrescriptionFormView.vue
git commit -m "feat: add consultation linking to PrescriptionFormView
"
```

---

### Task 11: Frontend — Extend Dashboard with doctor consultation stats

**Files:**
- Modify: `frontend/src/components/DashboardDoctorPanels.vue`

- [ ] **Step 1: Add consultation stats to doctor dashboard**

Read `frontend/src/components/DashboardDoctorPanels.vue`. Add a new stat card row above existing cards:

```vue
<!-- Consultation stats -->
<div class="stat-cards">
  <div class="stat-card consultation-stat">
    <div class="stat-number">{{ consultationCounts.draft }}</div>
    <div class="stat-label">待问诊</div>
  </div>
  <div class="stat-card consultation-stat">
    <div class="stat-number">{{ consultationCounts.progress }}</div>
    <div class="stat-label">问诊中</div>
  </div>
  <div class="stat-card consultation-stat">
    <div class="stat-number">{{ consultationCounts.completedToday }}</div>
    <div class="stat-label">今日完诊</div>
  </div>
  <div class="stat-card consultation-stat clickable" @click="$router.push('/consultations/new')">
    <el-icon :size="20"><Plus /></el-icon>
    <div class="stat-label">新建问诊</div>
  </div>
</div>
```

In the `<script setup>` section, add:

```typescript
import { useConsultationStore } from '@/stores/consultation'
import * as consultationApi from '@/api/consultations'
import { onMounted, reactive } from 'vue'

const consultationStore = useConsultationStore()
const consultationCounts = reactive({ draft: 0, progress: 0, completedToday: 0 })

onMounted(async () => {
  // Fetch each status count
  const [draftRes, progressRes, completedRes] = await Promise.all([
    consultationApi.listConsultations({ status: 'draft', pageSize: 1 }),
    consultationApi.listConsultations({ status: 'in_progress', pageSize: 1 }),
    consultationApi.listConsultations({ status: 'completed', pageSize: 1 }),
  ])
  consultationCounts.draft = draftRes.total || 0
  consultationCounts.progress = progressRes.total || 0
  consultationCounts.completedToday = completedRes.total || 0
})
```

- [ ] **Step 2: Commit**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add frontend/src/components/DashboardDoctorPanels.vue
git commit -m "feat: add consultation stats to doctor dashboard
"
```

---

### Task 12: Integration test & verify

**Files:**
- None (manual verification)

- [ ] **Step 1: Start backend and verify API**

```bash
cd backend && npm run dev
```

Test endpoints:
```bash
# List consultations
curl http://localhost:3000/api/consultations -H "Authorization: Bearer <doctor-token>"
# Should return seed data

# Create consultation
curl -X POST http://localhost:3000/api/consultations \
  -H "Authorization: Bearer <doctor-token>" \
  -H "Content-Type: application/json" \
  -d '{"patientId":1,"chiefComplaint":"test","diagnosis":"test diagnosis"}'
# Should return 201

# Complete consultation
curl -X POST http://localhost:3000/api/consultations/1/complete \
  -H "Authorization: Bearer <doctor-token>"
# Should return completed consultation
```

- [ ] **Step 2: Start frontend and verify UI**

```bash
cd frontend && npm run dev
```

Verify:
1. Login as doctor → sidebar shows "问诊管理"
2. Click "问诊管理" → ConsultationListView loads with seed data
3. Click "新建问诊" → form loads, can create
4. Click a row → detail view with all sections
5. Click "标记完诊" → status changes
6. Login as assistant → create prescription → can link consultation

- [ ] **Step 3: Commit any final fixes**

```bash
cd /Users/lanzhang/Desktop/rxflow-workspace
git add -A
git commit -m "chore: integration fixes for consultation flow
"
```
