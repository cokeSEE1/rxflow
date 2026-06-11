import { PrismaClient } from '@prisma/client'
import { randomInt } from 'crypto'
import { AppError } from '../middleware/errorHandler'
import { generatePrescriptionNo } from '../utils/prescriptionNo'
import { validatePhone } from '../utils/validate'

const prisma = new PrismaClient()

function getListFilter(role: string, userId: number, query: any) {
  const where: any = {}
  if (role === 'assistant') where.assistantId = userId
  if (role === 'courier') where.courierId = userId
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
  if (query.consultationId) where.consultationId = parseInt(query.consultationId)
  // Patient: find patient record by matching user phone, then filter by patientId
  if (role === 'patient') {
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) return { data: [], total: 0, page: 1, pageSize: 20 }
    const patient = await prisma.patient.findFirst({ where: { phone: user.phone } })
    if (!patient) return { data: [], total: 0, page: 1, pageSize: 20 }
    where.patientId = patient.id
  }
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
      consultation: { select: { id: true, diagnosis: true } },
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

  // Enhance with allergy and interaction checks if items have drugIds
  const drugIds = p.items.filter((i) => i.drugId).map((i) => i.drugId!)
  if (drugIds.length > 0) {
    const [allergyWarnings, interactionWarnings] = await Promise.all([
      computeAllergyWarnings(p.patientId, drugIds),
      computeInteractionWarnings(drugIds),
    ])
    return { ...p, allergyWarnings, interactionWarnings }
  }

  return p
}

async function computeAllergyWarnings(patientId: number, drugIds: number[]) {
  const [ingredients, patientAllergies] = await Promise.all([
    prisma.drugIngredient.findMany({
      where: { drugId: { in: drugIds } },
      include: { drug: { select: { standardName: true } }, allergen: true },
    }),
    prisma.patientAllergy.findMany({
      where: { patientId },
      include: { allergen: true },
    }),
  ])

  if (patientAllergies.length === 0) return []

  const allergenSeverity = new Map<number, { severity: string; name: string }>()
  for (const pa of patientAllergies) {
    allergenSeverity.set(pa.allergenId, { severity: pa.severity || 'moderate', name: pa.allergen.name })
  }

  const warnings: { drugName: string; allergenName: string; severity: string }[] = []
  for (const ing of ingredients) {
    const allergy = allergenSeverity.get(ing.allergenId)
    if (allergy) {
      warnings.push({
        drugName: ing.drug.standardName,
        allergenName: allergy.name,
        severity: allergy.severity,
      })
    }
  }
  return warnings
}

async function computeInteractionWarnings(drugIds: number[]) {
  if (drugIds.length < 2) return []

  const interactions = await prisma.drugInteraction.findMany({
    where: {
      OR: [
        { drugAId: { in: drugIds }, drugBId: { in: drugIds } },
      ],
    },
    include: {
      drugA: { select: { standardName: true } },
      drugB: { select: { standardName: true } },
    },
  })

  return interactions.map((ix) => ({
    drugAName: ix.drugA.standardName,
    drugBName: ix.drugB.standardName,
    severity: ix.severity,
    description: ix.description,
  }))
}

export async function createPrescription(data: {
  patientId: number; assistantId: number; diagnosis: string; note?: string; consultationId?: number
  items: { drugName: string; specification: string; dosage: string; frequency: string; days: number; remark?: string }[]
}) {
  if (data.consultationId) {
    const consultation = await prisma.consultation.findUnique({ where: { id: data.consultationId } })
    if (!consultation) throw new AppError(404, '关联的问诊记录不存在')
    if (consultation.status !== 'completed') throw new AppError(400, '只能关联已完诊的问诊记录')
    if (data.patientId && data.patientId !== consultation.patientId) {
      throw new AppError(400, '处方患者与问诊患者不一致')
    }
    if (!data.patientId) data.patientId = consultation.patientId
  }
  const p = await prisma.prescription.create({
    data: {
      patientId: data.patientId, assistantId: data.assistantId,
      diagnosis: data.diagnosis, note: data.note || '', status: 'draft',
      consultationId: data.consultationId || null,
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
  if (p.status !== 'draft' && p.status !== 'rejected') throw new AppError(400, '只能编辑草稿或已驳回状态的处方')
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
      status: 'pending',
      rejectedReason: null,
      rejectedType: null,
      rejectedById: null,
      submittedAt: new Date(),
      isResubmit,
      resubmitCount: isResubmit ? p.resubmitCount + 1 : p.resubmitCount,
      timeline: {
        create: {
          action: isResubmit ? 'resubmitted' : 'submitted',
          operatorId: assistantId,
          operatorName: assistant?.name || '',
          detail: isResubmit ? '修改后重新提交' : '提交审核',
        },
      },
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
    data: {
      status: 'approved',
      doctorId,
      approvedAt: new Date(),
      timeline: {
        create: { action: 'approved', operatorId: doctorId, operatorName: doctor?.name || '', detail: '审核通过' },
      },
    },
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
    data: {
      status: 'rejected',
      doctorId,
      rejectedById: doctorId,
      rejectedReason: reason,
      rejectedType: type,
      rejectedAt: new Date(),
      timeline: {
        create: {
          action: 'rejected',
          operatorId: doctorId,
          operatorName: doctor?.name || '',
          detail: reason,
          metadata: JSON.stringify({ type }),
        },
      },
    },
  })
}

export async function revokeApproval(id: number, doctorId: number, reason: string) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'approved') throw new AppError(400, '当前状态不可撤回')
  if (!p.approvedAt) throw new AppError(400, '审核时间异常，无法判断撤回窗口')
  const elapsed = Date.now() - p.approvedAt.getTime()
  if (elapsed > 30 * 60 * 1000) throw new AppError(400, '审核通过超过30分钟，不可撤回')
  const doctor = await prisma.user.findUnique({ where: { id: doctorId } })
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'pending',
      doctorId: null,
      approvedAt: null,
      revokedAt: new Date(),
      timeline: {
        create: { action: 'revoked', operatorId: doctorId, operatorName: doctor?.name || '', detail: reason },
      },
    },
  })
}

export async function pickup(id: number, courierId: number, trackingNo?: string) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'approved') throw new AppError(400, '当前状态不可取件')
  const courier = await prisma.user.findUnique({ where: { id: courierId } })
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'delivering',
      courierId,
      trackingNo: trackingNo || p.trackingNo,
      pickedUpAt: new Date(),
      estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000),
      timeline: {
        create: { action: 'picked_up', operatorId: courierId, operatorName: courier?.name || '', detail: '快递员取件' },
      },
    },
  })
}

export async function confirmDelivery(id: number, courierId: number, proof: string, method: string = 'photo') {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'delivering') throw new AppError(400, '当前状态不可签收')
  if (!proof) throw new AppError(400, '签收凭证不能为空')
  const courier = await prisma.user.findUnique({ where: { id: courierId } })
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'received',
      deliveryProof: proof,
      deliveryMethod: method,
      deliveredAt: new Date(),
      timeline: {
        create: { action: 'delivered', operatorId: courierId, operatorName: courier?.name || '', detail: '患者签收' },
      },
    },
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

  const [updated] = await Promise.all([
    prisma.prescription.update({
      where: { id },
      data: {
        status: 'returned',
        deliveryProof: photo || p.deliveryProof,
        returnedAt: new Date(),
        timeline: {
          create: {
            action: 'returned',
            operatorId: courierId,
            operatorName: courier?.name || '',
            detail: `${typeLabels[exType]}: ${desc}`,
            metadata: JSON.stringify({ type: exType, photo }),
          },
        },
      },
    }),
    prisma.deliveryException.create({
      data: {
        prescriptionId: id,
        courierId,
        type: exType,
        description: desc,
        photo: photo || null,
      },
    }),
  ])
  return updated
}

export async function requestRedelivery(id: number, requestedBy: number, reason: string) {
  const p = await prisma.prescription.findUnique({ where: { id } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'returned' && p.status !== 'received') throw new AppError(400, '当前状态不可重新配送')
  return prisma.prescription.update({
    where: { id },
    data: {
      status: 'approved',
      redeliverRequestedBy: requestedBy,
      redeliverRequestedAt: new Date(),
      redeliverReason: reason,
      courierId: null,
      trackingNo: null,
      deliveryProof: null,
      deliveryMethod: null,
      pickedUpAt: null,
      deliveredAt: null,
      returnedAt: null,
      timeline: {
        create: {
          action: 'redeliver_requested',
          operatorId: requestedBy,
          operatorName: '',
          detail: `重新配送: ${reason}`,
        },
      },
    },
  })
}

const RATE_LIMIT_WINDOW_MS = 60 * 1000
const RATE_LIMIT_MAX_COUNT = 3

async function checkRateLimit(phone: string) {
  const windowStart = new Date(Date.now() - RATE_LIMIT_WINDOW_MS)
  const count = await prisma.smsVerification.count({
    where: {
      phone,
      createdAt: { gte: windowStart },
    },
  })
  if (count >= RATE_LIMIT_MAX_COUNT) {
    throw new AppError(429, '验证码发送过于频繁，请 60 秒后再试')
  }
}

export async function generateSmsCode(prescriptionId: number, phone: string) {
  const p = await prisma.prescription.findUnique({ where: { id: prescriptionId } })
  if (!p) throw new AppError(404, '处方不存在')
  if (p.status !== 'delivering') throw new AppError(400, '当前状态不可生成验证码')

  validatePhone(phone)
  await checkRateLimit(phone)

  const code = String(randomInt(100000, 999999))

  const record = await prisma.smsVerification.create({
    data: {
      prescriptionId,
      phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  })

  // 开发环境输出验证码到控制台方便测试
  if (process.env.NODE_ENV !== 'production') {
    console.log(`[DEV] SMS code for ${phone}: ${code}`)
  }

  return {
    success: true,
    message: '验证码已发送',
    expiresAt: record.expiresAt,
  }
}

export async function verifySmsCode(prescriptionId: number, phone: string, code: string) {
  validatePhone(phone)

  if (!/^\d{6}$/.test(code)) {
    throw new AppError(400, '验证码格式不正确')
  }

  const record = await prisma.smsVerification.findFirst({
    where: { prescriptionId, phone, isVerified: false },
    orderBy: { createdAt: 'desc' },
  })
  if (!record) throw new AppError(404, '未找到验证码记录，请先生成验证码')
  if (record.attemptCount >= 3) throw new AppError(400, '验证次数已达上限，请重新生成验证码')
  if (new Date() > record.expiresAt) throw new AppError(400, '验证码已过期，请重新生成')

  await prisma.smsVerification.update({
    where: { id: record.id },
    data: { attemptCount: record.attemptCount + 1 },
  })

  if (record.code !== code) {
    throw new AppError(400, `验证码错误，剩余尝试次数: ${2 - record.attemptCount}`)
  }

  await prisma.smsVerification.update({
    where: { id: record.id },
    data: { isVerified: true, verifiedAt: new Date() },
  })

  return { verified: true }
}

export async function getDeliveryExceptions(query: { isResolved?: string; type?: string }) {
  const where: any = {}
  if (query.isResolved !== undefined) where.isResolved = query.isResolved === 'true'
  if (query.type) where.type = query.type
  return prisma.deliveryException.findMany({
    where,
    include: {
      prescription: { select: { prescriptionNo: true, patient: { select: { name: true } } } },
      courier: { select: { name: true, phone: true } },
    },
    orderBy: { createdAt: 'desc' },
  })
}

export async function saveTemplate(assistantId: number, name: string, diagnosis: string, items: any[]) {
  return prisma.prescriptionTemplate.create({
    data: { assistantId, name, diagnosis, items: JSON.stringify(items) },
  })
}

export async function getTemplates(assistantId: number) {
  return prisma.prescriptionTemplate.findMany({ where: { assistantId }, orderBy: { createdAt: 'desc' } })
}

export async function saveRejectionTemplate(doctorId: number, name: string, content: string) {
  return prisma.rejectionTemplate.create({ data: { doctorId, name, content } })
}

export async function getRejectionTemplates(doctorId: number) {
  return prisma.rejectionTemplate.findMany({
    where: { doctorId },
    orderBy: { usageCount: 'desc' },
  })
}

export async function useRejectionTemplate(id: number, doctorId: number) {
  const tmpl = await prisma.rejectionTemplate.findUnique({ where: { id } })
  if (!tmpl || tmpl.doctorId !== doctorId) throw new AppError(404, '模板不存在')
  await prisma.rejectionTemplate.update({ where: { id }, data: { usageCount: tmpl.usageCount + 1 } })
  return tmpl
}
