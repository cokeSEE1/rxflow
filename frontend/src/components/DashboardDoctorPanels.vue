<template>
  <!-- Consultation stats -->
  <div
    v-loading="consultationLoading"
    class="consultation-stats"
  >
    <div class="stat-card consultation-stat">
      <div class="stat-number">{{ consultationCounts.draft }}</div>
      <div class="stat-label">待问诊</div>
    </div>
    <div class="stat-card consultation-stat">
      <div class="stat-number">{{ consultationCounts.progress }}</div>
      <div class="stat-label">问诊中</div>
    </div>
    <div class="stat-card consultation-stat">
      <div class="stat-number">{{ consultationCounts.completedToday }}</div>
      <div class="stat-label">今日完诊</div>
    </div>
    <div class="stat-card consultation-stat clickable" @click="$router.push('/consultations/new')">
      <el-icon :size="20"><Plus /></el-icon>
      <div class="stat-label">新建问诊</div>
    </div>
  </div>

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
import { reactive, ref, onMounted } from 'vue'
import { Plus } from '@element-plus/icons-vue'
import type { Prescription } from '@/types'
import * as consultationApi from '@/api/consultations'

defineProps<{
  pendingQueue: (Prescription & { _waitText: string; _urgent: boolean })[]
  reviewRecords: { content: string; time: string; action: string }[]
  leftLoading: boolean
  rightLoading: boolean
}>()

const consultationLoading = ref(false)
const consultationCounts = reactive({ draft: 0, progress: 0, completedToday: 0 })

onMounted(async () => {
  consultationLoading.value = true
  try {
    const [draftRes, progressRes, completedRes] = await Promise.all([
      consultationApi.listConsultations({ status: 'draft', pageSize: 1 }),
      consultationApi.listConsultations({ status: 'in_progress', pageSize: 1 }),
      consultationApi.listConsultations({ status: 'completed', pageSize: 1 }),
    ])
    consultationCounts.draft = draftRes.total || 0
    consultationCounts.progress = progressRes.total || 0
    consultationCounts.completedToday = completedRes.total || 0
  } catch {
    // consultation stats are supplementary; silent fail
  } finally {
    consultationLoading.value = false
  }
})
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

.consultation-stats {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  margin-bottom: 20px;

  @media (max-width: 768px) {
    grid-template-columns: repeat(2, 1fr);
  }
}

.stat-card {
  padding: 20px;
  border-radius: 12px;
  background: #fff;
  box-shadow: var(--shadow-sm);
  border-left: 3px solid #0f766e;
  transition: box-shadow 0.25s ease, transform 0.25s ease;
  text-align: center;

  &:hover {
    box-shadow: var(--shadow-md);
    transform: translateY(-2px);
  }
}

.stat-card.clickable {
  cursor: pointer;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border-left-color: #14b8a6;
  background: linear-gradient(135deg, #f0fdfa, #ccfbf1);

  &:hover {
    background: linear-gradient(135deg, #ccfbf1, #99f6e4);
  }

  .el-icon {
    color: #0f766e;
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

@media (max-width: 768px) {
  .stat-number {
    font-size: 26px;
  }
}
</style>
