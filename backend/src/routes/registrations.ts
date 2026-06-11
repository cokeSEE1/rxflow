import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import * as service from '../services/registrationService'

const router = Router()
router.use(auth)

router.get('/', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.listRegistrations(req.query)) } catch (e) { next(e) }
})
router.get('/:id', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getRegistration(parseInt(req.params.id))) } catch (e) { next(e) }
})
router.post('/', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await service.createRegistration(req.body)) } catch (e) { next(e) }
})

export default router
