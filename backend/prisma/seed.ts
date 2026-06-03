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
    },
  })

  const patient2 = await prisma.patient.upsert({
    where: { id: 2 },
    update: {},
    create: {
      name: '李奶奶', phone: '13900005555', gender: 'female', age: 72,
      address: '北京市海淀区中关村南大街 12 号院 3 号楼 101',
      allergyHistory: '头孢类过敏',
    },
  })

  const prescription = await prisma.prescription.upsert({
    where: { id: 1 },
    update: {},
    create: {
      prescriptionNo: 'PRS-20260603-000001',
      patientId: patient1.id,
      assistantId: assistant.id,
      diagnosis: '高血压病 2 级，规律服药，血压控制可',
      status: 'pending',
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

  console.log('Seed complete. Login accounts (password: 123456):')
  console.log('  assistant: 13800001111')
  console.log('  doctor:    13800002222')
  console.log('  courier:   13800003333')
  console.log('  patient:   13800004444')
}

main().catch(console.error).finally(() => prisma.$disconnect())
