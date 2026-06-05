<template>
  <el-dialog
    :model-value="modelValue"
    title="驳回处方"
    width="560px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      :model="form"
      label-position="top"
    >
      <el-form-item
        label="驳回类型"
        required
      >
        <el-select
          v-model="form.type"
          placeholder="请选择驳回类型"
          style="width: 100%"
        >
          <el-option
            label="严重"
            value="serious"
          />
          <el-option
            label="一般"
            value="normal"
          />
          <el-option
            label="建议"
            value="suggestion"
          />
        </el-select>
      </el-form-item>

      <el-form-item
        label="驳回理由"
        required
      >
        <el-input
          v-model="form.reason"
          type="textarea"
          :rows="4"
          placeholder="请输入驳回理由（不少于10个字符）"
          show-word-limit
          maxlength="500"
        />
      </el-form-item>

      <el-form-item
        v-if="templates.length > 0"
        label="快速选择模板"
      >
        <div class="template-chips">
          <el-tag
            v-for="tpl in templates"
            :key="tpl.id"
            class="template-chip"
            :class="{ 'template-active': form.reason === tpl.content }"
            @click="form.reason = tpl.content || ''"
          >
            {{ tpl.name }}
          </el-tag>
        </div>
      </el-form-item>
    </el-form>

    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">
        取消
      </el-button>
      <el-button
        type="danger"
        :disabled="!canConfirm"
        @click="$emit('confirm', form.reason, form.type); form.reason = ''; form.type = 'normal'"
      >
        确认驳回
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { RejectionTemplate } from '@/types'

defineProps<{
  modelValue: boolean
  templates: RejectionTemplate[]
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [reason: string, type: string]
}>()

const form = ref({ type: 'normal', reason: '' })
const canConfirm = computed(() => form.value.reason.trim().length >= 10)
</script>

<style scoped lang="scss">
.template-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.template-chip {
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    border-color: var(--teal-700);
  }
}

.template-active {
  background: var(--teal-700);
  color: #fff;
  border-color: var(--teal-700);
}
</style>
