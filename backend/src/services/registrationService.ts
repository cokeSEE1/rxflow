import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function listRegistrations(query: any) {
  const where: any = {}
  if (query.patientId) where.patientId = parseInt(query.patientId)
  if (query.doctorId) where.doctorId = parseInt(query.doctorId)
  if (query.department) where.department = query.department
  const page = parseInt(query.page) || 1
  const pageSize = parseInt(query.pageSize) || 20
  const [data, total] = await Promise.all([
    prisma.registration.findMany({
      where,
      include: { patient: true, doctor: { select: { id: true, name: true } } },
      orderBy: { registeredAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.registration.count({ where }),
  ])
  return { data, total, page, pageSize }
}

export async function getRegistration(id: number) {
  return prisma.registration.findUnique({
    where: { id },
    include: { patient: true, doctor: { select: { id: true, name: true } }, consultations: true },
  })
}

export async function createRegistration(data: { patientId: number; doctorId: number; department: string }) {
  return prisma.registration.create({ data })
}
