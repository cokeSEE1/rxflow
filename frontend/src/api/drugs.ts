import client from './client'
import type { DrugQuery, Drug, DrugSearchResult } from '@/types'

export type { DrugQuery, Drug, DrugSearchResult }

export function searchDrugs(query: DrugQuery) {
  return client.get('/drugs/search', { params: query }).then((r) => r.data)
}

export function getDrug(id: number) {
  return client.get(`/drugs/${id}`).then((r) => r.data)
}

export function listDrugs(query: DrugQuery = {}) {
  return client.get('/drugs', { params: query }).then((r) => r.data)
}

// --- 患者过敏档案 ---
export interface PatientAllergyQuery {
  patientName?: string
  allergenName?: string
  page?: number
  pageSize?: number
}

export interface PatientAllergyItem {
  id: number
  patientId: number
  allergenId: number
  severity: string
  remark: string
  source: string
  pinned: boolean
  sortOrder: number
  createdAt: string
  patient: { id: number; name: string; phone: string }
  allergen: { id: number; name: string; category: string }
  images?: { id: number; name: string; url: string }[]
}

export function listPatientAllergies(query: PatientAllergyQuery = {}) {
  return client.get<{ data: PatientAllergyItem[]; total: number; page: number; pageSize: number }>('/patient-allergies', { params: query }).then((r) => r.data)
}

export function getPatientAllergy(id: number) {
  return client.get<PatientAllergyItem>(`/patient-allergies/${id}`).then((r) => r.data)
}

export interface CreatePatientAllergyBody {
  patientId: number
  allergenId: number
  severity?: string
  remark?: string
  source?: string
}

export function createPatientAllergy(body: CreatePatientAllergyBody) {
  return client.post('/patient-allergies', body).then((r) => r.data)
}

export interface UpdatePatientAllergyBody {
  patientId?: number
  allergenId?: number
  severity?: string
  remark?: string
  source?: string
}

export function updatePatientAllergy(id: number, body: UpdatePatientAllergyBody) {
  return client.put(`/patient-allergies/${id}`, body).then((r) => r.data)
}

export function deletePatientAllergy(id: number) {
  return client.delete(`/patient-allergies/${id}`).then((r) => r.data)
}

export function setPatientAllergyPin(id: number, pinned: boolean) {
  return client.patch(`/patient-allergies/${id}/pin`, { pinned }).then((r) => r.data)
}

export function updatePatientAllergySortOrders(orders: { id: number; sortOrder: number }[]) {
  return client.put('/patient-allergies/sort-orders', { orders }).then((r) => r.data)
}

// --- 过敏原字典 ---
export interface Allergen {
  id: number
  name: string
  category: string
  description: string
  createdAt: string
}

export function createAllergen(data: { name: string; category: string; description?: string }) {
  return client.post<Allergen>('/allergens', data).then((r) => r.data)
}

export function updateAllergen(id: number, data: { name?: string; category?: string; description?: string }) {
  return client.put<Allergen>(`/allergens/${id}`, data).then((r) => r.data)
}

export function deleteAllergen(id: number) {
  return client.delete(`/allergens/${id}`).then((r) => r.data)
}
