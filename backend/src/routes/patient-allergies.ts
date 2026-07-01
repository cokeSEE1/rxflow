import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import * as service from '../services/allergyService'

const router = Router()
router.use(auth)

router.get(
  '/',
  requireRole('assistant', 'doctor', 'pharmacist'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await service.listPatientAllergies(req.query))
    } catch (e) {
      next(e)
    }
  },
)

router.get(
  '/stats',
  requireRole('assistant', 'doctor', 'pharmacist'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await service.getAllergyStats())
    } catch (e) {
      next(e)
    }
  },
)

// ⚠️ Static path /sort-orders MUST be before /:id routes
router.put(
  '/sort-orders',
  requireRole('assistant', 'doctor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await service.updateSortOrders(req.body.orders))
    } catch (e) {
      next(e)
    }
  },
)

router.get(
  '/:id',
  requireRole('assistant', 'doctor', 'pharmacist'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await service.getPatientAllergy(parseInt(req.params.id)))
    } catch (e) {
      next(e)
    }
  },
)

router.post(
  '/',
  requireRole('assistant', 'doctor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(await service.createPatientAllergy(req.body))
    } catch (e) {
      next(e)
    }
  },
)

router.put(
  '/:id',
  requireRole('assistant', 'doctor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await service.updatePatientAllergy(parseInt(req.params.id), req.body))
    } catch (e) {
      next(e)
    }
  },
)

router.patch(
  '/:id/pin',
  requireRole('assistant', 'doctor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await service.setPin(parseInt(req.params.id), req.body.pinned))
    } catch (e) {
      next(e)
    }
  },
)

router.delete(
  '/:id',
  requireRole('assistant', 'doctor'),
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(await service.deletePatientAllergy(parseInt(req.params.id)))
    } catch (e) {
      next(e)
    }
  },
)

export default router
