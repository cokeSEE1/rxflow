export type ConsultationStatus = 'draft' | 'in_progress' | 'completed'

export interface Consultation {
  id: number
  patientId: number
  patient?: { id: number; name: string; gender: string; age: number; phone: string }
  doctorId: number
  doctor?: { id: number; name: string }
  registrationId?: number
  chiefComplaint: string
  presentIllness?: string
  pastHistory?: string
  physicalExam?: string
  auxiliaryExam?: string
  diagnosis: string
  icdCode?: string
  treatmentPlan?: string
  status: ConsultationStatus
  stepsCompleted: string[]
  completedAt?: string
  createdAt: string
  _count?: { prescriptions: number }
}

export interface ConsultationQuery {
  patientName?: string
  status?: ConsultationStatus
  doctorId?: number
  page?: number
  pageSize?: number
}

export interface ConsultationCreateParams {
  patientId: number
  chiefComplaint: string
  diagnosis: string
  icdCode?: string
  registrationId?: number
}

export interface ConsultationUpdateParams {
  presentIllness?: string
  pastHistory?: string
  physicalExam?: string
  auxiliaryExam?: string
  treatmentPlan?: string
}
