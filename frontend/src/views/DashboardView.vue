<template>
  <div class="dashboard">
    <!-- Stat Cards Grid -->
    <el-row :gutter="16" class="stat-grid" v-loading="statsLoading">
      <el-col v-for="stat in stats" :key="stat.label" :xs="12" :sm="12" :md="statColSpan" :lg="statColSpan">
        <div class="stat-card" :style="{ borderLeftColor: stat.color }">
          <div class="stat-number">{{ stat.value }}</div>
          <div class="stat-label">{{ stat.label }}</div>
        </div>
      </el-col>
    </el-row>

    <!-- Role-specific content panels (two-column layout) -->
    <el-row :gutter="20" class="content-panels">
      <!-- Left panel -->
      <el-col :xs="24" :sm="24" :md="14" :lg="14">
        <!-- Assistant: 待处理驳回 -->
        <el-card v-if="role === 'assistant'" class="panel-card" shadow="never" v-loading="leftLoading">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">待处理驳回</span>
              <el-tag type="danger" size="small">{{ rejectedList.length }} 项</el-tag>
            </div>
          </template>
          <div v-if="rejectedList.length" class="rejected-list">
            <div v-for="item in rejectedList" :key="item.id" class="rejected-item">
              <div class="rejected-item-main">
                <div class="rejected-patient">{{ item.patient?.name }}</div>
                <div class="rejected-detail">{{ item.diagnosis }}</div>
              </div>
              <div class="rejected-item-meta">
                <StatusTag :status="item.status" />
                <span class="rejected-time">{{ formatRelativeTime(item.rejectedAt || item.updatedAt) }}</span>
              </div>
            </div>
          </div>
          <el-empty v-else v-loading="false" description="暂无驳回记录" />
        </el-card>

        <!-- Doctor: 待审核队列 -->
        <el-card v-if="role === 'doctor'" class="panel-card" shadow="never" v-loading="leftLoading">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">待审核队列 · 按等待时长排序</span>
              <el-tag type="warning" size="small">{{ pendingQueue.length }} 项</el-tag>
            </div>
          </template>
          <el-table v-if="pendingQueue.length" :data="pendingQueue" stripe style="width: 100%" size="small">
            <el-table-column label="患者">
              <template #default="{ row }">{{ row.patient?.name }}</template>
            </el-table-column>
            <el-table-column prop="diagnosis" label="诊断摘要" min-width="160" />
            <el-table-column label="等待时长" width="100">
              <template #default="{ row }">
                <span :class="{ 'urgent-wait': row._urgent }">{{ row._waitText }}</span>
              </template>
            </el-table-column>
            <el-table-column label="操作" width="160">
              <template #default="{ row }">
                <el-button type="primary" size="small" link @click="$router.push(`/prescriptions/${row.id}`)">审核</el-button>
              </template>
            </el-table-column>
          </el-table>
          <el-empty v-else v-loading="false" description="暂无待审核处方" />
        </el-card>

        <!-- Courier: 今日任务 -->
        <el-card v-if="role === 'courier'" class="panel-card" shadow="never" v-loading="leftLoading">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">今日任务</span>
              <el-tag type="warning" size="small">{{ courierTasks.length }} 项</el-tag>
            </div>
          </template>
          <div v-if="courierTasks.length" class="courier-task-list">
            <div v-for="task in courierTasks" :key="task.id" class="courier-task-card">
              <div class="task-card-header">
                <span class="task-patient">{{ task.patient?.name }}</span>
                <span class="task-time">{{ formatRelativeTime(task.approvedAt || task.createdAt) }}</span>
              </div>
              <div class="task-card-body">
                <div class="task-info-row">
                  <span class="task-label">诊断</span>
                  <span class="task-value">{{ task.diagnosis }}</span>
                </div>
                <div class="task-info-row">
                  <span class="task-label">药品</span>
                  <span class="task-value">{{ taskItemsSummary(task) }}</span>
                </div>
              </div>
              <div class="task-card-footer">
                <el-button type="primary" size="small" @click="$router.push(`/prescriptions/${task.id}`)">开始配送</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else v-loading="false" description="暂无配送任务" />
        </el-card>

        <!-- Patient: 当前配送 -->
        <el-card v-if="role === 'patient'" class="panel-card" shadow="never" v-loading="leftLoading">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">当前配送</span>
              <StatusTag v-if="currentDelivery" :status="'delivering'" />
            </div>
          </template>
          <div v-if="currentDelivery" class="delivery-progress-card">
            <div class="delivery-medicine">{{ currentDelivery.medicine }}</div>
            <el-progress
              :percentage="currentDelivery.progress"
              :stroke-width="8"
              :color="'#0f766e'"
            />
            <div class="delivery-steps">
              <div
                v-for="(step, idx) in deliverySteps"
                :key="idx"
                class="delivery-step"
                :class="{ active: idx <= currentDelivery.currentStep, done: idx < currentDelivery.currentStep }"
              >
                <div class="step-dot" />
                <span class="step-label">{{ step }}</span>
              </div>
            </div>
            <div class="delivery-eta">{{ currentDelivery.eta }}</div>
          </div>
          <el-empty v-else v-loading="false" description="暂无进行中的配送" />
        </el-card>
      </el-col>

      <!-- Right panel -->
      <el-col :xs="24" :sm="24" :md="10" :lg="10">
        <!-- Assistant: 最近动态 -->
        <el-card v-if="role === 'assistant'" class="panel-card" shadow="never" v-loading="rightLoading">
          <template #header>
            <span class="panel-title">最近动态</span>
          </template>
          <el-timeline v-if="assistantActivities.length">
            <el-timeline-item
              v-for="(event, idx) in assistantActivities"
              :key="idx"
              :timestamp="event.time"
              placement="top"
            >
              {{ event.content }}
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else v-loading="false" description="暂无动态" />
        </el-card>

        <!-- Doctor: 最近审核记录 -->
        <el-card v-if="role === 'doctor'" class="panel-card" shadow="never" v-loading="rightLoading">
          <template #header>
            <span class="panel-title">最近审核记录</span>
          </template>
          <el-timeline v-if="doctorReviewRecords.length">
            <el-timeline-item
              v-for="(record, idx) in doctorReviewRecords"
              :key="idx"
              :timestamp="record.time"
              placement="top"
              :color="record.action === 'approved' ? '#67c23a' : '#f56c6c'"
            >
              {{ record.content }}
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else v-loading="false" description="暂无审核记录" />
        </el-card>

        <!-- Courier: 待处理异常 -->
        <el-card v-if="role === 'courier'" class="panel-card" shadow="never" v-loading="rightLoading">
          <template #header>
            <div class="panel-header">
              <span class="panel-title">待处理异常</span>
              <el-tag type="danger" size="small">{{ courierExceptions.length }} 项</el-tag>
            </div>
          </template>
          <div v-if="courierExceptions.length">
            <div v-for="ex in courierExceptions" :key="ex.id" class="exception-card">
              <div class="exception-reason">{{ exceptionTypeLabel(ex.type) }}</div>
              <div class="exception-detail">{{ ex.prescription?.prescriptionNo }} · {{ ex.prescription?.patient?.name }}</div>
              <el-button type="warning" size="small" style="margin-top: 8px" @click="$router.push(`/prescriptions/${ex.prescriptionId}`)">处理</el-button>
            </div>
          </div>
          <el-empty v-else v-loading="false" description="暂无异常" />
        </el-card>

        <!-- Patient: 我的处方 -->
        <el-card v-if="role === 'patient'" class="panel-card" shadow="never" v-loading="rightLoading">
          <template #header>
            <span class="panel-title">我的处方</span>
          </template>
          <div v-if="patientPrescriptions.length" class="prescription-list">
            <div v-for="rx in patientPrescriptions" :key="rx.id" class="prescription-item">
              <div class="rx-header">
                <span class="rx-id">{{ rx.prescriptionNo }}</span>
                <StatusTag :status="rx.status" />
              </div>
              <div class="rx-medicine">{{ rxItemsSummary(rx) }}</div>
              <div class="rx-date">{{ formatDate(rx.createdAt) }}</div>
              <div class="rx-actions">
                <el-button type="primary" size="small" link @click="$router.push(`/prescriptions/${rx.id}`)">查看</el-button>
              </div>
            </div>
          </div>
          <el-empty v-else v-loading="false" description="暂无处方记录" />
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useUserStore } from '@/stores/user'
import { usePrescriptionStore } from '@/stores/prescription'
import { getStats } from '@/api/dashboard'
import { listNotifications } from '@/api/notifications'
import { listPrescriptions } from '@/api/prescriptions'
import client from '@/api/client'
import StatusTag from '@/components/StatusTag.vue'
import { ElMessage } from 'element-plus'

const userStore = useUserStore()
const prescriptionStore = usePrescriptionStore()
const role = computed(() => userStore.role)

// ============ Loading states ============
const statsLoading = ref(false)
const leftLoading = ref(false)
const rightLoading = ref(false)

// ============ Stats data ============
const statsData = ref<Record<string, number>>({})

const statMappings: Record<string, Record<string, { label: string; color: string }>> = {
  assistant: {
    draft: { label: '草稿', color: '#909399' },
    pending: { label: '待审核', color: '#e6a23c' },
    rejected: { label: '已驳回', color: '#f43f5e' },
    todayApproved: { label: '今日通过', color: '#14b8a6' },
  },
  doctor: {
    pending: { label: '待审核处方', color: '#e6a23c' },
    todayReviewed: { label: '今日已审核', color: '#14b8a6' },
    rejected: { label: '已驳回', color: '#f43f5e' },
  },
  courier: {
    toPickup: { label: '待取件', color: '#e6a23c' },
    delivering: { label: '配送中', color: '#3b82f6' },
    todayDelivered: { label: '今日签收', color: '#14b8a6' },
  },
  patient: {
    delivering: { label: '配送中', color: '#3b82f6' },
    myPrescriptions: { label: '我的处方', color: '#14b8a6' },
  },
}

const statColSpan = computed(() => {
  const mapping = statMappings[role.value] || {}
  const count = Object.keys(mapping).length
  const span = Math.floor(24 / count)
  return span > 6 ? span : 6
})

const stats = computed(() => {
  const mapping = statMappings[role.value] || {}
  const result: { label: string; value: number; color: string }[] = []

  // Map API stats to display cards
  for (const [key, meta] of Object.entries(mapping)) {
    result.push({
      label: meta.label,
      value: Number(statsData.value[key]) || 0,
      color: meta.color,
    })
  }

  // Doctor: compute overdue >24h from pending queue
  if (role.value === 'doctor' && pendingQueue.value.length > 0) {
    const overdue = pendingQueue.value.filter((p: any) => (p._waitHours || 0) >= 24).length
    if (overdue > 0) {
      result.push({ label: '超时未审>24h', value: overdue, color: '#f43f5e' })
    }
  }

  // Courier: compute exceptions count
  if (role.value === 'courier') {
    result.push({ label: '异常单', value: courierExceptions.value.length, color: '#f43f5e' })
  }

  return result
})

// ============ Role-specific list data ============
const rejectedList = ref<any[]>([])
const pendingQueue = ref<any[]>([])
const courierTasks = ref<any[]>([])
const courierExceptions = ref<any[]>([])
const patientPrescriptions = ref<any[]>([])
const currentDeliveries = ref<any[]>([])

// ============ Activity / timeline data ============
const assistantActivities = ref<{ content: string; time: string }[]>([])
const doctorReviewRecords = ref<{ content: string; time: string; action: string }[]>([])

// ============ Patient delivery ============
const deliverySteps = ['已接单', '取件中', '配送中', '已签收']

const currentDelivery = computed(() => {
  const d = currentDeliveries.value[0]
  if (!d) return null

  const items = d.items || []
  const medicine = items.length > 0
    ? `${items[0].drugName} ${items[0].specification || ''}`.trim()
    : d.diagnosis

  const progress = d.status === 'delivering' ? 60 : d.status === 'approved' ? 10 : 0
  const currentStep = d.status === 'delivering' ? 2 : d.status === 'approved' ? 0 : 0

  let eta = '预计今天送达'
  if (d.estimatedDelivery) {
    const dDate = new Date(d.estimatedDelivery)
    eta = `预计 ${dDate.toLocaleDateString('zh-CN')} ${dDate.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })} 送达`
  }

  return { medicine, progress, currentStep, eta }
})

// ============ Time formatting helpers ============
function formatRelativeTime(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const date = new Date(dateStr).getTime()
  const diff = Date.now() - date
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  return `${days}天前`
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function formatWaitTime(submittedAt: string | undefined): { hours: number; text: string; urgent: boolean } {
  if (!submittedAt) return { hours: 0, text: '未知', urgent: false }
  const submitted = new Date(submittedAt).getTime()
  const diffMs = Date.now() - submitted
  const hours = Math.floor(diffMs / (1000 * 60 * 60))
  const minutes = Math.floor(diffMs / (1000 * 60))

  if (hours >= 24) return { hours, text: `${Math.floor(hours / 24)}d${hours % 24}h`, urgent: true }
  if (hours >= 1) return { hours, text: `${hours}h`, urgent: hours > 12 }
  return { hours, text: `${minutes}min`, urgent: false }
}

// ============ Item summary helpers ============
function taskItemsSummary(task: any): string {
  const items = task.items || []
  if (items.length === 0) return task.diagnosis || ''
  return items.map((i: any) => `${i.drugName} ${i.specification || ''}`.trim()).join('、')
}

function rxItemsSummary(rx: any): string {
  const items = rx.items || []
  if (items.length === 0) return rx.diagnosis || ''
  return items.map((i: any) => `${i.drugName} ${i.specification || ''}`.trim()).join('、')
}

function exceptionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    patient_reject: '患者拒收',
    wrong_address: '地址错误',
    unreachable: '联系不上',
    damaged: '药品破损',
  }
  return labels[type] || type
}

// ============ Data loading ============
async function loadDashboard() {
  if (!role.value) return

  // Load stats
  statsLoading.value = true
  try {
    const result = await getStats()
    // API may return { stats: {...} } or the object directly
    statsData.value = result.stats || result
  } catch {
    ElMessage.error('加载统计数据失败')
  } finally {
    statsLoading.value = false
  }

  // Load role-specific data
  switch (role.value) {
    case 'assistant':
      await loadAssistantData()
      break
    case 'doctor':
      await loadDoctorData()
      break
    case 'courier':
      await loadCourierData()
      break
    case 'patient':
      await loadPatientData()
      break
  }
}

async function loadAssistantData() {
  leftLoading.value = true
  rightLoading.value = true
  try {
    const [rejectedResult, notifResult] = await Promise.all([
      prescriptionStore.fetchList({ status: 'rejected', pageSize: 20 }),
      listNotifications({ pageSize: 10 }),
    ])

    rejectedList.value = rejectedResult?.data || []

    const notifs = notifResult?.data || []
    assistantActivities.value = notifs.map((n: any) => ({
      content: n.content || n.title,
      time: formatRelativeTime(n.createdAt),
    }))
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    leftLoading.value = false
    rightLoading.value = false
  }
}

async function loadDoctorData() {
  leftLoading.value = true
  rightLoading.value = true
  try {
    // Fetch pending queue
    const pendingResult = await prescriptionStore.fetchList({ status: 'pending', pageSize: 50 })
    const pendingData = (pendingResult?.data || []).map((p: any) => {
      const wait = formatWaitTime(p.submittedAt || p.createdAt)
      return {
        ...p,
        _waitHours: wait.hours,
        _waitText: wait.text,
        _urgent: wait.urgent,
      }
    })
    // Sort by wait time descending (longest wait first)
    pendingData.sort((a: any, b: any) => b._waitHours - a._waitHours)
    pendingQueue.value = pendingData

    // Fetch recent review records (approved + rejected)
    const reviewResult = await listPrescriptions({ status: 'approved,rejected', pageSize: 15 })
    const reviewData = (reviewResult?.data || [])
      .filter((p: any) => p.approvedAt || p.rejectedAt)
      .sort((a: any, b: any) => {
        const aTime = new Date(a.approvedAt || a.rejectedAt).getTime()
        const bTime = new Date(b.approvedAt || b.rejectedAt).getTime()
        return bTime - aTime
      })
      .slice(0, 10)

    doctorReviewRecords.value = reviewData.map((p: any) => {
      if (p.status === 'approved') {
        return {
          content: `审核通过 ${p.patient?.name || ''} 的处方`,
          time: formatRelativeTime(p.approvedAt),
          action: 'approved',
        }
      }
      const reason = p.rejectedReason ? `（${p.rejectedReason.length > 20 ? p.rejectedReason.slice(0, 20) + '...' : p.rejectedReason}）` : ''
      return {
        content: `驳回了 ${p.patient?.name || ''} 的处方${reason}`,
        time: formatRelativeTime(p.rejectedAt),
        action: 'rejected',
      }
    })
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    leftLoading.value = false
    rightLoading.value = false
  }
}

async function loadCourierData() {
  leftLoading.value = true
  rightLoading.value = true
  try {
    const [tasksResult, exResult] = await Promise.all([
      prescriptionStore.fetchList({ status: 'approved', pageSize: 20 }),
      client.get('/prescriptions/exceptions/list', { params: { isResolved: false } }),
    ])

    courierTasks.value = tasksResult?.data || []
    courierExceptions.value = exResult.data || []
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    leftLoading.value = false
    rightLoading.value = false
  }
}

async function loadPatientData() {
  leftLoading.value = true
  rightLoading.value = true
  try {
    const [deliveringResult, allResult] = await Promise.all([
      prescriptionStore.fetchList({ status: 'delivering', pageSize: 10 }),
      prescriptionStore.fetchList({ pageSize: 20 }),
    ])

    currentDeliveries.value = deliveringResult?.data || []
    patientPrescriptions.value = allResult?.data || []
  } catch {
    ElMessage.error('加载数据失败')
  } finally {
    leftLoading.value = false
    rightLoading.value = false
  }
}

onMounted(() => {
  loadDashboard()
})
</script>

<style scoped>
.dashboard {
  max-width: 1400px;
}

/* Stat Grid */
.stat-grid {
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  border-left: 3px solid #ccc;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
  margin-bottom: 16px;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-number {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 32px;
  font-weight: 700;
  color: var(--warm-900);
  line-height: 1.2;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-top: 4px;
}

/* Content Panels */
.content-panels {
  margin-top: 0;
}

.panel-card {
  border-radius: 12px;
  border: 1px solid var(--warm-200);
  box-shadow: var(--shadow-sm);
  margin-bottom: 20px;
}

:deep(.panel-card .el-card__header) {
  padding: 16px 20px;
  border-bottom: 1px solid var(--warm-100);
}

:deep(.panel-card .el-card__body) {
  padding: 16px 20px;
}

.panel-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.panel-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--warm-900);
}

/* ===== Assistant: Rejected Items ===== */
.rejected-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.rejected-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--warm-50);
  border-radius: 8px;
  border: 1px solid var(--warm-100);
  transition: box-shadow 0.2s;
}

.rejected-item:hover {
  box-shadow: var(--shadow-sm);
}

.rejected-patient {
  font-size: 14px;
  font-weight: 600;
  color: var(--warm-900);
}

.rejected-detail {
  font-size: 13px;
  color: var(--warm-700);
  margin-top: 2px;
}

.rejected-item-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-shrink: 0;
}

.rejected-time {
  font-size: 12px;
  color: #909399;
  white-space: nowrap;
}

/* ===== Doctor: Pending Review Table ===== */
.urgent-wait {
  color: var(--coral);
  font-weight: 600;
}

/* ===== Courier: Task Cards ===== */
.courier-task-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.courier-task-card {
  padding: 14px 16px;
  background: var(--warm-50);
  border-radius: 10px;
  border: 1px solid var(--warm-100);
}

.task-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10px;
}

.task-patient {
  font-weight: 600;
  font-size: 14px;
  color: var(--warm-900);
}

.task-time {
  font-size: 12px;
  color: #909399;
  background: #fff;
  padding: 2px 8px;
  border-radius: 4px;
}

.task-card-body {
  display: flex;
  flex-direction: column;
  gap: 6px;
  margin-bottom: 12px;
}

.task-info-row {
  display: flex;
  gap: 8px;
  font-size: 13px;
}

.task-label {
  color: #909399;
  flex-shrink: 0;
  width: 32px;
}

.task-value {
  color: var(--warm-700);
}

.task-card-footer {
  display: flex;
  justify-content: flex-end;
}

/* ===== Courier: Exception Cards ===== */
.exception-card {
  padding: 12px 14px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin-bottom: 10px;
}

.exception-card:last-child {
  margin-bottom: 0;
}

.exception-reason {
  font-weight: 600;
  font-size: 14px;
  color: var(--coral);
}

.exception-detail {
  font-size: 13px;
  color: var(--warm-700);
  margin-top: 4px;
}

/* ===== Patient: Delivery Progress ===== */
.delivery-progress-card {
  padding: 4px 0;
}

.delivery-medicine {
  font-size: 16px;
  font-weight: 600;
  color: var(--warm-900);
  margin-bottom: 16px;
}

.delivery-steps {
  display: flex;
  justify-content: space-between;
  margin-top: 16px;
}

.delivery-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
}

.step-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--warm-200);
  transition: background 0.3s;
}

.delivery-step.active .step-dot {
  background: var(--teal-500);
}

.delivery-step.done .step-dot {
  background: var(--teal-700);
}

.step-label {
  font-size: 11px;
  color: #909399;
  white-space: nowrap;
}

.delivery-step.active .step-label {
  color: var(--teal-700);
  font-weight: 500;
}

.delivery-eta {
  margin-top: 16px;
  padding: 10px 14px;
  background: var(--teal-100);
  border-radius: 8px;
  font-size: 14px;
  color: var(--teal-700);
  font-weight: 500;
  text-align: center;
}

/* ===== Patient: Prescription List ===== */
.prescription-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.prescription-item {
  padding: 12px 14px;
  background: var(--warm-50);
  border-radius: 8px;
  border: 1px solid var(--warm-100);
}

.rx-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 4px;
}

.rx-id {
  font-weight: 600;
  font-size: 13px;
  color: var(--warm-900);
}

.rx-medicine {
  font-size: 13px;
  color: var(--warm-700);
  margin-bottom: 2px;
}

.rx-date {
  font-size: 12px;
  color: #909399;
  margin-bottom: 6px;
}

.rx-actions {
  display: flex;
  gap: 8px;
}

/* Responsive: stat cards */
@media (max-width: 768px) {
  .stat-number {
    font-size: 26px;
  }

  .rejected-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }

  .rejected-item-meta {
    width: 100%;
    justify-content: space-between;
  }
}
</style>
