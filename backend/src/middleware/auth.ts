import { Request, Response, NextFunction } from 'express'
import { verifyToken, TokenPayload } from '../utils/jwt'
import { AppError } from './errorHandler'

declare global {
  namespace Express {
    interface Request {
      user?: TokenPayload
    }
  }
}

export function auth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, '未登录或 Token 已过期')
  }
  req.user = verifyToken(header.slice(7))
  next()
}
