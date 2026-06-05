# Phase 2 Backend Implementation Plan — 药品主数据 + 药剂师配药

## Overview

Implement real backend services for drug search (pinyin), allergy risk computation, dispensing queue/stats, FIFO batch selection, and prescription allergy/interaction checks. Replace all Phase 1 stubs.

---

## 1. File Change Inventory

### New files (2)
- `backend/src/services/drugService.ts` — drug list, detail, search with allergy risk
- `backend/src/services/dispensingService.ts` — queue, stats, start, complete

### Modified files (4)
- `backend/src/routes/drugs.ts` — replace stubs + **fix route ordering bug**
- `backend/src/routes/dispensing.ts` — replace stubs + add `/stats` route
- `backend/src/routes/prescriptions.ts` — enhance `GET /:id` for allergy/interaction checks
- `backend/prisma/seed.ts` — +DrugInteraction records, +batches, +approved prescription

### No changes needed
- `backend/src/index.ts`, `backend/prisma/schema.prisma`, `backend/src/middleware/*`

---

## 2. Critical Bug: Route Ordering

Current `drugs.ts` has `GET /:id` before `GET /search`, causing `/api/drugs/search` to match `/:id` with `id="search"`. Fix: `search → / → /:id`.

Same principle for `dispensing.ts`: `GET /queue → GET /stats → POST /:id/start → POST /:id/complete`.

---

## 3. Service Design

### 3a. drugService.ts

```
listDrugs(query)      → paginated drug list with batches + ingredients
getDrug(id)           → single drug detail, 404 if not found
searchDrugs(params)   → keyword search with pinyin + optional allergy risk per patientId
computeAllergyRisk()  → helper: batch-load ingredients + patient allergies, compute risk tier
```

### 3b. dispensingService.ts

```
getDispensingQueue()  → approved prescriptions with dispensingAt=null
getDispensingStats()  → pendingCount, todayCompleted, stockAlertCount, overdueCount
startDispensing(id, pharmacistId)  → validate status, set pharmacist + dispensingAt, timeline + audit
completeDispensing(id, pharmacistId, { batches, note }) → validate batches, decrement stock, update status, timeline + audit
```

### 3c. prescriptionService.ts (enhance getPrescription)

After main fetch, if items have `drugId`:
- Query `DrugIngredient` ↔ `PatientAllergy` for allergy warnings
- Query `DrugInteraction` for pairwise interaction warnings
- Append `allergyWarnings` and `interactionWarnings` to return object

---

## 4. Key Algorithms

### Allergy Risk (drug search)
1. Batch query: all ingredients for matched drugs + all patient allergies
2. Build lookup maps (drugId → allergens[], allergenId → severity)
3. For each drug: severe match → 'severe', moderate → 'moderate', same category → 'compatible', none → null
4. Priority: severe > moderate > compatible > null

### Pinyin Search
```typescript
WHERE { isActive: true, OR: [
  { standardName: { contains: keyword } },
  { genericName: { contains: keyword } },
  { pinyinInitial: { startsWith: keyword.toLowerCase() } },
  { searchCode: { contains: keyword.toLowerCase() } },
] }
```

### Dispensing Queue
- Filter: `status='approved' AND dispensingAt IS NULL`
- Order by `approvedAt ASC` (oldest first)
- Compute `waitMinutes` and `urgent` (wait > 60min) on-the-fly

### Complete Dispensing
- Validate all batches exist, belong to correct drugs, have stock > 0
- `$transaction(async tx => { decrement stock, update items, update status, create audit })`

---

## 5. Seed Data Additions

- 10 DrugInteraction records (华法林+阿司匹林/重度, ACE+钾/中度, etc.)
- 3 low-stock batches (quantity < 10)
- 1 approved prescription (#6) for queue testing (阿莫西林 + 复方甘草片, approved 90min ago)

---

## 6. Implementation Order

```
1. Seed data (independent)
2. drugService.ts → drugs.ts route (pair)
3. dispensingService.ts → dispensing.ts route (pair)
4. prescriptionService.ts enhancement (optional, depends on seed data)
```

Steps 2 and 3 can run in parallel.

---

## 7. Route Specifications

### Drug routes
| Method | Path | Response Format |
|--------|------|----------------|
| GET | `/api/drugs/search?keyword=&patientId=&pageSize=` | `{ data: DrugSearchResult[], total }` |
| GET | `/api/drugs?page=&pageSize=` | `{ data: Drug[], total, page, pageSize }` |
| GET | `/api/drugs/:id` | `{ data: Drug }` |

### Dispensing routes
| Method | Path | Response Format |
|--------|------|----------------|
| GET | `/api/dispensing/queue` | `{ data: DispensingQueueItem[] }` |
| GET | `/api/dispensing/stats` | `{ data: DispensingStats }` |
| POST | `/api/dispensing/:id/start` | `{ message }` |
| POST | `/api/dispensing/:id/complete` | `{ message }` |

---

## 8. Error Handling

| Scenario | Error |
|----------|-------|
| Drug not found | `404 药品不存在` |
| Non-approved status for dispensing | `400 当前状态不可开始配药` |
| Already being dispensed | `400 已有药师在处理此处方` |
| Wrong pharmacist completing | `403 只有当前配药师可以完成配药` |
| Invalid batch | `400 部分批次不存在` |
| Wrong drug batch | `400 批次不属于药品` |
| Insufficient stock | `400 批次库存不足` |
| Empty search keyword | Return empty array (not error) |

---

## 9. Test Commands

```bash
# Drug search (pinyin)
curl -H "Authorization: Bearer <TOKEN>" "localhost:3000/api/drugs/search?keyword=amxl"

# Drug search with allergy check (patient #1 = penicillin severe)
curl -H "Authorization: Bearer <TOKEN>" "localhost:3000/api/drugs/search?keyword=阿莫西林&patientId=1"

# Dispensing queue (pharmacist token)
curl -H "Authorization: Bearer <TOKEN>" "localhost:3000/api/dispensing/queue"

# Dispensing stats
curl -H "Authorization: Bearer <TOKEN>" "localhost:3000/api/dispensing/stats"

# Start dispensing
curl -X POST -H "Authorization: Bearer <TOKEN>" "localhost:3000/api/dispensing/6/start"

# Complete dispensing
curl -X POST -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{"batches":{"5":5},"pharmacistNote":"已核对"}' \
  "localhost:3000/api/dispensing/6/complete"
```
