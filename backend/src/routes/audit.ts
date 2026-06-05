import { Router } from 'express'
import { auth } from '../middleware/auth'

const router = Router()

router.get('/', auth, async (req, res) => {
  // TODO: Phase 4 implementation
  res.json({ data: [], total: 0, page: 1, pageSize: 20, message: 'Audit log endpoint — Phase 4' })
})

export default router
