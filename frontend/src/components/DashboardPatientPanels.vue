<template>
  <!-- Left: 当前配送 -->
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
          <span class="panel-title">当前配送</span>
          <StatusTag
            v-if="currentDelivery"
            status="delivering"
          />
        </div>
      </template>
      <div
        v-if="currentDelivery"
        class="delivery-progress-card"
      >
        <div class="delivery-medicine">
          {{ currentDelivery.medicine }}
        </div>
        <el-progress
          :percentage="currentDelivery.progress"
          :stroke-width="8"
          color="#0f766e"
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
        <div class="delivery-eta">
          {{ currentDelivery.eta }}
        </div>
      </div>
      <el-empty
        v-else
        v-loading="false"
        description="暂无进行中的配送"
      />
    </el-card>
  </el-col>

  <!-- Right: 我的处方 -->
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
        <span class="panel-title">我的处方</span>
      </template>
      <div
        v-if="prescriptions.length"
        class="prescription-list"
      >
        <div
          v-for="rx in prescriptions"
          :key="rx.id"
          class="prescription-item"
        >
          <div class="rx-header">
            <span class="rx-id">{{ rx.prescriptionNo }}</span>
            <StatusTag :status="rx.status" />
          </div>
          <div class="rx-medicine">
            {{ itemsSummary(rx) }}
          </div>
          <div class="rx-date">
            {{ formatDate(rx.createdAt) }}
          </div>
          <div class="rx-actions">
            <el-button
              type="primary"
              size="small"
              link
              @click="$router.push(`/prescriptions/${rx.id}`)"
            >
              查看
            </el-button>
          </div>
        </div>
      </div>
      <el-empty
        v-else
        v-loading="false"
        description="暂无处方记录"
      />
    </el-card>
  </el-col>
</template>

<script setup lang="ts">
import StatusTag from '@/components/StatusTag.vue'
import type { Prescription, PrescriptionItem } from '@/types'

defineProps<{
  currentDelivery: { medicine: string; progress: number; currentStep: number; eta: string } | null
  prescriptions: Prescription[]
  leftLoading: boolean
  rightLoading: boolean
}>()

const deliverySteps = ['已接单', '取件中', '配送中', '已签收']

function itemsSummary(rx: Prescription): string {
  const items = rx.items || []
  if (items.length === 0) return rx.diagnosis || ''
  return items.map((i: PrescriptionItem) => `${i.drugName} ${i.specification || ''}`.trim()).join('、')
}

function formatDate(dateStr: string | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
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
</style>
