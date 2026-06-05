import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

export async function listNotifications(userId: number, query: any) {
  const where: any = { userId }
  if (query.type) where.type = query.type
  if (query.isRead !== undefined) where.isRead = query.isRead === 'true'
  const page = parseInt(query.page) || 1
  const pageSize = parseInt(query.pageSize) || 20
  const [data, total, unreadCount] = await Promise.all([
    prisma.notification.findMany({ where, orderBy: { createdAt: 'desc' }, skip: (page - 1) * pageSize, take: pageSize }),
    prisma.notification.count({ where }),
    prisma.notification.count({ where: { userId, isRead: false } }),
  ])
  return { data, total, unreadCount }
}

export async function markAsRead(id: number, userId: number) {
  return prisma.notification.updateMany({ where: { id, userId }, data: { isRead: true } })
}

export async function markAllRead(userId: number) {
  return prisma.notification.updateMany({ where: { userId, isRead: false }, data: { isRead: true } })
}

export async function createNotification(data: { userId: number; type: string; title: string; content: string; prescriptionId?: number }) {
  return prisma.notification.create({ data })
}
