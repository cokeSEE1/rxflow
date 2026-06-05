import axios from 'axios'
import { ElMessage } from 'element-plus'

const client = axios.create({
  baseURL: '/api',
  timeout: 15000,
})

client.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let refreshQueue: ((token: string) => void)[] = []

client.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = localStorage.getItem('refreshToken')
      if (!refreshToken) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        // 使用 location.href 而非 router.push，因为 axios 实例在 Vue app 初始化前创建，
        // 此时尚无法访问 router 实例。这在教学项目中是可接受的权衡。
        window.location.href = '/login'
        return Promise.reject(error)
      }

      if (isRefreshing) {
        return new Promise((resolve) => {
          refreshQueue.push((token: string) => {
            originalRequest.headers.Authorization = `Bearer ${token}`
            resolve(client(originalRequest))
          })
        })
      }

      originalRequest._retry = true
      isRefreshing = true

      try {
        const { data } = await axios.post('/api/auth/refresh', { refreshToken })
        localStorage.setItem('accessToken', data.accessToken)
        refreshQueue.forEach((cb) => cb(data.accessToken))
        refreshQueue = []
        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`
        return client(originalRequest)
      } catch {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        // 使用 location.href 而非 router.push，因为 axios 实例在 Vue app 初始化前创建，
        // 此时尚无法访问 router 实例。这在教学项目中是可接受的权衡。
        window.location.href = '/login'
        return Promise.reject(error)
      } finally {
        isRefreshing = false
      }
    }

    if (error.response?.status === 403) {
      ElMessage.error('无权限执行此操作')
    } else if (error.response?.status >= 500) {
      ElMessage.error('服务器错误，请稍后重试')
    }

    return Promise.reject(error)
  },
)

export default client
