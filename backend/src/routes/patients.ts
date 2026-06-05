import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import * as service from '../services/patientService'

const router = Router()
router.use(auth)

router.get('/', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.listPatients(req.query)) } catch (e) { next(e) }
})
router.get('/:id', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getPatient(parseInt(req.params.id))) } catch (e) { next(e) }
})
router.post('/', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await service.createPatient(req.body)) } catch (e) { next(e) }
})
router.put('/:id', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.updatePatient(parseInt(req.params.id), req.body)) } catch (e) { next(e) }
})
router.delete('/:id', requireRole('assistant', 'doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.deletePatient(parseInt(req.params.id))) } catch (e) { next(e) }
})

export default router
