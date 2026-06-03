import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import * as service from '../services/notificationService'

const router = Router()
router.use(auth)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.listNotifications(req.user!.userId, req.query)) } catch (e) { next(e) }
})
router.put('/:id/read', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.markAsRead(parseInt(req.params.id), req.user!.userId)) } catch (e) { next(e) }
})
router.put('/read-all', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.markAllRead(req.user!.userId)) } catch (e) { next(e) }
})

export default router
