import { Prisma, PrismaClient } from '@prisma/client'
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
  return prisma.patientAllergy.create({
    data: {
      patientId: data.patientId,
      allergenId: data.allergenId,
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

    return tx.patientAllergy.update({
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
  })
}

export async function deletePatientAllergy(id: number) {
  return prisma.patientAllergy.delete({ where: { id } })
}

export async function setPin(id: number, pinned: boolean) {
  return prisma.$transaction(async (tx) => {
    const record = await tx.patientAllergy.findUnique({ where: { id } })
    if (!record) throw new Error('记录不存在')

    if (pinned) {
      const pinnedCount = await tx.patientAllergy.count({ where: { pinned: true } })
      if (pinnedCount >= 10) {
        throw new Error('置顶最多 10 条，请先取消其他置顶')
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

export async function updateSortOrders(orders: { id: number; sortOrder: number }[]) {
  try {
    await Promise.all(
      orders.map(({ id, sortOrder }) =>
        prisma.patientAllergy.update({ where: { id }, data: { sortOrder } })
      )
    )
    return { success: true }
  } catch (e) {
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
      throw new Error('部分记录不存在')
    }
    throw e
  }
}
