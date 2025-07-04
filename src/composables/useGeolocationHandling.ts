import { ref, watch, nextTick } from 'vue'
import { useGeolocation } from '@vueuse/core'
import type { Ref } from 'vue'

export function useGeolocationHandling() {
  const { coords, isSupported } = useGeolocation()
  const geolocationError = ref<string | null>(null)

  // Handle geolocation support
  if (!isSupported) {
    geolocationError.value = 'Geolocation is not supported in your browser'
  }

  // Handle page reload
  function handleReload(): void {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  // Clear localStorage and reload
  function clearLocalStorage(): void {
    if (typeof window !== 'undefined') {
      window.localStorage.clear()
      window.location.reload()
    }
  }

  return {
    coords,
    isSupported,
    geolocationError,
    handleReload,
    clearLocalStorage
  }
}