import { Router, Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'

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

export default router
