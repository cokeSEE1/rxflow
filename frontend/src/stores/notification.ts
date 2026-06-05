import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/notifications'
import type { Notification, NotificationQuery } from '@/types'

export const useNotificationStore = defineStore('notification', () => {
  const list = ref<Notification[]>([])
  const unreadCount = ref(0)
  async function fetchList(query: NotificationQuery = {}) {
    const result = await api.listNotifications(query)
    list.value = result.data
    unreadCount.value = result.unreadCount
  }
  async function markRead(id: number) { await api.markAsRead(id); unreadCount.value-- }
  async function markAll() { await api.markAllRead(); unreadCount.value = 0; await fetchList() }
  return { list, unreadCount, fetchList, markRead, markAll }
})
