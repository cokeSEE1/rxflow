<template>
  <div class="drug-item-row">
    <div class="drug-item-header">
      <span class="drug-item-index">药品 {{ index + 1 }}</span>
      <el-button
        v-if="canDelete"
        type="danger"
        link
        size="small"
        @click="$emit('remove')"
      >
        <el-icon><Delete /></el-icon>
        删除
      </el-button>
    </div>

    <div class="drug-item-fields">
      <div class="field-group">
        <label class="field-label required">药品名称</label>
        <el-input
          :model-value="item.drugName"
          placeholder="如：阿莫西林胶囊"
          @update:model-value="$emit('update:item', { ...$props.item, drugName: $event })"
        />
        <span
          v-if="errors.drugName"
          class="field-error"
        >
          {{ errors.drugName }}
        </span>
      </div>

      <div class="field-group">
        <label class="field-label">规格</label>
        <el-input
          :model-value="item.specification"
          placeholder="如：0.5g x 24粒"
          @update:model-value="$emit('update:item', { ...$props.item, specification: $event })"
        />
      </div>

      <div class="field-group">
        <label class="field-label required">用量</label>
        <el-input
          :model-value="item.dosage"
          placeholder="如：0.5g"
          @update:model-value="$emit('update:item', { ...$props.item, dosage: $event })"
        />
        <span
          v-if="errors.dosage"
          class="field-error"
        >
          {{ errors.dosage }}
        </span>
      </div>

      <div class="field-group">
        <label class="field-label">频次</label>
        <el-select
          :model-value="item.frequency"
          placeholder="选择频次"
          @update:model-value="$emit('update:item', { ...$props.item, frequency: $event })"
        >
          <el-option
            label="每日一次 (qd)"
            value="qd"
          />
          <el-option
            label="每日两次 (bid)"
            value="bid"
          />
          <el-option
            label="每日三次 (tid)"
            value="tid"
          />
          <el-option
            label="每晚一次 (qn)"
            value="qn"
          />
        </el-select>
      </div>

      <div class="field-group">
        <label class="field-label required">天数</label>
        <el-input-number
          :model-value="item.days"
          :min="1"
          :max="90"
          :step="1"
          controls-position="right"
          @update:model-value="$emit('update:item', { ...$props.item, days: $event ?? 1 })"
        />
        <span
          v-if="errors.days"
          class="field-error"
        >
          {{ errors.days }}
        </span>
      </div>

      <div class="field-group field-group-remark">
        <label class="field-label">备注</label>
        <el-input
          :model-value="item.remark"
          placeholder="用药说明..."
          @update:model-value="$emit('update:item', { ...$props.item, remark: $event })"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Delete } from '@element-plus/icons-vue'

export interface DrugItem {
  _key: string
  drugName: string
  specification: string
  dosage: string
  frequency: string
  days: number
  remark: string
}

defineProps<{
  item: DrugItem
  index: number
  canDelete: boolean
  errors: Record<string, string>
}>()

defineEmits<{
  'update:item': [item: DrugItem]
  remove: []
}>()
</script>

<style scoped lang="scss">
.drug-item-row {
  background: var(--warm-50);
  border: 1px solid var(--warm-200);
  border-radius: 10px;
  padding: 16px 20px;
  margin-bottom: 12px;
}

.drug-item-row:last-child {
  margin-bottom: 0;
}

.drug-item-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.drug-item-index {
  font-size: 14px;
  font-weight: 600;
  color: var(--teal-700);
}

.drug-item-fields {
  display: grid;
  grid-template-columns: 1.5fr 1fr 0.8fr 1fr 90px 1.2fr;
  gap: 12px;
  align-items: start;
}

.field-group {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.field-group-remark {
  grid-column: 6;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--warm-700);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.field-label.required::after {
  content: ' *';
  color: var(--coral);
}

.field-error {
  font-size: 12px;
  color: var(--coral);
  margin-top: 2px;
}

@media (max-width: 1024px) {
  .drug-item-fields {
    grid-template-columns: 1fr 1fr;
    gap: 10px;
  }
  .field-group-remark {
    grid-column: span 2;
  }
}

@media (max-width: 640px) {
  .drug-item-fields {
    grid-template-columns: 1fr;
  }
  .field-group-remark {
    grid-column: 1;
  }
}
</style>
