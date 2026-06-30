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
