<template>
  <!-- Left: 今日任务 -->
  <el-col
    :xs="24"
    :sm="24"
    :md="14"
    :lg="14"
  >
    <el-card
      v-loading="leftLoading"
      class="panel-card"
      shadow="never"
    >
      <template #header>
        <div class="panel-header">
          <span class="panel-title">今日任务</span>
          <el-tag
            type="warning"
            size="small"
          >
            {{ tasks.length }} 项
          </el-tag>
        </div>
      </template>
      <div
        v-if="tasks.length"
        class="courier-task-list"
      >
        <div
          v-for="task in tasks"
          :key="task.id"
          class="courier-task-card"
        >
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
              <span class="task-value">{{ itemsSummary(task) }}</span>
            </div>
          </div>
          <div class="task-card-footer">
            <el-button
              type="primary"
              size="small"
              @click="$router.push(`/prescriptions/${task.id}`)"
            >
              开始配送
            </el-button>
          </div>
        </div>
      </div>
      <el-empty
        v-else
        v-loading="false"
        description="暂无配送任务"
      />
    </el-card>
  </el-col>

  <!-- Right: 待处理异常 -->
  <el-col
    :xs="24"
    :sm="24"
    :md="10"
    :lg="10"
  >
    <el-card
      v-loading="rightLoading"
      class="panel-card"
      shadow="never"
    >
      <template #header>
        <div class="panel-header">
          <span class="panel-title">待处理异常</span>
          <el-tag
            type="danger"
            size="small"
          >
            {{ exceptions.length }} 项
          </el-tag>
        </div>
      </template>
      <div v-if="exceptions.length">
        <div
          v-for="ex in exceptions"
          :key="ex.id"
          class="exception-card"
        >
          <div class="exception-reason">
            {{ exceptionTypeLabel(ex.type) }}
          </div>
          <div class="exception-detail">
            {{ ex.prescription?.prescriptionNo }} · {{ ex.prescription?.patient?.name }}
          </div>
          <el-button
            type="warning"
            size="small"
            style="margin-top: 8px"
            @click="$router.push(`/prescriptions/${ex.prescriptionId}`)"
          >
            处理
          </el-button>
        </div>
      </div>
      <el-empty
        v-else
        v-loading="false"
        description="暂无异常"
      />
    </el-card>
  </el-col>
</template>

<script setup lang="ts">
import type { Prescription, PrescriptionItem } from '@/types'

defineProps<{
  tasks: Prescription[]
  exceptions: { id: number; type: string; prescriptionId: number; prescription?: { prescriptionNo?: string; patient?: { name?: string } } }[]
  leftLoading: boolean
  rightLoading: boolean
}>()

function itemsSummary(task: Prescription): string {
  const items = task.items || []
  if (items.length === 0) return task.diagnosis || ''
  return items.map((i: PrescriptionItem) => `${i.drugName} ${i.specification || ''}`.trim()).join('、')
}

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

function exceptionTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    patient_reject: '患者拒收',
    wrong_address: '地址错误',
    unreachable: '联系不上',
    damaged: '药品破损',
  }
  return labels[type] || type
}
</script>

<style scoped lang="scss">
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

.exception-card {
  padding: 12px 14px;
  background: #fef2f2;
  border-radius: 8px;
  border: 1px solid #fecaca;
  margin-bottom: 10px;

  &:last-child {
    margin-bottom: 0;
  }
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
</style>
