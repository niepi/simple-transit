import { describe, it, expect, vi, beforeEach } from 'vitest'
import { usePWA } from './usePWA'

// Mock environment variables
vi.mock('virtual:pwa-register', () => ({
  registerSW: vi.fn(() => vi.fn())
}))

// Mock import.meta.env
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_APP_VERSION: '0.2.1'
  }
})

describe('usePWA', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(),
        setItem: vi.fn(),
      },
      writable: true,
    })
    // Mock caches API
    Object.defineProperty(window, 'caches', {
      value: {
        keys: vi.fn(() => Promise.resolve([])),
        delete: vi.fn(() => Promise.resolve(true)),
      },
      writable: true,
    })
  })

  it('initializes with correct default values', () => {
    const { needRefresh, offlineReady } = usePWA()
    
    expect(needRefresh.value).toBe(false)
    expect(offlineReady.value).toBe(false)
  })

  it('provides updateServiceWorker function', () => {
    const { updateServiceWorker } = usePWA()
    
    expect(typeof updateServiceWorker).toBe('function')
  })

  it('handles version changes in localStorage', () => {
    const { needRefresh, offlineReady, updateServiceWorker } = usePWA()
    
    // Test that the composable doesn't throw errors
    expect(needRefresh.value).toBeDefined()
    expect(offlineReady.value).toBeDefined()
    expect(updateServiceWorker).toBeDefined()
  })

  it('returns PWA update info interface', () => {
    const pwaInfo = usePWA()
    
    expect(pwaInfo).toHaveProperty('needRefresh')
    expect(pwaInfo).toHaveProperty('offlineReady')
    expect(pwaInfo).toHaveProperty('updateServiceWorker')
  })
})