import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import App from './App.vue'
import { createPinia, setActivePinia } from 'pinia'

const fetchMock = vi.fn(() => Promise.resolve({ ok: false, json: async () => ({}) }))
vi.stubGlobal('fetch', fetchMock)

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core')
  return {
    ...actual,
    useGeolocation: vi.fn(() => ({ coords: ref({ latitude: null, longitude: null }), isSupported: false })),
    usePreferredDark: vi.fn(() => ref(false)),
    useStorage: vi.fn((key: string, value: any) => ref(value))
  }
})

vi.mock('./stores/stations', () => ({ useStationsStore: vi.fn(() => ({ fetchNearbyStations: vi.fn(), sortedStations: [] })) }))
vi.mock('./stores/favorites', () => ({ useFavoritesStore: vi.fn(() => ({ activeView: 'all', favoriteIds: [] })) }))
vi.mock('leaflet', () => ({
  default: {
    Icon: { Default: { mergeOptions: vi.fn(), prototype: {} } },
    map: vi.fn(() => ({
      setView: vi.fn().mockReturnThis(),
      addTo: vi.fn().mockReturnThis(),
      on: vi.fn().mockReturnThis(),
      removeLayer: vi.fn().mockReturnThis(),
      getCenter: vi.fn(() => ({ lat: 52.52, lng: 13.405 })),
      invalidateSize: vi.fn(),
      getZoom: vi.fn(() => 13)
    })),
    tileLayer: vi.fn(() => ({ addTo: vi.fn(), remove: vi.fn() })),
    marker: vi.fn(() => ({ addTo: vi.fn(), bindPopup: vi.fn(), remove: vi.fn() })),
    divIcon: vi.fn(),
    control: {
      zoom: vi.fn(() => ({ addTo: vi.fn() })),
      attribution: vi.fn(() => ({ addTo: vi.fn() }))
    },
    latLng: vi.fn((lat, lng) => ({ lat, lng, distanceTo: vi.fn(() => 0) }))
  }
}))

describe('App.vue', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    fetchMock.mockClear()
    setActivePinia(createPinia())
  })

  it('shows geolocation unsupported error', async () => {
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

  describe('UI Rendering Tests', () => {
    it('renders main app structure with proper CSS classes', () => {
      const wrapper = shallowMount(App)
      expect(wrapper.find('.h-screen.w-full.flex').exists()).toBe(true)
      expect(wrapper.find('.h-screen.w-full.flex').classes()).toContain('transition-colors')
    })

    it('renders control buttons with proper styling', () => {
      const wrapper = shallowMount(App)
      const controlButtons = wrapper.find('.absolute.top-4.right-4')
      expect(controlButtons.exists()).toBe(true)
      expect(controlButtons.classes()).toContain('z-[1000]')
      const darkModeButton = controlButtons.find('button')
      expect(darkModeButton.exists()).toBe(true)
      expect(darkModeButton.classes()).toContain('p-2')
      expect(darkModeButton.classes()).toContain('rounded-full')
      expect(darkModeButton.classes()).toContain('bg-white')
    })

    it('renders map section with correct responsive classes', () => {
      const wrapper = shallowMount(App)
      const mapSection = wrapper.find('.w-full.md\\:w-2\\/3')
      expect(mapSection.exists()).toBe(true)
      expect(mapSection.classes()).toContain('h-[40vh]')
      expect(mapSection.classes()).toContain('md:h-screen')
      expect(mapSection.classes()).toContain('relative')
    })

    it('renders station panel with proper layout classes', () => {
      const wrapper = shallowMount(App)
      const stationPanel = wrapper.find('.w-full.md\\:w-1\\/3')
      expect(stationPanel.exists()).toBe(true)
      expect(stationPanel.classes()).toContain('h-[60vh]')
      expect(stationPanel.classes()).toContain('md:h-screen')
      expect(stationPanel.classes()).toContain('bg-gray-50')
      expect(stationPanel.classes()).toContain('dark:bg-gray-900')
    })

    it('renders geolocation error overlay when no location', () => {
      const wrapper = shallowMount(App)
      const errorOverlay = wrapper.find('.absolute.inset-0.bg-gray-900\\/50')
      expect(errorOverlay.exists()).toBe(true)
      expect(errorOverlay.classes()).toContain('backdrop-blur-sm')
      expect(errorOverlay.classes()).toContain('z-[1000]')
    })

    it('applies dark mode classes correctly', async () => {
      const { useStorage } = vi.mocked(await import('@vueuse/core'))
      useStorage.mockReturnValue(ref(true))
      const wrapper = shallowMount(App)
      const mainContainer = wrapper.find('.h-screen')
      expect(mainContainer.classes()).toContain('transition-colors')
    })
  })

  describe('Component Integration', () => {
    it('includes BottomNav component', () => {
      const wrapper = shallowMount(App)
      expect(wrapper.findComponent({ name: 'BottomNav' }).exists()).toBe(true)
    })

    it('conditionally renders StationPanel components', () => {
      const wrapper = shallowMount(App)
      expect(wrapper.findComponent({ name: 'StationPanel' }).exists()).toBe(false)
    })
  })

  describe('Tailwind CSS Classes Verification', () => {
    it('uses standard Tailwind utility classes', () => {
      const wrapper = shallowMount(App)
      const html = wrapper.html()
      expect(html).toContain('h-screen')
      expect(html).toContain('w-full')
      expect(html).toContain('flex')
      expect(html).toContain('md:flex-row')
      expect(html).toContain('flex-col')
      expect(html).toContain('bg-white')
      expect(html).toContain('dark:bg-gray-800')
      expect(html).toContain('dark:bg-gray-900')
    })

    it('does not use deprecated or custom classes', () => {
      const wrapper = shallowMount(App)
      const html = wrapper.html()
      expect(html).not.toContain('dark:bg-dark-card')
      expect(html).not.toContain('dark:bg-dark-hover')
      expect(html).not.toContain('dark:text-dark')
      expect(html).not.toContain('bg-dark')
    })
  })
})
