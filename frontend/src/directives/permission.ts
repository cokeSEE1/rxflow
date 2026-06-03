import type { Directive } from 'vue'
import { useUserStore } from '@/stores/user'

export const vPermission: Directive = {
  mounted(el, binding) {
    const userStore = useUserStore()
    const roles = binding.value as string[]
    if (!roles.includes(userStore.role)) {
      el.style.display = 'none'
    }
  },
}
