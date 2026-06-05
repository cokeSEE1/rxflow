<template>
  <!-- Left: 待处理驳回 -->
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
          <span class="panel-title">待处理驳回</span>
          <el-tag
            type="danger"
            size="small"
          >
            {{ rejectedList.length }} 项
          </el-tag>
        </div>
      </template>
      <div
        v-if="rejectedList.length"
        class="rejected-list"
      >
        <div
          v-for="item in rejectedList"
          :key="item.id"
          class="rejected-item"
        >
          <div class="rejected-item-main">
            <div class="rejected-patient">
              {{ item.patient?.name }}
            </div>
            <div class="rejected-detail">
              {{ item.diagnosis }}
            </div>
          </div>
          <div class="rejected-item-meta">
            <StatusTag :status="item.status" />
            <span class="rejected-time">{{ formatRelativeTime(item.rejectedAt || item.updatedAt) }}</span>
          </div>
        </div>
      </div>
      <el-empty
        v-else
        v-loading="false"
        description="暂无驳回记录"
      />
    </el-card>
  </el-col>

  <!-- Right: 最近动态 -->
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
        <span class="panel-title">最近动态</span>
      </template>
      <el-timeline v-if="activities.length">
        <el-timeline-item
          v-for="(event, idx) in activities"
          :key="idx"
          :timestamp="event.time"
          placement="top"
        >
          {{ event.content }}
        </el-timeline-item>
      </el-timeline>
      <el-empty
        v-else
        v-loading="false"
        description="暂无动态"
      />
    </el-card>
  </el-col>
</template>

<script setup lang="ts">
import StatusTag from '@/components/StatusTag.vue'
import type { Prescription } from '@/types'

defineProps<{
  rejectedList: Prescription[]
  activities: { content: string; time: string }[]
  leftLoading: boolean
  rightLoading: boolean
}>()

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

  &:hover {
    box-shadow: var(--shadow-sm);
  }
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

@media (max-width: 768px) {
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
