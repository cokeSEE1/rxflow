import { Router, Request, Response, NextFunction } from 'express'
import { login, refreshAccessToken, getMe, logout } from '../services/authService'
import { auth } from '../middleware/auth'
import { AppError } from '../middleware/errorHandler'

const router = Router()

function validateLoginInput(phone: string, password: string) {
  if (!phone || !password) throw new AppError(400, '手机号和密码不能为空')
  if (!/^1[3-9]\d{9}$/.test(phone)) throw new AppError(400, '手机号格式不正确')
  if (password.length < 6) throw new AppError(400, '密码长度不能少于6位')
}

router.post('/login', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, password } = req.body
    validateLoginInput(phone, password)
    const result = await login(phone, password)
    res.json(result)
  } catch (e) { next(e) }
})

router.post('/refresh', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { refreshToken } = req.body
    if (!refreshToken) {
      throw new AppError(400, 'refreshToken 不能为空')
    }
    const result = await refreshAccessToken(refreshToken)
    res.json(result)
  } catch (e) { next(e) }
})

router.post('/logout', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json(await logout(req.user!.userId))
  } catch (e) { next(e) }
})

router.get('/me', auth, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = await getMe(req.user!.userId)
    res.json(user)
  } catch (e) { next(e) }
})

export default router
