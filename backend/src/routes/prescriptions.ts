import { Router, Request, Response, NextFunction } from 'express'
import { auth } from '../middleware/auth'
import { requireRole } from '../middleware/role'
import * as service from '../services/prescriptionService'

const router = Router()
router.use(auth)

router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.listPrescriptions(req.user!.role, req.user!.userId, req.query)) } catch (e) { next(e) }
})

router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getPrescription(parseInt(req.params.id), req.user!.role, req.user!.userId)) } catch (e) { next(e) }
})

router.post('/', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await service.createPrescription({ ...req.body, assistantId: req.user!.userId })) } catch (e) { next(e) }
})

router.put('/:id', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.updateDraft(parseInt(req.params.id), req.user!.userId, req.body)) } catch (e) { next(e) }
})

router.delete('/:id', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { PrismaClient } = require('@prisma/client')
    const prisma = new PrismaClient()
    const p = await prisma.prescription.findUnique({ where: { id: parseInt(req.params.id) } })
    if (!p) { res.status(404).json({ error: '处方不存在' }); return }
    if (p.status !== 'draft') { res.status(400).json({ error: '只能删除草稿' }); return }
    if (p.assistantId !== req.user!.userId) { res.status(403).json({ error: '只能删除自己的处方' }); return }
    await prisma.prescriptionItem.deleteMany({ where: { prescriptionId: p.id } })
    await prisma.prescriptionTimeline.deleteMany({ where: { prescriptionId: p.id } })
    await prisma.prescription.delete({ where: { id: p.id } })
    res.json({ success: true })
  } catch (e) { next(e) }
})

router.post('/:id/submit', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.submitForReview(parseInt(req.params.id), req.user!.userId)) } catch (e) { next(e) }
})

router.post('/:id/approve', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.approve(parseInt(req.params.id), req.user!.userId)) } catch (e) { next(e) }
})

router.post('/:id/reject', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.reject(parseInt(req.params.id), req.user!.userId, req.body.reason, req.body.type || 'normal')) } catch (e) { next(e) }
})

router.post('/:id/revoke', requireRole('doctor'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.revokeApproval(parseInt(req.params.id), req.user!.userId, req.body.reason || '医生主动撤回')) } catch (e) { next(e) }
})

router.post('/:id/pickup', requireRole('courier'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.pickup(parseInt(req.params.id), req.user!.userId)) } catch (e) { next(e) }
})

router.post('/:id/deliver', requireRole('courier'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.confirmDelivery(parseInt(req.params.id), req.user!.userId, req.body.proof)) } catch (e) { next(e) }
})

router.post('/:id/exception', requireRole('courier'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.reportException(parseInt(req.params.id), req.user!.userId, req.body.exType, req.body.desc, req.body.photo)) } catch (e) { next(e) }
})

router.post('/templates', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.status(201).json(await service.saveTemplate(req.user!.userId, req.body.name, req.body.diagnosis, req.body.items)) } catch (e) { next(e) }
})

router.get('/templates', requireRole('assistant'), async (req: Request, res: Response, next: NextFunction) => {
  try { res.json(await service.getTemplates(req.user!.userId)) } catch (e) { next(e) }
})

export default router
