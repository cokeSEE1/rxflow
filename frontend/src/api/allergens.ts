import client from './client'

export interface Allergen {
  id: number
  name: string
  category: string
  description: string
  createdAt: string
}

export function listAllergens() {
  return client.get<{ data: Allergen[] }>('/allergens').then((r) => r.data)
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
