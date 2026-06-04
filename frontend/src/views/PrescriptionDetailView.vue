<template>
  <div class="page" v-loading="loading">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2>处方详情</h2>
        <span class="prescription-no">{{ current?.prescriptionNo }}</span>
      </div>
      <StatusTag v-if="current" :status="current.status" />
    </div>

    <template v-if="current">
      <div class="content-grid">
        <!-- Left Column -->
        <div class="main-column">
          <!-- 1. Basic Info Card -->
          <section class="info-card">
            <h3 class="section-title">基本信息</h3>
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
            </div>
          </section>

          <!-- 2. Patient Info Card -->
          <section class="info-card">
            <h3 class="section-title">患者信息</h3>
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
            <div v-if="current.patient?.allergyHistory" class="allergy-section">
              <span class="allergy-label">过敏史</span>
              <span class="allergy-value">{{ current.patient.allergyHistory }}</span>
            </div>
          </section>

          <!-- 3. Diagnosis -->
          <section class="info-card">
            <h3 class="section-title">诊断</h3>
            <p class="diagnosis-text">{{ current.diagnosis || '暂无诊断信息' }}</p>
          </section>

          <!-- 4. Drug Items Table -->
          <section class="info-card">
            <h3 class="section-title">药品明细</h3>
            <el-table :data="current.items || []" stripe border style="width: 100%">
              <el-table-column prop="drugName" label="药品名称" min-width="150" />
              <el-table-column prop="specification" label="规格" width="120" />
              <el-table-column prop="dosage" label="用量" width="100" />
              <el-table-column prop="frequency" label="频次" width="100" />
              <el-table-column prop="days" label="天数" width="80" />
              <el-table-column prop="remark" label="备注" min-width="120" />
              <el-table-column v-if="hasDoctorAnnotation" prop="doctorAnnotation" label="医生批注" min-width="150">
                <template #default="{ row }">
                  <span class="annotation-text">{{ row.doctorAnnotation || '-' }}</span>
                </template>
              </el-table-column>
            </el-table>
          </section>

          <!-- 5. Note -->
          <section class="info-card" v-if="current.note">
            <h3 class="section-title">备注</h3>
            <p class="note-text">{{ current.note }}</p>
          </section>

          <!-- 6. Status Timeline -->
          <section class="info-card">
            <h3 class="section-title">状态时间线</h3>
            <el-timeline v-if="current.timeline?.length">
              <el-timeline-item
                v-for="item in current.timeline"
                :key="item.id"
                :timestamp="formatDateTime(item.createdAt)"
                :color="item.action === 'rejected' ? '#f56c6c' : undefined"
                placement="top"
              >
                <div :class="['timeline-card', { 'timeline-rejected': item.action === 'rejected' }]">
                  <div class="timeline-action">{{ actionLabel(item.action) }}</div>
                  <div class="timeline-operator">{{ item.operatorName }}</div>
                  <div v-if="item.detail" class="timeline-detail">{{ item.detail }}</div>
                  <div
                    v-if="item.action === 'rejected' && item.metadata"
                    class="timeline-reason"
                  >
                    {{ formatMetadata(item.metadata) }}
                  </div>
                </div>
              </el-timeline-item>
            </el-timeline>
            <el-empty v-else description="暂无时间线记录" :image-size="60" />
          </section>
        </div>

        <!-- Right Column -->
        <div class="side-column">
          <!-- Doctor Review Actions -->
          <section
            v-if="isDoctor && current.status === 'pending'"
            class="action-card"
          >
            <h3 class="section-title">审核操作</h3>
            <div class="action-buttons">
              <el-button type="primary" size="large" @click="handleApprove" class="action-btn">
                <el-icon><Check /></el-icon> 通过
              </el-button>
              <el-button type="danger" size="large" @click="showRejectDialog = true" class="action-btn">
                <el-icon><Close /></el-icon> 驳回
              </el-button>
            </div>
          </section>

          <!-- Revoke (doctor, approved, within 30min) -->
          <section
            v-if="isDoctor && current.status === 'approved' && isWithinRevokeWindow"
            class="action-card revoke-card"
          >
            <h3 class="section-title">撤回审核</h3>
            <p class="revoke-hint">审核通过后30分钟内可撤回</p>
            <el-button
              type="warning"
              size="large"
              @click="handleRevoke"
              :disabled="revokeCountdown <= 0"
            >
              撤回审核 {{ revokeCountdown > 0 ? `(${formatCountdown(revokeCountdown)})` : '' }}
            </el-button>
          </section>

          <!-- Courier Actions -->
          <section v-if="isCourier && courierActions.length > 0" class="action-card">
            <h3 class="section-title">配送操作</h3>
            <div class="action-buttons">
              <template v-for="action in courierActions" :key="action.type">
                <el-button
                  v-if="action.type === 'pickup'"
                  type="primary"
                  size="large"
                  @click="handlePickup"
                >
                  确认取件
                </el-button>
                <el-button
                  v-if="action.type === 'deliver'"
                  type="success"
                  size="large"
                  @click="showDeliverDialog = true"
                >
                  确认签收
                </el-button>
                <el-button
                  v-if="action.type === 'exception'"
                  type="danger"
                  size="large"
                  @click="showExceptionDialog = true"
                >
                  上报异常
                </el-button>
              </template>
            </div>
          </section>

          <!-- Rejected Info (when rejected) -->
          <section v-if="current.status === 'rejected'" class="info-card rejected-info">
            <h3 class="section-title">驳回信息</h3>
            <div class="reject-detail">
              <div class="info-item">
                <span class="info-label">驳回类型</span>
                <el-tag :type="rejectTypeTag" size="small">{{ rejectTypeLabel }}</el-tag>
              </div>
              <div class="info-item">
                <span class="info-label">驳回理由</span>
                <span class="info-value reject-reason">{{ current.rejectedReason }}</span>
              </div>
            </div>
          </section>

          <!-- Delivery Info -->
          <section
            v-if="showDeliveryInfo"
            class="info-card"
          >
            <h3 class="section-title">配送信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">快递单号</span>
                <span class="info-value">{{ current.trackingNo || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">快递员</span>
                <span class="info-value">{{ current.courier?.name || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">配送方式</span>
                <span class="info-value">{{ current.deliveryMethod || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">预计送达</span>
                <span class="info-value">{{ formatDate(current.estimatedDelivery) }}</span>
              </div>
            </div>
            <div v-if="current.status === 'received' && current.deliveryProof" class="delivery-proof">
              <span class="info-label">签收凭证</span>
              <el-image
                :src="current.deliveryProof"
                fit="cover"
                class="proof-image"
                :preview-src-list="[current.deliveryProof]"
              />
            </div>
          </section>
        </div>
      </div>
    </template>

    <!-- Reject Dialog -->
    <el-dialog v-model="showRejectDialog" title="驳回处方" width="560px" destroy-on-close>
      <el-form :model="rejectForm" label-position="top">
        <el-form-item label="驳回类型" required>
          <el-select v-model="rejectForm.type" placeholder="请选择驳回类型" style="width: 100%">
            <el-option label="严重" value="serious" />
            <el-option label="一般" value="normal" />
            <el-option label="建议" value="suggestion" />
          </el-select>
        </el-form-item>

        <el-form-item label="驳回理由" required>
          <el-input
            v-model="rejectForm.reason"
            type="textarea"
            :rows="4"
            placeholder="请输入驳回理由（不少于10个字符）"
            show-word-limit
            maxlength="500"
          />
        </el-form-item>

        <el-form-item v-if="rejectionTemplates.length > 0" label="快速选择模板">
          <div class="template-chips">
            <el-tag
              v-for="tpl in rejectionTemplates"
              :key="tpl.id"
              class="template-chip"
              :class="{ 'template-active': rejectForm.reason === tpl.content }"
              @click="rejectForm.reason = tpl.content"
            >
              {{ tpl.name }}
            </el-tag>
          </div>
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showRejectDialog = false">取消</el-button>
        <el-button type="danger" @click="handleReject" :disabled="!canReject">确认驳回</el-button>
      </template>
    </el-dialog>

    <!-- Deliver Dialog -->
    <el-dialog v-model="showDeliverDialog" title="确认签收" width="480px" destroy-on-close>
      <el-form label-position="top">
        <el-form-item label="签收凭证（照片URL）">
          <el-input v-model="deliveryProofUrl" placeholder="请输入签收凭证照片URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showDeliverDialog = false">取消</el-button>
        <el-button type="success" @click="handleDeliver">确认签收</el-button>
      </template>
    </el-dialog>

    <!-- Exception Dialog -->
    <el-dialog v-model="showExceptionDialog" title="上报异常" width="520px" destroy-on-close>
      <el-form :model="exceptionForm" label-position="top">
        <el-form-item label="异常类型" required>
          <el-select v-model="exceptionForm.type" placeholder="请选择异常类型" style="width: 100%">
            <el-option label="包裹破损" value="damaged" />
            <el-option label="地址错误" value="address_error" />
            <el-option label="患者拒收" value="rejected_by_patient" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
        <el-form-item label="异常描述" required>
          <el-input
            v-model="exceptionForm.description"
            type="textarea"
            :rows="4"
            placeholder="请描述异常情况"
            show-word-limit
            maxlength="500"
          />
        </el-form-item>
        <el-form-item v-if="exceptionForm.type === 'damaged'" label="异常照片URL">
          <el-input v-model="exceptionForm.photo" placeholder="请输入破损照片URL" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showExceptionDialog = false">取消</el-button>
        <el-button type="danger" @click="handleReportException" :disabled="!canReport">确认上报</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Check, Close } from '@element-plus/icons-vue'
import { usePrescriptionStore } from '@/stores/prescription'
import { useUserStore } from '@/stores/user'
import StatusTag from '@/components/StatusTag.vue'
import client from '@/api/client'

const route = useRoute()
const prescriptionStore = usePrescriptionStore()
const userStore = useUserStore()

const id = computed(() => Number(route.params.id))
const current = computed(() => prescriptionStore.current)
const loading = ref(false)

// Role checks
const isDoctor = computed(() => userStore.role === 'doctor')
const isCourier = computed(() => userStore.role === 'courier')

// ---- Reject Dialog State ----
const showRejectDialog = ref(false)
const rejectForm = ref({ type: 'normal', reason: '' })
const rejectionTemplates = ref<any[]>([])
const canReject = computed(() => rejectForm.value.reason.trim().length >= 10)

// ---- Deliver Dialog State ----
const showDeliverDialog = ref(false)
const deliveryProofUrl = ref('')

// ---- Exception Dialog State ----
const showExceptionDialog = ref(false)
const exceptionForm = ref({ type: 'damaged', description: '', photo: '' })
const canReport = computed(() => exceptionForm.value.type && exceptionForm.value.description.trim().length > 0)

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

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

// ---- Courier Actions ----
const courierActions = computed(() => {
  const actions: { type: string }[] = []
  if (current.value?.status === 'approved') {
    actions.push({ type: 'pickup' })
  }
  if (current.value?.status === 'delivering') {
    actions.push({ type: 'deliver' })
    actions.push({ type: 'exception' })
  }
  return actions
})

const showDeliveryInfo = computed(() => {
  const s = current.value?.status
  return s === 'approved' || s === 'delivering' || s === 'received' || s === 'returned'
})

// ---- Doctor Annotation ----
const hasDoctorAnnotation = computed(() => {
  return current.value?.items?.some((item: any) => item.doctorAnnotation)
})

// ---- Reject Type Display ----
const rejectTypeLabel = computed(() => {
  const map: Record<string, string> = { serious: '严重', normal: '一般', suggestion: '建议' }
  return map[current.value?.rejectedType] || current.value?.rejectedType || '-'
})

const rejectTypeTag = computed(() => {
  const map: Record<string, string> = { serious: 'danger', normal: 'warning', suggestion: 'info' }
  return map[current.value?.rejectedType] || 'info'
})

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
    showRejectDialog.value = false
  } catch {
    // user cancelled
  }
}

async function handleReject() {
  if (!canReject.value) return
  try {
    await ElMessageBox.confirm('确定要驳回该处方吗？', '驳回确认', {
      confirmButtonText: '确认驳回',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await prescriptionStore.reject(id.value, rejectForm.value.reason, rejectForm.value.type)
    ElMessage.success('处方已驳回')
    showRejectDialog.value = false
    rejectForm.value = { type: 'normal', reason: '' }
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

async function handleReportException() {
  if (!canReport.value) return
  try {
    await ElMessageBox.confirm('确定要上报该异常吗？', '上报异常', {
      confirmButtonText: '确认上报',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await prescriptionStore.reportEx(
      id.value,
      exceptionForm.value.type,
      exceptionForm.value.description,
      exceptionForm.value.photo || undefined
    )
    ElMessage.success('异常已上报')
    showExceptionDialog.value = false
    exceptionForm.value = { type: 'damaged', description: '', photo: '' }
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

function formatDateTime(date: string): string {
  if (!date) return '-'
  return new Date(date).toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function actionLabel(action: string): string {
  const map: Record<string, string> = {
    created: '创建处方',
    submitted: '提交审核',
    approved: '审核通过',
    rejected: '审核驳回',
    revoked: '撤回审核',
    picked_up: '已取件',
    delivered: '已送达',
    received: '已签收',
    returned: '异常退回',
    redelivered: '重新配送',
    resubmitted: '重新提交',
  }
  return map[action] || action
}

function formatMetadata(metadata: string | null): string {
  if (!metadata) return ''
  try {
    const parsed = JSON.parse(metadata)
    if (parsed.rejectedReason) return `驳回原因：${parsed.rejectedReason}`
    if (parsed.reason) return `原因：${parsed.reason}`
    return JSON.stringify(parsed)
  } catch {
    return metadata
  }
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

<style scoped>
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

.side-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

/* Cards */
.info-card,
.action-card {
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

/* Timeline */
.timeline-card {
  padding: 8px 0;
}

.timeline-rejected {
  color: var(--coral);
}

.timeline-action {
  font-size: 14px;
  font-weight: 600;
  color: var(--warm-900);
  margin-bottom: 2px;
}

.timeline-rejected .timeline-action {
  color: var(--coral);
}

.timeline-operator {
  font-size: 13px;
  color: var(--warm-700);
}

.timeline-detail {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

.timeline-reason {
  font-size: 13px;
  color: var(--coral);
  margin-top: 4px;
  padding: 6px 10px;
  background: #fef2f2;
  border-radius: 6px;
}

/* Action Buttons */
.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
}

/* Revoke */
.revoke-card {
  border-color: #fbbf24;
  background: #fffbeb;
}

.revoke-hint {
  font-size: 13px;
  color: #92400e;
  margin-bottom: 12px;
}

/* Rejected Info */
.rejected-info {
  border-color: #fecaca;
}

.reject-detail {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.reject-reason {
  color: var(--coral);
}

/* Template Chips */
.template-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-chip {
  cursor: pointer;
  transition: all 0.2s;
}

.template-chip:hover {
  border-color: var(--teal-700);
}

.template-active {
  background: var(--teal-700);
  color: #fff;
  border-color: var(--teal-700);
}

/* Delivery Proof */
.delivery-proof {
  margin-top: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.proof-image {
  width: 160px;
  height: 160px;
  border-radius: 8px;
  border: 1px solid var(--warm-200);
  cursor: pointer;
}

/* Element Plus Timeline Overrides */
:deep(.el-timeline-item__node) {
  background: var(--teal-700);
}

:deep(.el-timeline-item__tail) {
  border-color: var(--warm-200);
}

/* Empty state */
:deep(.el-empty__description) {
  color: #b0b0b0;
}
</style>
