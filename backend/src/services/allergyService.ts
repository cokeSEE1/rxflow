import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'
const prisma = new PrismaClient()

export async function listPatientAllergies(query: any) {
  const where: any = {}

  if (query.patientName) {
    where.patient = { name: { contains: query.patientName } }
  }

  if (query.allergenName) {
    where.allergen = { name: { contains: query.allergenName } }
  }

  if (query.severity) {
    where.severity = query.severity
  }

  const page = parseInt(query.page) || 1
  const pageSize = parseInt(query.pageSize) || 20

  const [data, total] = await Promise.all([
    prisma.patientAllergy.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        allergen: { select: { id: true, name: true, category: true } },
        images: { select: { id: true, name: true, url: true } },
      },
      orderBy: [
        { pinned: 'desc' },
        { sortOrder: 'asc' },
        { createdAt: 'desc' },
      ],
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
      images: { select: { id: true, name: true, url: true } },
    },
  })
}

export async function createPatientAllergy(data: {
  patientId: number
  allergenId: number
  severity?: string
  remark?: string
  source?: string
  pinned?: boolean
  images?: { name: string; url: string }[]
}) {
  const allergenId = Number(data.allergenId)
  if (!allergenId) {
    throw new AppError(400, '过敏原ID不能为空')
  }

  let patientId: number
  const rawPatient = data.patientId as any

  if (!rawPatient) {
    throw new AppError(400, '患者ID或姓名不能为空')
  }

  if (/^\d+$/.test(String(rawPatient))) {
    patientId = Number(rawPatient)
  } else {
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
        pinned: data.pinned || false,
        images: data.images ? {
          create: data.images,
        } : undefined,
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        allergen: { select: { id: true, name: true, category: true } },
        images: { select: { id: true, name: true, url: true } },
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
    pinned?: boolean
    sortOrder?: number
    images?: { name: string; url: string }[]
  },
) {
  return prisma.$transaction(async (tx) => {
    if (data.images !== undefined) {
      await tx.allergyImage.deleteMany({ where: { patientAllergyId: id } })
    }

    try {
      return await tx.patientAllergy.update({
        where: { id },
        data: {
          patientId: data.patientId,
          allergenId: data.allergenId,
          severity: data.severity,
          remark: data.remark,
          source: data.source,
          pinned: data.pinned,
          sortOrder: data.sortOrder,
          images: data.images ? { create: data.images } : undefined,
        },
        include: {
          patient: { select: { id: true, name: true, phone: true } },
          allergen: { select: { id: true, name: true, category: true } },
          images: { select: { id: true, name: true, url: true } },
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
  })
}

export async function deletePatientAllergy(id: number) {
  return prisma.patientAllergy.delete({ where: { id } })
}

export async function setPin(id: number, pinned: boolean) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.patientAllergy.findUnique({ where: { id } })
    if (!record) throw new AppError(404, '记录不存在')

    if (pinned) {
      const pinnedCount = await tx.patientAllergy.count({ where: { pinned: true } })
      if (pinnedCount >= 10) {
        throw new AppError(400, '置顶最多 10 条，请先取消其他置顶')
      }
    }

    return tx.patientAllergy.update({
      where: { id },
      data: {
        pinned,
        sortOrder: pinned ? 999 : 0,
      },
      include: {
        patient: { select: { id: true, name: true, phone: true } },
        allergen: { select: { id: true, name: true, category: true } },
        images: { select: { id: true, name: true, url: true } },
      },
    })
  })
}

export async function getAllergyStats() {
  const [severityGroups, allergenGroups, total] = await Promise.all([
    prisma.patientAllergy.groupBy({
      by: ['severity'],
      _count: { id: true },
      where: { severity: { not: null } },
    }),
    prisma.patientAllergy.groupBy({
      by: ['allergenId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
      take: 8,
    }),
    prisma.patientAllergy.count(),
  ])

  const severityMap: Record<string, number> = {}
  severityGroups.forEach((g) => {
    if (g.severity) severityMap[g.severity] = g._count.id
  })

  const allergenIds = allergenGroups.map((g) => g.allergenId)
  const allergens = await prisma.allergen.findMany({
    where: { id: { in: allergenIds } },
    select: { id: true, name: true },
  })
  const allergenNameMap = new Map(allergens.map((a) => [a.id, a.name]))

  const topAllergens = allergenGroups.map((g) => ({
    name: allergenNameMap.get(g.allergenId) || '未知',
    count: g._count.id,
  }))

  return {
    severe: severityMap['severe'] || 0,
    moderate: severityMap['moderate'] || 0,
    mild: severityMap['mild'] || 0,
    total,
    topAllergens,
  }
}

export async function updateSortOrders(orders: { id: number; sortOrder: number }[]) {
  try {
    await Promise.all(
      orders.map(({ id, sortOrder }) =>
        prisma.patientAllergy.update({ where: { id }, data: { sortOrder } })
      )
    )
    return { success: true }
  } catch (e: any) {
    if (e?.code === 'P2025') {
      throw new AppError(404, '部分记录不存在')
    }
    throw e
  }
}
