import client from './client'
import type { DispensingQueueItem, DispensingStats, DispensingCompleteParams } from '@/types'

export type { DispensingQueueItem, DispensingStats, DispensingCompleteParams }

export function getDispensingQueue() {
  return client.get('/dispensing/queue').then((r) => r.data)
}

export function getDispensingStats() {
  return client.get('/dispensing/stats').then((r) => r.data)
}

export function startDispensing(prescriptionId: number) {
  return client.post(`/dispensing/${prescriptionId}/start`).then((r) => r.data)
}

export function completeDispensing(prescriptionId: number, data: DispensingCompleteParams) {
  return client.post(`/dispensing/${prescriptionId}/complete`, data).then((r) => r.data)
}
