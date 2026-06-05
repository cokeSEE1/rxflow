/** 系统角色 */
export type UserRole = 'assistant' | 'doctor' | 'courier' | 'patient' | 'pharmacist'

/** 登录请求参数 */
export interface LoginParams {
  phone: string
  password: string
}

/** 登录响应 */
export interface LoginResult {
  accessToken: string
  refreshToken: string
  user: UserInfo
}

/** 用户信息 */
export interface UserInfo {
  id: number
  name: string
  phone: string
  role: UserRole
}
