<template>
  <div class="pharmacy-dashboard">
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
        :md="6"
        :lg="6"
      >
        <div class="stat-card">
          <div
            class="stat-icon"
            :style="{ background: stat.iconBg }"
          >
            <span class="stat-icon-text">{{ stat.icon }}</span>
          </div>
          <div class="stat-value">
            {{ stat.value }}
          </div>
          <div class="stat-label">
            <span
              v-if="stat.pulse"
              class="pulse-dot"
            />
            {{ stat.label }}
          </div>
          <span
            v-if="stat.ribbon"
            class="stat-ribbon"
            :style="{ background: stat.ribbonColor, color: '#fff' }"
          >{{ stat.ribbon }}</span>
        </div>
      </el-col>
    </el-row>

    <!-- Dispensing Queue Card -->
    <el-card
      v-loading="queueLoading"
      class="queue-card"
      shadow="never"
    >
      <template #header>
        <div class="queue-header">
          <h3 class="queue-title">
            待配药队列
          </h3>
          <div class="queue-sort">
            <el-button
              :type="sortMode === 'time' ? 'primary' : 'default'"
              size="small"
              @click="setSortMode('time')"
            >
              按时间 ↓
            </el-button>
            <el-button
              :type="sortMode === 'urgent' ? 'primary' : 'default'"
              size="small"
              @click="setSortMode('urgent')"
            >
              紧急优先 ↓
            </el-button>
          </div>
        </div>
      </template>

      <div
        v-if="sortedQueue.length"
        class="queue-list"
      >
        <div
          v-for="item in sortedQueue"
          :key="item.prescriptionId"
          class="queue-item"
        >
          <div
            class="queue-priority"
            :class="item.urgent || item.waitMinutes > 60 ? 'urgent' : 'normal'"
          />
          <div class="queue-info">
            <div class="queue-info-name">
              {{ item.prescriptionNo }} · {{ item.drugNames }}
            </div>
            <div class="queue-info-meta">
              {{ item.patientName }} · {{ item.diagnosis }} · 审核时间 {{ item.approvedAt }} · 已等待 {{ item.waitMinutes }}min
            </div>
          </div>
          <el-tag
            :type="item.waitMinutes > 60 ? 'danger' : ''"
            :class="item.waitMinutes > 60 ? 'status-late' : 'status-waiting'"
            size="small"
            disable-transitions
          >
            {{ item.waitMinutes > 60 ? '已超时' : '待配药' }}
          </el-tag>
          <el-button
            type="primary"
            size="small"
            @click="handleStartDispensing(item.prescriptionId)"
          >
            开始配药 →
          </el-button>
        </div>
      </div>

      <el-empty
        v-else
        description="暂无待配药处方"
      />
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useDispensingStore } from '@/stores/dispensing'
import { ElMessage } from 'element-plus'

const router = useRouter()
const dispensingStore = useDispensingStore()

// ============ Loading states ============
const statsLoading = ref(false)
const queueLoading = ref(false)

// ============ Sort mode ============
const sortMode = ref<'time' | 'urgent'>('time')

function setSortMode(mode: 'time' | 'urgent') {
  sortMode.value = mode
}

// ============ Stats ============
const stats = computed(() => {
  const s = dispensingStore.stats
  return [
    {
      label: '待配药处方',
      value: s?.pendingCount ?? 0,
      icon: '📋',
      iconBg: '#f0fdfa',
      ribbon: null,
      ribbonColor: null,
      pulse: false,
    },
    {
      label: '今日已完成配药',
      value: s?.todayCompleted ?? 0,
      icon: '✅',
      iconBg: '#f0fdf4',
      ribbon: null,
      ribbonColor: null,
      pulse: false,
    },
    {
      label: '库存预警药品',
      value: s?.stockAlertCount ?? 0,
      icon: '📦',
      iconBg: '#fff7ed',
      ribbon: '需补货',
      ribbonColor: '#f97316',
      pulse: false,
    },
    {
      label: '超时未配药',
      value: s?.overdueCount ?? 0,
      icon: '⏱️',
      iconBg: '#fef2f2',
      ribbon: '紧急',
      ribbonColor: '#f43f5e',
      pulse: true,
    },
  ]
})

// ============ Sorted queue ============
const sortedQueue = computed(() => {
  const data = [...dispensingStore.queue]
  if (sortMode.value === 'urgent') {
    data.sort((a, b) => {
      const urgentDiff = (b.urgent ? 1 : 0) - (a.urgent ? 1 : 0)
      if (urgentDiff !== 0) return urgentDiff
      return b.waitMinutes - a.waitMinutes
    })
  } else {
    data.sort((a, b) => b.waitMinutes - a.waitMinutes)
  }
  return data
})

// ============ Actions ============
function handleStartDispensing(prescriptionId: number) {
  dispensingStore.startDispensing(prescriptionId).then(() => {
    router.push(`/dispensing/${prescriptionId}`)
  }).catch(() => {
    ElMessage.error('开始配药失败，请稍后重试')
  })
}

// ============ Data loading ============
async function loadData() {
  statsLoading.value = true
  queueLoading.value = true
  try {
    await Promise.all([
      dispensingStore.fetchStats(),
      dispensingStore.fetchQueue(),
    ])
  } catch {
    ElMessage.error('加载药剂师工作台数据失败')
  } finally {
    statsLoading.value = false
    queueLoading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.pharmacy-dashboard {
  max-width: 1400px;
}

/* Stat Grid */
.stat-grid {
  margin-bottom: 24px;
}

.stat-card {
  padding: 20px 24px;
  border-radius: 14px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  position: relative;
  overflow: hidden;
  cursor: pointer;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
  margin-bottom: 16px;
}

.stat-card:hover {
  box-shadow: var(--shadow-md);
  transform: translateY(-2px);
}

.stat-icon {
  width: 40px;
  height: 40px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12px;
}

.stat-icon-text {
  font-size: 18px;
  line-height: 1;
}

.stat-value {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 28px;
  font-weight: 400;
  line-height: 1;
  color: var(--warm-900);
}

.stat-label {
  font-size: 12px;
  color: var(--warm-500);
  margin-top: 4px;
  font-weight: 500;
  display: flex;
  align-items: center;
}

.stat-ribbon {
  position: absolute;
  top: 0;
  right: 0;
  padding: 3px 28px;
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transform: translate(8px, -1px) rotate(12deg);
}

/* Pulse dot animation */
.pulse-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--coral);
  animation: pulse 2s infinite;
  display: inline-block;
  margin-right: 4px;
  flex-shrink: 0;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.4;
  }
}

/* Queue Card */
.queue-card {
  border-radius: 14px;
  border: 1px solid var(--warm-200);
  box-shadow: var(--shadow-sm);
}

:deep(.queue-card .el-card__header) {
  padding: 16px 24px;
  border-bottom: 1px solid var(--warm-100);
}

:deep(.queue-card .el-card__body) {
  padding: 0 24px 16px;
}

.queue-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.queue-title {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 16px;
  margin: 0;
  padding: 0;
  border: none;
}

.queue-sort {
  display: flex;
  gap: 8px;
}

/* Queue List */
.queue-list {
  display: flex;
  flex-direction: column;
  gap: 0;
}

.queue-item {
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 16px 0;
  border-bottom: 1px solid var(--warm-100);
  cursor: pointer;
  transition: all 0.2s ease;
}

.queue-item:last-child {
  border-bottom: none;
}

.queue-item:hover {
  border-color: var(--teal-100);
  transform: translateX(2px);
}

.queue-priority {
  width: 4px;
  height: 48px;
  border-radius: 2px;
  flex-shrink: 0;
}

.queue-priority.urgent {
  background: var(--coral);
}

.queue-priority.normal {
  background: var(--teal-500);
}

.queue-info {
  flex: 1;
  min-width: 0;
}

.queue-info-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--warm-900);
}

.queue-info-meta {
  font-size: 12px;
  color: var(--warm-500);
  margin-top: 4px;
}

/* Status tags */
.status-late {
  background: #fef2f2 !important;
  color: var(--coral) !important;
  border-color: #fecaca !important;
  border-radius: 20px !important;
  font-weight: 600 !important;
  flex-shrink: 0;
}

.status-waiting {
  background: #f0fdfa !important;
  color: var(--teal-700) !important;
  border-color: #99f6e4 !important;
  border-radius: 20px !important;
  font-weight: 600 !important;
  flex-shrink: 0;
}

/* Responsive */
@media (max-width: 768px) {
  .stat-value {
    font-size: 24px;
  }

  .queue-item {
    flex-wrap: wrap;
    gap: 8px;
  }

  .queue-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }
}
</style>
