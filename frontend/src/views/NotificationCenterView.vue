<template>
  <div class="notification-center">
    <!-- Page Header -->
    <div class="page-header">
      <div class="header-left">
        <h2 class="page-title">通知中心</h2>
        <span v-if="store.unreadCount" class="unread-badge">{{ store.unreadCount }} 条未读</span>
      </div>
      <el-button
        type="primary"
        :disabled="!store.unreadCount"
        @click="handleMarkAll"
      >
        全部标为已读
      </el-button>
    </div>

    <!-- Filter Tabs -->
    <div class="filter-tabs">
      <el-radio-group
        v-model="activeFilter"
        size="default"
        @change="handleFilterChange"
      >
        <el-radio-button value="all">全部</el-radio-button>
        <el-radio-button value="unread">
          未读
          <span v-if="store.unreadCount" class="tab-count">({{ store.unreadCount }})</span>
        </el-radio-button>
        <el-radio-button value="read">已读</el-radio-button>
      </el-radio-group>
    </div>

    <!-- Notification List -->
    <div v-if="store.list.length" class="notification-list">
      <div
        v-for="item in store.list"
        :key="item.id"
        :class="['notification-item', { unread: !item.isRead }]"
        @click="handleItemClick(item)"
      >
        <!-- Type Icon -->
        <div class="item-icon">
          <span :title="typeLabel(item.type)">{{ typeIcon(item.type) }}</span>
        </div>

        <!-- Content -->
        <div class="item-body">
          <div class="item-title" :class="{ bold: !item.isRead }">
            {{ item.title }}
          </div>
          <div class="item-content">{{ item.content }}</div>
          <div class="item-time">{{ relativeTime(item.createdAt) }}</div>
        </div>

        <!-- Actions -->
        <div class="item-actions">
          <span v-if="!item.isRead" class="unread-dot" />
          <el-button
            v-if="!item.isRead"
            text
            size="small"
            type="primary"
            @click.stop="handleMarkOne(item)"
          >
            标为已读
          </el-button>
        </div>
      </div>
    </div>

    <!-- Empty State -->
    <el-empty v-else :description="emptyDescription" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { useNotificationStore } from '@/stores/notification'

const router = useRouter()
const store = useNotificationStore()

const activeFilter = ref<string>('all')

const emptyDescription = computed(() => {
  switch (activeFilter.value) {
    case 'unread': return '没有未读通知'
    case 'read': return '没有已读通知'
    default: return '暂无通知'
  }
})

function typeIcon(type: string): string {
  const map: Record<string, string> = {
    review: '📋',
    approved: '✅',
    rejected: '❌',
    delivery: '📦',
    delivering: '🚚',
    received: '📬',
    returned: '↩️',
    system: '🔔',
  }
  return map[type] || '📌'
}

function typeLabel(type: string): string {
  const map: Record<string, string> = {
    review: '审核',
    approved: '审核通过',
    rejected: '驳回',
    delivery: '配送',
    delivering: '配送中',
    received: '已签收',
    returned: '退回',
    system: '系统',
  }
  return map[type] || type
}

function relativeTime(dateStr: string): string {
  if (!dateStr) return ''
  const now = Date.now()
  const then = new Date(dateStr).getTime()
  const diff = now - then
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return '刚刚'
  if (minutes < 60) return `${minutes}分钟前`
  if (hours < 24) return `${hours}小时前`
  if (days < 7) return `${days}天前`

  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

function handleFilterChange() {
  switch (activeFilter.value) {
    case 'unread':
      store.fetchList({ isRead: false })
      break
    case 'read':
      store.fetchList({ isRead: true })
      break
    default:
      store.fetchList()
  }
}

async function handleMarkOne(item: any) {
  await store.markRead(item.id)
  ElMessage.success('已标为已读')
  if (activeFilter.value === 'unread') {
    store.fetchList({ isRead: false })
  } else if (activeFilter.value === 'all') {
    store.fetchList()
  }
}

async function handleMarkAll() {
  await store.markAll()
  ElMessage.success('全部标为已读')
}

function handleItemClick(item: any) {
  if (!item.isRead) {
    store.markRead(item.id)
  }
  if (item.prescriptionId) {
    router.push(`/prescriptions/${item.prescriptionId}`)
  }
}

onMounted(() => {
  store.fetchList()
})
</script>

<style scoped>
.notification-center {
  max-width: 1000px;
}

/* Page Header */
.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.page-title {
  font-family: 'DM Serif Display', serif;
  font-size: 24px;
  font-weight: 400;
  color: var(--warm-900);
}

.unread-badge {
  font-size: 13px;
  color: var(--coral);
  background: #fef2f2;
  padding: 2px 10px;
  border-radius: 12px;
}

/* Filter Tabs */
.filter-tabs {
  margin-bottom: 20px;
}

:deep(.el-radio-group) {
  background: var(--warm-100);
  border-radius: 8px;
  padding: 4px;
}

:deep(.el-radio-button__inner) {
  border: none;
  background: transparent;
  color: var(--warm-700);
  border-radius: 6px;
  padding: 6px 18px;
  font-size: 14px;
  box-shadow: none;
  transition: all 0.2s;
}

:deep(.el-radio-button.is-active .el-radio-button__inner) {
  background: #fff;
  color: var(--teal-700);
  font-weight: 600;
  box-shadow: var(--shadow-sm);
}

.tab-count {
  font-weight: 400;
  opacity: 0.7;
}

/* Notification List */
.notification-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Notification Item */
.notification-item {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  padding: 16px 20px;
  background: #fff;
  border-radius: 10px;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
  box-shadow: var(--shadow-sm);
  border: 1px solid transparent;
}

.notification-item:hover {
  background: var(--warm-50);
  box-shadow: var(--shadow-md);
}

.notification-item.unread {
  background: var(--warm-50);
  border-left: 3px solid #3b82f6;
  border-radius: 10px;
}

/* Type Icon */
.item-icon {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 22px;
  background: var(--warm-100);
  border-radius: 10px;
  margin-top: 2px;
}

/* Body */
.item-body {
  flex: 1;
  min-width: 0;
}

.item-title {
  font-size: 15px;
  font-weight: 500;
  color: var(--warm-900);
  margin-bottom: 4px;
}

.item-title.bold {
  font-weight: 600;
}

.item-content {
  font-size: 13px;
  color: var(--warm-700);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 6px;
  line-height: 1.4;
}

.item-time {
  font-size: 12px;
  color: #909399;
}

/* Actions */
.item-actions {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 2px;
}

.unread-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: #3b82f6;
  flex-shrink: 0;
}
</style>
