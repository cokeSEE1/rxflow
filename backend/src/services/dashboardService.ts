import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function getDashboardStats(userId: number, role: string) {
  if (role === 'assistant') {
    const [draft, pending, rejected, todayApproved] = await Promise.all([
      prisma.prescription.count({ where: { assistantId: userId, status: 'draft' } }),
      prisma.prescription.count({ where: { assistantId: userId, status: 'pending' } }),
      prisma.prescription.count({ where: { assistantId: userId, status: 'rejected' } }),
      prisma.prescription.count({
        where: {
          assistantId: userId,
          status: { in: ['approved', 'delivering', 'received'] },
          submittedAt: { gte: new Date(new Date().toDateString()) },
        },
      }),
    ])
    return { draft, pending, rejected, todayApproved }
  }
  if (role === 'doctor') {
    const today = new Date(new Date().toDateString())
    const [pending, todayReviewed, rejected] = await Promise.all([
      prisma.prescription.count({ where: { status: 'pending' } }),
      prisma.prescription.count({
        where: {
          doctorId: userId,
          approvedAt: { gte: today },
        },
      }),
      prisma.prescription.count({ where: { status: 'rejected' } }),
    ])
    return { pending, todayReviewed, rejected }
  }
  if (role === 'courier') {
    const today = new Date(new Date().toDateString())
    const [toPickup, delivering, todayDelivered] = await Promise.all([
      prisma.prescription.count({ where: { status: 'approved' } }),
      prisma.prescription.count({ where: { courierId: userId, status: 'delivering' } }),
      prisma.prescription.count({
        where: {
          courierId: userId,
          status: 'received',
          deliveredAt: { gte: today },
        },
      }),
    ])
    return { toPickup, delivering, todayDelivered }
  }
  if (role === 'patient') {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { myPrescriptions: 0, delivering: 0 }
    const patient = await prisma.patient.findFirst({ where: { phone: user.phone } })
    if (!patient) return { myPrescriptions: 0, delivering: 0 }
    const [total, delivering] = await Promise.all([
      prisma.prescription.count({ where: { patientId: patient.id } }),
      prisma.prescription.count({ where: { patientId: patient.id, status: 'delivering' } }),
    ])
    return { myPrescriptions: total, delivering }
  }
  return {}
}

export async function getPendingQueue(sortBy: string = 'waitTime') {
  const list = await prisma.prescription.findMany({
    where: { status: 'pending' },
    include: {
      patient: { select: { name: true } },
      assistant: { select: { name: true } },
    },
  })

  if (sortBy === 'waitTime') {
    list.sort((a, b) => {
      const aTime = a.submittedAt?.getTime() || a.createdAt.getTime()
      const bTime = b.submittedAt?.getTime() || b.createdAt.getTime()
      return aTime - bTime
    })
    list.forEach((p: any) => {
      const submitTime = p.submittedAt?.getTime() || p.createdAt.getTime()
      p.waitHours = Math.round((Date.now() - submitTime) / (1000 * 60 * 60))
    })
  }

  return list
}
