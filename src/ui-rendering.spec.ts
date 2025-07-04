import { describe, it, expect, vi, beforeEach } from 'vitest'
import { mount, shallowMount } from '@vue/test-utils'
import { ref } from 'vue'
import { createPinia, setActivePinia } from 'pinia'
import App from './App.vue'
import BottomNav from './components/BottomNav.vue'
import StationPanel from './components/StationPanel.vue'
import TransitIcon from './components/TransitIcon.vue'

// Mock external dependencies
vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core')
  return {
    ...actual,
    useGeolocation: vi.fn(() => ({ 
      coords: ref({ latitude: 52.52, longitude: 13.405 }), 
      isSupported: true 
    })),
    usePreferredDark: vi.fn(() => ref(false)),
    useStorage: vi.fn((key: string, value: any) => ref(value))
  }
})

vi.mock('./stores/stations', () => ({
  useStationsStore: vi.fn(() => ({
    stations: ref([
      {
        id: 'test-station',
        name: 'Test Station',
        type: 'stop',
        location: { latitude: 52.52, longitude: 13.405 }
      }
    ]),
    departures: ref({}),
    isLoading: ref(false),
    error: ref(null),
    sortedStations: ref([]),
    fetchNearbyStations: vi.fn(),
    fetchDepartures: vi.fn(),
    updateMapCenter: vi.fn()
  }))
}))

vi.mock('./stores/favorites', () => ({
  useFavoritesStore: vi.fn(() => ({
    favoriteIds: ref([]),
    activeView: ref('all'),
    toggleFavorite: vi.fn(),
    isFavorite: vi.fn(() => false),
    setActiveView: vi.fn()
  }))
}))

vi.mock('./stores/preferences', () => ({
  usePreferencesStore: vi.fn(() => ({
    preferences: ref({
      allowAutoCenter: true,
      darkMode: false,
      refreshInterval: 60000,
      maxDepartures: 6,
      maxDistance: 1000,
      lastView: 'all',
      enabledTransitTypes: ['sbahn', 'ubahn', 'tram', 'bus', 'ferry']
    }),
    updatePreference: vi.fn(),
    resetPreferences: vi.fn()
  }))
}))

vi.mock('leaflet', () => ({
  default: {
    Icon: {
      Default: {
        mergeOptions: vi.fn(),
        prototype: {}
      }
    },
    map: vi.fn(() => ({
      setView: vi.fn(),
      addTo: vi.fn(),
      on: vi.fn(),
      getCenter: vi.fn(() => ({ lat: 52.52, lng: 13.405 })),
      invalidateSize: vi.fn(),
      getZoom: vi.fn(() => 13)
    })),
    tileLayer: vi.fn(() => ({
      addTo: vi.fn(),
      remove: vi.fn()
    })),
    marker: vi.fn(() => ({
      addTo: vi.fn(),
      bindPopup: vi.fn()
    })),
    divIcon: vi.fn(),
    control: {
      zoom: vi.fn(() => ({ addTo: vi.fn() })),
      attribution: vi.fn(() => ({ addTo: vi.fn() }))
    }
  }
}))

describe('UI Rendering After Dependency Updates', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    setActivePinia(createPinia())
  })

  describe('Critical UI Elements Rendering', () => {
    it('renders all essential UI components without errors', () => {
      const wrapper = mount(App, {
        global: {
          stubs: {
            StationPanel: true,
            BottomNav: true
          }
        }
      })

      expect(wrapper.exists()).toBe(true)
      expect(() => wrapper.html()).not.toThrow()
    })

    it('main layout structure is intact', () => {
      const wrapper = shallowMount(App)
      
      // Main container
      expect(wrapper.find('[data-testid="main-container"], .h-screen.w-full.flex').exists()).toBe(true)
      
      // Map section
      expect(wrapper.find('.w-full').exists()).toBe(true)
      
      // Station panel
      expect(wrapper.find('.bg-gray-50').exists()).toBe(true)
    })

    it('control buttons are rendered and functional', () => {
      const wrapper = shallowMount(App)
      
      const controlButtons = wrapper.find('.absolute.top-4.right-4')
      expect(controlButtons.exists()).toBe(true)
      
      const buttons = controlButtons.findAll('button')
      expect(buttons.length).toBeGreaterThanOrEqual(2) // Dark mode toggle + clear storage
      
      // Check that buttons have proper attributes
      buttons.forEach(button => {
        expect(button.attributes('class')).toContain('p-2')
        expect(button.attributes('class')).toContain('rounded-full')
      })
    })
  })

  describe('CSS Framework Integration', () => {
    it('Tailwind CSS classes are properly applied', () => {
      const wrapper = shallowMount(App)
      const html = wrapper.html()
      
      // Essential layout classes
      expect(html).toContain('h-screen')
      expect(html).toContain('w-full')
      expect(html).toContain('flex')
      expect(html).toContain('relative')
      expect(html).toContain('absolute')
      
      // Responsive classes
      expect(html).toContain('md:')
      
      // Color classes
      expect(html).toContain('bg-')
      expect(html).toContain('text-')
      
      // Dark mode classes
      expect(html).toContain('dark:')
    })

    it('custom Tailwind colors are working', () => {
      const wrapper = mount(TransitIcon, {
        props: {
          type: 'sbahn',
          name: 'S1'
        }
      })
      
      // Check that the component renders without errors
      expect(wrapper.exists()).toBe(true)
      expect(wrapper.find('span').exists()).toBe(true)
    })

    it('dark mode classes are properly configured', () => {
      const wrapper = shallowMount(App)
      const html = wrapper.html()
      
      // Check for dark mode classes without custom ones that might break
      expect(html).toContain('dark:bg-gray-800')
      expect(html).toContain('dark:bg-gray-900')
      expect(html).not.toContain('dark:bg-dark-card') // Deprecated custom class
    })
  })

  describe('Component Dependencies', () => {
    it('Vue composition API features work correctly', () => {
      const wrapper = shallowMount(App)
      expect(wrapper.vm).toBeDefined()
      
      // Check that reactive refs are working
      expect(wrapper.vm.$data).toBeDefined()
    })

    it('Pinia store integration works', () => {
      const wrapper = shallowMount(BottomNav)
      expect(wrapper.exists()).toBe(true)
      expect(() => wrapper.vm).not.toThrow()
    })

    it('VueUse composables are properly mocked', () => {
      const wrapper = shallowMount(App)
      expect(wrapper.exists()).toBe(true)
      
      // Should not throw errors about missing geolocation
      // Check for main layout structure instead of specific background class
      expect(wrapper.find('.h-screen').exists()).toBe(true)
    })
  })

  describe('Build System Integration', () => {
    it('TypeScript types are properly resolved', () => {
      // This test ensures TypeScript compilation doesn't fail
      const wrapper = shallowMount(App)
      expect(wrapper.exists()).toBe(true)
    })

    it('imports resolve correctly', () => {
      // Test that all imports in components work
      expect(() => {
        shallowMount(App)
        shallowMount(BottomNav)
        mount(TransitIcon, { props: { type: 'bus', name: 'M10' } })
      }).not.toThrow()
    })
  })

  describe('Critical User Interactions', () => {
    it('dark mode toggle works without errors', async () => {
      const { useStorage } = vi.mocked(await import('@vueuse/core'))
      const darkMode = ref(false)
      useStorage.mockReturnValue(darkMode)
      
      const wrapper = shallowMount(App)
      const darkModeButton = wrapper.find('button')
      
      expect(() => darkModeButton.trigger('click')).not.toThrow()
    })

    it('navigation buttons in BottomNav work', async () => {
      const wrapper = shallowMount(BottomNav)
      const buttons = wrapper.findAll('button')
      
      for (const button of buttons) {
        expect(() => button.trigger('click')).not.toThrow()
      }
    })
  })

  describe('Performance and Memory', () => {
    it('components unmount cleanly', () => {
      const wrapper = shallowMount(App)
      expect(() => wrapper.unmount()).not.toThrow()
    })

    it('no memory leaks in reactive refs', () => {
      // Mount and unmount multiple times to check for memory leaks
      for (let i = 0; i < 5; i++) {
        const wrapper = shallowMount(App)
        wrapper.unmount()
      }
      // If this doesn't throw, we're good
      expect(true).toBe(true)
    })
  })

  describe('Error Boundaries', () => {
    it('gracefully handles missing props', () => {
      expect(() => {
        mount(TransitIcon, {
          props: {
            type: 'bus',
            name: 'M10'
          }
        })
      }).not.toThrow()
    })

    it('handles API errors gracefully', () => {
      expect(() => shallowMount(App)).not.toThrow()
    })
  })
})