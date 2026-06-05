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
