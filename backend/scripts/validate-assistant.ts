/**
 * RxFlow — Doctor Assistant (医生助理) Workflow Validation Script
 *
 * Validates the Prisma schema and database by simulating the complete
 * assistant workflow end-to-end.
 *
 * Usage: npx tsx scripts/validate-assistant.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---- Helpers ----

let passed = 0
let failed = 0

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✅ PASS  ${label}`)
    passed++
  } else {
    console.log(`  ❌ FAIL  ${label}${detail ? ` — ${detail}` : ''}`)
    failed++
  }
}

function section(title: string): void {
  console.log(`\n${'='.repeat(60)}`)
  console.log(`  ${title}`)
  console.log('='.repeat(60))
}

function missing(label: string): void {
  console.log(`  ⚠️  MISSING  ${label}`)
  failed++
}

// ---- Test Data ----

const TEST_PREFIX = 'VALIDATE-ASST-'

// Seed IDs per requirement (must match seed.ts)
const ASSISTANT_ID = 1
const DOCTOR_ID = 2
const COURIER_ID = 3
const PATIENT_ZHAO_ID = 1  // 赵建国
const PATIENT_LI_ID = 2    // 李奶奶
const REJECTED_RX_ID = 4   // status='rejected'

async function main(): Promise<void> {
  console.log('\n🔬 RxFlow Doctor Assistant — Schema Validation')
  console.log(`   Started at: ${new Date().toISOString()}`)
  console.log(`   Database:   rxflow @ 127.0.0.1:3306`)

  // ----------------------------------------------------------------
  // PRE-FLIGHT: Verify seed data exists
  // ----------------------------------------------------------------
  section('0. Pre-flight — Verify Seed Data')

  const assistant = await prisma.user.findUnique({ where: { id: ASSISTANT_ID } })
  check('Assistant user exists (id=1)', !!assistant, assistant ? `role=${assistant.role}` : 'not found')
  if (assistant) {
    check('Assistant role is "assistant"', assistant.role === 'assistant')
  }

  const doctor = await prisma.user.findUnique({ where: { id: DOCTOR_ID } })
  check('Doctor user exists (id=2)', !!doctor, doctor ? `role=${doctor.role}` : 'not found')

  const courier = await prisma.user.findUnique({ where: { id: COURIER_ID } })
  check('Courier user exists (id=3)', !!courier, courier ? `role=${courier.role}` : 'not found')

  const patient1 = await prisma.patient.findUnique({ where: { id: PATIENT_ZHAO_ID } })
  check('Patient 赵建国 exists (id=1)', !!patient1, patient1 ? `phone=${patient1.phone}` : 'not found')
  if (patient1) {
    check('Patient.createdBy field is set', patient1.createdBy === ASSISTANT_ID, `createdBy=${patient1.createdBy}`)
  }

  const patient2 = await prisma.patient.findUnique({ where: { id: PATIENT_LI_ID } })
  check('Patient 李奶奶 exists (id=2)', !!patient2, patient2 ? `phone=${patient2.phone}` : 'not found')

  const rejectedRx = await prisma.prescription.findUnique({
    where: { id: REJECTED_RX_ID },
    include: { items: true },
  })
  check('Rejected prescription exists (id=4)', !!rejectedRx, rejectedRx ? `status=${rejectedRx.status}` : 'not found')

  if (!assistant || !doctor || !patient1 || !patient2 || !rejectedRx) {
    console.log('\n⚠️  Required seed data missing. Please run: npx tsx prisma/seed.ts')
    await prisma.$disconnect()
    process.exit(1)
  }

  // ----------------------------------------------------------------
  // 1. CREATE A NEW PATIENT
  // ----------------------------------------------------------------
  section('1. Create a New Patient')

  const newPatient = await prisma.patient.create({
    data: {
      name: '王小明',
      gender: 'male',
      age: 45,
      phone: '13900006666',
      address: '北京市东城区王府井大街 100 号',
      allergyHistory: '无',
      createdBy: ASSISTANT_ID,
    },
  })
  check('Patient record created', !!newPatient, `id=${newPatient.id}, name=${newPatient.name}`)
  check('Patient.createdBy equals assistant id', newPatient.createdBy === ASSISTANT_ID, `createdBy=${newPatient.createdBy}`)
  check('Patient.phone is set', newPatient.phone === '13900006666')
  check('Patient.allergyHistory is set', newPatient.allergyHistory === '无')

  // Verify we can read it back by phone
  const foundPatient = await prisma.patient.findFirst({ where: { phone: '13900006666' } })
  check('Patient is queryable by phone', !!foundPatient, foundPatient ? `name=${foundPatient.name}` : 'not found')

  // ----------------------------------------------------------------
  // 2. CREATE A DRAFT PRESCRIPTION
  // ----------------------------------------------------------------
  section('2. Create a Draft Prescription')

  const draftRx = await prisma.prescription.create({
    data: {
      patientId: newPatient.id,
      assistantId: ASSISTANT_ID,
      diagnosis: '急性上呼吸道感染，发热 38.2°C，咽部充血，无药物过敏史',
      status: 'draft',
      prescriptionNo: `${TEST_PREFIX}${Date.now()}`,
      note: '建议多饮水，注意休息',
      items: {
        create: [
          {
            drugName: '连花清瘟胶囊',
            specification: '0.35g x 36粒',
            dosage: '4粒',
            frequency: 'tid',
            days: 3,
          },
          {
            drugName: '布洛芬缓释胶囊',
            specification: '0.3g x 20粒',
            dosage: '1粒',
            frequency: 'bid',
            days: 3,
            remark: '体温超过 38.5°C 时服用',
          },
        ],
      },
      timeline: {
        create: {
          action: 'created',
          operatorId: ASSISTANT_ID,
          operatorName: '李助理',
          detail: '创建处方草稿',
        },
      },
    },
    include: { items: true, timeline: true },
  })
  check('Prescription record created', !!draftRx, `id=${draftRx.id}, no=${draftRx.prescriptionNo}`)
  check('status is "draft"', draftRx.status === 'draft')
  check('Items count is 2', draftRx.items.length === 2, `got ${draftRx.items.length}`)
  check('Timeline has 1 entry', draftRx.timeline.length === 1, `got ${draftRx.timeline.length}`)
  check('assistantId matches', draftRx.assistantId === ASSISTANT_ID)
  check('isResubmit defaults to false', draftRx.isResubmit === false)
  check('resubmitCount defaults to 0', draftRx.resubmitCount === 0)
  check('submittedAt is null (draft)', draftRx.submittedAt === null)
  check('rejectedReason is null (draft)', draftRx.rejectedReason === null)

  // Verify drug item fields
  const item1 = draftRx.items[0]
  check('Item has drugName', typeof item1.drugName === 'string' && item1.drugName.length > 0)
  check('Item has specification', typeof item1.specification === 'string' && item1.specification.length > 0)
  check('Item has dosage', typeof item1.dosage === 'string')
  check('Item has frequency', typeof item1.frequency === 'string')
  check('Item has days', typeof item1.days === 'number' && item1.days > 0)
  check('Item has doctorAnnotation field', 'doctorAnnotation' in item1)

  const item2 = draftRx.items[1]
  check('Item remark is writable', item2.remark === '体温超过 38.5°C 时服用')

  // ----------------------------------------------------------------
  // 3. PRESCRIPTION TEMPLATE — SAVE AND LOAD
  // ----------------------------------------------------------------
  section('3. Use a Prescription Template')

  // 3a. Save template
  const templateItems = [
    { drugName: '阿莫西林胶囊', specification: '0.5g x 24粒', dosage: '1粒', frequency: 'tid', days: 3 },
    { drugName: '复方甘草片', specification: '100片/瓶', dosage: '3片', frequency: 'tid', days: 3 },
  ]

  const savedTemplate = await prisma.prescriptionTemplate.create({
    data: {
      assistantId: ASSISTANT_ID,
      name: '上呼吸道感染标准方',
      diagnosis: '急性上呼吸道感染，咽部充血，无过敏史',
      items: JSON.stringify(templateItems),
    },
  })
  check('Template saved successfully', !!savedTemplate, `id=${savedTemplate.id}`)
  check('Template name matches', savedTemplate.name === '上呼吸道感染标准方')
  check('Template diagnosis saved', savedTemplate.diagnosis.includes('急性上呼吸道感染'))
  check('Template items is JSON string', typeof savedTemplate.items === 'string')
  check('Template usageCount starts at 0', savedTemplate.usageCount === 0)

  // 3b. Load templates for assistant
  const templates = await prisma.prescriptionTemplate.findMany({
    where: { assistantId: ASSISTANT_ID },
    orderBy: { createdAt: 'desc' },
  })
  check('Can query templates by assistantId', templates.length >= 1, `found ${templates.length} templates`)
  const loadedTemplate = templates.find(t => t.id === savedTemplate.id)
  check('Saved template appears in query results', !!loadedTemplate)

  // 3c. Parse loaded template items
  if (loadedTemplate) {
    const parsedItems = JSON.parse(loadedTemplate.items)
    check('Template items parse back to array', Array.isArray(parsedItems), `length=${parsedItems.length}`)
    check('Parsed items have correct structure', parsedItems.length === 2 && parsedItems[0].drugName === '阿莫西林胶囊')
  }

  // 3d. Increment usage count (simulate template usage)
  await prisma.prescriptionTemplate.update({
    where: { id: savedTemplate.id },
    data: { usageCount: savedTemplate.usageCount + 1 },
  })
  const updatedTemplate = await prisma.prescriptionTemplate.findUnique({ where: { id: savedTemplate.id } })
  check('Template usageCount increments', updatedTemplate?.usageCount === 1, `usageCount=${updatedTemplate?.usageCount}`)

  // ----------------------------------------------------------------
  // 4. SUBMIT FOR REVIEW (FIRST SUBMISSION)
  // ----------------------------------------------------------------
  section('4. Submit for Review (First Submission)')

  // Simulate submitForReview logic matching prescriptionService.ts
  const currentRx = await prisma.prescription.findUnique({
    where: { id: draftRx.id },
    include: { items: true },
  })
  check('Draft prescription found for submission', !!currentRx && currentRx.status === 'draft')

  if (!currentRx) {
    console.log('   Cannot proceed with submission — draft not found')
    await prisma.$disconnect()
    process.exit(1)
  }

  const isResubmit = currentRx.status === 'rejected'
  const submitData = {
    status: 'pending',
    rejectedReason: null,
    rejectedType: null,
    rejectedById: null,
    submittedAt: new Date(),
    isResubmit,
    resubmitCount: isResubmit ? currentRx.resubmitCount + 1 : currentRx.resubmitCount,
    timeline: {
      create: {
        action: 'submitted',
        operatorId: ASSISTANT_ID,
        operatorName: '李助理',
        detail: '提交审核',
      },
    },
  }

  const submittedRx = await prisma.prescription.update({
    where: { id: draftRx.id },
    data: submitData,
    include: { items: true, timeline: { orderBy: { createdAt: 'asc' } } },
  })

  check('status changed to "pending"', submittedRx.status === 'pending', `status=${submittedRx.status}`)
  check('submittedAt is set', submittedRx.submittedAt !== null, `submittedAt=${submittedRx.submittedAt?.toISOString()}`)
  check('isResubmit is false (first submission)', submittedRx.isResubmit === false)
  check('resubmitCount remains 0', submittedRx.resubmitCount === 0)
  check('rejectedReason cleared', submittedRx.rejectedReason === null)
  check('rejectedType cleared', submittedRx.rejectedType === null)
  check('rejectedById cleared', submittedRx.rejectedById === null)
  check('Timeline has 2 entries (created + submitted)', submittedRx.timeline.length === 2, `got ${submittedRx.timeline.length}`)
  check('Timeline includes "submitted" action',
    submittedRx.timeline.some(t => t.action === 'submitted'),
    `actions: ${submittedRx.timeline.map(t => t.action).join(', ')}`)

  // ----------------------------------------------------------------
  // 5. QUERY DRAFT / SUBMITTED LISTS
  // ----------------------------------------------------------------
  section('5. Query Draft / Submitted Lists')

  // 5a. Query drafts
  const drafts = await prisma.prescription.findMany({
    where: { status: 'draft', assistantId: ASSISTANT_ID },
    include: { patient: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  })
  check('Can query drafts by status + assistantId', Array.isArray(drafts), `found ${drafts.length} drafts`)

  // 5b. Query submitted (pending)
  const submitted = await prisma.prescription.findMany({
    where: { status: 'pending', assistantId: ASSISTANT_ID },
    include: { patient: { select: { name: true } } },
    orderBy: { submittedAt: 'desc' },
  })
  check('Can query pending by status + assistantId', Array.isArray(submitted), `found ${submitted.length} pending`)

  // 5c. Verify our test prescription appears in pending
  const testRxInList = submitted.find(r => r.id === draftRx.id)
  check('Test prescription appears in pending list', !!testRxInList)

  // 5d. Filter by patient name (like the app does)
  const byPatient = await prisma.prescription.findMany({
    where: {
      assistantId: ASSISTANT_ID,
      patient: { name: { contains: '王小明' } },
    },
  })
  check('Can filter prescriptions by patient name', byPatient.length >= 1, `found ${byPatient.length}`)

  // 5e. Filter by date range
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
  const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000)
  const byDate = await prisma.prescription.findMany({
    where: {
      assistantId: ASSISTANT_ID,
      createdAt: { gte: yesterday, lte: tomorrow },
    },
  })
  check('Can filter prescriptions by date range', byDate.length >= 1, `found ${byDate.length}`)

  // ----------------------------------------------------------------
  // 6. VIEW REJECTED PRESCRIPTION
  // ----------------------------------------------------------------
  section('6. View Rejected Prescription')

  const rejectedPrescription = await prisma.prescription.findUnique({
    where: { id: REJECTED_RX_ID },
    include: {
      patient: true,
      assistant: { select: { name: true, phone: true } },
      doctor: { select: { name: true } },
      rejectedBy: { select: { name: true } },
      items: true,
      timeline: { orderBy: { createdAt: 'asc' } },
    },
  })

  check('Rejected prescription is readable', !!rejectedPrescription, `no=${rejectedPrescription?.prescriptionNo}`)
  if (!rejectedPrescription) {
    console.log('   Cannot proceed — rejected prescription not found')
    await prisma.$disconnect()
    process.exit(1)
  }

  check('status is "rejected"', rejectedPrescription.status === 'rejected', `status=${rejectedPrescription.status}`)
  check('rejectedReason is readable', rejectedPrescription.rejectedReason !== null && rejectedPrescription.rejectedReason.length > 0, `reason length=${rejectedPrescription.rejectedReason?.length}`)
  check('rejectedType is readable', rejectedPrescription.rejectedType === 'normal', `type=${rejectedPrescription.rejectedType}`)
  check('rejectedById is readable', rejectedPrescription.rejectedById === DOCTOR_ID, `rejectedById=${rejectedPrescription.rejectedById}`)
  check('rejectedAt is readable', rejectedPrescription.rejectedAt !== null, `rejectedAt=${rejectedPrescription.rejectedAt?.toISOString()}`)
  check('rejectedBy relation resolves', rejectedPrescription.rejectedBy?.name === '张医生', `rejectedBy=${rejectedPrescription.rejectedBy?.name}`)
  check('doctor relation resolves', rejectedPrescription.doctor?.name === '张医生', `doctor=${rejectedPrescription.doctor?.name}`)
  check('assistant relation resolves', rejectedPrescription.assistant?.name === '李助理')
  check('patient relation resolves', rejectedPrescription.patient?.name === '李奶奶')
  check('Items included', rejectedPrescription.items.length >= 1)
  check('Timeline includes rejected action',
    rejectedPrescription.timeline.some(t => t.action === 'rejected'),
    `actions: ${rejectedPrescription.timeline.map(t => t.action).join(', ')}`)
  check('submittedAt is set on rejected rx', rejectedPrescription.submittedAt !== null)

  // Verify no stray fields exist
  check('approvedAt is null on rejected rx', rejectedPrescription.approvedAt === null)
  check('pickedUpAt is null on rejected rx', rejectedPrescription.pickedUpAt === null)

  // ----------------------------------------------------------------
  // 7. RESUBMIT AFTER REJECTION
  // ----------------------------------------------------------------
  section('7. Resubmit After Rejection')

  const currentRejectedRx = await prisma.prescription.findUnique({
    where: { id: REJECTED_RX_ID },
  })

  if (!currentRejectedRx) {
    console.log('   Cannot proceed — rejected prescription not found')
    await prisma.$disconnect()
    process.exit(1)
  }

  check('Current status is "rejected"', currentRejectedRx.status === 'rejected', `status=${currentRejectedRx.status}`)
  check('Current isResubmit is false', currentRejectedRx.isResubmit === false)
  check('Current resubmitCount is 0', currentRejectedRx.resubmitCount === 0)
  check('Current rejectedReason is set', currentRejectedRx.rejectedReason !== null)

  // IMPORTANT: We are about to modify the seed data (id=4).
  // Save the original state so we can restore it.
  const originalState = {
    status: currentRejectedRx.status,
    rejectedReason: currentRejectedRx.rejectedReason,
    rejectedType: currentRejectedRx.rejectedType,
    rejectedById: currentRejectedRx.rejectedById,
    rejectedAt: currentRejectedRx.rejectedAt,
    isResubmit: currentRejectedRx.isResubmit,
    resubmitCount: currentRejectedRx.resubmitCount,
    submittedAt: currentRejectedRx.submittedAt,
  }

  // Simulate resubmit by following the same pattern as submitForReview
  const resubmitData = {
    status: 'pending',
    rejectedReason: null,
    rejectedType: null,
    rejectedById: null,
    submittedAt: new Date(),
    isResubmit: true,
    resubmitCount: currentRejectedRx.resubmitCount + 1,
    timeline: {
      create: {
        action: 'resubmitted',
        operatorId: ASSISTANT_ID,
        operatorName: '李助理',
        detail: '修改后重新提交',
      },
    },
  }

  const resubmittedRx = await prisma.prescription.update({
    where: { id: REJECTED_RX_ID },
    data: resubmitData,
    include: { timeline: { orderBy: { createdAt: 'asc' } } },
  })

  check('Status changed to "pending" after resubmit', resubmittedRx.status === 'pending', `status=${resubmittedRx.status}`)
  check('isResubmit becomes true', resubmittedRx.isResubmit === true)
  check('resubmitCount increments to 1', resubmittedRx.resubmitCount === 1, `resubmitCount=${resubmittedRx.resubmitCount}`)
  check('rejectedReason is cleared (null)', resubmittedRx.rejectedReason === null, `rejectedReason=${resubmittedRx.rejectedReason}`)
  check('rejectedType is cleared (null)', resubmittedRx.rejectedType === null, `rejectedType=${resubmittedRx.rejectedType}`)
  check('rejectedById is cleared (null)', resubmittedRx.rejectedById === null, `rejectedById=${resubmittedRx.rejectedById}`)
  check('submittedAt is updated', resubmittedRx.submittedAt !== null)
  check('New submittedAt is after original rejectedAt',
    resubmittedRx.submittedAt!.getTime() > originalState.submittedAt!.getTime())
  check('Timeline includes "resubmitted" action',
    resubmittedRx.timeline.some(t => t.action === 'resubmitted'),
    `actions: ${resubmittedRx.timeline.map(t => t.action).join(', ')}`)

  // ---- RESTORE SEED DATA ----
  console.log('\n   Restoring seed data for prescription id=4...')
  await prisma.prescription.update({
    where: { id: REJECTED_RX_ID },
    data: {
      status: originalState.status,
      rejectedReason: originalState.rejectedReason,
      rejectedType: originalState.rejectedType,
      rejectedById: originalState.rejectedById,
      rejectedAt: originalState.rejectedAt,
      isResubmit: originalState.isResubmit,
      resubmitCount: originalState.resubmitCount,
      submittedAt: originalState.submittedAt,
    },
  })
  // Remove the 'resubmitted' timeline entry we added
  await prisma.prescriptionTimeline.deleteMany({
    where: { prescriptionId: REJECTED_RX_ID, action: 'resubmitted' },
  })
  const restoredRx = await prisma.prescription.findUnique({
    where: { id: REJECTED_RX_ID },
    include: { timeline: { orderBy: { createdAt: 'asc' } } },
  })
  check('Seed data restored to "rejected" status',
    restoredRx?.status === 'rejected' && restoredRx?.isResubmit === false,
    `status=${restoredRx?.status}, isResubmit=${restoredRx?.isResubmit}`)

  // ---- CLEANUP ----
  section('Cleanup — Remove Test Data')

  // Delete the test prescription and its items
  await prisma.prescriptionTimeline.deleteMany({ where: { prescriptionId: draftRx.id } })
  await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: draftRx.id } })
  await prisma.prescription.delete({ where: { id: draftRx.id } })
  console.log('   Deleted test prescription')

  // Delete the test template
  await prisma.prescriptionTemplate.delete({ where: { id: savedTemplate.id } })
  console.log('   Deleted test template')

  // Delete the test patient
  await prisma.patient.delete({ where: { id: newPatient.id } })
  console.log('   Deleted test patient')

  // ---- SUMMARY ----
  section('Summary')
  console.log(`   ✅ Passed: ${passed}`)
  console.log(`   ❌ Failed: ${failed}`)
  console.log(`   Total:    ${passed + failed}`)
  if (failed === 0) {
    console.log(`\n   🎉 All checks passed! Schema is ready for Doctor Assistant workflow.`)
  } else {
    console.log(`\n   ⚠️  ${failed} check(s) failed. Review the FAIL lines above.`)
  }

  await prisma.$disconnect()
}

main().catch(async (err) => {
  console.error('\n💥 Unhandled error:', err)
  await prisma.$disconnect()
  process.exit(1)
})
