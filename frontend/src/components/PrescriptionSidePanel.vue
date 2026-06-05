<template>
  <div class="side-column">
    <!-- Doctor Review Actions -->
    <section
      v-if="isDoctor && status === 'pending'"
      class="action-card"
    >
      <h3 class="section-title">
        审核操作
      </h3>
      <div class="action-buttons">
        <el-button
          type="primary"
          size="large"
          class="action-btn"
          @click="$emit('approve')"
        >
          <el-icon><Check /></el-icon> 审核通过（需签名确认）
        </el-button>
        <el-button
          type="danger"
          size="large"
          class="action-btn"
          @click="$emit('showReject')"
        >
          <el-icon><Close /></el-icon> 驳回
        </el-button>
      </div>
    </section>

    <!-- Revoke (doctor, approved, within 30min) -->
    <section
      v-if="isDoctor && status === 'approved' && isWithinRevokeWindow"
      class="action-card revoke-card"
    >
      <h3 class="section-title">
        撤回审核
      </h3>
      <p class="revoke-hint">
        审核通过后30分钟内可撤回
      </p>
      <el-button
        type="warning"
        size="large"
        class="action-btn"
        :disabled="revokeCountdown <= 0"
        @click="$emit('revoke')"
      >
        撤回审核 {{ revokeCountdown > 0 ? `(${formatCountdown(revokeCountdown)})` : '' }}
      </el-button>
    </section>

    <!-- Courier Actions -->
    <section
      v-if="isCourier && courierActions.length > 0"
      class="action-card"
    >
      <h3 class="section-title">
        配送操作
      </h3>
      <div class="action-buttons">
        <template
          v-for="action in courierActions"
          :key="action.type"
        >
          <el-button
            v-if="action.type === 'pickup'"
            type="primary"
            size="large"
            class="action-btn"
            @click="$emit('pickup')"
          >
            确认取件
          </el-button>
          <el-button
            v-if="action.type === 'deliver'"
            type="success"
            size="large"
            class="action-btn"
            @click="$emit('showDeliver')"
          >
            确认签收
          </el-button>
          <el-button
            v-if="action.type === 'exception'"
            type="danger"
            size="large"
            class="action-btn"
            @click="$emit('showException')"
          >
            上报异常
          </el-button>
          <el-button
            v-if="action.type === 'redeliver'"
            type="primary"
            size="large"
            class="action-btn"
            @click="$emit('redeliver')"
          >
            重新配送
          </el-button>
        </template>
      </div>
    </section>

    <!-- Rejected Info -->
    <section
      v-if="status === 'rejected'"
      class="info-card rejected-info"
    >
      <h3 class="section-title">
        驳回信息
      </h3>
      <div class="reject-detail">
        <div class="info-item">
          <span class="info-label">驳回类型</span>
          <el-tag
            :type="rejectTypeTag"
            size="small"
          >
            {{ rejectTypeLabel }}
          </el-tag>
        </div>
        <div class="info-item">
          <span class="info-label">驳回理由</span>
          <span class="info-value reject-reason">{{ rejectedReason }}</span>
        </div>
      </div>
    </section>

    <!-- Assistant Resubmit -->
    <section
      v-if="isAssistant && status === 'rejected'"
      class="action-card"
    >
      <h3 class="section-title">
        重新提交
      </h3>
      <p class="resubmit-hint">
        该处方已被驳回，请根据驳回理由修改处方内容后重新提交审核。
      </p>
      <el-button
        type="primary"
        size="large"
        class="action-btn"
        @click="$emit('resubmit')"
      >
        <el-icon><Edit /></el-icon> 修改并重新提交
      </el-button>
    </section>

    <!-- Delivery Info -->
    <section
      v-if="showDeliveryInfo"
      class="info-card"
    >
      <h3 class="section-title">
        配送信息
      </h3>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">快递单号</span>
          <span class="info-value">{{ trackingNo || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">快递员</span>
          <span class="info-value">{{ courierName || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">配送方式</span>
          <span class="info-value">{{ deliveryMethod || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">预计送达</span>
          <span class="info-value">{{ estimatedDelivery ? formatDate(estimatedDelivery) : '-' }}</span>
        </div>
      </div>
      <div
        v-if="status === 'received' && deliveryProof"
        class="delivery-proof"
      >
        <span class="info-label">签收凭证</span>
        <el-image
          :src="deliveryProof"
          fit="cover"
          class="proof-image"
          :preview-src-list="[deliveryProof]"
        />
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Check, Close, Edit } from '@element-plus/icons-vue'
import type { PrescriptionStatus } from '@/types'

const props = defineProps<{
  status: PrescriptionStatus
  isDoctor: boolean
  isCourier: boolean
  isAssistant: boolean
  revokeCountdown: number
  isWithinRevokeWindow: boolean
  rejectedReason?: string
  rejectedType?: string
  trackingNo?: string
  courierName?: string
  deliveryMethod?: string
  estimatedDelivery?: string
  deliveryProof?: string
}>()

defineEmits<{
  approve: []
  showReject: []
  revoke: []
  pickup: []
  showDeliver: []
  showException: []
  redeliver: []
  resubmit: []
}>()

const courierActions = computed(() => {
  const actions: { type: string }[] = []
  if (props.status === 'approved') {
    actions.push({ type: 'pickup' })
  }
  if (props.status === 'delivering') {
    actions.push({ type: 'deliver' })
    actions.push({ type: 'exception' })
  }
  if (props.status === 'returned') {
    actions.push({ type: 'redeliver' })
  }
  return actions
})

const showDeliveryInfo = computed(() => {
  const s = props.status
  return s === 'approved' || s === 'delivering' || s === 'received' || s === 'returned'
})

const rejectTypeLabel = computed(() => {
  const map: Record<string, string> = { serious: '严重', normal: '一般', suggestion: '建议' }
  return map[props.rejectedType ?? ''] || props.rejectedType || '-'
})

const rejectTypeTag = computed(() => {
  const map: Record<string, string> = { serious: 'danger', normal: 'warning', suggestion: 'info' }
  return map[props.rejectedType ?? ''] || 'info'
})

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function formatDate(date: string | null | undefined): string {
  if (!date) return '-'
  return new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
}
</script>

<style scoped lang="scss">
.side-column {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

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

.info-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
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

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.action-btn {
  width: 100%;
}

.revoke-card {
  border-color: #fbbf24;
  background: #fffbeb;
}

.revoke-hint {
  font-size: 13px;
  color: #92400e;
  margin-bottom: 12px;
}

.resubmit-hint {
  font-size: 13px;
  color: var(--warm-700);
  margin-bottom: 12px;
}

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
</style>
