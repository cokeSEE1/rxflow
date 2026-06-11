import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import * as service from '../services/consultationService'

const router = Router()
router.use(auth)

router.get('/', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.listConsultations(req.query)) } catch (e) { next(e) }
})
router.get('/:id', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getConsultation(parseInt(req.params.id))) } catch (e) { next(e) }
})
router.post('/', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await service.createConsultation({ ...req.body, doctorId: req.user!.userId })) } catch (e) { next(e) }
})
router.put('/:id', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.updateConsultation(parseInt(req.params.id), req.user!.userId, req.body)) } catch (e) { next(e) }
})
router.post('/:id/start', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.startConsultation(parseInt(req.params.id), req.user!.userId)) } catch (e) { next(e) }
})
router.post('/:id/complete', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.completeConsultation(parseInt(req.params.id), req.user!.userId)) } catch (e) { next(e) }
})
router.get('/:id/prescriptions', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getConsultationPrescriptions(parseInt(req.params.id))) } catch (e) { next(e) }
})

export default router
