/** 药品查询参数 */
export interface DrugQuery {
  keyword?: string
  page?: number
  pageSize?: number
}

/** 药品基本信息 */
export interface Drug {
  id: number
  name: string
  spec: string
  maker: string
  insurance: string
  price: number
  unit: string
  pinyinInitial: string
  searchCode: string
}

/** 药品搜索结果（含过敏风险） */
export interface DrugSearchResult extends Drug {
  allergyRisk?: 'severe' | 'moderate' | 'compatible' | null
  allergenName?: string
}

/** 已选药品（DrugSelector 中选中的药品表单状态） */
export interface SelectedDrug {
  drugId: number
  drugName: string
  dosage: string
  freq: string
  days: number
  allergyRisk?: 'severe' | 'moderate' | 'compatible' | null
  allergenName?: string
  insurance?: string
  price?: number
  unit?: string
}
