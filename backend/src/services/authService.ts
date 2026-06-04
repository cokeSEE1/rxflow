import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { signAccessToken, signRefreshToken, verifyRefreshToken, TokenPayload } from '../utils/jwt'
import { AppError } from '../middleware/errorHandler'

const prisma = new PrismaClient()

const MAX_LOGIN_ATTEMPTS = 5
const LOCK_DURATION_MINUTES = 15

export async function login(phone: string, password: string) {
  // 1. Find user
  const user = await prisma.user.findUnique({ where: { phone } })
  if (!user) {
    throw new AppError(401, '手机号或密码错误')
  }

  // 2. Check if locked
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(423, '账号已锁定，请15分钟后再试')
  }

  // 3. Compare password
  const valid = await bcrypt.compare(password, user.passwordHash)

  if (!valid) {
    const failCount = user.loginFailCount + 1
    const updateData: { loginFailCount: number; lockedUntil?: Date } = { loginFailCount: failCount }
    if (failCount >= MAX_LOGIN_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOCK_DURATION_MINUTES * 60 * 1000)
    }
    await prisma.user.update({ where: { id: user.id }, data: updateData })

    if (failCount >= MAX_LOGIN_ATTEMPTS) {
      throw new AppError(423, '账号已锁定，请15分钟后再试')
    }
    throw new AppError(401, '手机号或密码错误')
  }

  // 4. Correct: reset counters and update last login
  await prisma.user.update({
    where: { id: user.id },
    data: {
      loginFailCount: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
    },
  })

  const payload: TokenPayload = { userId: user.id, role: user.role }
  return {
    accessToken: signAccessToken(payload),
    refreshToken: signRefreshToken(payload),
    user: { id: user.id, name: user.name, phone: user.phone, role: user.role, avatar: user.avatar },
  }
}

export async function refreshAccessToken(refreshToken: string) {
  // 1. Verify the refresh token using verifyRefreshToken (NOT verifyToken)
  const payload = verifyRefreshToken(refreshToken)

  // 2. Find user, check active, check not locked
  const user = await prisma.user.findUnique({ where: { id: payload.userId } })
  if (!user || !user.isActive) {
    throw new AppError(401, '账号不存在或已停用')
  }
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    throw new AppError(423, '账号已锁定，请稍后再试')
  }

  // 3. Generate NEW access token AND NEW refresh token (rotation)
  const newPayload: TokenPayload = { userId: user.id, role: user.role }
  return {
    accessToken: signAccessToken(newPayload),
    refreshToken: signRefreshToken(newPayload),
  }
}

export async function logout(_userId: number) {
  // Token invalidation is handled client-side for this teaching project.
  // Server-side blacklist would require Redis.
  return { success: true }
}

export async function getMe(userId: number) {
  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) throw new AppError(404, '用户不存在')

  // Reset lockedUntil and loginFailCount if lock expired
  if (user.lockedUntil && user.lockedUntil <= new Date() && user.loginFailCount > 0) {
    await prisma.user.update({
      where: { id: user.id },
      data: { loginFailCount: 0, lockedUntil: null },
    })
    return {
      id: user.id,
      name: user.name,
      phone: user.phone,
      role: user.role,
      avatar: user.avatar,
      lastLoginAt: user.lastLoginAt,
    }
  }

  return {
    id: user.id,
    name: user.name,
    phone: user.phone,
    role: user.role,
    avatar: user.avatar,
    lastLoginAt: user.lastLoginAt,
  }
}
