/** 处方状态 */
export type PrescriptionStatus =
  | 'draft'
  | 'pending'
  | 'approved'
  | 'dispensing'
  | 'delivering'
  | 'received'
  | 'rejected'
  | 'returned'

/** 处方药品项 */
export interface PrescriptionItem {
  _key?: string
  drugId: number
  drugName: string
  specification: string
  manufacturer: string
  dosage: string
  frequency: string
  days: number
  quantity: number
  unit: string
  insuranceType: string
  unitPrice: number
  totalPrice: number
  doctorAnnotation?: string
  remark?: string
}

/** 处方主记录 */
export interface Prescription {
  id: number
  prescriptionNo: string
  patientId: number
  patientName: string
  patient?: {
    name: string
    gender?: string
    age?: number
    phone?: string
    address?: string
    allergyHistory?: string
  }
  assistant?: { name: string }
  courier?: { name: string; phone: string }
  diagnosis: string
  status: PrescriptionStatus
  items: PrescriptionItem[]
  timeline?: { id: number; time: string; action: string; detail?: string; operator?: string; operatorName?: string; createdAt: string; metadata?: Record<string, unknown> }[]
  trackingNo?: string
  deliveryMethod?: string
  deliveryProof?: string
  estimatedDelivery?: string
  createdAt: string
  updatedAt: string
  submittedAt?: string
  approvedAt?: string
  rejectedAt?: string
  rejectedReason?: string
  rejectedType?: string
  rejectionReason?: string
  rejectionType?: string
  deliveredAt?: string
  receivedAt?: string
  createdByName?: string
  approvedByName?: string
  totalPrice?: number
  note?: string
  exception?: { type: string; description: string; photo?: string; createdAt?: string }
  _waitHours?: number
  _waitMinutes?: number
}

/** 处方查询参数 */
export interface PrescriptionQuery {
  page?: number
  pageSize?: number
  status?: string
  patientName?: string
  dateFrom?: string
  dateTo?: string
}

/** 创建处方参数 */
export interface PrescriptionCreateParams {
  patientId: number | null
  diagnosis: string
  items: { drugName: string; specification: string; dosage: string; frequency: string; days: number; remark: string }[]
  note?: string
}

/** 更新处方草稿参数 */
export interface PrescriptionUpdateParams {
  patientId?: number | null
  diagnosis?: string
  items?: { drugName: string; specification: string; dosage: string; frequency: string; days: number; remark: string }[]
  note?: string
}

/** 处方模板 */
export interface PrescriptionTemplate {
  id: number
  name: string
  diagnosis: string
  items: PrescriptionItem[]
}

/** 驳回模板 */
export interface RejectionTemplate {
  id: number
  type: string
  reason: string
  name?: string
  content?: string
}
