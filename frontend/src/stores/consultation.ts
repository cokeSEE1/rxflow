import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/consultations'
import type { Consultation, ConsultationQuery, ConsultationCreateParams, ConsultationUpdateParams } from '@/types'

export const useConsultationStore = defineStore('consultation', () => {
  const list = ref<Consultation[]>([])
  const current = ref<Consultation | null>(null)
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(query: ConsultationQuery = {}) {
    loading.value = true
    try {
      const result = await api.listConsultations(query)
      list.value = result.data
      total.value = result.total
      return result
    } finally { loading.value = false }
  }

  async function fetchDetail(id: number) {
    current.value = await api.getConsultation(id)
    return current.value
  }

  async function create(data: ConsultationCreateParams) {
    return api.createConsultation(data)
  }

  async function update(id: number, data: ConsultationUpdateParams) {
    const result = await api.updateConsultation(id, data)
    if (current.value && current.value.id === id) current.value = result
    return result
  }

  async function complete(id: number) {
    const result = await api.completeConsultation(id)
    if (current.value && current.value.id === id) current.value = result
    return result
  }

  async function start(id: number) {
    const result = await api.startConsultation(id)
    if (current.value && current.value.id === id) current.value = result
    return result
  }

  return { list, current, total, loading, fetchList, fetchDetail, create, update, complete, start }
})
