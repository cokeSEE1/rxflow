import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'

const prisma = new PrismaClient()

export async function getDispensingQueue() {
  const prescriptions = await prisma.prescription.findMany({
    where: {
      status: 'approved',
      dispensingAt: null,
    },
    include: {
      patient: { select: { name: true } },
      items: {
        include: { drug: { select: { standardName: true } } },
      },
    },
    orderBy: { approvedAt: 'asc' },
  })

  const now = Date.now()

  return {
    data: prescriptions.map((p) => {
      const waitMs = p.approvedAt ? now - p.approvedAt.getTime() : 0
      const waitMinutes = Math.floor(waitMs / 60000)

      return {
        prescriptionId: p.id,
        prescriptionNo: p.prescriptionNo,
        patientName: p.patient.name,
        diagnosis: p.diagnosis,
        drugNames: p.items.map((i) => i.drug?.standardName || i.drugName).join('、'),
        approvedAt: p.approvedAt?.toISOString() || '',
        waitMinutes,
        urgent: waitMinutes > 60,
      }
    }),
  }
}

export async function getDispensingStats() {
  const now = new Date()
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const todayEnd = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)

  const [pendingCount, todayCompleted, stockAlertCount, overdueCount] = await Promise.all([
    prisma.prescription.count({
      where: { status: 'approved', dispensingAt: null },
    }),
    prisma.prescription.count({
      where: {
        status: 'approved',
        dispensedAt: { gte: todayStart, lt: todayEnd },
      },
    }),
    prisma.drugBatch.count({
      where: { quantity: { lt: 10 } },
    }),
    prisma.prescription.count({
      where: {
        status: 'approved',
        dispensingAt: null,
        approvedAt: { lt: new Date(now.getTime() - 60 * 60 * 1000) },
      },
    }),
  ])

  return {
    data: {
      pendingCount,
      todayCompleted,
      stockAlertCount,
      overdueCount,
    },
  }
}

export async function startDispensing(prescriptionId: number, pharmacistId: number) {
  const p = await prisma.prescription.findUnique({ where: { id: prescriptionId } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'approved') throw new AppError(400, '当前状态不可开始配药')

  const pharmacist = await prisma.user.findUnique({ where: { id: pharmacistId } })

  const result = await prisma.prescription.updateMany({
    where: {
      id: prescriptionId,
      status: 'approved',
      dispensingAt: null,
    },
    data: {
      pharmacistId,
      dispensingAt: new Date(),
    },
  })

  if (result.count === 0) {
    throw new AppError(400, '已有药师在处理此处方')
  }

  await Promise.all([
    prisma.prescriptionTimeline.create({
      data: {
        prescriptionId,
        action: 'dispensing_started',
        operatorId: pharmacistId,
        operatorName: pharmacist?.name || '',
        detail: '药剂师开始配药',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: pharmacistId,
        userName: pharmacist?.name || '',
        userRole: 'pharmacist',
        action: 'dispensing_start',
        resource: 'prescription',
        resourceId: prescriptionId,
        beforeState: 'approved',
        afterState: 'approved',
        result: 'success',
      },
    }),
  ])

  return { message: '已开始配药' }
}

export async function completeDispensing(
  prescriptionId: number,
  pharmacistId: number,
  data: { batches?: Record<string, number>; pharmacistNote?: string },
) {
  const p = await prisma.prescription.findUnique({
    where: { id: prescriptionId },
    include: { items: true },
  })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'approved') throw new AppError(400, '当前状态不可完成配药')
  if (!p.dispensingAt) throw new AppError(400, '请先开始配药')
  if (p.pharmacistId !== pharmacistId) throw new AppError(403, '只有当前配药师可以完成配药')

  const batches = data.batches || {}
  const pharmacist = await prisma.user.findUnique({ where: { id: pharmacistId } })

  await prisma.$transaction(async (tx) => {
    // Validate and decrement stock for each selected batch
    for (const [drugIdStr, qty] of Object.entries(batches)) {
      const drugId = parseInt(drugIdStr)
      if (qty <= 0) continue

      // Find batches for this drug ordered by FIFO (earliest expiry first)
      const drugBatches = await tx.drugBatch.findMany({
        where: { drugId, quantity: { gt: 0 } },
        orderBy: { expireDate: 'asc' },
      })

      if (drugBatches.length === 0) {
        throw new AppError(400, `药品 ID ${drugId} 没有可用批次`)
      }

      // Use the FIFO batch (first available)
      const batch = drugBatches[0]
      if (batch.quantity < qty) {
        throw new AppError(400, `批次 ${batch.batchNo} 库存不足`)
      }

      await tx.drugBatch.update({
        where: { id: batch.id },
        data: { quantity: batch.quantity - qty },
      })
    }

    // Update prescription items with pharmacist note
    if (data.pharmacistNote) {
      await tx.prescriptionItem.updateMany({
        where: { prescriptionId },
        data: { pharmacistNote: data.pharmacistNote },
      })
    }

    // Update prescription status
    await tx.prescription.update({
      where: { id: prescriptionId },
      data: {
        dispensedAt: new Date(),
      },
    })
  })

  await Promise.all([
    prisma.prescriptionTimeline.create({
      data: {
        prescriptionId,
        action: 'dispensed',
        operatorId: pharmacistId,
        operatorName: pharmacist?.name || '',
        detail: data.pharmacistNote ? `配药完成: ${data.pharmacistNote}` : '配药完成',
      },
    }),
    prisma.auditLog.create({
      data: {
        userId: pharmacistId,
        userName: pharmacist?.name || '',
        userRole: 'pharmacist',
        action: 'dispensing_complete',
        resource: 'prescription',
        resourceId: prescriptionId,
        beforeState: 'approved',
        afterState: 'approved',
        result: 'success',
      },
    }),
  ])

  return { message: '配药完成' }
}
