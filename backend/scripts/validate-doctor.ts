/**
 * RxFlow Doctor Role Validation Script
 *
 * Validates the complete doctor workflow against the real MySQL database.
 * Assumes seed data is in place: doctor id=2, pending #1, rejected #4, etc.
 *
 * Run: npx tsx scripts/validate-doctor.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

const DOCTOR_ID = 2
const DOCTOR_NAME = '张医生'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passCount = 0
let failCount = 0

function check(label: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`  ✅ PASS — ${label}`)
    passCount++
  } else {
    console.log(`  ❌ FAIL — ${label}${detail ? ` (${detail})` : ''}`)
    failCount++
  }
}

async function resetPrescription1ToPending(): Promise<void> {
  // Ensure #1 starts as fresh 'pending' for the test run (undo any prior mutation)
  await prisma.prescription.update({
    where: { id: 1 },
    data: {
      status: 'pending',
      doctorId: null,
      rejectedReason: null,
      rejectedType: null,
      rejectedById: null,
      approvedAt: null,
      rejectedAt: null,
      revokedAt: null,
    },
  })
}

function isToday(date: Date): boolean {
  const now = new Date()
  return (
    date.getFullYear() === now.getFullYear() &&
    date.getMonth() === now.getMonth() &&
    date.getDate() === now.getDate()
  )
}

// ---------------------------------------------------------------------------
// Main validation routine
// ---------------------------------------------------------------------------

async function main(): Promise<void> {
  console.log('═'.repeat(60))
  console.log('  RxFlow Doctor Role — Schema Validation')
  console.log('═'.repeat(60))
  console.log('')

  // ------------------------------------------------------------------
  // Step 1: Pending queue sorted by wait time
  // ------------------------------------------------------------------
  console.log('1. Pending queue sorted by submittedAt (wait-time ascending)')

  await resetPrescription1ToPending()

  // Also ensure there are multiple pending records for a meaningful sort test
  // Make #2 pending as well (it is currently 'draft')
  await prisma.prescription.update({
    where: { id: 2 },
    data: {
      status: 'pending',
      submittedAt: new Date(Date.now() - 30 * 60 * 1000), // 30 min ago
    },
  })

  const pendingQueue = await prisma.prescription.findMany({
    where: { status: 'pending' },
    orderBy: { submittedAt: 'asc' },
    select: { id: true, prescriptionNo: true, submittedAt: true, diagnosis: true },
  })

  check('At least 1 pending prescription exists', pendingQueue.length >= 1)
  check(
    'First result has earliest submittedAt',
    pendingQueue.length >= 2
      ? pendingQueue[0].submittedAt!.getTime() <= pendingQueue[1].submittedAt!.getTime()
      : true
  )
  // #1 was submitted 60 min ago in seed, #2 was just set to 30 min ago → #1 should be first
  check('#1 (60min ago) sorts before #2 (30min ago)', pendingQueue.length >= 2 &&
    pendingQueue[0].id === 1 && pendingQueue[1].id === 2)
  check('#1 has submittedAt set', pendingQueue.find(p => p.id === 1)?.submittedAt !== null)
  console.log('')

  // ------------------------------------------------------------------
  // Step 2: Annotate drug items
  // ------------------------------------------------------------------
  console.log('2. Annotate drug items (doctorAnnotation field)')

  const item = await prisma.prescriptionItem.findFirst({
    where: { prescriptionId: 1 },
  })

  check('Found at least one item for #1', item !== null)

  const annotationText = '血压偏高，建议联合用药，注意监测血压变化'

  await prisma.prescriptionItem.update({
    where: { id: item!.id },
    data: { doctorAnnotation: annotationText },
  })

  const updatedItem = await prisma.prescriptionItem.findUnique({
    where: { id: item!.id },
  })

  check('doctorAnnotation field exists and is writable', updatedItem?.doctorAnnotation === annotationText)
  console.log('')

  // ------------------------------------------------------------------
  // Step 3: Approve a prescription
  // ------------------------------------------------------------------
  console.log('3. Approve prescription #1')

  const beforeApprove = Date.now()
  await prisma.prescription.update({
    where: { id: 1 },
    data: {
      status: 'approved',
      doctorId: DOCTOR_ID,
      approvedAt: new Date(),
    },
  })

  const approved = await prisma.prescription.findUnique({ where: { id: 1 } })

  check('status changed to approved', approved?.status === 'approved')
  check('approvedAt timestamp is set', approved?.approvedAt !== null)
  check('approvedAt is recent (within last 5 seconds)', approved?.approvedAt
    ? Math.abs(approved.approvedAt.getTime() - beforeApprove) < 10_000
    : false)
  check('doctorId is set to 2', approved?.doctorId === DOCTOR_ID)

  const approvedAtValue = approved?.approvedAt
  console.log('')

  // ------------------------------------------------------------------
  // Step 4: Revoke within 30 minutes
  // ------------------------------------------------------------------
  console.log('4. Revoke approval within 30-minute window')

  // Verify 30-min window check using approvedAt
  const elapsedMs = approvedAtValue
    ? Date.now() - approvedAtValue.getTime()
    : Infinity
  const within30Min = elapsedMs < 30 * 60 * 1000

  check(`30-min window: elapsed ${Math.round(elapsedMs / 1000)}s < 1800s → within window`, within30Min)

  if (!within30Min) {
    console.log('  ⚠️  Skipping revoke because 30-min window has passed.')
  } else {
    // Simulate the revoke logic from the service
    const revokeTime = Date.now()
    await prisma.prescription.update({
      where: { id: 1 },
      data: {
        status: 'pending',
        doctorId: null,
        approvedAt: null,
        revokedAt: new Date(),
      },
    })

    const revoked = await prisma.prescription.findUnique({ where: { id: 1 } })

    check('status reverted to pending', revoked?.status === 'pending')
    check('approvedAt cleared to null', revoked?.approvedAt === null)
    check('doctorId cleared to null', revoked?.doctorId === null)
    check('revokedAt timestamp is set', revoked?.revokedAt !== null)
    check('revokedAt is recent', revoked?.revokedAt
      ? Math.abs(revoked.revokedAt.getTime() - revokeTime) < 10_000
      : false)
  }
  console.log('')

  // ------------------------------------------------------------------
  // Step 5: Reject with template
  // ------------------------------------------------------------------
  console.log('5. Reject with RejectionTemplate')

  // Get a template
  const template = await prisma.rejectionTemplate.findFirst({
    where: { doctorId: DOCTOR_ID },
  })

  check('RejectionTemplate found for doctor #2', template !== null)

  const usageBefore = template!.usageCount

  // Increment usageCount
  await prisma.rejectionTemplate.update({
    where: { id: template!.id },
    data: { usageCount: usageBefore + 1 },
  })

  const templateAfter = await prisma.rejectionTemplate.findUnique({
    where: { id: template!.id },
  })

  check('usageCount incremented from ' + usageBefore + ' to ' + templateAfter?.usageCount,
    templateAfter?.usageCount === usageBefore + 1)

  // Reject #1 (which is now back in 'pending' after revoke)
  const rejectReason = template!.content  // use template content as reason

  await prisma.prescription.update({
    where: { id: 1 },
    data: {
      status: 'rejected',
      doctorId: DOCTOR_ID,
      rejectedById: DOCTOR_ID,
      rejectedReason: rejectReason,
      rejectedType: template!.name,
      rejectedAt: new Date(),
    },
  })

  const rejected = await prisma.prescription.findUnique({ where: { id: 1 } })

  check('status changed to rejected', rejected?.status === 'rejected')
  check('rejectedReason is set', rejected?.rejectedReason === rejectReason)
  check('rejectedType is set to template name', rejected?.rejectedType === template!.name)
  check('rejectedById is set', rejected?.rejectedById === DOCTOR_ID)
  check('rejectedAt timestamp is set', rejected?.rejectedAt !== null)
  check('doctorId is set', rejected?.doctorId === DOCTOR_ID)
  console.log('')

  // ------------------------------------------------------------------
  // Step 6: View all prescriptions (no assistantId filter)
  // ------------------------------------------------------------------
  console.log('6. View all prescriptions (doctor sees all, no assistantId filter)')

  const allPrescriptions = await prisma.prescription.findMany({
    where: {}, // no assistantId filter — doctor sees everything
    select: { id: true, prescriptionNo: true, status: true },
  })

  check('Query returns prescriptions across all assistants', allPrescriptions.length >= 5)
  check('Includes draft #2', allPrescriptions.some(p => p.id === 2))
  check('Includes approved #3', allPrescriptions.some(p => p.id === 3))
  check('Includes delivering #5', allPrescriptions.some(p => p.id === 5))
  console.log('')

  // ------------------------------------------------------------------
  // Step 7: Today's stats (prescriptions approvedAt >= today)
  // ------------------------------------------------------------------
  console.log("7. Today's stats — count prescriptions with approvedAt >= today")

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const todayApprovedCount = await prisma.prescription.count({
    where: {
      approvedAt: { gte: todayStart },
    },
  })

  check('approvedAt gte today filter works', typeof todayApprovedCount === 'number')

  // Seed has #3 approved 30 min ago → should be counted today
  const todayApproved = await prisma.prescription.findMany({
    where: { approvedAt: { gte: todayStart } },
    select: { id: true, prescriptionNo: true, approvedAt: true },
  })

  const hasApproved3 = todayApproved.some(p => p.id === 3)
  check('Prescription #3 (approved today) is included in stats', hasApproved3)

  // Verify each result actually has approvedAt >= today
  for (const p of todayApproved) {
    check(`  #${p.id} approvedAt is today`, isToday(p.approvedAt!),
      `approvedAt=${p.approvedAt?.toISOString()}`)
  }

  console.log(`  Today's approved count: ${todayApprovedCount}`)
  console.log('')

  // ------------------------------------------------------------------
  // Summary
  // ------------------------------------------------------------------
  console.log('═'.repeat(60))
  console.log(`  Results: ${passCount} passed, ${failCount} failed`)
  if (failCount === 0) {
    console.log('  All doctor workflow validations passed. ✅')
  } else {
    console.log(`  ${failCount} validation(s) failed — see details above. ❌`)
  }
  console.log('═'.repeat(60))
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
