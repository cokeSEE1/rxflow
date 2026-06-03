import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function listPatients(query: any) {
  const where: any = {}
  if (query.name) where.name = { contains: query.name }
  if (query.phone) where.phone = { contains: query.phone }
  const page = parseInt(query.page) || 1
  const pageSize = parseInt(query.pageSize) || 20
  const [data, total] = await Promise.all([
    prisma.patient.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.patient.count({ where }),
  ])
  return { data, total }
}

export async function getPatient(id: number) { return prisma.patient.findUnique({ where: { id } }) }
export async function createPatient(data: any) { return prisma.patient.create({ data }) }
export async function updatePatient(id: number, data: any) { return prisma.patient.update({ where: { id }, data }) }
export async function deletePatient(id: number) { return prisma.patient.delete({ where: { id } }) }
