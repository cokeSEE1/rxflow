<template>
  <div class="header-bar">
    <div class="header-left">
      <h1 class="logo">RxFlow</h1>
      <span class="subtitle">处方配送管理平台</span>
    </div>
    <div class="header-right">
      <NotificationBell />
      <el-dropdown trigger="click">
        <span class="user-info">
          {{ userStore.user?.name }}
          <el-tag size="small" :type="roleTagType">{{ roleLabel }}</el-tag>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="$router.push('/notifications')">通知中心</el-dropdown-item>
            <el-dropdown-item divided @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import NotificationBell from './NotificationBell.vue'

const router = useRouter()
const userStore = useUserStore()

const roleLabels: Record<string, string> = {
  assistant: '医生助理', doctor: '医生', courier: '快递员', patient: '病人',
}
const roleLabel = computed(() => roleLabels[userStore.role] || userStore.role)

const roleTagType = computed(() => {
  const map: Record<string, string> = { assistant: 'warning', doctor: 'success', courier: '', patient: 'info' }
  return map[userStore.role] || ''
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.header-bar { display: flex; align-items: center; justify-content: space-between; height: 60px; padding: 0 20px; background: #fff; border-bottom: 1px solid #e6e6e6; }
.header-left { display: flex; align-items: baseline; gap: 12px; }
.logo { font-size: 20px; color: #409eff; }
.subtitle { font-size: 13px; color: #909399; }
.header-right { display: flex; align-items: center; gap: 20px; }
.user-info { cursor: pointer; display: flex; align-items: center; gap: 8px; }
</style>
