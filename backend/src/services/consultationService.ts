import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'
const prisma = new PrismaClient()

export async function listConsultations(query: any) {
  const where: any = {}
  if (query.status) where.status = query.status
  if (query.patientName) where.patient = { name: { contains: query.patientName } }
  if (query.doctorId) where.doctorId = parseInt(query.doctorId)
  const page = Math.max(1, parseInt(query.page) || 1)
  const pageSize = Math.max(1, Math.min(100, parseInt(query.pageSize) || 20))
  const [data, total] = await Promise.all([
    prisma.consultation.findMany({
      where,
      include: { patient: true, doctor: { select: { id: true, name: true } }, _count: { select: { prescriptions: true } } },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.consultation.count({ where }),
  ])
  return { data, total, page, pageSize }
}

export async function getConsultation(id: number) {
  const c = await prisma.consultation.findUnique({
    where: { id },
    include: {
      patient: true,
      doctor: { select: { id: true, name: true } },
      registration: true,
      prescriptions: { select: { id: true, prescriptionNo: true, status: true, createdAt: true } },
    },
  })
  if (!c) throw new AppError(404, '问诊记录不存在')
  return c
}

export async function createConsultation(data: {
  patientId: number
  doctorId: number
  chiefComplaint: string
  diagnosis: string
  registrationId?: number
  icdCode?: string
}) {
  if (!data.patientId) throw new AppError(400, '患者ID不能为空')
  if (!data.chiefComplaint || !data.chiefComplaint.trim()) throw new AppError(400, '主诉不能为空')
  if (!data.diagnosis || !data.diagnosis.trim()) throw new AppError(400, '诊断结论不能为空')

  const patient = await prisma.patient.findUnique({ where: { id: data.patientId } })
  if (!patient) throw new AppError(404, '患者不存在')

  if (data.registrationId) {
    const registration = await prisma.registration.findUnique({ where: { id: data.registrationId } })
    if (!registration) throw new AppError(404, '挂号记录不存在')
  }

  return prisma.consultation.create({
    data: {
      ...data,
      status: 'draft',
      stepsCompleted: ['chiefComplaint', 'diagnosis'],
    },
  })
}

export async function updateConsultation(id: number, doctorId: number, data: any) {
  const c = await prisma.consultation.findUnique({ where: { id } })
  if (!c) throw new AppError(404, '问诊记录不存在')
  if (c.doctorId !== doctorId) throw new AppError(403, '只能操作自己的问诊记录')
  if (c.status === 'completed') throw new AppError(400, '已完诊的记录不可修改')

  // Build stepsCompleted from provided fields
  const steps: string[] = ['chiefComplaint', 'diagnosis']
  if (data.presentIllness) steps.push('presentIllness')
  if (data.pastHistory) steps.push('pastHistory')
  if (data.physicalExam) steps.push('physicalExam')
  if (data.auxiliaryExam) steps.push('auxiliaryExam')
  if (data.treatmentPlan) steps.push('treatmentPlan')

  return prisma.consultation.update({
    where: { id },
    data: { ...data, stepsCompleted: steps },
  })
}

export async function completeConsultation(id: number, doctorId: number) {
  const c = await prisma.consultation.findUnique({ where: { id } })
  if (!c) throw new AppError(404, '问诊记录不存在')
  if (c.doctorId !== doctorId) throw new AppError(403, '只能操作自己的问诊记录')
  if (c.status === 'draft') throw new AppError(400, '草稿状态请先开始问诊再完诊')
  if (c.status === 'completed') throw new AppError(400, '该问诊已完诊')
  return prisma.consultation.update({
    where: { id },
    data: { status: 'completed', completedAt: new Date() },
  })
}

export async function startConsultation(id: number, doctorId: number) {
  const c = await prisma.consultation.findUnique({ where: { id } })
  if (!c) throw new AppError(404, '问诊记录不存在')
  if (c.doctorId !== doctorId) throw new AppError(403, '只能操作自己的问诊记录')
  if (c.status !== 'draft') throw new AppError(400, '当前状态不可开始问诊')
  return prisma.consultation.update({
    where: { id },
    data: { status: 'in_progress' },
  })
}

export async function getConsultationPrescriptions(consultationId: number) {
  return prisma.prescription.findMany({
    where: { consultationId },
    include: { patient: true },
    orderBy: { createdAt: 'desc' },
  })
}
