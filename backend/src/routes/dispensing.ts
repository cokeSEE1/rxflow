import { Router } from 'express'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import {
  getDispensingQueue,
  getDispensingStats,
  startDispensing,
  completeDispensing,
} from '../services/dispensingService'

const router = Router()

router.get('/queue', auth, requireRole('pharmacist'), async (_req, res, next) => {
  try {
    const result = await getDispensingQueue()
    res.json(result)
  } catch (e) {
    next(e)
  }
})

router.get('/stats', auth, requireRole('pharmacist'), async (_req, res, next) => {
  try {
    const result = await getDispensingStats()
    res.json(result)
  } catch (e) {
    next(e)
  }
})

router.post('/:prescriptionId/start', auth, requireRole('pharmacist'), async (req, res, next) => {
  try {
    const result = await startDispensing(parseInt(req.params.prescriptionId), req.user!.userId)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

router.post('/:prescriptionId/complete', auth, requireRole('pharmacist'), async (req, res, next) => {
  try {
    const result = await completeDispensing(
      parseInt(req.params.prescriptionId),
      req.user!.userId,
      req.body,
    )
    res.json(result)
  } catch (e) {
    next(e)
  }
})

export default router
