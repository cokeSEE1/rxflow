import client from './client'
import type { PrescriptionQuery, PrescriptionCreateParams, PrescriptionUpdateParams } from '@/types'

export type { PrescriptionQuery }

export function listPrescriptions(query: PrescriptionQuery) {
  return client.get('/prescriptions', { params: query }).then((r) => r.data)
}
export function getPrescription(id: number) {
  return client.get(`/prescriptions/${id}`).then((r) => r.data)
}
export function createPrescription(data: PrescriptionCreateParams) {
  return client.post('/prescriptions', data).then((r) => r.data)
}
export function updateDraft(id: number, data: PrescriptionUpdateParams) {
  return client.put(`/prescriptions/${id}`, data).then((r) => r.data)
}
export function deleteDraft(id: number) {
  return client.delete(`/prescriptions/${id}`).then((r) => r.data)
}
export function submitForReview(id: number) {
  return client.post(`/prescriptions/${id}/submit`).then((r) => r.data)
}
export function approve(id: number) {
  return client.post(`/prescriptions/${id}/approve`).then((r) => r.data)
}
export function reject(id: number, reason: string, type: string) {
  return client.post(`/prescriptions/${id}/reject`, { reason, type }).then((r) => r.data)
}
export function revokeApproval(id: number, reason: string) {
  return client.post(`/prescriptions/${id}/revoke`, { reason }).then((r) => r.data)
}
export function pickup(id: number) {
  return client.post(`/prescriptions/${id}/pickup`).then((r) => r.data)
}
export function confirmDelivery(id: number, proof: string) {
  return client.post(`/prescriptions/${id}/deliver`, { proof }).then((r) => r.data)
}
export function reportException(id: number, exType: string, desc: string, photo?: string) {
  return client.post(`/prescriptions/${id}/exception`, { exType, desc, photo }).then((r) => r.data)
}
export function requestRedelivery(id: number, reason: string) {
  return client.post(`/prescriptions/${id}/redeliver`, { reason }).then((r) => r.data)
}
export function getTemplates() {
  return client.get('/prescriptions/templates').then((r) => r.data)
}
export function saveTemplate(name: string, diagnosis: string, items: { drugName: string; specification: string; dosage: string; frequency: string; days: number; remark: string }[]) {
  return client.post('/prescriptions/templates', { name, diagnosis, items }).then((r) => r.data)
}
