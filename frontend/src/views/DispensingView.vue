<template>
  <div
    v-loading="loading"
    class="dispensing-view"
  >
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>配药</h2>
        <span class="prescription-no">{{ prescriptionNo }}</span>
      </div>
      <el-tag
        type="success"
        size="large"
      >
        已审核 · 待配药
      </el-tag>
    </div>

    <!-- Prescription Info Card -->
    <section class="info-card">
      <div class="card-header-bar">
        <div class="card-header-left">
          <span class="prescription-no-mono">{{ prescriptionNo }}</span>
          <el-tag
            type="success"
            size="small"
          >
            已审核 · 待配药
          </el-tag>
        </div>
        <span class="text-sm text-muted">
          审核时间：{{ approvedAt }} · 处方有效期至 {{ expiresAt }}
        </span>
      </div>

      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">患者</span>
          <span class="info-value">{{ patientName }} · {{ patientGender }} · {{ patientAge }}岁</span>
        </div>
        <div class="info-item">
          <span class="info-label">诊断</span>
          <span class="info-value">{{ diagnosis }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">医生</span>
          <span class="info-value">{{ doctorName }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">剩余有效期</span>
          <span class="info-value remaining-validity">{{ remainingValidity }}</span>
        </div>
      </div>

      <el-alert
        :title="allergyCheckTitle"
        :type="allergyCheckType"
        :closable="false"
        show-icon
        class="mt-4"
      />
    </section>

    <!-- Drug Verification & Batch Selection -->
    <section class="info-card">
      <div class="section-header">
        <h3>药品核对与批号选择</h3>
        <span class="text-sm text-muted">共 {{ drugItems.length }} 种药品</span>
      </div>

      <div
        v-for="(drug, di) in drugItems"
        :key="drug.drugId"
        class="drug-verify-section"
      >
        <div class="drug-verify-header">
          <div class="drug-verify-name">
            <span class="drug-index">{{ di + 1 }}.</span>
            {{ drug.drugName }}
            <span
              class="insurance-tag"
              :class="'insurance-' + drug.insurance"
            >
              {{ insuranceLabel(drug.insurance) }}
            </span>
          </div>
          <div class="drug-verify-meta">
            {{ drug.spec }} · {{ drug.maker }}
          </div>
        </div>

        <div class="batch-list">
          <div
            v-for="batch in getBatches(drug.drugId)"
            :key="batch.id"
            class="batch-row"
            :class="{
              selected: selectedBatches[drug.drugId] === batch.id,
              'fifo-recommended': getFifoBatchId(drug.drugId) === batch.id,
            }"
            @click="selectBatch(drug.drugId, batch.id)"
          >
            <div>
              <div class="batch-field-label">批号</div>
              <div class="batch-field-value">
                {{ batch.batchNo }}
                <span
                  v-if="getFifoBatchId(drug.drugId) === batch.id"
                  class="fifo-tag"
                >FIFO</span>
              </div>
            </div>
            <div>
              <div class="batch-field-label">采购价</div>
              <div class="batch-field-value">&yen;{{ batch.price }}<span class="text-xs text-muted"> /盒</span></div>
            </div>
            <div>
              <div class="batch-field-label">库存</div>
              <div
                class="batch-field-value"
                :class="{ warn: batch.qty < 10 }"
              >
                {{ batch.qty }} 盒{{ batch.qty < 10 ? ' ⚠' : '' }}
              </div>
            </div>
            <div>
              <div class="batch-field-label">有效期至</div>
              <div
                class="batch-field-value"
                :class="{ warn: isExpiringSoon(batch.expire) }"
              >
                {{ batch.expire }}{{ isExpiringSoon(batch.expire) ? ' ⚠' : '' }}
              </div>
            </div>
            <div class="batch-check">✓</div>
          </div>
        </div>
      </div>

      <!-- Inventory Alerts -->
      <div
        v-for="alert in inventoryAlerts"
        :key="alert.batchNo"
        class="inventory-alert"
        :class="alert.severity"
      >
        ⚠ {{ alert.drugName }} 批号 {{ alert.batchNo }} 仅剩 {{ alert.qty }} 盒，有效期至 {{ alert.expire }}
        {{ alert.severity === 'expired' ? '（即将过期，建议优先消耗）' : '（库存偏低，建议补货）' }}
      </div>
    </section>

    <!-- Pharmacist Confirmation -->
    <section class="info-card">
      <h3 class="section-title">药剂师确认</h3>

      <div class="form-group">
        <label>药剂师备注（选填）</label>
        <el-input
          v-model="pharmacistNote"
          type="textarea"
          :rows="3"
          placeholder="如：已核对药品批号及效期，与处方一致"
          maxlength="500"
          show-word-limit
        />
      </div>

      <div class="confirm-footer">
        <span class="text-sm text-muted">
          选择 FIFO 推荐批次确保效期最优。确认后将生成 QR 交接码并触发签名流程。
        </span>
        <div class="confirm-actions">
          <el-button @click="handleSaveDraft">暂存</el-button>
          <el-button
            type="primary"
            size="large"
            @click="showSignModal = true"
          >
            ✓ 确认配药完成（需签名）
          </el-button>
        </div>
      </div>
    </section>

    <!-- Signature Modal -->
    <DispensingSignatureModal
      v-model="showSignModal"
      :prescription-no="prescriptionNo"
      :signer-name="signerName"
      @signed="onSignComplete"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import DispensingSignatureModal from '@/components/DispensingSignatureModal.vue'

const router = useRouter()

const loading = ref(false)
const showSignModal = ref(false)
const pharmacistNote = ref('')

// ── Simulated prescription data ──────────────────────────────
const prescriptionNo = ref('PRS-20260603-000003')
const approvedAt = ref('2026-06-04 09:30')
const expiresAt = ref('2026-06-07 09:30')
const patientName = ref('赵建国')
const patientGender = ref('男')
const patientAge = ref(62)
const diagnosis = ref('高血脂症，总胆固醇 6.2mmol/L')
const doctorName = ref('张医生')
const signerName = ref('陈药师')

const allergyCheckTitle = ref('过敏检查通过 — 患者有青霉素重度过敏史，但本处方不含青霉素类药品，可以安全配药')
const allergyCheckType = ref<'success' | 'warning' | 'error'>('success')

// ── Drug items ───────────────────────────────────────────────
interface DrugItem {
  drugId: number
  drugName: string
  spec: string
  maker: string
  insurance: string
  dosage: string
  freq: string
  days: number
}

interface Batch {
  id: number
  drugId: number
  batchNo: string
  qty: number
  price: string
  expire: string
}

const drugItems = ref<DrugItem[]>([
  { drugId: 3, drugName: '阿托伐他汀钙片', spec: '20mg×7片', maker: '辉瑞制药', insurance: 'A', dosage: '1片', freq: 'qd', days: 30 },
  { drugId: 2, drugName: '厄贝沙坦片', spec: '150mg×7片', maker: '赛诺菲', insurance: 'A', dosage: '1片', freq: 'qd', days: 30 },
])

const batches = ref<Batch[]>([
  { id: 1, drugId: 3, batchNo: 'B20260603001', qty: 180, price: '35.00', expire: '2027-06-03' },
  { id: 2, drugId: 3, batchNo: 'B20260415001', qty: 5, price: '34.00', expire: '2026-08-15' },
  { id: 3, drugId: 3, batchNo: 'B20260120001', qty: 45, price: '33.00', expire: '2026-07-15' },
  { id: 4, drugId: 2, batchNo: 'B20260515001', qty: 150, price: '20.00', expire: '2027-05-15' },
  { id: 5, drugId: 2, batchNo: 'B20260301001', qty: 80, price: '19.50', expire: '2026-12-01' },
])

const selectedBatches = ref<Record<number, number>>({ 3: 1, 2: 4 })

// ── Computed ─────────────────────────────────────────────────
function getBatches(drugId: number): Batch[] {
  return batches.value
    .filter((b) => b.drugId === drugId)
    .sort((a, b) => new Date(a.expire).getTime() - new Date(b.expire).getTime())
}

function getFifoBatchId(drugId: number): number | undefined {
  const sorted = getBatches(drugId)
  return sorted.length > 0 ? sorted[0].id : undefined
}

function isExpiringSoon(expire: string): boolean {
  const diff = new Date(expire).getTime() - Date.now()
  return diff < 90 * 24 * 60 * 60 * 1000
}

function insuranceLabel(val: string): string {
  const map: Record<string, string> = { A: '甲', B: '乙', C: '丙', self: '自费' }
  return map[val] || val
}

const remainingValidity = computed(() => {
  const diff = new Date(expiresAt.value).getTime() - Date.now()
  const days = Math.floor(diff / (24 * 60 * 60 * 1000))
  const hours = Math.floor((diff % (24 * 60 * 60 * 1000)) / (60 * 60 * 1000))
  return `${days} 天 ${hours} 小时`
})

const inventoryAlerts = computed(() => {
  const alerts: { batchNo: string; drugName: string; qty: number; expire: string; severity: 'low' | 'expired' }[] = []
  for (const b of batches.value) {
    if (b.qty < 10) {
      const drug = drugItems.value.find((d) => d.drugId === b.drugId)
      alerts.push({
        batchNo: b.batchNo,
        drugName: drug?.drugName || '',
        qty: b.qty,
        expire: b.expire,
        severity: isExpiringSoon(b.expire) ? 'expired' : 'low',
      })
    }
  }
  return alerts
})

// ── Actions ──────────────────────────────────────────────────
function selectBatch(drugId: number, batchId: number) {
  selectedBatches.value[drugId] = batchId
}

function onSignComplete() {
  setTimeout(() => {
    router.push('/pharmacy')
  }, 500)
}

function handleSaveDraft() {
  ElMessage.success('已暂存')
}
</script>

<style scoped lang="scss">
.dispensing-view {
  max-width: 1400px;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 16px;

  h2 {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 28px;
    font-weight: 400;
    color: var(--warm-900);
  }
}

.prescription-no {
  font-size: 14px;
  color: var(--warm-700);
  background: var(--warm-100);
  padding: 2px 10px;
  border-radius: 6px;
  font-family: 'DM Mono', monospace;
}

.info-card {
  background: #fff;
  border: 1px solid var(--warm-200);
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 20px;
}

.section-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 18px;
  font-weight: 400;
  color: var(--warm-900);
  margin-bottom: 16px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;

  h3 {
    font-family: 'DM Serif Display', Georgia, serif;
    font-size: 16px;
    margin: 0;
  }
}

.card-header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20px;
  flex-wrap: wrap;
  gap: 8px;
}

.card-header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.prescription-no-mono {
  font-size: 14px;
  font-weight: 600;
  font-family: 'SF Mono', 'Cascadia Code', monospace;
}

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px 24px;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 11px;
  color: var(--warm-400);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.info-value {
  font-size: 13px;
  font-weight: 500;
  color: var(--warm-900);
}

.remaining-validity {
  color: var(--teal-700);
  font-weight: 600;
}

.drug-verify-section {
  margin-bottom: 24px;

  &:last-child {
    margin-bottom: 0;
  }
}

.drug-verify-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
  padding-bottom: 10px;
  border-bottom: 1px solid var(--warm-100);
}

.drug-verify-name {
  font-size: 14px;
  font-weight: 600;
  display: flex;
  align-items: center;
  gap: 10px;
}

.drug-index {
  color: var(--teal-700);
}

.drug-verify-meta {
  font-size: 12px;
  color: var(--warm-500);
}

.insurance-tag {
  display: inline-block;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.02em;

  &.insurance-A { background: #dcfce7; color: #15803d; }
  &.insurance-B { background: #eff6ff; color: #1d4ed8; }
  &.insurance-C { background: #fef3c7; color: #b45309; }
  &.insurance-self { background: var(--warm-100); color: var(--warm-500); }
}

.batch-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.batch-row {
  display: grid;
  grid-template-columns: 2fr 0.9fr 0.8fr 0.9fr 40px;
  align-items: center;
  gap: 12px;
  padding: 14px 16px;
  border: 2px solid var(--warm-100);
  border-radius: 10px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  background: #fff;

  &:hover {
    border-color: var(--teal-200);
    background: #fafffe;
  }

  &.selected {
    border-color: var(--teal-500);
    background: linear-gradient(135deg, #f0fdfa, #f5fffe);
    box-shadow: 0 0 0 1px var(--teal-500);
  }

  &.fifo-recommended {
    border-style: dashed;
    border-color: var(--teal-500);

    &::before {
      content: 'FIFO 推荐';
      position: absolute;
      top: -10px;
      left: 16px;
      font-size: 10px;
      font-weight: 700;
      color: var(--teal-700);
      background: var(--teal-100);
      padding: 2px 10px;
      border-radius: 4px;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      z-index: 1;
    }
  }
}

.batch-field-label {
  font-size: 10px;
  color: var(--warm-400);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  font-weight: 600;
  margin-bottom: 3px;
}

.batch-field-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--warm-900);

  &.warn {
    color: #f97316;
  }
}

.fifo-tag {
  font-size: 10px;
  color: var(--teal-700);
  font-weight: 700;
}

.batch-check {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  border: 2px solid var(--warm-200);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  color: transparent;
  transition: all 0.15s;

  .batch-row.selected & {
    background: var(--teal-500);
    border-color: var(--teal-500);
    color: #fff;
  }
}

.inventory-alert {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 11px 16px;
  border-radius: 10px;
  margin-bottom: 12px;
  font-size: 12px;
  font-weight: 500;

  &.low {
    background: #fff7ed;
    color: #c2410c;
    border: 1px solid #fed7aa;
  }

  &.expired {
    background: #fef2f2;
    color: var(--coral);
    border: 1px solid #fecaca;
  }
}

.confirm-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 20px;
  flex-wrap: wrap;
  gap: 16px;
}

.confirm-actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.form-group {
  margin-bottom: 16px;

  label {
    display: block;
    font-size: 11px;
    font-weight: 600;
    color: var(--warm-700);
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 6px;
  }
}

.text-muted { color: var(--warm-500); }
.text-sm { font-size: 12px; }
.text-xs { font-size: 11px; }
.mt-4 { margin-top: 16px; }
</style>
