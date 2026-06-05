<template>
  <el-dialog
    :model-value="modelValue"
    title="上报异常"
    width="520px"
    destroy-on-close
    @update:model-value="$emit('update:modelValue', $event)"
  >
    <el-form
      :model="form"
      label-position="top"
    >
      <el-form-item
        label="异常类型"
        required
      >
        <el-select
          v-model="form.type"
          placeholder="请选择异常类型"
          style="width: 100%"
        >
          <el-option
            label="包裹破损"
            value="damaged"
          />
          <el-option
            label="地址错误"
            value="address_error"
          />
          <el-option
            label="患者拒收"
            value="rejected_by_patient"
          />
          <el-option
            label="其他"
            value="other"
          />
        </el-select>
      </el-form-item>
      <el-form-item
        label="异常描述"
        required
      >
        <el-input
          v-model="form.description"
          type="textarea"
          :rows="4"
          placeholder="请描述异常情况"
          show-word-limit
          maxlength="500"
        />
      </el-form-item>
      <el-form-item
        v-if="form.type === 'damaged'"
        label="异常照片URL"
      >
        <el-input
          v-model="form.photo"
          placeholder="请输入破损照片URL"
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">
        取消
      </el-button>
      <el-button
        type="danger"
        :disabled="!canConfirm"
        @click="$emit('confirm', form.type, form.description, form.photo || undefined); form.type = 'damaged'; form.description = ''; form.photo = ''"
      >
        确认上报
      </el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'

defineProps<{
  modelValue: boolean
}>()

defineEmits<{
  'update:modelValue': [value: boolean]
  confirm: [type: string, description: string, photo?: string]
}>()

const form = ref({ type: 'damaged', description: '', photo: '' })
const canConfirm = computed(() => form.value.type && form.value.description.trim().length > 0)
</script>
