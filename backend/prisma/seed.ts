import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  const hash = await bcrypt.hash('123456', 10)

  const assistant = await prisma.user.upsert({
    where: { phone: '13800001111' },
    update: {},
    create: { name: '李助理', phone: '13800001111', passwordHash: hash, role: 'assistant' },
  })
  const doctor = await prisma.user.upsert({
    where: { phone: '13800002222' },
    update: {},
    create: { name: '张医生', phone: '13800002222', passwordHash: hash, role: 'doctor' },
  })
  const courier = await prisma.user.upsert({
    where: { phone: '13800003333' },
    update: {},
    create: { name: '王师傅', phone: '13800003333', passwordHash: hash, role: 'courier' },
  })
  const patientUser = await prisma.user.upsert({
    where: { phone: '13800004444' },
    update: {},
    create: { name: '赵建国', phone: '13800004444', passwordHash: hash, role: 'patient' },
  })

  const patient1 = await prisma.patient.upsert({
    where: { id: 1 },
    update: {},
    create: {
      name: '赵建国', phone: '13800004444', gender: 'male', age: 62,
      address: '北京市朝阳区望京西园三区 401 号楼 5 单元 302',
      allergyHistory: '青霉素过敏',
      createdBy: assistant.id,
    },
  })

  const patient2 = await prisma.patient.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '李奶奶', phone: '13900005555', gender: 'female', age: 72,
      address: '北京市海淀区中关村南大街 12 号院 3 号楼 101',
      allergyHistory: '头孢类过敏',
      createdBy: assistant.id,
    },
  })

  // ---- Prescriptions in different statuses ----

  // 1. Pending (waiting for doctor review)
  const now = new Date()
  const fiveMinAgo = new Date(now.getTime() - 5 * 60 * 1000)
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000)

  await prisma.prescription.upsert({
    where: { id: 1 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000001',
      patientId: patient1.id,
      assistantId: assistant.id,
      diagnosis: '高血压病 2 级，规律服药，血压控制可',
      status: 'pending',
      submittedAt: oneHourAgo,
      items: {
        create: [
          { drugName: '硝苯地平控释片', specification: '30mg x 7片', dosage: '1片', frequency: 'qd', days: 7 },
          { drugName: '厄贝沙坦片', specification: '150mg x 7片', dosage: '1片', frequency: 'qd', days: 7 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方' },
          { action: 'submitted', operatorId: assistant.id, operatorName: '李助理', detail: '提交审核' },
        ],
      },
    },
  })

  // 2. Draft (not yet submitted)
  await prisma.prescription.upsert({
    where: { id: 2 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000002',
      patientId: patient2.id,
      assistantId: assistant.id,
      diagnosis: '糖尿病 2 型，空腹血糖 7.2mmol/L，建议控制饮食',
      status: 'draft',
      items: {
        create: [
          { drugName: '盐酸二甲双胍片', specification: '0.5g x 20片', dosage: '1片', frequency: 'bid', days: 10 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方草稿' },
        ],
      },
    },
  })

  // 3. Approved (ready for courier pickup)
  await prisma.prescription.upsert({
    where: { id: 3 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000003',
      patientId: patient1.id,
      assistantId: assistant.id,
      doctorId: doctor.id,
      diagnosis: '高血脂症，总胆固醇 6.2mmol/L',
      status: 'approved',
      submittedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      approvedAt: new Date(now.getTime() - 30 * 60 * 1000),
      items: {
        create: [
          { drugName: '阿托伐他汀钙片', specification: '20mg x 7片', dosage: '1片', frequency: 'qn', days: 7 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方' },
          { action: 'submitted', operatorId: assistant.id, operatorName: '李助理', detail: '提交审核' },
          { action: 'approved', operatorId: doctor.id, operatorName: '张医生', detail: '审核通过' },
        ],
      },
    },
  })

  // 4. Rejected (with reason)
  await prisma.prescription.upsert({
    where: { id: 4 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000004',
      patientId: patient2.id,
      assistantId: assistant.id,
      doctorId: doctor.id,
      diagnosis: '感冒，咳嗽，发热 38.5°C',
      status: 'rejected',
      rejectedReason: '诊断描述不够详细，请补充体温持续时间和伴随症状，并说明是否有药物过敏史',
      rejectedType: 'normal',
      rejectedById: doctor.id,
      submittedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      rejectedAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      items: {
        create: [
          { drugName: '布洛芬缓释胶囊', specification: '0.3g x 20粒', dosage: '1粒', frequency: 'bid', days: 3 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方' },
          { action: 'submitted', operatorId: assistant.id, operatorName: '李助理', detail: '提交审核' },
          { action: 'rejected', operatorId: doctor.id, operatorName: '张医生', detail: '诊断描述不够详细，请补充体温持续时间和伴随症状，并说明是否有药物过敏史', metadata: JSON.stringify({ type: 'normal' }) },
        ],
      },
    },
  })

  // 5. Delivering
  await prisma.prescription.upsert({
    where: { id: 5 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000005',
      patientId: patient1.id,
      assistantId: assistant.id,
      doctorId: doctor.id,
      courierId: courier.id,
      diagnosis: '急性咽炎，咽部充血',
      status: 'delivering',
      trackingNo: 'SF1234567890',
      submittedAt: new Date(now.getTime() - 4 * 60 * 60 * 1000),
      approvedAt: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      pickedUpAt: new Date(now.getTime() - 60 * 60 * 1000),
      estimatedDelivery: new Date(now.getTime() + 60 * 60 * 1000),
      items: {
        create: [
          { drugName: '阿莫西林胶囊', specification: '0.5g x 24粒', dosage: '1粒', frequency: 'tid', days: 3 },
          { drugName: '复方甘草片', specification: '100片/瓶', dosage: '3片', frequency: 'tid', days: 3 },
        ],
      },
      timeline: {
        create: [
          { action: 'created', operatorId: assistant.id, operatorName: '李助理', detail: '创建处方' },
          { action: 'submitted', operatorId: assistant.id, operatorName: '李助理', detail: '提交审核' },
          { action: 'approved', operatorId: doctor.id, operatorName: '张医生', detail: '审核通过' },
          { action: 'picked_up', operatorId: courier.id, operatorName: '王师傅', detail: '快递员取件' },
        ],
      },
    },
  })

  // ---- Rejection Templates ----
  await prisma.rejectionTemplate.upsert({
    where: { id: 1 },
    update: {},
    create: { doctorId: doctor.id, name: '剂量错误', content: '药品剂量超出常规范围，请核对后修正。' },
  })
  await prisma.rejectionTemplate.upsert({
    where: { id: 2 },
    update: {},
    create: { doctorId: doctor.id, name: '诊断与用药不符', content: '诊断描述与所开药品的适应症不匹配，请核实。' },
  })
  await prisma.rejectionTemplate.upsert({
    where: { id: 3 },
    update: {},
    create: { doctorId: doctor.id, name: '药物禁忌', content: '患者存在相关药物禁忌或过敏史，请更换药品。' },
  })
  await prisma.rejectionTemplate.upsert({
    where: { id: 4 },
    update: {},
    create: { doctorId: doctor.id, name: '缺少检查结果', content: '缺少必要的检查结果支持诊断，请补充相关检查报告。' },
  })
  await prisma.rejectionTemplate.upsert({
    where: { id: 5 },
    update: {},
    create: { doctorId: doctor.id, name: '患者信息不全', content: '患者基本信息或过敏史不完整，请完善后重新提交。' },
  })

  // ---- Notifications ----
  await prisma.notification.upsert({
    where: { id: 1 },
    update: {},
    create: {
      userId: doctor.id,
      type: 'review',
      title: '新处方待审核',
      content: '李助理提交了赵建国的处方（高血压病），请尽快审核。',
      prescriptionId: 1,
    },
  })
  await prisma.notification.upsert({
    where: { id: 2 },
    update: {},
    create: {
      userId: assistant.id,
      type: 'rejected',
      title: '处方被驳回',
      content: '张医生驳回了李奶奶的处方（感冒），请查看驳回理由并修改。',
      prescriptionId: 4,
    },
  })
  await prisma.notification.upsert({
    where: { id: 3 },
    update: {},
    create: {
      userId: courier.id,
      type: 'delivery',
      title: '新待取件处方',
      content: '有新的已通过处方待取件配送。',
      prescriptionId: 3,
    },
  })

  console.log('Seed complete. Login accounts (password: 123456):')
  console.log('  assistant: 13800001111')
  console.log('  doctor:    13800002222')
  console.log('  courier:   13800003333')
  console.log('  patient:   13800004444')
  console.log('')
  console.log('Prescriptions:')
  console.log('  #1 pending   - 高血压病 (赵建国)')
  console.log('  #2 draft     - 糖尿病 (李奶奶)')
  console.log('  #3 approved  - 高血脂症 (赵建国)')
  console.log('  #4 rejected  - 感冒 (李奶奶)')
  console.log('  #5 delivering - 急性咽炎 (赵建国)')
  console.log('')
  console.log('Rejection templates: 5')
  console.log('Notifications: 3')
}

main().catch(console.error).finally(() => prisma.$disconnect())
