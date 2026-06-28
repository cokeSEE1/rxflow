import { PrismaClient } from '@prisma/client'
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
  return prisma.patientAllergy.create({
    data: {
      patientId: data.patientId,
      allergenId: data.allergenId,
      severity: data.severity || null,
      remark: data.remark || null,
      source: data.source || 'manual',
    },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      allergen: { select: { id: true, name: true, category: true } },
    },
  })
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
  return prisma.patientAllergy.update({
    where: { id },
    data: {
      patientId: data.patientId,
      allergenId: data.allergenId,
      severity: data.severity,
      remark: data.remark,
      source: data.source,
    },
    include: {
      patient: { select: { id: true, name: true, phone: true } },
      allergen: { select: { id: true, name: true, category: true } },
    },
  })
}

export async function deletePatientAllergy(id: number) {
  return prisma.patientAllergy.delete({ where: { id } })
}
