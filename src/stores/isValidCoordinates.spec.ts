import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useStationsStore } from './stations'

function createFetchResponse(data: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
  }) as unknown as Response
}

describe('isValidCoordinates', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.resetAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('accepts zero coordinates in fetchNearbyStations', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => createFetchResponse([])))
    const store = useStationsStore()
    await store.fetchNearbyStations(0, 0)
    expect((global.fetch as any)).toHaveBeenCalled()
    expect(store.error).toBeNull()
  })

  it('sets error for invalid coordinates', async () => {
    vi.stubGlobal('fetch', vi.fn())
    const store = useStationsStore()
    await store.fetchNearbyStations(200, 200)
    expect(store.error).toBe('Invalid coordinates provided')
    expect((global.fetch as any)).not.toHaveBeenCalled()
  })
})
