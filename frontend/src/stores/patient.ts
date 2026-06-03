import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/patients'

export const usePatientStore = defineStore('patient', () => {
  const list = ref<any[]>([])
  const total = ref(0)
  async function fetchList(query: any = {}) {
    const result = await api.listPatients(query)
    list.value = result.data
    total.value = result.total
  }
  async function create(data: any) { return api.createPatient(data) }
  async function update(id: number, data: any) { return api.updatePatient(id, data) }
  async function remove(id: number) { await api.deletePatient(id); await fetchList() }
  return { list, total, fetchList, create, update, remove }
})
