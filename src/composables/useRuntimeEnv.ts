import { ref, computed } from 'vue'

interface RuntimeEnv {
  VITE_APP_VERSION?: string
  VITE_APP_NAME?: string
  VITE_APP_DESCRIPTION?: string
}

let runtimeEnvCache: RuntimeEnv | null = null
let runtimeEnvPromise: Promise<RuntimeEnv> | null = null

function getRuntimeEnvUrl(): string | null {
  try {
    if (typeof window !== 'undefined' && window.location?.origin) {
      return new URL('/runtime-env.json', window.location.origin).toString()
    }
  } catch {}
  return null
}

async function fetchRuntimeEnv(): Promise<RuntimeEnv> {
  if (runtimeEnvCache) return runtimeEnvCache
  if (runtimeEnvPromise) return runtimeEnvPromise

  const runtimeEnvUrl = getRuntimeEnvUrl()
  if (!runtimeEnvUrl) {
    runtimeEnvCache = {}
    return runtimeEnvCache
  }

  runtimeEnvPromise = fetch(runtimeEnvUrl)
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

export function useRuntimeEnv() {
  const runtimeEnv = ref<RuntimeEnv>({})
  const isLoaded = ref(false)

  if (!isLoaded.value) {
    fetchRuntimeEnv().then(env => {
      runtimeEnv.value = env
      isLoaded.value = true
    })
  }

  const getEnv = (key: keyof RuntimeEnv, fallback: string = ''): string => {
    if (runtimeEnv.value[key]) return runtimeEnv.value[key]!
    if (import.meta.env[key]) return import.meta.env[key]
    return fallback
  }

  const appVersion = computed(() => {
    const version = getEnv('VITE_APP_VERSION', 'dev')
    return version.startsWith('v') ? version : `v${version}`
  })

  const appName = computed(() => getEnv('VITE_APP_NAME', 'Berlin Transit Map'))
  const appDescription = computed(() => getEnv('VITE_APP_DESCRIPTION', 'Real-time Berlin public transportation tracking'))

  return {
    runtimeEnv: computed(() => runtimeEnv.value),
    isLoaded: computed(() => isLoaded.value),
    getEnv,
    appVersion,
    appName,
    appDescription,
  }
}
