// 通用
export type { PaginatedResponse, ApiResponse } from './api'

// 用户 & 认证
export type { UserRole, LoginParams, LoginResult, UserInfo } from './user'

// 处方
export type {
  PrescriptionStatus,
  PrescriptionItem,
  Prescription,
  PrescriptionQuery,
  PrescriptionCreateParams,
  PrescriptionUpdateParams,
  PrescriptionTemplate, RejectionTemplate,
} from './prescription'

// 患者
export type { Patient, PatientQuery, PatientCreateParams } from './patient'

// 问诊
export type { ConsultationStatus, Consultation, ConsultationQuery, ConsultationCreateParams, ConsultationUpdateParams } from './consultation'

// 药品
export type { DrugQuery, Drug, DrugSearchResult, SelectedDrug } from './drug'

// 发药
export type { DispensingQueueItem, DispensingStats, DispensingCompleteParams } from './dispensing'

// 通知
export type { NotificationType, Notification, NotificationQuery } from './notification'
