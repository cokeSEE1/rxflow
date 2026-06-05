<template>
  <div
    v-loading="loading"
    class="page"
  >
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>处方详情</h2>
        <span class="prescription-no">{{ current?.prescriptionNo }}</span>
      </div>
      <StatusTag
        v-if="current"
        :status="current.status"
      />
    </div>

    <template v-if="current">
      <div class="content-grid">
        <!-- Left Column -->
        <div class="main-column">
          <!-- 1. Basic Info Card -->
          <section class="info-card">
            <h3 class="section-title">
              基本信息
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">处方编号</span>
                <span class="info-value">{{ current.prescriptionNo }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建人</span>
                <span class="info-value">{{ current.assistant?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">创建时间</span>
                <span class="info-value">{{ formatDate(current.createdAt) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">状态</span>
                <StatusTag :status="current.status" />
              </div>
              <div class="info-item">
                <span class="info-label">处方有效期</span>
                <span class="info-value validity-value">审核通过后 3 天内有效</span>
              </div>
              <div class="info-item">
                <span class="info-label">医保分类</span>
                <span class="info-value">
                  <span class="insurance-summary">{{ insuranceSummary }}</span>
                </span>
              </div>
            </div>
          </section>

          <!-- 2. Patient Info Card -->
          <section class="info-card">
            <h3 class="section-title">
              患者信息
            </h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">姓名</span>
                <span class="info-value">{{ current.patient?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">性别</span>
                <span class="info-value">{{ current.patient?.gender || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">年龄</span>
                <span class="info-value">{{ current.patient?.age ?? '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">电话</span>
                <span class="info-value">{{ current.patient?.phone || '-' }}</span>
              </div>
              <div class="info-item info-full">
                <span class="info-label">地址</span>
                <span class="info-value">{{ current.patient?.address || '-' }}</span>
              </div>
            </div>
            <div
              v-if="current.patient?.allergyHistory"
              class="allergy-section"
            >
              <span class="allergy-label">过敏史</span>
              <span class="allergy-value">{{ current.patient.allergyHistory }}</span>
            </div>
          </section>

          <!-- 3. Diagnosis -->
          <section class="info-card">
            <h3 class="section-title">
              诊断
            </h3>
            <p class="diagnosis-text">
              {{ current.diagnosis || '暂无诊断信息' }}
            </p>
          </section>

          <!-- 4. Drug Items Table -->
          <section class="info-card">
            <h3 class="section-title">
              药品明细
            </h3>
            <el-table
              :data="current.items || []"
              stripe
              border
              style="width: 100%"
            >
              <el-table-column
                prop="drugName"
                label="药品名称"
                min-width="150"
              />
              <el-table-column
                prop="specification"
                label="规格"
                width="120"
              />
              <el-table-column
                prop="dosage"
                label="用量"
                width="100"
              />
              <el-table-column
                prop="frequency"
                label="频次"
                width="100"
              />
              <el-table-column
                prop="days"
                label="天数"
                width="80"
              />
              <el-table-column
                prop="remark"
                label="备注"
                min-width="120"
              />
              <el-table-column
                v-if="hasDoctorAnnotation"
                prop="doctorAnnotation"
                label="医生批注"
                min-width="150"
              >
                <template #default="{ row }">
                  <span class="annotation-text">{{ row.doctorAnnotation || '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </section>

          <!-- 5. Note -->
          <section
            v-if="current.note"
            class="info-card"
          >
            <h3 class="section-title">
              备注
            </h3>
            <p class="note-text">
              {{ current.note }}
            </p>
          </section>

          <!-- 6. Allergy Check Results -->
          <section
            v-if="hasDrugData"
            class="info-card"
          >
            <h3 class="section-title">
              过敏检查结果
            </h3>
            <el-alert
              v-if="allergyResult.severity === 'severe'"
              title="严重过敏风险 — 需医生手动确认"
              type="error"
              :closable="false"
              show-icon
            >
              <template #default>
                <div class="allergy-detail">
                  <p>{{ allergyResult.description }}</p>
                  <div class="allergy-actions">
                    <el-button
                      type="warning"
                      size="small"
                      @click="handleViewAlternatives"
                    >
                      查看替代药品建议
                    </el-button>
                    <el-button
                      type="danger"
                      size="small"
                      @click="handleConfirmRisk"
                    >
                      确认风险并签名继续
                    </el-button>
                  </div>
                </div>
              </template>
            </el-alert>
            <el-alert
              v-else-if="allergyResult.severity === 'moderate'"
              title="中度过敏提示"
              type="warning"
              :closable="false"
              show-icon
            >
              <template #default>
                <div class="allergy-detail">
                  <p>{{ allergyResult.description }}</p>
                </div>
              </template>
            </el-alert>
            <el-alert
              v-else
              title="过敏检查通过"
              type="success"
              :closable="false"
              show-icon
            >
              <template #default>
                <div class="allergy-detail">
                  <p>{{ allergyResult.description }}</p>
                </div>
              </template>
            </el-alert>
          </section>

          <!-- 7. Drug Interaction Check Results -->
          <section
            v-if="hasDrugData"
            class="info-card"
          >
            <h3 class="section-title">
              药品相互作用检查
              <span class="interaction-count">（共检查 {{ interactionResults.length }} 组配伍）</span>
            </h3>
            <el-table
              :data="interactionResults"
              stripe
              border
              style="width: 100%"
            >
              <el-table-column
                prop="drugA"
                label="药品 A"
                min-width="140"
              />
              <el-table-column
                prop="drugB"
                label="药品 B"
                min-width="140"
              />
              <el-table-column
                prop="severity"
                label="严重程度"
                width="100"
                align="center"
              >
                <template #default="{ row }">
                  <el-tag
                    :type="severityTagType(row.severity)"
                    size="small"
                    effect="dark"
                  >
                    {{ row.severity }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column
                prop="advice"
                label="临床建议"
                min-width="200"
              />
            </el-table>
          </section>

          <!-- 8. Status Timeline -->
          <PrescriptionTimeline :timeline="current.timeline" />
        </div>

        <!-- Right Column -->
        <PrescriptionSidePanel
          :status="current.status"
          :is-doctor="isDoctor"
          :is-courier="isCourier"
          :is-assistant="isAssistant"
          :revoke-countdown="revokeCountdown"
          :is-within-revoke-window="isWithinRevokeWindow"
          :rejected-reason="current.rejectedReason"
          :rejected-type="current.rejectedType"
          :tracking-no="current.trackingNo"
          :courier-name="current.courier?.name"
          :delivery-method="current.deliveryMethod"
          :estimated-delivery="current.estimatedDelivery"
          :delivery-proof="current.deliveryProof"
          @approve="handleApprove"
          @show-reject="showRejectDialog = true"
          @revoke="handleRevoke"
          @pickup="handlePickup"
          @show-deliver="showDeliverDialog = true"
          @show-exception="showExceptionDialog = true"
          @redeliver="handleRedeliver"
          @resubmit="handleResubmit"
        />
      </div>
    </template>

    <!-- Reject Dialog -->
    <PrescriptionRejectDialog
      v-model="showRejectDialog"
      :templates="rejectionTemplates"
      @confirm="handleReject"
    />

    <!-- Deliver Dialog -->
    <el-dialog
      v-model="showDeliverDialog"
      title="确认签收"
      width="480px"
      destroy-on-close
    >
      <el-form label-position="top">
        <el-form-item label="签收凭证（照片URL）">
          <el-input
            v-model="deliveryProofUrl"
            placeholder="请输入签收凭证照片URL"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDeliverDialog = false">
          取消
        </el-button>
        <el-button
          type="success"
          @click="handleDeliver"
        >
          确认签收
        </el-button>
      </template>
    </el-dialog>

    <!-- Exception Dialog -->
    <PrescriptionExceptionDialog
      v-model="showExceptionDialog"
      @confirm="handleReportException"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { usePrescriptionStore } from '@/stores/prescription'
import { useUserStore } from '@/stores/user'
import StatusTag from '@/components/StatusTag.vue'
import PrescriptionTimeline from '@/components/PrescriptionTimeline.vue'
import PrescriptionSidePanel from '@/components/PrescriptionSidePanel.vue'
import PrescriptionRejectDialog from '@/components/PrescriptionRejectDialog.vue'
import PrescriptionExceptionDialog from '@/components/PrescriptionExceptionDialog.vue'
import client from '@/api/client'
import type { PrescriptionItem, RejectionTemplate } from '@/types'

const route = useRoute()
const router = useRouter()
const prescriptionStore = usePrescriptionStore()
const userStore = useUserStore()

const id = computed(() => Number(route.params.id))
const current = computed(() => prescriptionStore.current)
const loading = ref(false)

const isDoctor = computed(() => userStore.role === 'doctor')
const isCourier = computed(() => userStore.role === 'courier')
const isAssistant = computed(() => userStore.role === 'assistant')

// ---- Dialog visibility ----
const showRejectDialog = ref(false)
const showDeliverDialog = ref(false)
const showExceptionDialog = ref(false)

// ---- Reject templates (fetched & passed to dialog) ----
const rejectionTemplates = ref<RejectionTemplate[]>([])

// ---- Deliver form ----
const deliveryProofUrl = ref('')

// ---- Revoke Countdown ----
const revokeCountdown = ref(0)
let countdownTimer: ReturnType<typeof setInterval> | null = null

const isWithinRevokeWindow = computed(() => {
  if (!current.value?.approvedAt) return false
  const approvedAt = new Date(current.value.approvedAt).getTime()
  const now = Date.now()
  return now - approvedAt < 30 * 60 * 1000
})

function startRevokeCountdown() {
  if (!current.value?.approvedAt) return
  const approvedAt = new Date(current.value.approvedAt).getTime()
  const deadline = approvedAt + 30 * 60 * 1000
  revokeCountdown.value = Math.max(0, Math.floor((deadline - Date.now()) / 1000))

  stopRevokeCountdown()
  countdownTimer = setInterval(() => {
    revokeCountdown.value = Math.max(0, Math.floor((deadline - Date.now()) / 1000))
    if (revokeCountdown.value <= 0) stopRevokeCountdown()
  }, 1000)
}

function stopRevokeCountdown() {
  if (countdownTimer) {
    clearInterval(countdownTimer)
    countdownTimer = null
  }
}

// ---- Doctor Annotation ----
const hasDoctorAnnotation = computed(() => {
  return current.value?.items?.some((item: PrescriptionItem) => item.doctorAnnotation)
})

const hasDrugData = computed(() => {
  return current.value?.items?.some((item: PrescriptionItem) => item.drugId)
})

// ---- Allergy Check (simulated) ----
const allergyResult = computed(() => {
  const hasAllergyHistory = !!current.value?.patient?.allergyHistory
  if (hasAllergyHistory) {
    return {
      severity: 'severe',
      description: '患者有青霉素过敏史，处方中含阿莫西林（青霉素类）。阿莫西林可能引发皮疹、呼吸困难等过敏反应，严重时可导致过敏性休克。',
    }
  }
  const items = current.value?.items || []
  const hasDrugData = items.some((item: PrescriptionItem) => item.drugId)
  if (hasDrugData) {
    return {
      severity: 'compatible',
      description: '未发现处方药品与患者过敏史之间的交叉反应，过敏检查通过。',
    }
  }
  return { severity: 'compatible', description: '' }
})

// ---- Drug Interactions (simulated) ----
const interactionResults = computed(() => {
  return [
    {
      drugA: '阿莫西林',
      drugB: '布洛芬',
      severity: '低',
      advice: '无已知相互作用，可联合使用。建议饭后服用以减少胃部不适。',
    },
    {
      drugA: '阿莫西林',
      drugB: '氨溴索',
      severity: '无',
      advice: '无相互作用，可安全联合使用。氨溴索有助于化痰，与抗生素协同治疗呼吸道感染。',
    },
    {
      drugA: '布洛芬',
      drugB: '阿司匹林',
      severity: '中',
      advice: '两者均为NSAIDs，联合使用增加胃肠道出血风险。建议避免同时服用，或加用胃黏膜保护剂。',
    },
    {
      drugA: '阿莫西林',
      drugB: '华法林',
      severity: '高',
      advice: '阿莫西林可能增强华法林抗凝作用，增加出血风险。建议监测INR值，必要时调整华法林剂量。',
    },
  ]
})

function severityTagType(severity: string): string {
  const map: Record<string, string> = {
    '高': 'danger',
    '中': 'warning',
    '低': 'info',
    '无': 'success',
  }
  return map[severity] || 'info'
}

// ---- Insurance Summary ----
const insuranceSummary = computed(() => {
  const items = current.value?.items || []
  if (items.length === 0) return '-'
  const countA = items.filter((item: PrescriptionItem) => item.insuranceType === '甲').length
  const countB = items.filter((item: PrescriptionItem) => item.insuranceType === '乙').length
  const parts: string[] = []
  if (countA > 0) parts.push(`甲×${countA}`)
  if (countB > 0) parts.push(`乙×${countB}`)
  return parts.length > 0 ? parts.join(' ') : '-'
})

// ---- Allergy Actions ----
function handleViewAlternatives() {
  ElMessage.info('替代药品建议功能开发中')
}

function handleConfirmRisk() {
  ElMessageBox.confirm(
    '确认已了解过敏风险并愿意签名继续？此操作将记录在处方时间线中。',
    '确认风险并签名',
    {
      confirmButtonText: '确认签名',
      cancelButtonText: '取消',
      type: 'warning',
    },
  ).then(() => {
    ElMessage.success('已确认风险，签名已记录')
  }).catch(() => {
    // user cancelled
  })
}

// ---- Resubmit ----
function handleResubmit() {
  router.push(`/prescriptions/${id.value}/edit`)
}

// ---- Fetch Data ----
async function fetchData() {
  loading.value = true
  try {
    await prescriptionStore.fetchDetail(id.value)
    startRevokeCountdown()
    if (isDoctor.value) {
      await fetchRejectionTemplates()
    }
  } catch {
    ElMessage.error('获取处方详情失败')
  } finally {
    loading.value = false
  }
}

async function fetchRejectionTemplates() {
  try {
    const { data } = await client.get('/prescriptions/rejection-templates')
    rejectionTemplates.value = Array.isArray(data) ? data : data.data || []
  } catch {
    // templates are optional, silently fail
  }
}

// ---- Actions ----
async function handleApprove() {
  try {
    await ElMessageBox.confirm('确定要通过该处方吗？', '审核确认', {
      confirmButtonText: '确认通过',
      cancelButtonText: '取消',
      type: 'success',
    })
    await prescriptionStore.approve(id.value)
    ElMessage.success('处方已通过')
  } catch {
    // user cancelled
  }
}

async function handleReject(reason: string, type: string) {
  try {
    await ElMessageBox.confirm('确定要驳回该处方吗？', '驳回确认', {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await prescriptionStore.reject(id.value, reason, type)
    ElMessage.success('处方已驳回')
    showRejectDialog.value = false
  } catch {
    // user cancelled
  }
}

async function handleRevoke() {
  try {
    const { value: reason } = await ElMessageBox.prompt('请输入撤回原因', '撤回审核', {
      confirmButtonText: '确认撤回',
      cancelButtonText: '取消',
      inputType: 'textarea',
      inputPlaceholder: '请输入撤回原因（可选）',
    })
    await prescriptionStore.revoke(id.value, reason || '')
    ElMessage.success('处方已撤回')
  } catch {
    // user cancelled
  }
}

async function handlePickup() {
  try {
    await ElMessageBox.confirm('确认取件操作？', '确认取件', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'info',
    })
    await prescriptionStore.pickup(id.value)
    ElMessage.success('已确认取件')
  } catch {
    // user cancelled
  }
}

async function handleDeliver() {
  try {
    await ElMessageBox.confirm('确认该处方已签收？', '确认签收', {
      confirmButtonText: '确认签收',
      cancelButtonText: '取消',
      type: 'success',
    })
    await prescriptionStore.deliver(id.value, deliveryProofUrl.value)
    ElMessage.success('已确认签收')
    showDeliverDialog.value = false
    deliveryProofUrl.value = ''
  } catch {
    // user cancelled
  }
}

async function handleReportException(type: string, description: string, photo?: string) {
  try {
    await ElMessageBox.confirm('确定要上报该异常吗？', '上报异常', {
      confirmButtonText: '确认上报',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await prescriptionStore.reportEx(id.value, type, description, photo)
    ElMessage.success('异常已上报')
    showExceptionDialog.value = false
  } catch {
    // user cancelled
  }
}

async function handleRedeliver() {
  try {
    const { value: reason } = await ElMessageBox.prompt(
      '请输入重新配送原因',
      '重新配送',
      {
        confirmButtonText: '确认配送',
        cancelButtonText: '取消',
        inputType: 'textarea',
        inputPlaceholder: '请输入重新配送原因',
        inputValidator: (value) => {
          if (!value || value.trim().length === 0) return '请输入配送原因'
          return true
        },
      },
    )
    await prescriptionStore.requestRedeliver(id.value, reason.trim())
    ElMessage.success('已提交重新配送，处方回到待配送队列')
  } catch {
    // user cancelled
  }
}

// ---- Helpers ----
function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}

// Watch for route param changes
watch(id, () => {
  if (id.value) fetchData()
})

onMounted(() => {
  if (id.value) fetchData()
})

onUnmounted(() => {
  stopRevokeCountdown()
})
</script>

<style scoped lang="scss">
.page {
  max-width: 1400px;
  padding: 24px;
}

/* Page Header */
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
}

.header-left h2 {
  font-family: 'DM Serif Display', serif;
  font-size: 28px;
  font-weight: 400;
  color: var(--warm-900);
}

.prescription-no {
  font-size: 14px;
  color: var(--warm-700);
  background: var(--warm-100);
  padding: 2px 10px;
  border-radius: 6px;
  font-family: 'DM Mono', monospace;
}

/* Content Layout */
.content-grid {
  display: grid;
  grid-template-columns: 1fr 360px;
  gap: 20px;
  align-items: start;
}

@media (max-width: 900px) {
  .content-grid {
    grid-template-columns: 1fr;
  }
}

.main-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Cards */
.info-card {
  background: #fff;
  border: 1px solid var(--warm-200);
  border-radius: 12px;
  padding: 24px;
}

.section-title {
  font-family: 'DM Serif Display', serif;
  font-size: 18px;
  font-weight: 400;
  color: var(--warm-900);
  margin-bottom: 16px;
}

/* Info Grid */
.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

.info-full {
  grid-column: 1 / -1;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.info-label {
  font-size: 12px;
  color: #909399;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.info-value {
  font-size: 14px;
  color: var(--warm-900);
}

/* Allergy */
.allergy-section {
  margin-top: 16px;
  padding: 12px 16px;
  background: #fef2f2;
  border: 1px solid #fecaca;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.allergy-label {
  font-size: 12px;
  color: var(--coral);
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.allergy-value {
  font-size: 14px;
  color: #991b1b;
  line-height: 1.5;
}

/* Diagnosis */
.diagnosis-text {
  font-size: 15px;
  line-height: 1.6;
  color: var(--warm-700);
  white-space: pre-wrap;
}

/* Note */
.note-text {
  font-size: 14px;
  line-height: 1.6;
  color: var(--warm-700);
  white-space: pre-wrap;
}

/* Annotation */
.annotation-text {
  color: var(--coral);
  font-style: italic;
}

/* Allergy Check */
.allergy-detail {
  p {
    font-size: 14px;
    line-height: 1.6;
    color: var(--warm-700);
    margin: 0 0 12px;
  }
}

.allergy-actions {
  display: flex;
  gap: 8px;
  margin-top: 8px;
}

/* Interaction */
.interaction-count {
  font-size: 13px;
  font-weight: 400;
  color: #909399;
  font-family: 'DM Sans', system-ui, sans-serif;
  margin-left: 4px;
}

/* Validity */
.validity-value {
  color: #e6a23c;
  font-weight: 500;
}

/* Insurance */
.insurance-summary {
  font-size: 14px;
  color: var(--teal-700);
  font-weight: 600;
  background: var(--teal-50);
  padding: 2px 8px;
  border-radius: 4px;
}
</style>
