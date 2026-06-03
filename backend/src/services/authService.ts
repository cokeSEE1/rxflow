import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { signAccessToken, signRefreshToken, verifyToken, TokenPayload } from '../utils/jwt'
import { AppError } from '../middleware/errorHandler'

const prisma = new PrismaClient()

export async function login(phone: string, password: string) {
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user || !user.isActive) {
    throw new AppError(401, '账号不存在或已停用')
  }
  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    throw new AppError(401, '密码错误')
  }
  const payload: TokenPayload = { userId: user.id, role: user.role }
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role },
  }
}

export async function refreshAccessToken(refreshToken: string) {
  const payload = verifyToken(refreshToken)
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || !user.isActive) {
    throw new AppError(401, '账号不存在或已停用')
  }
  return signAccessToken({ userId: user.id, role: user.role })
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, '用户不存在')
  return { id: user.id, name: user.name, phone: user.phone, role: user.role }
}
