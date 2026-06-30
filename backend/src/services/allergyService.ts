import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'
const prisma = new PrismaClient()

export async function listPatientAllergies(query: any) {
  const where: any = {}

  // 支持按患者姓名搜索
  if (query.patientName) {
    where.patient = { name: { contains: query.patientName } }
  }

  // 支持按过敏原名称搜索
  if (query.allergenName) {
    where.allergen = { name: { contains: query.allergenName } }
  }

  const page = parseInt(query.page) || 1
  const pageSize = parseInt(query.pageSize) || 20

  const [data, total] = await Promise.all([
    prisma.patientAllergy.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        allergen: { select: { id: true, name: true, category: true } },
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.patientAllergy.count({ where }),
  ])

  return { data, total, page, pageSize }
}

export async function getPatientAllergy(id: number) {
  return prisma.patientAllergy.findUnique({
    where: { id },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      allergen: { select: { id: true, name: true, category: true } },
    },
  })
}

export async function createPatientAllergy(data: {
  patientId: number
  allergenId: number
  severity?: string
  remark?: string
  source?: string
}) {
  const allergenId = Number(data.allergenId)
  if (!allergenId) {
    throw new AppError(400, '过敏原ID不能为空')
  }

  let patientId: number
  const rawPatient = data.patientId as any // 接受数字或字符串名字

  if (!rawPatient) {
    throw new AppError(400, '患者ID或姓名不能为空')
  }

  // 纯数字 → 直接作为 patientId
  if (/^\d+$/.test(String(rawPatient))) {
    patientId = Number(rawPatient)
  } else {
    // 非数字 → 按姓名模糊匹配
    const patient = await prisma.patient.findFirst({
      where: { name: { contains: String(rawPatient) } },
    })
    if (!patient) {
      throw new AppError(404, `未找到患者「${rawPatient}」`)
    }
    patientId = patient.id
  }

  try {
    return await prisma.patientAllergy.create({
      data: {
        patientId,
        allergenId,
        severity: data.severity || null,
        remark: data.remark || null,
        source: data.source || 'manual',
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        allergen: { select: { id: true, name: true, category: true } },
      },
    })
  } catch (e: any) {
    if (e?.code === 'P2002') {
      throw new AppError(409, '该患者的此过敏原记录已存在')
    }
    throw e
  }
}

export async function updatePatientAllergy(
  id: number,
  data: {
    patientId?: number
    allergenId?: number
    severity?: string
    remark?: string
    source?: string
  },
) {
  const updateData: any = {}
  if (data.patientId !== undefined) updateData.patientId = Number(data.patientId)
  if (data.allergenId !== undefined) updateData.allergenId = Number(data.allergenId)
  if (data.severity !== undefined) updateData.severity = data.severity
  if (data.remark !== undefined) updateData.remark = data.remark
  if (data.source !== undefined) updateData.source = data.source

  try {
    return await prisma.patientAllergy.update({
      where: { id },
      data: updateData,
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        allergen: { select: { id: true, name: true, category: true } },
      },
    })
  } catch (e: any) {
    if (e?.code === 'P2025') {
      throw new AppError(404, '过敏档案记录不存在')
    }
    if (e?.code === 'P2002') {
      throw new AppError(409, '该患者的此过敏原记录已存在')
    }
    throw e
  }
}

export async function deletePatientAllergy(id: number) {
  return prisma.patientAllergy.delete({ where: { id } })
}
