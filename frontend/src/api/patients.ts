import client from './client'
import type { PatientQuery, PatientCreateParams } from '@/types'

export function listPatients(query: PatientQuery) {
  return client.get('/patients', { params: query }).then((r) => r.data)
}
export function getPatient(id: number) {
  return client.get(`/patients/${id}`).then((r) => r.data)
}
export function createPatient(data: PatientCreateParams) {
  return client.post('/patients', data).then((r) => r.data)
}
export function updatePatient(id: number, data: Partial<PatientCreateParams>) {
  return client.put(`/patients/${id}`, data).then((r) => r.data)
}
export function deletePatient(id: number) {
  return client.delete(`/patients/${id}`).then((r) => r.data)
}
