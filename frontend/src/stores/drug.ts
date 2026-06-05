import { defineStore } from 'pinia'
import { ref } from 'vue'
import * as api from '@/api/drugs'
import type { Drug, DrugSearchResult } from '@/types'

export const useDrugStore = defineStore('drug', () => {
  const searchResults = ref<DrugSearchResult[]>([])
  const searchLoading = ref(false)
  const currentDrug = ref<Drug | null>(null)

  async function search(keyword: string) {
    searchLoading.value = true
    try {
      const result = await api.searchDrugs({ keyword, pageSize: 50 })
      searchResults.value = result.data || []
      return result
    } finally {
      searchLoading.value = false
    }
  }

  async function fetchDetail(id: number) {
    currentDrug.value = await api.getDrug(id)
    return currentDrug.value
  }

  function clearSearch() {
    searchResults.value = []
  }

  return {
    searchResults,
    searchLoading,
    currentDrug,
    search,
    fetchDetail,
    clearSearch,
  }
})
