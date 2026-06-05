<template>
  <!-- Left: 待审核队列 -->
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
          <span class="panel-title">待审核队列 · 按等待时长排序</span>
          <el-tag
            type="warning"
            size="small"
          >
            {{ pendingQueue.length }} 项
          </el-tag>
        </div>
      </template>
      <el-table
        v-if="pendingQueue.length"
        :data="pendingQueue"
        stripe
        style="width: 100%"
        size="small"
      >
        <el-table-column label="患者">
          <template #default="{ row }">
            {{ row.patient?.name }}
          </template>
        </el-table-column>
        <el-table-column
          prop="diagnosis"
          label="诊断摘要"
          min-width="160"
        />
        <el-table-column
          label="等待时长"
          width="100"
        >
          <template #default="{ row }">
            <span :class="{ 'urgent-wait': row._urgent }">{{ row._waitText }}</span>
          </template>
        </el-table-column>
        <el-table-column
          label="操作"
          width="160"
        >
          <template #default="{ row }">
            <el-button
              type="primary"
              size="small"
              link
              @click="$router.push(`/prescriptions/${row.id}`)"
            >
              审核
            </el-button>
          </template>
        </el-table-column>
      </el-table>
      <el-empty
        v-else
        v-loading="false"
        description="暂无待审核处方"
      />
    </el-card>
  </el-col>

  <!-- Right: 最近审核记录 -->
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
        <span class="panel-title">最近审核记录</span>
      </template>
      <el-timeline v-if="reviewRecords.length">
        <el-timeline-item
          v-for="(record, idx) in reviewRecords"
          :key="idx"
          :timestamp="record.time"
          placement="top"
          :color="record.action === 'approved' ? '#67c23a' : '#f56c6c'"
        >
          {{ record.content }}
        </el-timeline-item>
      </el-timeline>
      <el-empty
        v-else
        v-loading="false"
        description="暂无审核记录"
      />
    </el-card>
  </el-col>
</template>

<script setup lang="ts">
import type { Prescription } from '@/types'

defineProps<{
  pendingQueue: (Prescription & { _waitText: string; _urgent: boolean })[]
  reviewRecords: { content: string; time: string; action: string }[]
  leftLoading: boolean
  rightLoading: boolean
}>()
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

.urgent-wait {
  color: var(--coral);
  font-weight: 600;
}
</style>
