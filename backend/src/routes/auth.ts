import { Router, Request, Response, NextFunction } from 'express'
import { login, refreshAccessToken, getMe } from '../services/authService'
import { auth } from '../middleware/auth'

const router = Router()

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body
    if (!phone || !password) {
      res.status(400).json({ error: '手机号和密码不能为空' })
      return
    }
    const result = await login(phone, password)
    res.json(result)
  } catch (e) { next(e) }
})

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      res.status(400).json({ error: 'refreshToken 不能为空' })
      return
    }
    const accessToken = await refreshAccessToken(refreshToken)
    res.json({ accessToken })
  } catch (e) { next(e) }
})

router.get('/me', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getMe(req.user!.userId)
    res.json(user)
  } catch (e) { next(e) }
})

export default router
