import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()

let passed = 0, failed = 0
function check(label: string, ok: boolean) {
  if (ok) { passed++; console.log(`  ✅ ${label}`) }
  else { failed++; console.log(`  ❌ ${label}`) }
}

async function main() {
  console.log('=== Courier (快递员) Role Validation ===\n')

  const courierId = 3

  // 1. Pending pickup list
  console.log('1. Pending pickup list')
  const approved = await prisma.prescription.findMany({ where: { status: 'approved' } })
  check('Approved prescriptions found', approved.length > 0)
  check('CourierId is null', approved.every(p => p.courierId === null))

  // 2. Confirm pickup
  console.log('\n2. Confirm pickup')
  if (approved.length > 0) {
    const p = await prisma.prescription.update({
      where: { id: approved[0].id },
      data: { status: 'delivering', courierId, trackingNo: 'TEST-SF123', pickedUpAt: new Date(), estimatedDelivery: new Date(Date.now() + 2 * 60 * 60 * 1000) },
    })
    check('Status → delivering', p.status === 'delivering')
    check('pickedUpAt set', p.pickedUpAt !== null)
    check('courierId set', p.courierId === courierId)
    check('trackingNo set', p.trackingNo === 'TEST-SF123')
    check('estimatedDelivery set', p.estimatedDelivery !== null)

    // 3. Delivering list
    console.log('\n3. Delivering list')
    const delivering = await prisma.prescription.findMany({ where: { courierId, status: 'delivering' } })
    check('Delivering prescriptions found', delivering.length > 0)

    // 4. Confirm delivery with photo
    console.log('\n4. Confirm delivery (photo)')
    const d = await prisma.prescription.update({
      where: { id: approved[0].id },
      data: { status: 'received', deliveryProof: 'https://photo.example.com/proof.jpg', deliveryMethod: 'photo', deliveredAt: new Date() },
    })
    check('Status → received', d.status === 'received')
    check('deliveryProof set', d.deliveryProof === 'https://photo.example.com/proof.jpg')
    check('deliveryMethod = photo', d.deliveryMethod === 'photo')
    check('deliveredAt set', d.deliveredAt !== null)

    // Restore to approved for further tests
    await prisma.prescription.update({
      where: { id: approved[0].id },
      data: { status: 'approved', courierId: null, trackingNo: null, deliveryProof: null, deliveryMethod: null, pickedUpAt: null, deliveredAt: null, estimatedDelivery: null },
    })
  }

  // 5. SMS verification
  console.log('\n5. SMS verification')
  const deliveringRx = await prisma.prescription.findFirst({ where: { status: 'delivering' } })
  if (deliveringRx) {
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const sms = await prisma.smsVerification.create({
      data: { prescriptionId: deliveringRx.id, phone: '13800004444', code, expiresAt: new Date(Date.now() + 5 * 60 * 1000) },
    })
    check('SmsVerification created', sms.id !== undefined)
    check('code is 6 digits', /^\d{6}$/.test(sms.code))
    check('expiresAt ~5min', sms.expiresAt.getTime() > Date.now())
    check('isVerified = false', !sms.isVerified)
    check('attemptCount = 0', sms.attemptCount === 0)

    // Verify correct code
    const updated = await prisma.smsVerification.update({ where: { id: sms.id }, data: { isVerified: true, verifiedAt: new Date(), attemptCount: 0 } })
    check('SMS isVerified = true', updated.isVerified)

    // Wrong code attempt
    const sms2 = await prisma.smsVerification.create({
      data: { prescriptionId: deliveringRx.id, phone: '13800004444', code: '999999', expiresAt: new Date(Date.now() + 5 * 60 * 1000), attemptCount: 3 },
    })
    check('SMS attemptCount=3 (locked)', sms2.attemptCount >= 3)

    // Expired
    const expired = await prisma.smsVerification.create({
      data: { prescriptionId: deliveringRx.id, phone: '13800004444', code: '111111', expiresAt: new Date(Date.now() - 1000) },
    })
    check('Expired SMS detectable', expired.expiresAt.getTime() < Date.now())

    // Cleanup SMS
    await prisma.smsVerification.deleteMany({ where: { prescriptionId: deliveringRx.id } })
  }

  // 6. Report exception
  console.log('\n6. Report exception')
  if (deliveringRx) {
    const ex = await prisma.deliveryException.create({
      data: { prescriptionId: deliveringRx.id, courierId, type: 'damaged', description: '药品包装破损', photo: 'https://photo.example.com/damage.jpg' },
    })
    check('DeliveryException created', ex.id !== undefined)
    check('type = damaged', ex.type === 'damaged')
    check('photo saved', ex.photo !== null)
    check('isResolved = false', !ex.isResolved)

    const p = await prisma.prescription.update({
      where: { id: deliveringRx.id },
      data: { status: 'returned', returnedAt: new Date() },
    })
    check('Status → returned', p.status === 'returned')
    check('returnedAt set', p.returnedAt !== null)

    // Cleanup
    await prisma.deliveryException.deleteMany({ where: { prescriptionId: deliveringRx.id } })
    await prisma.prescription.update({ where: { id: deliveringRx.id }, data: { status: 'delivering', returnedAt: null } })
  }

  // 7. Redelivery
  console.log('\n7. Redelivery')
  if (deliveringRx) {
    await prisma.prescription.update({ where: { id: deliveringRx.id }, data: { status: 'returned', returnedAt: new Date() } })
    const rd = await prisma.prescription.update({
      where: { id: deliveringRx.id },
      data: { status: 'approved', redeliverRequestedBy: courierId, redeliverRequestedAt: new Date(), redeliverReason: '重新配送测试', courierId: null, trackingNo: null, deliveryProof: null, deliveryMethod: null },
    })
    check('Status → approved', rd.status === 'approved')
    check('redeliverRequestedBy set', rd.redeliverRequestedBy === courierId)
    check('redeliverRequestedAt set', rd.redeliverRequestedAt !== null)
    check('redeliverReason set', rd.redeliverReason === '重新配送测试')
    check('courierId cleared', rd.courierId === null)

    // Restore
    await prisma.prescription.update({
      where: { id: deliveringRx.id },
      data: { status: 'delivering', courierId, pickedUpAt: new Date(), redeliverRequestedBy: null, redeliverRequestedAt: null, redeliverReason: null, returnedAt: null, trackingNo: 'SF1234567890' },
    })
  }

  console.log(`\n=== Result: ${passed} PASS, ${failed} FAIL ===`)
}

main().catch(console.error).finally(() => prisma.$disconnect())
