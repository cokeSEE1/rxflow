import { Router } from 'express'
import { auth } from '../middleware/auth'

const router = Router()

router.post('/sign', auth, async (req, res) => {
  // TODO: Phase 4 implementation
  res.json({ message: 'Signature endpoint — Phase 4', signed: true })
})

router.get('/verify/:prescriptionId', auth, async (req, res) => {
  res.json({ message: `Verify signatures for prescription ${req.params.prescriptionId} — Phase 4`, valid: true })
})

export default router
