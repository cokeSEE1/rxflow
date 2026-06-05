<template>
  <div class="header-bar">
    <div class="header-left">
      <h1 class="logo">
        RxFlow
      </h1>
      <span class="subtitle">处方配送管理平台</span>
    </div>
    <div class="header-right">
      <div
        class="notification-wrapper"
        @click="$router.push('/notifications')"
      >
        <el-badge
          :value="notificationStore.unreadCount"
          :hidden="notificationStore.unreadCount === 0"
          class="notification-bell"
        >
          <div class="bell-icon">
            <SvgIcon
              :icon="BellIcon"
              :size="26"
            />
          </div>
        </el-badge>
      </div>
      <el-dropdown trigger="click">
        <span class="user-info">
          <span class="user-name">{{ userStore.user?.name }}</span>
          <el-tag
            size="small"
            :type="roleTagType"
          >{{ roleLabel }}</el-tag>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="$router.push('/notifications')">
              通知中心
            </el-dropdown-item>
            <el-dropdown-item
              divided
              @click="handleLogout"
            >
              退出登录
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useNotificationStore } from '@/stores/notification'
import SvgIcon from '@/components/SvgIcon.vue'
import { BellIcon } from '@/assets/icons'

const router = useRouter()
const userStore = useUserStore()
const notificationStore = useNotificationStore()

onMounted(() => {
  notificationStore.fetchList()
})

const roleLabels: Record<string, string> = {
  assistant: '医生助理',
  doctor: '医生',
  courier: '快递员',
  patient: '患者',
}

const roleLabel = computed(() => roleLabels[userStore.role] || userStore.role)

const roleTagType = computed(() => {
  const map: Record<string, string> = {
    assistant: 'warning',
    doctor: 'success',
    courier: 'primary',
    patient: 'info',
  }
  return map[userStore.role] || 'info'
})

function handleLogout() {
  userStore.logout()
  router.push('/login')
}
</script>

<style scoped lang="scss">
.header-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 56px;
  padding: 0 20px;
  background: #fff;
  border-bottom: 1px solid var(--warm-200);
}

.header-left {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.logo {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 20px;
  font-weight: 400;
  color: var(--teal-700);
  letter-spacing: 0.02em;
  margin: 0;
}

.subtitle {
  font-size: 13px;
  color: #909399;
  font-family: 'DM Sans', system-ui, sans-serif;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 20px;
}

.notification-wrapper {
  display: flex;
  align-items: center;
}

:deep(.notification-bell .el-badge__content) {
  background-color: var(--coral);
  border: 2px solid #fff;
}

.bell-icon {
  width: 36px;
  height: 36px;
  border-radius: 8px;
  background: var(--warm-100);
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--warm-700);
  cursor: pointer;
  transition: background 0.2s, color 0.2s;
}

.bell-icon:hover {
  background: var(--warm-200);
  color: var(--warm-900);
}

.user-info {
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.user-name {
  color: var(--warm-700);
  font-weight: 500;
}
</style>
