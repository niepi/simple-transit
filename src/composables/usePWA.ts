import { ref, onMounted } from 'vue'

export interface PWAUpdateInfo {
  needRefresh: boolean
  offlineReady: boolean // Keep for backward compatibility but not used
  updateServiceWorker: () => Promise<void>
}

export function usePWA(): PWAUpdateInfo {
  const needRefresh = ref(false)
  const offlineReady = ref(false)
  let updateSW: (() => Promise<void>) | null = null

  const handleUpdate = async () => {
    try {
      if (updateSW) {
        await updateSW()
        // Force page reload after service worker update
        window.location.reload()
      }
    } catch (error) {
      console.error('PWA: Failed to update service worker', error)
    }
  }

  onMounted(async () => {
    // Skip PWA initialization in test environment
    if (typeof window === 'undefined' || import.meta.env.MODE === 'test') {
      return
    }

    if ('serviceWorker' in navigator) {
      try {
        // Dynamically import PWA register function only in browser environment
        const pwaModule = await import('virtual:pwa-register').catch(() => null)
        if (!pwaModule) {
          console.warn('PWA: virtual:pwa-register not available')
          return
        }
        
        updateSW = pwaModule.registerSW({
          onNeedRefresh() {
            console.log('PWA: New content available')
            needRefresh.value = true
          },
          onOfflineReady() {
            console.log('PWA: App ready to work offline')
            // offlineReady notification removed per user request
          },
          onRegistered(registration) {
            console.log('PWA: Service Worker registered', registration)
            
            // Check for updates every 60 seconds when app is visible
            if (registration) {
              setInterval(() => {
                if (document.visibilityState === 'visible') {
                  registration.update().catch(() => {
                    // Silently fail if update check fails
                  })
                }
              }, 60000)
            }
          },
          onRegisterError(error) {
            console.warn('PWA: Service Worker registration error', error)
          },
        })
      } catch (error) {
        console.warn('PWA: Failed to initialize service worker', error)
      }
    }
  })

  onMounted(() => {
    // Listen for app version changes via localStorage
    const currentVersion = import.meta.env.VITE_APP_VERSION || '0.2.0'
    const lastVersion = localStorage.getItem('app-version')
    
    if (lastVersion && lastVersion !== currentVersion) {
      console.log(`PWA: Version change detected: ${lastVersion} → ${currentVersion}`)
      // Clear version-specific caches when version changes (only image caches now)
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => {
            if (name.includes('-v') && !name.includes(`-v${currentVersion}`)) {
              caches.delete(name)
              console.log(`PWA: Cleared outdated cache: ${name}`)
            }
          })
        })
      }
    }
    
    localStorage.setItem('app-version', currentVersion)
  })

  return {
    needRefresh,
    offlineReady,
    updateServiceWorker: handleUpdate,
  }
}