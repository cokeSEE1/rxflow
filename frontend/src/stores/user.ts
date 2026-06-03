import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { login as loginApi, getMe } from '@/api/auth'
import type { UserInfo } from '@/api/auth'

export const useUserStore = defineStore('user', () => {
  const user = ref<UserInfo | null>(null)
  const token = ref(localStorage.getItem('accessToken') || '')
  const refreshToken = ref(localStorage.getItem('refreshToken') || '')

  const isLoggedIn = computed(() => !!token.value)
  const role = computed(() => user.value?.role || '')

  async function login(phone: string, password: string) {
    const result = await loginApi({ phone, password })
    token.value = result.accessToken
    refreshToken.value = result.refreshToken
    user.value = result.user
    localStorage.setItem('accessToken', result.accessToken)
    localStorage.setItem('refreshToken', result.refreshToken)
  }

  async function fetchUser() {
    if (!token.value) return
    user.value = await getMe()
  }

  function logout() {
    token.value = ''
    refreshToken.value = ''
    user.value = null
    localStorage.clear()
  }

  return { user, token, refreshToken, isLoggedIn, role, login, fetchUser, logout }
})
