/** 通用分页响应 */
export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

/** 通用 API 响应 */
export interface ApiResponse<T> {
  data: T
  message?: string
}
