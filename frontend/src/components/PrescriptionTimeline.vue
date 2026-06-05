<template>
  <section class="info-card">
    <h3 class="section-title">
      状态时间线
    </h3>
    <el-timeline v-if="timeline?.length">
      <el-timeline-item
        v-for="item in timeline"
        :key="item.id"
        :timestamp="formatDateTime(item.createdAt)"
        :color="item.action === 'rejected' ? '#f56c6c' : undefined"
        placement="top"
      >
        <div :class="['timeline-card', { 'timeline-rejected': item.action === 'rejected' }]">
          <div class="timeline-action">
            {{ actionLabel(item.action) }}
          </div>
          <div class="timeline-operator">
            {{ item.operatorName }}
          </div>
          <div
            v-if="item.detail"
            class="timeline-detail"
          >
            {{ item.detail }}
          </div>
          <div
            v-if="item.action === 'rejected' && item.metadata"
            class="timeline-reason"
          >
            {{ formatMetadata(item.metadata) }}
          </div>
        </div>
      </el-timeline-item>
    </el-timeline>
    <el-empty
      v-else
      description="暂无时间线记录"
      :image-size="60"
    />
  </section>
</template>

<script setup lang="ts">
defineProps<{
  timeline?: {
    id: number
    action: string
    operatorName?: string
    detail?: string
    metadata?: Record<string, unknown> | null
    createdAt: string
  }[]
}>()

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
    redeliver_requested: '重新配送',
    resubmitted: '重新提交',
  }
  return map[action] || action
}

function formatMetadata(metadata: Record<string, unknown> | null | undefined): string {
  if (!metadata) return ''
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata)
      if (parsed.rejectedReason) return `驳回原因：${parsed.rejectedReason}`
      if (parsed.reason) return `原因：${parsed.reason}`
      return JSON.stringify(parsed)
    } catch {
      return metadata
    }
  }
  return JSON.stringify(metadata)
}
</script>

<style scoped lang="scss">
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

:deep(.el-timeline-item__node) {
  background: var(--teal-700);
}

:deep(.el-timeline-item__tail) {
  border-color: var(--warm-200);
}

:deep(.el-empty__description) {
  color: #b0b0b0;
}
</style>
