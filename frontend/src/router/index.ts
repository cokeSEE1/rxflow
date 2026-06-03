import { createRouter, createWebHistory } from 'vue-router'
import { routes } from './routes'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach(async (to, _from, next) => {
  const userStore = useUserStore()

  if (to.meta.guest) {
    if (userStore.isLoggedIn) return next('/')
    return next()
  }

  if (!userStore.isLoggedIn) {
    return next('/login')
  }

  if (!userStore.user) {
    await userStore.fetchUser()
  }

  const allowedRoles = to.meta.roles as string[] | undefined
  if (allowedRoles && !allowedRoles.includes(userStore.role)) {
    return next('/forbidden')
  }

  next()
})

export default router
