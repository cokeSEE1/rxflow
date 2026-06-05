/** 患者基本信息 */
export interface Patient {
  id: number
  name: string
  gender: string
  age: number
  phone: string
  idCard?: string
  address?: string
  allergyHistory?: string
  createdAt: string
  updatedAt?: string
  createdByName?: string
}

/** 患者查询参数 */
export interface PatientQuery {
  page?: number
  pageSize?: number
  keyword?: string
  name?: string
  phone?: string
}

/** 创建/更新患者参数 */
export interface PatientCreateParams {
  name: string
  gender: string
  age: number
  phone: string
  idCard?: string
  address?: string
  allergyHistory?: string
}
