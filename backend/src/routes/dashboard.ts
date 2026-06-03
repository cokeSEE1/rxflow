import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import * as service from '../services/dashboardService'

const router = Router()
router.use(auth)

router.get('/stats', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getDashboardStats(req.user!.userId, req.user!.role)) } catch (e) { next(e) }
})

export default router
