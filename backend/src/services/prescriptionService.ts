import { PrismaClient } from '@prisma/client'
import { AppError } from '../middleware/errorHandler'
import { generatePrescriptionNo } from '../utils/prescriptionNo'

const prisma = new PrismaClient()

function getListFilter(role: string, userId: number, query: any) {
  const where: any = {}
  if (role === 'assistant') where.assistantId = userId
  if (query.status) where.status = { in: query.status.split(',') }
  if (query.patientName) where.patient = { name: { contains: query.patientName } }
  if (query.dateFrom || query.dateTo) {
    where.createdAt = {}
    if (query.dateFrom) where.createdAt.gte = new Date(query.dateFrom)
    if (query.dateTo) where.createdAt.lte = new Date(query.dateTo + 'T23:59:59')
  }
  return where
}

export async function listPrescriptions(role: string, userId: number, query: any) {
  const where = getListFilter(role, userId, query)
  const page = parseInt(query.page) || 1
  const pageSize = parseInt(query.pageSize) || 20
  const [data, total] = await Promise.all([
    prisma.prescription.findMany({
      where,
      include: {
        patient: { select: { name: true, phone: true } },
        assistant: { select: { name: true } },
        doctor: { select: { name: true } },
        courier: { select: { name: true, phone: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.prescription.count({ where }),
  ])
  return { data, total, page, pageSize }
}

export async function getPrescription(id: number, role: string, userId: number) {
  const p = await prisma.prescription.findUnique({
    where: { id },
    include: {
      patient: true,
      assistant: { select: { name: true, phone: true } },
      doctor: { select: { name: true } },
      courier: { select: { name: true, phone: true } },
      items: true,
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!p) throw new AppError(404, '处方不存在')
  if (role === 'patient') {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user || p.patient.phone !== user.phone) {
      throw new AppError(403, '无权限查看此处方')
    }
  }
  return p
}

export async function createPrescription(data: {
  patientId: number; assistantId: number; diagnosis: string; note?: string
  items: { drugName: string; specification: string; dosage: string; frequency: string; days: number; remark?: string }[]
}) {
  const p = await prisma.prescription.create({
    data: {
      patientId: data.patientId, assistantId: data.assistantId,
      diagnosis: data.diagnosis, note: data.note || '', status: 'draft',
      prescriptionNo: `TEMP-${Date.now()}`,
      items: { create: data.items },
      timeline: { create: { action: 'created', operatorId: data.assistantId, operatorName: '', detail: '创建处方' } },
    },
  })
  const prescriptionNo = generatePrescriptionNo(p.id)
  const assistant = await prisma.user.findUnique({ where: { id: data.assistantId } })
  await prisma.prescriptionTimeline.updateMany({
    where: { prescriptionId: p.id, action: 'created' },
    data: { operatorName: assistant?.name || '' },
  })
  return prisma.prescription.update({ where: { id: p.id }, data: { prescriptionNo } })
}

export async function updateDraft(id: number, assistantId: number, data: any) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'draft') throw new AppError(400, '只能编辑草稿状态的处方')
  if (p.assistantId !== assistantId) throw new AppError(403, '只能编辑自己创建的处方')
  await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: id } })
  return prisma.prescription.update({
    where: { id },
    data: { patientId: data.patientId, diagnosis: data.diagnosis, note: data.note, items: { create: data.items } },
  })
}

export async function submitForReview(id: number, assistantId: number) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'draft' && p.status !== 'rejected') throw new AppError(400, '当前状态不可提交审核')
  if (p.assistantId !== assistantId) throw new AppError(403, '只能提交自己创建的处方')
  const assistant = await prisma.user.findUnique({ where: { id: assistantId } })
  const isResubmit = p.status === 'rejected'
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'pending', rejectedReason: null, rejectedType: null,
      timeline: { create: { action: isResubmit ? 'resubmitted' : 'submitted', operatorId: assistantId, operatorName: assistant?.name || '', detail: isResubmit ? '修改后重新提交' : '提交审核' } },
    },
  })
}

export async function approve(id: number, doctorId: number) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'pending') throw new AppError(400, '当前状态不可审核')
  const doctor = await prisma.user.findUnique({ where: { id: doctorId } })
  return prisma.prescription.update({
    where: { id },
    data: { status: 'approved', doctorId, timeline: { create: { action: 'approved', operatorId: doctorId, operatorName: doctor?.name || '', detail: '审核通过' } } },
  })
}

export async function reject(id: number, doctorId: number, reason: string, type: string) {
  if (!reason || reason.length < 10) throw new AppError(400, '驳回理由不能少于10个字')
  if (!['serious', 'normal', 'suggestion'].includes(type)) throw new AppError(400, '无效的驳回类型')
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'pending') throw new AppError(400, '当前状态不可驳回')
  const doctor = await prisma.user.findUnique({ where: { id: doctorId } })
  return prisma.prescription.update({
    where: { id },
    data: { status: 'rejected', doctorId, rejectedReason: reason, rejectedType: type, timeline: { create: { action: 'rejected', operatorId: doctorId, operatorName: doctor?.name || '', detail: reason } } },
  })
}

export async function revokeApproval(id: number, doctorId: number, reason: string) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'approved') throw new AppError(400, '当前状态不可撤回')
  const elapsed = Date.now() - p.updatedAt.getTime()
  if (elapsed > 30 * 60 * 1000) throw new AppError(400, '审核通过超过30分钟，不可撤回')
  const doctor = await prisma.user.findUnique({ where: { id: doctorId } })
  return prisma.prescription.update({
    where: { id },
    data: { status: 'pending', doctorId: null, timeline: { create: { action: 'revoked', operatorId: doctorId, operatorName: doctor?.name || '', detail: reason } } },
  })
}

export async function pickup(id: number, courierId: number) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'approved') throw new AppError(400, '当前状态不可取件')
  const courier = await prisma.user.findUnique({ where: { id: courierId } })
  return prisma.prescription.update({
    where: { id },
    data: { status: 'delivering', courierId, timeline: { create: { action: 'picked_up', operatorId: courierId, operatorName: courier?.name || '', detail: '快递员取件' } } },
  })
}

export async function confirmDelivery(id: number, courierId: number, proof: string) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'delivering') throw new AppError(400, '当前状态不可签收')
  if (!proof) throw new AppError(400, '签收凭证不能为空')
  const courier = await prisma.user.findUnique({ where: { id: courierId } })
  return prisma.prescription.update({
    where: { id },
    data: { status: 'received', deliveryProof: proof, timeline: { create: { action: 'delivered', operatorId: courierId, operatorName: courier?.name || '', detail: '患者签收' } } },
  })
}

export async function reportException(id: number, courierId: number, exType: string, desc: string, photo?: string) {
  const validTypes = ['patient_reject', 'wrong_address', 'unreachable', 'damaged']
  if (!validTypes.includes(exType)) throw new AppError(400, '无效的异常类型')
  if (!desc) throw new AppError(400, '异常描述不能为空')
  if (exType === 'damaged' && !photo) throw new AppError(400, '药品破损需上传照片')
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'delivering') throw new AppError(400, '当前状态不可上报异常')
  const typeLabels: Record<string, string> = { patient_reject: '患者拒收', wrong_address: '地址错误', unreachable: '联系不上', damaged: '药品破损' }
  const courier = await prisma.user.findUnique({ where: { id: courierId } })
  return prisma.prescription.update({
    where: { id },
    data: { status: 'returned', deliveryProof: photo || p.deliveryProof, timeline: { create: { action: 'returned', operatorId: courierId, operatorName: courier?.name || '', detail: `${typeLabels[exType]}: ${desc}` } } },
  })
}

export async function saveTemplate(assistantId: number, name: string, diagnosis: string, items: any[]) {
  return prisma.prescriptionTemplate.create({ data: { assistantId, name, diagnosis, items: JSON.stringify(items) } })
}

export async function getTemplates(assistantId: number) {
  return prisma.prescriptionTemplate.findMany({ where: { assistantId }, orderBy: { createdAt: 'desc' } })
}
