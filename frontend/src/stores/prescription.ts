import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/prescriptions'
import type { PrescriptionQuery, Prescription, PrescriptionCreateParams, PrescriptionUpdateParams } from '@/types'

export const usePrescriptionStore = defineStore('prescription', () => {
  const list = ref<Prescription[]>([])
  const current = ref<Prescription | null>(null)
  const total = ref(0)
  const loading = ref(false)

  async function fetchList(query: PrescriptionQuery = {}) {
    loading.value = true
    try {
      const result = await api.listPrescriptions(query)
      list.value = result.data
      total.value = result.total
      return result
    } finally { loading.value = false }
  }

  async function fetchDetail(id: number) {
    current.value = await api.getPrescription(id)
    return current.value
  }

  async function create(data: PrescriptionCreateParams) {
    return api.createPrescription(data)
  }

  async function update(id: number, data: PrescriptionUpdateParams) {
    return api.updateDraft(id, data)
  }

  async function remove(id: number) {
    await api.deleteDraft(id)
    await fetchList()
  }

  async function submit(id: number) {
    await api.submitForReview(id)
    await fetchList()
  }

  async function approve(id: number) {
    await api.approve(id)
    await fetchDetail(id)
  }

  async function reject(id: number, reason: string, type: string) {
    await api.reject(id, reason, type)
    await fetchDetail(id)
  }

  async function revoke(id: number, reason: string) {
    await api.revokeApproval(id, reason)
    await fetchDetail(id)
  }

  async function pickup(id: number) {
    await api.pickup(id)
    await fetchDetail(id)
  }

  async function deliver(id: number, proof: string) {
    await api.confirmDelivery(id, proof)
    await fetchDetail(id)
  }

  async function reportEx(id: number, exType: string, desc: string, photo?: string) {
    await api.reportException(id, exType, desc, photo)
    await fetchDetail(id)
  }

  async function requestRedeliver(id: number, reason: string) {
    await api.requestRedelivery(id, reason)
    await fetchDetail(id)
  }

  return { list, current, total, loading, fetchList, fetchDetail, create, update, remove, submit, approve, reject, revoke, pickup, deliver, reportEx, requestRedeliver }
})
