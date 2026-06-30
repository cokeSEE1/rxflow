import { Router, Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import * as service from '../services/allergenService'

const prisma = new PrismaClient()
const router = Router()
router.use(auth)

router.get(
  '/',
  requireRole('assistant', 'doctor', 'pharmacist'),
  async (_req: Request, res: Response, next: NextFunction) => {
    try {
      const data = await prisma.allergen.findMany({ orderBy: { category: 'asc' } })
      res.json({ data })
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
      res.status(201).json(await service.createAllergen(req.body))
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
      res.json(await service.updateAllergen(parseInt(req.params.id), req.body))
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
      res.json(await service.deleteAllergen(parseInt(req.params.id)))
    } catch (e) {
      next(e)
    }
  },
)

export default router
