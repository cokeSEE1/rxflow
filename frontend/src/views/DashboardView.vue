<template>
  <div class="dashboard">
    <!-- Stat Cards Grid -->
    <el-row
      v-loading="statsLoading"
      :gutter="16"
      class="stat-grid"
    >
      <el-col
        v-for="stat in stats"
        :key="stat.label"
        :xs="12"
        :sm="12"
        :md="statColSpan"
        :lg="statColSpan"
      >
        <div
          class="stat-card"
          :style="{ borderLeftColor: stat.color }"
        >
          <div class="stat-number">
            {{ stat.value }}
          </div>
          <div class="stat-label">
            {{ stat.label }}
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- Role-specific content panels -->
    <el-row
      :gutter="20"
      class="content-panels"
    >
      <DashboardAssistantPanels
        v-if="role === 'assistant'"
        :rejected-list="rejectedList"
        :activities="assistantActivities"
        :left-loading="leftLoading"
        :right-loading="rightLoading"
      />
      <DashboardDoctorPanels
        v-if="role === 'doctor'"
        :pending-queue="pendingQueue"
        :review-records="doctorReviewRecords"
        :left-loading="leftLoading"
        :right-loading="rightLoading"
      />
      <DashboardCourierPanels
        v-if="role === 'courier'"
        :tasks="courierTasks"
        :exceptions="courierExceptions"
        :left-loading="leftLoading"
        :right-loading="rightLoading"
      />
      <DashboardPatientPanels
        v-if="role === 'patient'"
        :current-delivery="currentDelivery"
        :prescriptions="patientPrescriptions"
        :left-loading="leftLoading"
        :right-loading="rightLoading"
      />
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
import { ElMessage } from 'element-plus'
import DashboardAssistantPanels from '@/components/DashboardAssistantPanels.vue'
import DashboardDoctorPanels from '@/components/DashboardDoctorPanels.vue'
import DashboardCourierPanels from '@/components/DashboardCourierPanels.vue'
import DashboardPatientPanels from '@/components/DashboardPatientPanels.vue'
import type { Prescription, Notification } from '@/types'

interface EnrichedPrescription extends Prescription {
  _waitText: string
  _urgent: boolean
}

const userStore = useUserStore()
const prescriptionStore = usePrescriptionStore()
const role = computed(() => userStore.role)

const statsLoading = ref(false)
const leftLoading = ref(false)
const rightLoading = ref(false)

// ============ Stats ============
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

  for (const [key, meta] of Object.entries(mapping)) {
    result.push({
      label: meta.label,
      value: Number(statsData.value[key]) || 0,
      color: meta.color,
    })
  }

  if (role.value === 'doctor' && pendingQueue.value.length > 0) {
    const overdue = pendingQueue.value.filter((p: EnrichedPrescription) => (p._waitHours || 0) >= 24).length
    if (overdue > 0) {
      result.push({ label: '超时未审>24h', value: overdue, color: '#f43f5e' })
    }
  }

  if (role.value === 'courier') {
    result.push({ label: '异常单', value: courierExceptions.value.length, color: '#f43f5e' })
  }

  return result
})

// ============ Data refs ============
const rejectedList = ref<Prescription[]>([])
const pendingQueue = ref<EnrichedPrescription[]>([])
const courierTasks = ref<Prescription[]>([])
const courierExceptions = ref<{ id: number; type: string; prescriptionId: number; prescription?: { prescriptionNo?: string; patient?: { name?: string } } }[]>([])
const patientPrescriptions = ref<Prescription[]>([])
const currentDeliveries = ref<Prescription[]>([])

const assistantActivities = ref<{ content: string; time: string }[]>([])
const doctorReviewRecords = ref<{ content: string; time: string; action: string }[]>([])

// ============ Patient delivery computed ============
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

// ============ Helpers ============
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

// ============ Data loading ============
async function loadDashboard() {
  if (!role.value) return

  statsLoading.value = true
  try {
    const result = await getStats()
    statsData.value = result.stats || result
  } catch {
    ElMessage.error('加载统计数据失败')
  } finally {
    statsLoading.value = false
  }

  switch (role.value) {
    case 'assistant': await loadAssistantData(); break
    case 'doctor': await loadDoctorData(); break
    case 'courier': await loadCourierData(); break
    case 'patient': await loadPatientData(); break
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
    assistantActivities.value = notifs.map((n: Notification) => ({
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
    const pendingResult = await prescriptionStore.fetchList({ status: 'pending', pageSize: 50 })
    const pendingData: EnrichedPrescription[] = (pendingResult?.data || []).map((p: Prescription) => {
      const wait = formatWaitTime(p.submittedAt || p.createdAt)
      return { ...p, _waitHours: wait.hours, _waitText: wait.text, _urgent: wait.urgent }
    })
    pendingData.sort((a: EnrichedPrescription, b: EnrichedPrescription) => (b._waitHours ?? 0) - (a._waitHours ?? 0))
    pendingQueue.value = pendingData

    const reviewResult = await listPrescriptions({ status: 'approved,rejected', pageSize: 15 })
    const reviewData = (reviewResult?.data || [])
      .filter((p: Prescription) => p.approvedAt || p.rejectedAt)
      .sort((a: Prescription, b: Prescription) => {
        const aTime = new Date((a.approvedAt || a.rejectedAt)!).getTime()
        const bTime = new Date((b.approvedAt || b.rejectedAt)!).getTime()
        return bTime - aTime
      })
      .slice(0, 10)

    doctorReviewRecords.value = reviewData.map((p: Prescription) => {
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

<style scoped lang="scss">
.dashboard {
  max-width: 1400px;
}

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

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
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

.content-panels {
  margin-top: 0;
}

@media (max-width: 768px) {
  .stat-number {
    font-size: 26px;
  }
}
</style>
