<template>
  <aside class="sidebar">
    <div class="sidebar-brand">
      Rx<span class="brand-accent">Flow</span>
    </div>
    <nav class="sidebar-nav">
      <div
        v-for="section in menuItems"
        :key="section.title"
        class="nav-section-group"
      >
        <div class="nav-section-title">
          {{ section.title }}
        </div>
        <router-link
          v-for="item in section.items"
          :key="item.path"
          :to="item.path"
          class="nav-item"
          :class="{ active: route.path === item.path }"
        >
          <span>{{ item.label }}</span>
        </router-link>
      </div>
    </nav>
    <div class="sidebar-user">
      <div class="user-avatar">
        {{ displayInitial }}
      </div>
      <div>
        <div class="user-name">
          {{ userStore.user?.name || '用户' }}
        </div>
        <div class="user-role">
          {{ roleLabel }}
        </div>
      </div>
    </div>
  </aside>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const roleLabels: Record<string, string> = {
  assistant: '医生助理',
  doctor: '医生',
  courier: '快递员',
  patient: '患者',
  pharmacist: '药剂师',
}

const roleLabel = computed(() => roleLabels[userStore.role] || '未知角色')

const displayInitial = computed(() => {
  const name = userStore.user?.name || ''
  return name.charAt(0) || 'U'
})

const menuItems = computed(() => {
  const role = userStore.role
  if (!role) return []

  // Filter routes: sidebar visible + role authorized
  const visible = router.getRoutes().filter((r) => {
    if (r.meta.sidebar === false) return false
    if (!r.meta.title) return false
    const roles = r.meta.roles as string[] | undefined
    if (!roles || !roles.includes(role)) return false
    return true
  })

  // Group by meta.group, preserving definition order
  const groups = new Map<string, { label: string; path: string }[]>()
  for (const r of visible) {
    const group = (r.meta.group as string) || '其他'
    if (!groups.has(group)) groups.set(group, [])
    groups.get(group)!.push({
      label: r.meta.title as string,
      path: router.resolve({ name: r.name }).fullPath,
    })
  }

  return Array.from(groups, ([title, items]) => ({ title, items }))
})
</script>

<style scoped lang="scss">
.sidebar {
  width: 220px;
  min-height: 100vh;
  background: linear-gradient(180deg, #0d5c56 0%, var(--teal-900) 100%);
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
}

/* Brand */
.sidebar-brand {
  font-family: 'DM Serif Display', Georgia, serif;
  font-size: 24px;
  font-weight: 400;
  color: #fff;
  padding: 20px 20px 24px;
  letter-spacing: 0.02em;
}

.brand-accent {
  color: var(--teal-500);
}

/* Navigation */
.sidebar-nav {
  flex: 1;
  padding: 0 12px;
  overflow-y: auto;
}

.nav-section-group {
  margin-bottom: 20px;
}

.nav-section-title {
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: rgba(255, 255, 255, 0.3);
  padding: 0 12px 8px;
}

.nav-item {
  display: block;
  padding: 8px 12px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 500;
  color: rgba(255, 255, 255, 0.6);
  text-decoration: none;
  transition: all 0.25s ease;
  margin-bottom: 2px;
  cursor: pointer;
}

.nav-item:hover {
  color: #fff;
  background: rgba(255, 255, 255, 0.08);
}

.nav-item.active {
  color: #fff;
  background: rgba(255, 255, 255, 0.12);
  font-weight: 600;
}

/* User */
.sidebar-user {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 16px 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  margin-top: auto;
}

.user-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--teal-700);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 600;
  flex-shrink: 0;
}

.user-name {
  font-size: 13px;
  font-weight: 500;
  color: #fff;
  line-height: 1.3;
}

.user-role {
  font-size: 11px;
  color: rgba(255, 255, 255, 0.5);
  line-height: 1.3;
}
</style>
