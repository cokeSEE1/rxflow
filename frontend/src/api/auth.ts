import client from './client'

export interface LoginParams { phone: string; password: string }
export interface LoginResult {
  accessToken: string; refreshToken: string;
  user: { id: number; name: string; phone: string; role: string }
}
export interface UserInfo { id: number; name: string; phone: string; role: string }

export async function login(params: LoginParams): Promise<LoginResult> {
  const { data } = await client.post('/auth/login', params)
  return data
}
export async function getMe(): Promise<UserInfo> {
  const { data } = await client.get('/auth/me')
  return data
}
