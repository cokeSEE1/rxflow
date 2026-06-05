import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/patients'
import type { Patient, PatientQuery, PatientCreateParams } from '@/types'

export const usePatientStore = defineStore('patient', () => {
  const list = ref<Patient[]>([])
  const total = ref(0)
  async function fetchList(query: PatientQuery = {}) {
    const result = await api.listPatients(query)
    list.value = result.data
    total.value = result.total
  }
  async function create(data: PatientCreateParams) { return api.createPatient(data) }
  async function update(id: number, data: Partial<PatientCreateParams>) { return api.updatePatient(id, data) }
  async function remove(id: number) { await api.deletePatient(id); await fetchList() }
  return { list, total, fetchList, create, update, remove }
})
