import { ref, computed } from 'vue'

interface RuntimeEnv {
  VITE_APP_VERSION?: string
  VITE_APP_NAME?: string
  VITE_APP_DESCRIPTION?: string
}

// Cache for runtime environment variables
let runtimeEnvCache: RuntimeEnv | null = null
let runtimeEnvPromise: Promise<RuntimeEnv> | null = null

/**
 * Fetch runtime environment variables from the server
 */
async function fetchRuntimeEnv(): Promise<RuntimeEnv> {
  if (runtimeEnvCache) {
    return runtimeEnvCache
  }

  if (runtimeEnvPromise) {
    return runtimeEnvPromise
  }

  runtimeEnvPromise = fetch('/runtime-env.json')
    .then(response => {
      if (!response.ok) {
        console.warn('Runtime environment config not found, using build-time values')
        return {}
      }
      return response.json()
    })
    .catch(error => {
      console.warn('Failed to load runtime environment config:', error)
      return {}
    })
    .then(env => {
      runtimeEnvCache = env
      console.log('🔄 Runtime environment loaded:', env)
      return env
    })

  return runtimeEnvPromise
}

/**
 * Composable for accessing environment variables with runtime override support
 */
export function useRuntimeEnv() {
  const runtimeEnv = ref<RuntimeEnv>({})
  const isLoaded = ref(false)

  // Load runtime environment on first use
  if (!isLoaded.value) {
    fetchRuntimeEnv().then(env => {
      runtimeEnv.value = env
      isLoaded.value = true
    })
  }

  /**
   * Get environment variable with runtime override support
   * Priority: 1. Runtime env, 2. Build-time env, 3. Fallback
   */
  const getEnv = (key: keyof RuntimeEnv, fallback: string = ''): string => {
    // Try runtime environment first
    if (runtimeEnv.value[key]) {
      return runtimeEnv.value[key]!
    }

    // Fall back to build-time environment
    if (import.meta.env[key]) {
      return import.meta.env[key]
    }

    // Use fallback
    return fallback
  }

  // Computed properties for common environment variables
  const appVersion = computed(() => {
    const version = getEnv('VITE_APP_VERSION', 'dev')
    // Ensure version has 'v' prefix for display
    return version.startsWith('v') ? version : `v${version}`
  })

  const appName = computed(() => getEnv('VITE_APP_NAME', 'Berlin Transit Map'))
  
  const appDescription = computed(() => 
    getEnv('VITE_APP_DESCRIPTION', 'Real-time Berlin public transportation tracking')
  )

  return {
    runtimeEnv: computed(() => runtimeEnv.value),
    isLoaded: computed(() => isLoaded.value),
    getEnv,
    appVersion,
    appName,
    appDescription
  }
}