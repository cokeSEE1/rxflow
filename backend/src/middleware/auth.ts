import { Request, Response, NextFunction } from 'express'
import { PrismaClient } from '@prisma/client'
import { verifyToken, TokenPayload } from '../utils/jwt'
import { AppError } from './errorHandler'

const prisma = new PrismaClient()

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export async function auth(req: Request, _res: Response, next: NextFunction) {
  try {
    const header = req.headers.authorization
    if (!header || !header.startsWith('Bearer ')) {
      throw new AppError(401, '未登录或 Token 已过期')
    }
    const payload = verifyToken(header.slice(7))

    // Check if user is still active and not locked
    const user = await prisma.user.findUnique({ where: { id: payload.userId } })
    if (!user || !user.isActive) {
      throw new AppError(401, '账号不存在或已停用')
    }
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      throw new AppError(423, '账号已锁定，请稍后再试')
    }

    req.user = { ...payload, tokenType: 'access' }
    next()
  } catch (e) {
    next(e)
  }
}
