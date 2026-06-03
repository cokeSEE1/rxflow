import { Request, Response, NextFunction } from 'express'
import { AppError } from './errorHandler'

export function requireRole(...roles: string[]) {
  return (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      throw new AppError(403, '无权限执行此操作')
    }
    next()
  }
}
