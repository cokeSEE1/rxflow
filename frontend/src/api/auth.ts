import client from './client'
import type { LoginParams, LoginResult, UserInfo } from '@/types'

export type { LoginParams, LoginResult, UserInfo }

export async function login(params: LoginParams): Promise<LoginResult> {
  const { data } = await client.post('/auth/login', params)
  return data
}
export async function getMe(): Promise<UserInfo> {
  const { data } = await client.get('/auth/me')
  return data
}
