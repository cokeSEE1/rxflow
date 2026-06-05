import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/dispensing'
import type { DispensingQueueItem, DispensingStats } from '@/types'

export const useDispensingStore = defineStore('dispensing', () => {
  const queue = ref<DispensingQueueItem[]>([])
  const stats = ref<DispensingStats | null>(null)
  const loading = ref(false)

  async function fetchQueue() {
    loading.value = true
    try {
      const result = await api.getDispensingQueue()
      queue.value = result.data || []
      return result
    } finally {
      loading.value = false
    }
  }

  async function fetchStats() {
    const result = await api.getDispensingStats()
    stats.value = result.data || result
    return result
  }

  async function startDispensing(prescriptionId: number) {
    return api.startDispensing(prescriptionId)
  }

  return {
    queue,
    stats,
    loading,
    fetchQueue,
    fetchStats,
    startDispensing,
  }
})
