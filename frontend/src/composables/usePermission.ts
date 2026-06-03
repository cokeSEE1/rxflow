import { useUserStore } from '@/stores/user'
import { computed } from 'vue'

export function usePermission() {
  const userStore = useUserStore()
  const role = computed(() => userStore.role)
  function can(...roles: string[]) { return roles.includes(userStore.role) }
  function isRole(r: string) { return userStore.role === r }
  return { role, can, isRole }
}
