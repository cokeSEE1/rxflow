import client from './client'
import type { ConsultationQuery, ConsultationCreateParams, ConsultationUpdateParams } from '@/types'

export function listConsultations(query: ConsultationQuery = {}) {
  return client.get('/consultations', { params: query }).then((r) => r.data)
}
export function getConsultation(id: number) {
  return client.get(`/consultations/${id}`).then((r) => r.data)
}
export function createConsultation(data: ConsultationCreateParams) {
  return client.post('/consultations', data).then((r) => r.data)
}
export function updateConsultation(id: number, data: ConsultationUpdateParams) {
  return client.put(`/consultations/${id}`, data).then((r) => r.data)
}
export function completeConsultation(id: number) {
  return client.post(`/consultations/${id}/complete`).then((r) => r.data)
}
export function startConsultation(id: number) {
  return client.post(`/consultations/${id}/start`).then((r) => r.data)
}
export function getConsultationPrescriptions(id: number) {
  return client.get(`/consultations/${id}/prescriptions`).then((r) => r.data)
}
