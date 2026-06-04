import jwt, { TokenExpiredError, JsonWebTokenError } from 'jsonwebtoken'
import { config } from '../config'
import { AppError } from '../middleware/errorHandler'

export interface TokenPayload {
  userId: number
  role: string
  tokenType?: 'access' | 'refresh'
}

export function signAccessToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, tokenType: 'access' }, config.jwtSecret, { expiresIn: config.jwtExpiresIn } as jwt.SignOptions)
}

export function signRefreshToken(payload: TokenPayload): string {
  return jwt.sign({ ...payload, tokenType: 'refresh' }, config.jwtRefreshSecret, { expiresIn: config.jwtRefreshExpiresIn } as jwt.SignOptions)
}

export function verifyToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwtSecret) as TokenPayload
  } catch (e) {
    if (e instanceof TokenExpiredError) {
      throw new AppError(401, 'Token 已过期')
    }
    if (e instanceof JsonWebTokenError) {
      throw new AppError(401, 'Token 无效')
    }
    throw e
  }
}

export function verifyRefreshToken(token: string): TokenPayload {
  try {
    return jwt.verify(token, config.jwtRefreshSecret) as TokenPayload
  } catch (e) {
    if (e instanceof TokenExpiredError) {
      throw new AppError(401, 'Token 已过期')
    }
    if (e instanceof JsonWebTokenError) {
      throw new AppError(401, 'Token 无效')
    }
    throw e
  }
}
