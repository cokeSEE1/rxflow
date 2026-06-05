<template>
  <el-badge
    :value="unreadCount"
    :hidden="unreadCount === 0"
    :max="99"
  >
    <el-icon
      :size="20"
      style="cursor:pointer"
      @click="$router.push('/notifications')"
    >
      <Bell />
    </el-icon>
  </el-badge>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useNotificationStore } from '@/stores/notification'

const notifStore = useNotificationStore()
const unreadCount = computed(() => notifStore.unreadCount)

onMounted(() => { notifStore.fetchList({ page: 1, pageSize: 5 }) })
</script>
