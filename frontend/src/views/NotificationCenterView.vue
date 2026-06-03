<template>
  <div class="page">
    <div class="page-header">
      <h2>通知中心</h2>
      <el-button type="primary" text @click="handleMarkAll">全部已读</el-button>
    </div>
    <!-- TODO: student - implement notification center
         Filters: type (rejected/approved/delivering/received/returned/system)
         List: notification cards with title, content, time, read status
         Click to mark as read + navigate to related prescription
         "Mark all read" button
         Import: import { useNotificationStore } from '@/stores/notification'
         Call notificationStore.fetchList() on mount
    -->
    <el-empty description="通知中心 — 学生待实现" />
  </div>
</template>
<script setup lang="ts">
import { useNotificationStore } from '@/stores/notification'
const notifStore = useNotificationStore()
async function handleMarkAll() { await notifStore.markAll(); location.reload() }
</script>
<style scoped>
.page { max-width: 800px; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
</style>
