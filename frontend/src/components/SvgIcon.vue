<template>
  <component
    :is="icon"
    class="svg-icon"
    :style="iconStyle"
    aria-hidden="true"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { DefineComponent } from 'vue'

const props = defineProps<{
  /** 从 @/assets/icons 导入的 SVG 组件 */
  icon: DefineComponent
  /** 尺寸 (px)，默认 24 */
  size?: number | string
  /** 颜色，默认继承父级 */
  color?: string
}>()

const iconStyle = computed(() => {
  const size = typeof props.size === 'number' ? `${props.size}px` : props.size
  return {
    width: size,
    height: size,
    color: props.color,
  }
})
</script>

<style scoped>
.svg-icon {
  display: inline-block;
  flex-shrink: 0;
  vertical-align: middle;
}
</style>
