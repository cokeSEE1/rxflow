import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

let passed = 0
let failed = 0
const missingFields: string[] = []

function check(step: string, condition: boolean, detail?: string): void {
  if (condition) {
    console.log(`✅ PASS: ${step}${detail ? ` (${detail})` : ''}`)
    passed++
  } else {
    console.log(`❌ FAIL: ${step}${detail ? ` (${detail})` : ''}`)
    failed++
  }
}

function fieldMissing(fieldName: string): void {
  if (!missingFields.includes(fieldName)) {
    missingFields.push(fieldName)
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log('══════════════════════════════════════════════════')
  console.log('  RxFlow Patient (患者) Role — Schema Validation')
  console.log('══════════════════════════════════════════════════\n')

  // ------------------------------------------------------------------
  // Step 1: View my prescriptions
  // ------------------------------------------------------------------
  console.log('── Step 1: View My Prescriptions ──\n')

  // 1a. Query by patient phone number (through Patient relation)
  const myPrescriptionsByPhone = await prisma.prescription.findMany({
    where: { patient: { phone: '13800004444' } },
    include: { patient: true },
    orderBy: { id: 'asc' },
  })
  check(
    'Query prescriptions by patient phone',
    myPrescriptionsByPhone.length === 3,
    `expected 3, got ${myPrescriptionsByPhone.length}`
  )
  console.log(
    `   Found prescriptions: ${myPrescriptionsByPhone.map(p => `#${p.id} ${p.status}`).join(', ')}`
  )

  // 1b. Verify patientId filter works directly
  const myPrescriptionsByPatientId = await prisma.prescription.findMany({
    where: { patientId: 1 },
    orderBy: { id: 'asc' },
  })
  check(
    'Query prescriptions by patientId',
    myPrescriptionsByPatientId.length === 3,
    `expected 3, got ${myPrescriptionsByPatientId.length}`
  )

  // 1c. Verify all returned prescriptions actually belong to this patient
  const allMatchPatient = myPrescriptionsByPhone.every(
    p => p.patient?.phone === '13800004444'
  )
  check(
    'All returned prescriptions belong to patient 13800004444',
    allMatchPatient
  )
  console.log(`   Statuses: ${myPrescriptionsByPhone.map(p => p.status).join(', ')}`)

  // 1d. Verify draft/rejected prescriptions do NOT appear for this patient
  const draftOrRejected = myPrescriptionsByPhone.filter(
    p => p.status === 'draft' || p.status === 'rejected'
  )
  check(
    'No draft or rejected prescriptions for 赵建国',
    draftOrRejected.length === 0,
    `found ${draftOrRejected.length} unexpected`
  )

  // ------------------------------------------------------------------
  // Step 2: Delivery tracking
  // ------------------------------------------------------------------
  console.log('\n── Step 2: Delivery Tracking ──\n')

  const delivering = await prisma.prescription.findFirst({
    where: { status: 'delivering', patient: { phone: '13800004444' } },
    include: { courier: true },
  })
  check('Found delivering prescription', delivering !== null)
  if (!delivering) throw new Error('Cannot continue: no delivering prescription')

  check(
    'status = delivering',
    delivering.status === 'delivering',
    `got: ${delivering.status}`
  )

  check(
    'estimatedDelivery is set',
    delivering.estimatedDelivery !== null,
    `got: ${delivering.estimatedDelivery}`
  )
  if (!delivering.estimatedDelivery) {
    fieldMissing('Prescription.estimatedDelivery')
  }

  check(
    'trackingNo is set (non-null string)',
    typeof delivering.trackingNo === 'string' && delivering.trackingNo.length > 0,
    `got: ${delivering.trackingNo}`
  )
  if (!delivering.trackingNo) {
    fieldMissing('Prescription.trackingNo')
  }

  check(
    'courier relation exists',
    delivering.courier !== null,
    `courierId=${delivering.courierId}`
  )
  if (!delivering.courier) {
    fieldMissing('Prescription.courier (relation)')
  } else {
    check(
      'courier.name',
      delivering.courier.name === '王师傅',
      `got: ${delivering.courier.name}`
    )
    if (!delivering.courier.name) fieldMissing('User.name')

    check(
      'courier.phone',
      delivering.courier.phone === '13800003333',
      `got: ${delivering.courier.phone}`
    )
    if (!delivering.courier.phone) fieldMissing('User.phone')
  }

  // ------------------------------------------------------------------
  // Step 3: Prescription timeline
  // ------------------------------------------------------------------
  console.log('\n── Step 3: Prescription Timeline ──\n')

  const timeline = await prisma.prescriptionTimeline.findMany({
    where: { prescriptionId: delivering.id },
    orderBy: { createdAt: 'asc' },
  })
  check(
    'Timeline has entries',
    timeline.length >= 4,
    `expected >= 4, got ${timeline.length}`
  )

  const expectedActions = ['created', 'submitted', 'approved', 'picked_up']
  for (const action of expectedActions) {
    const entry = timeline.find(t => t.action === action)
    check(
      `Timeline action: ${action}`,
      entry !== undefined,
      entry ? `${entry.operatorName} at ${entry.createdAt}` : 'MISSING'
    )
    if (!entry) continue
    if (!entry.operatorId) fieldMissing('PrescriptionTimeline.operatorId')
    if (!entry.operatorName) fieldMissing('PrescriptionTimeline.operatorName')
    if (!entry.createdAt) fieldMissing('PrescriptionTimeline.createdAt')
    if (entry.detail === null) {
      // detail is optional, but useful — not a failure
    }
  }

  const actualActions = timeline.map(t => t.action)
  console.log(`   All actions: ${actualActions.join(' → ')}`)

  // ------------------------------------------------------------------
  // Step 4: Request SMS verification code
  // ------------------------------------------------------------------
  console.log('\n── Step 4: Request SMS Verification Code ──\n')

  const patientPhone = '13800004444'
  const smsCode = String(Math.floor(100000 + Math.random() * 900000))
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000)

  const smsRecord = await prisma.smsVerification.create({
    data: {
      prescriptionId: delivering.id,
      phone: patientPhone,
      code: smsCode,
      expiresAt,
    },
  })
  check('SmsVerification record created', smsRecord.id > 0)
  check('phone number saved', smsRecord.phone === patientPhone, `got: ${smsRecord.phone}`)
  check(
    'code is 6 digits',
    /^\d{6}$/.test(smsRecord.code),
    `got: ${smsRecord.code}`
  )
  if (!/^\d{6}$/.test(smsRecord.code)) fieldMissing('SmsVerification.code (should be 6-digit)')

  const timeDiff = Math.abs(smsRecord.expiresAt.getTime() - expiresAt.getTime())
  check(
    'expiresAt ~5 min from now',
    timeDiff < 2000,
    `diff: ${timeDiff}ms`
  )
  if (!smsRecord.expiresAt) fieldMissing('SmsVerification.expiresAt')

  check('isVerified defaults to false', smsRecord.isVerified === false)
  check('attemptCount defaults to 0', smsRecord.attemptCount === 0)

  // ------------------------------------------------------------------
  // Step 5: Verify SMS code
  // ------------------------------------------------------------------
  console.log('\n── Step 5: Verify SMS Code ──\n')

  // 5a. Correct code → verified
  await prisma.smsVerification.update({
    where: { id: smsRecord.id },
    data: { isVerified: true, verifiedAt: new Date() },
  })
  const verified = await prisma.smsVerification.findUnique({
    where: { id: smsRecord.id },
  })
  check('Correct code → isVerified = true', verified?.isVerified === true)
  check('Correct code → verifiedAt is set', verified?.verifiedAt !== null)

  // 5b. Wrong code → attemptCount increments
  const wrongCodeRecord = await prisma.smsVerification.create({
    data: {
      prescriptionId: delivering.id,
      phone: patientPhone,
      code: '999999',
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  })
  // Simulate 1 wrong attempt
  await prisma.smsVerification.update({
    where: { id: wrongCodeRecord.id },
    data: { attemptCount: { increment: 1 } },
  })
  const afterWrong = await prisma.smsVerification.findUnique({
    where: { id: wrongCodeRecord.id },
  })
  check('Wrong code → attemptCount increments', afterWrong?.attemptCount === 1)

  // 5c. 3 failed attempts → locked out
  await prisma.smsVerification.update({
    where: { id: wrongCodeRecord.id },
    data: { attemptCount: 3 },
  })
  const lockedOut = await prisma.smsVerification.findUnique({
    where: { id: wrongCodeRecord.id },
  })
  check('3 failed attempts → attemptCount = 3', lockedOut?.attemptCount === 3)
  check(
    'Locked out (attemptCount >= 3 → need new code)',
    (lockedOut?.attemptCount ?? 0) >= 3
  )

  // 5d. Expired code
  const expiredRecord = await prisma.smsVerification.create({
    data: {
      prescriptionId: delivering.id,
      phone: patientPhone,
      code: '111111',
      expiresAt: new Date(Date.now() - 1 * 60 * 1000), // 1 min in the past
    },
  })
  const now = new Date()
  check(
    'Expired code → expiresAt < now',
    expiredRecord.expiresAt < now,
    '模拟 "验证码已过期" 场景'
  )

  // ------------------------------------------------------------------
  // Step 6: Confirm receipt
  // ------------------------------------------------------------------
  console.log('\n── Step 6: Confirm Receipt ──\n')

  // Save original state so we can restore it
  const originalStatus = delivering.status
  const originalDeliveredAt = delivering.deliveredAt
  const originalDeliveryMethod = delivering.deliveryMethod

  await prisma.prescription.update({
    where: { id: delivering.id },
    data: {
      status: 'received',
      deliveredAt: new Date(),
      deliveryMethod: 'sms',
    },
  })
  // Add timeline entry for this delivery confirmation
  await prisma.prescriptionTimeline.create({
    data: {
      prescriptionId: delivering.id,
      action: 'delivered',
      operatorId: 4, // patient user
      operatorName: '赵建国',
      detail: '患者确认签收（短信验证）',
    },
  })

  const received = await prisma.prescription.findUnique({
    where: { id: delivering.id },
  })
  check('status changed to received', received?.status === 'received')
  check('deliveredAt timestamp set', received?.deliveredAt !== null)
  if (!received?.deliveredAt) fieldMissing('Prescription.deliveredAt')
  check(
    'deliveryMethod = sms',
    received?.deliveryMethod === 'sms',
    `got: ${received?.deliveryMethod}`
  )
  if (!received?.deliveryMethod) fieldMissing('Prescription.deliveryMethod')

  // ------------------------------------------------------------------
  // Step 7: View prescription status card
  // ------------------------------------------------------------------
  console.log('\n── Step 7: View Prescription Status Card ──\n')

  const fullPrescription = await prisma.prescription.findUnique({
    where: { id: delivering.id },
    include: {
      items: true,
      timeline: { orderBy: { createdAt: 'asc' } },
      courier: true,
    },
  })

  check('Prescription found', fullPrescription !== null)
  if (!fullPrescription) throw new Error('Cannot continue')

  // Items — verify the items relation works and each item has required fields
  check(
    'Has PrescriptionItem records',
    fullPrescription.items.length >= 1,
    `found ${fullPrescription.items.length} item(s)`
  )

  for (const item of fullPrescription.items) {
    check(`Item drugName: ${item.drugName}`, item.drugName.length > 0)
    if (!item.drugName) fieldMissing('PrescriptionItem.drugName')

    check(`Item dosage: ${item.dosage}`, item.dosage.length > 0, `for ${item.drugName}`)
    if (!item.dosage) fieldMissing('PrescriptionItem.dosage')

    check(`Item frequency: ${item.frequency}`, item.frequency.length > 0, `for ${item.drugName}`)
    if (!item.frequency) fieldMissing('PrescriptionItem.frequency')

    check(`Item days: ${item.days}`, item.days > 0, `for ${item.drugName}`)
    if (!item.days) fieldMissing('PrescriptionItem.days')
  }

  // Full timeline (including the newly added 'delivered' entry)
  const fullTimeline = fullPrescription.timeline
  check(
    'Timeline now includes delivered action',
    fullTimeline.some(t => t.action === 'delivered'),
    `actions: ${fullTimeline.map(t => t.action).join(', ')}`
  )

  console.log('\n   Timeline:')
  for (const t of fullTimeline) {
    console.log(`     ${t.action} | ${t.operatorName} | ${t.createdAt.toISOString()}`)
  }

  // ------------------------------------------------------------------
  // Cleanup: restore prescription #5 to original state
  // ------------------------------------------------------------------
  console.log(`\n── Cleanup: Restoring prescription #${delivering.id} ──`)

  await prisma.prescription.update({
    where: { id: delivering.id },
    data: {
      status: originalStatus,
      deliveredAt: originalDeliveredAt,
      deliveryMethod: originalDeliveryMethod,
    },
  })
  // Remove the 'delivered' timeline entry we added
  await prisma.prescriptionTimeline.deleteMany({
    where: {
      prescriptionId: delivering.id,
      action: 'delivered',
      operatorId: 4,
    },
  })

  // Remove test SMS verification records
  await prisma.smsVerification.deleteMany({
    where: {
      prescriptionId: delivering.id,
    },
  })

  console.log(`   Prescription #${delivering.id} restored to original state.`)

  // ------------------------------------------------------------------
  // Report
  // ------------------------------------------------------------------
  console.log('\n══════════════════════════════════════════════════')
  console.log('  Validation Report')
  console.log('══════════════════════════════════════════════════')
  console.log(`  ✅ Passed: ${passed}`)
  console.log(`  ❌ Failed: ${failed}`)
  console.log(`  Total:    ${passed + failed}`)

  if (missingFields.length > 0) {
    console.log(`\n  ⚠️  Missing / non-functional fields:`)
    for (const f of missingFields) {
      console.log(`     - ${f}`)
    }
  } else {
    console.log(`\n  ✅ All required fields are present and functional.`)
  }

  console.log('══════════════════════════════════════════════════\n')

  if (failed > 0) {
    process.exitCode = 1
  }
}

main()
  .catch((e) => {
    console.error('Fatal error:', e)
    process.exitCode = 2
  })
  .finally(() => prisma.$disconnect())
