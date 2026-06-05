import { AppError } from '../middleware/errorHandler'

/** 中国大陆手机号正则：1 开头的 11 位数字 */
const PHONE_REGEX = /^1[3-9]\d{9}$/

export function validatePhone(phone: string): void {
  if (!phone || typeof phone !== 'string') {
    throw new AppError(400, '手机号不能为空')
  }
  if (!PHONE_REGEX.test(phone)) {
    throw new AppError(400, '手机号格式不正确')
  }
}
