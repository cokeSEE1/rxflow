/** 通知类型 */
export type NotificationType = 'approval' | 'rejection' | 'delivery' | 'exception' | 'status_change' | 'info'

/** 通知 */
export interface Notification {
  id: number
  type: NotificationType
  title: string
  content: string
  isRead: boolean
  createdAt: string
  relatedId?: number
  relatedType?: string
  prescriptionId?: number
}

/** 通知查询参数 */
export interface NotificationQuery {
  page?: number
  pageSize?: number
  unreadOnly?: boolean
  isRead?: boolean
}
