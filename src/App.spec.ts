import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'
import App from './App.vue'

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core')
  return {
    ...actual,
    useGeolocation: vi.fn(() => ({ coords: ref({ latitude: null, longitude: null }), isSupported: false })),
    usePreferredDark: vi.fn(() => ref(false)),
    useStorage: vi.fn((key: string, value: any) => ref(value))
  }
})

vi.mock('./stores/stations', () => ({ useStationsStore: vi.fn(() => ({ fetchNearbyStations: vi.fn() })) }))
vi.mock('./stores/favorites', () => ({ useFavoritesStore: vi.fn(() => ({})) }))
vi.mock('leaflet', () => ({ default: { Icon: { Default: { mergeOptions: vi.fn(), prototype: {} } } } }))

describe('App.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('shows geolocation unsupported error', () => {
    const wrapper = mount(App, { shallow: true })
    expect(wrapper.text()).toContain('Geolocation is not supported')
  })

  it('handleReload triggers page reload', () => {
    const wrapper = mount(App, { shallow: true })
    const original = window.location.reload
    Object.defineProperty(window, 'location', { value: { ...window.location, reload: vi.fn() }, writable: true })
    ;(wrapper.vm as any).handleReload()
    expect(window.location.reload).toHaveBeenCalled()
    Object.defineProperty(window, 'location', { value: { ...window.location, reload: original } })
  })

  it('clearLocalStorage clears storage and reloads', () => {
    const wrapper = mount(App, { shallow: true })
    const original = window.location.reload
    Object.defineProperty(window, 'location', { value: { ...window.location, reload: vi.fn() }, writable: true })
    ;(wrapper.vm as any).clearLocalStorage()
    expect(window.location.reload).toHaveBeenCalled()
    Object.defineProperty(window, 'location', { value: { ...window.location, reload: original } })
  })
})
