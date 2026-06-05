import { Router } from 'express'
import { auth } from '../middleware/auth'
import { listDrugs, getDrug, searchDrugs } from '../services/drugService'

const router = Router()

// Static routes MUST precede /:id parameterized route
router.get('/search', auth, async (req, res, next) => {
  try {
    const result = await searchDrugs(req.query as any)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

router.get('/', auth, async (req, res, next) => {
  try {
    const result = await listDrugs(req.query as any)
    res.json(result)
  } catch (e) {
    next(e)
  }
})

router.get('/:id', auth, async (req, res, next) => {
  try {
    const result = await getDrug(parseInt(req.params.id))
    res.json(result)
  } catch (e) {
    next(e)
  }
})

export default router
