/** 发药队列项 */
export interface DispensingQueueItem {
  prescriptionId: number
  prescriptionNo: string
  patientName: string
  diagnosis: string
  drugNames: string
  approvedAt: string
  waitMinutes: number
  urgent: boolean
}

/** 发药统计数据 */
export interface DispensingStats {
  pendingCount: number
  todayCompleted: number
  stockAlertCount: number
  overdueCount: number
}

/** 发药完成参数 */
export interface DispensingCompleteParams {
  batches: Record<number, number>
  pharmacistNote?: string
}
