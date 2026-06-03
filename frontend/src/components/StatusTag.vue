<template>
  <el-tag :type="tagType" size="small">{{ label }}</el-tag>
</template>

<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ status: string }>()

const statusMap: Record<string, { label: string; type: string }> = {
  draft:      { label: '草稿',     type: 'info' },
  pending:    { label: '待审核',   type: 'warning' },
  rejected:   { label: '已驳回',   type: 'danger' },
  approved:   { label: '已通过',   type: 'success' },
  delivering: { label: '配送中',   type: '' },
  received:   { label: '已签收',   type: '' },
  returned:   { label: '异常退回', type: 'danger' },
}

const label = computed(() => statusMap[props.status]?.label || props.status)
const tagType = computed(() => statusMap[props.status]?.type || 'info')
</script>
