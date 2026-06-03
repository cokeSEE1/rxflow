import { ref } from 'vue'

export function useDraft(key: string) {
  const draft = ref<any>(null)
  const saved = localStorage.getItem(`rxflow_draft_${key}`)
  if (saved) {
    try { draft.value = JSON.parse(saved) } catch { /* ignore corrupted data */ }
  }
  let timer: ReturnType<typeof setInterval> | null = null
  function startAutoSave(getData: () => any) {
    timer = setInterval(() => {
      const data = getData()
      if (data) localStorage.setItem(`rxflow_draft_${key}`, JSON.stringify(data))
    }, 30000)
  }
  function stopAutoSave() { if (timer) clearInterval(timer) }
  function clearDraft() { localStorage.removeItem(`rxflow_draft_${key}`) }
  return { draft, startAutoSave, stopAutoSave, clearDraft }
}
