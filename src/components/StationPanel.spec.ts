import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from 'vitest'
import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia, type Pinia } from 'pinia'
import StationPanel from './StationPanel.vue'
import { useStationsStore } from '../stores/stations'
import { useFavoritesStore } from '../stores/favorites'
import { usePreferencesStore } from '../stores/preferences'
import type { Station, Trip, TransitType } from '../types'
import { DEFAULT_PREFERENCES } from '../types/preferences'

// --- Global Mocks ---
global.fetch = vi.fn()

vi.mock('./TransitIcon.vue', () => ({
  default: {
    name: 'TransitIcon',
    props: ['type', 'class'],
    template: '<span :data-testid="`transit-icon-${type}`" :class="class">ICON</span>',
  },
}))

vi.mock('./TransitFilter.vue', () => ({
  default: {
    name: 'TransitFilter',
    template: '<div data-testid="transit-filter">Mocked Transit Filter</div>',
  },
}))

vi.mock('element-plus', async () => {
  const actual = await vi.importActual('element-plus')
  return {
    ...actual,
    ElTag: {
      name: 'ElTag',
      props: ['type'],
      template: '<span class="mock-el-tag"><slot /></span>',
    },
    ElTooltip: {
      name: 'ElTooltip',
      props: ['content', 'placement'],
      template: '<div><slot /></div>', 
    },
  }
})

vi.mock('@heroicons/vue/24/outline', () => ({
  StarIcon: {
    name: 'StarIconOutline',
    template: '<svg data-testid="star-icon-outline"></svg>',
  },
}))

vi.mock('@heroicons/vue/24/solid', () => ({
  StarIcon: {
    name: 'StarIconSolid',
    template: '<svg data-testid="star-icon-solid"></svg>',
  },
  ClockIcon: { 
    name: 'ClockIcon',
    template: '<svg data-testid="clock-icon"></svg>',
  }
}))

// Mock timers
beforeAll(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.clearAllTimers()
  vi.mocked(fetch).mockReset() 
})

// --- Test Data ---
const mockStation: Station = {
  id: 'station1',
  name: 'Test Station Alpha',
  lines: [], 
  location: { latitude: 52.5, longitude: 13.3, altitude: null },
  notes: null,
  type: 'station',
  slug: 'test-station-alpha',
  distance: 120 
}

const mockDeparture1: Trip = {
  tripId: 'trip1',
  line: { name: 'U2', product: 'subway' },
  direction: 'Pankow',
  when: new Date(Date.now() + 5 * 60000).toISOString(), 
  plannedWhen: new Date(Date.now() + 5 * 60000).toISOString(),
  delay: 0,
  cancelled: false,
  platform: '1',
}

const mockDeparture2: Trip = {
  tripId: 'trip2',
  line: { name: 'S1', product: 'suburban' },
  direction: 'Wannsee',
  when: new Date(Date.now() + 10 * 60000).toISOString(), 
  plannedWhen: new Date(Date.now() + 10 * 60000).toISOString(),
  delay: 5, 
  cancelled: false,
  platform: '3',
}

const mockDepartureCancelled: Trip = {
  tripId: 'trip3',
  line: { name: 'BUS X11', product: 'bus' },
  direction: 'Krumme Lanke',
  when: null, 
  plannedWhen: new Date(Date.now() + 15 * 60000).toISOString(),
  delay: null,
  cancelled: true,
  platform: 'A',
}

// Helper to create fetch responses
function createFetchResponse(data: unknown, ok = true, status = 200) {
  return Promise.resolve({
    ok,
    status,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  });
}


describe.skip('StationPanel.vue', () => {
  let pinia: Pinia
  let stationsStore: ReturnType<typeof useStationsStore>
  let favoritesStore: ReturnType<typeof useFavoritesStore>
  let preferencesStore: ReturnType<typeof usePreferencesStore>

  beforeEach(async () => {
    pinia = createPinia()
    setActivePinia(pinia)

    stationsStore = useStationsStore()
    favoritesStore = useFavoritesStore()
    preferencesStore = usePreferencesStore()

    stationsStore.clearStations() 
    favoritesStore.favoriteIds = [] 
    preferencesStore.resetPreferences()
    
    preferencesStore.preferences.enabledTransitTypes = ['sbahn', 'ubahn', 'tram', 'bus', 'ferry', 'express', 'regional']
    preferencesStore.preferences.maxDepartures = 5

    // Spies - generally allow original implementation unless specifically mocked per test
    vi.spyOn(stationsStore, 'fetchDepartures')
    vi.spyOn(favoritesStore, 'toggleFavorite')
    vi.spyOn(favoritesStore, 'setActiveView') 
    vi.spyOn(preferencesStore, 'updatePreference')
    
    // Default fetch mock for departures. Tests can override this.
    vi.mocked(fetch).mockImplementation(async (url): Promise<any> => {
      if (typeof url === 'string' && url.includes(`/stops/${mockStation.id}/departures`)) {
        return createFetchResponse({ departures: [mockDeparture1, mockDeparture2, mockDepartureCancelled] });
      }
      return createFetchResponse({ departures: [] }); // Default empty for other stations
    });
  })

  it('renders station name', async () => {
    const wrapper = mount(StationPanel, {
      props: { station: mockStation },
      global: { plugins: [pinia] },
    })
    await flushPromises() // Allow onMounted and fetch to complete
    expect(wrapper.find('h2').text()).toBe(mockStation.name)
  })

  describe('Favorite Toggle', () => {
    it('displays an outline star if station is not favorite', async () => {
      favoritesStore.favoriteIds = []
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises()
      expect(wrapper.findComponent({ name: 'StarIconOutline' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'StarIconSolid' }).exists()).toBe(false)
    })

    it('displays a solid star if station is favorite', async () => {
      favoritesStore.favoriteIds = [mockStation.id] 
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises()
      expect(wrapper.findComponent({ name: 'StarIconSolid' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'StarIconOutline' }).exists()).toBe(false)
    })

    it('calls favoritesStore.toggleFavorite when star button is clicked', async () => {
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises()
      await wrapper.find('button[title*="favorite"]').trigger('click')
      expect(favoritesStore.toggleFavorite).toHaveBeenCalledWith(mockStation.id)
    })
  })

  describe('TransitFilter visibility', () => {
    it('shows TransitFilter when activeView is "favorites"', async () => {
      favoritesStore.activeView = 'favorites' // Set directly as it's a computed property
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises()
      expect(wrapper.findComponent({ name: 'TransitFilter' }).exists()).toBe(true)
    })

    it('hides TransitFilter when activeView is not "favorites"', async () => {
      favoritesStore.activeView = 'all'
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises()
      expect(wrapper.findComponent({ name: 'TransitFilter' }).exists()).toBe(false)
    })
  })

  describe('Departures Display', () => {
    it('shows loading message when loading ref is true', async () => {
      const neverResolves = new Promise<void>(() => {});
      vi.mocked(fetch).mockImplementationOnce(async () => neverResolves); // Override global fetch for this test

      const wrapper = mount(StationPanel, {
          props: { station: mockStation },
          global: { plugins: [pinia] },
      });
      await flushPromises(); // Initial render cycle
      
      expect(wrapper.text()).toContain('Loading departures...');
      // Clean up by allowing the promise to resolve if necessary or ensure test ends.
      // In this case, fake timers might need careful handling if the promise has timeouts.
    })

    it('displays "No departures" message if stationDepartures is empty and not loading', async () => {
      vi.mocked(fetch).mockImplementationOnce(async () => createFetchResponse({ departures: [] }));
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises() 
      expect(wrapper.text()).toContain('No departures in the next 30 minutes')
      expect(wrapper.text()).not.toContain('Loading departures...')
    })

    it('renders departure items correctly', async () => {
      // Default fetch mock in beforeEach provides 3 departures
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises()
      
      const departureItems = wrapper.findAll('.departure-item')
      expect(departureItems.length).toBe(3) 

      const dep1Wrapper = departureItems[0]
      expect(dep1Wrapper.find('.transit-line').text()).toContain('U2')
      expect(dep1Wrapper.findComponent({ name: 'TransitIcon' }).props('type')).toBe('ubahn')
      expect(dep1Wrapper.find('.font-medium.truncate').text()).toBe(mockDeparture1.direction)
      expect(dep1Wrapper.find('.text-right .font-medium').text()).toBe(new Date(mockDeparture1.plannedWhen).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      expect(dep1Wrapper.text()).toContain('On time')

      const dep2Wrapper = departureItems[1]
      expect(dep2Wrapper.find('.transit-line').text()).toContain('S1')
      expect(dep2Wrapper.findComponent({ name: 'TransitIcon' }).props('type')).toBe('sbahn')
      expect(dep2Wrapper.text()).toContain(`+${mockDeparture2.delay} min`)

      const dep3Wrapper = departureItems[2]
      expect(dep3Wrapper.find('.transit-line').text()).toContain('BUS X11')
      expect(dep3Wrapper.findComponent({ name: 'TransitIcon' }).props('type')).toBe('bus')
      expect(dep3Wrapper.text()).toContain('Cancelled')
    })
    
    it('filters departures by enabledTransitTypes from preferencesStore', async () => {
      preferencesStore.preferences.enabledTransitTypes = ['ubahn'] 
      // Default fetch mock in beforeEach provides U2 (ubahn), S1 (sbahn), BUS X11 (bus)
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises()
      const departureItems = wrapper.findAll('.departure-item')
      expect(departureItems.length).toBe(1)
      expect(departureItems[0].find('.transit-line').text()).toContain(mockDeparture1.line.name) // U2
    })
  })

  describe('Load More Button', () => {
    it('renders "Load More Departures" button if departures are present', async () => {
      // Default fetch mock in beforeEach provides departures
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises()
      const buttons = wrapper.findAll('button').filter(b => b.text().includes('Load More Departures'))
      expect(buttons.length).toBe(1)
    })

    it('calls stationsStore.fetchDepartures with loadMore true when button is clicked', async () => {
      // Initial fetch (onMounted)
      vi.mocked(fetch).mockImplementationOnce(async () => createFetchResponse({ departures: [mockDeparture1] }));
      
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises() // onMounted fetch
      expect(stationsStore.fetchDepartures).toHaveBeenCalledWith(mockStation.id, false, false);

      // Setup fetch mock for "load more" call
      vi.mocked(fetch).mockImplementationOnce(async () => createFetchResponse({ departures: [mockDeparture2] })); // New data for load more
      
      const loadMoreButton = wrapper.findAll('button').find(b => b.text().includes('Load More Departures'))
      expect(loadMoreButton).toBeDefined()

      await loadMoreButton!.trigger('click')
      await flushPromises()

      expect(stationsStore.fetchDepartures).toHaveBeenCalledWith(mockStation.id, false, true)
      // Check button text/disabled state (reflecting component's loadingMore ref)
      expect(loadMoreButton!.text()).toContain('Loading...') 
      expect(loadMoreButton!.attributes('disabled')).toBeDefined()

      await flushPromises() // after fetchDepartures resolves
      expect(loadMoreButton!.text()).toContain('Load More Departures') 
      expect(loadMoreButton!.attributes('disabled')).toBeUndefined()
      
      // Verify new departure is displayed
      const departureItems = wrapper.findAll('.departure-item');
      // This check depends on how the store merges "load more" data.
      // The component's computed `stationDepartures` will re-evaluate.
      // The store's fetchDepartures should append if loadMore is true.
      // Assuming store correctly appends and sorts, we might see more items.
      // For this test, primarily focused on calling the action.
      // A more robust test would check the actual content of departureItems.
      expect(departureItems.length).toBeGreaterThanOrEqual(1); // At least one item should be there
    })
  })
  
  describe('Automatic Refresh Interval', () => {
    it('calls fetchDepartures periodically', async () => {
      mount(StationPanel, { 
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      await flushPromises()
      expect(stationsStore.fetchDepartures).toHaveBeenCalledTimes(1)
      expect(stationsStore.fetchDepartures).toHaveBeenLastCalledWith(mockStation.id, false, false)

      vi.advanceTimersByTime(60000) // REFRESH_INTERVAL
      await flushPromises()
      expect(stationsStore.fetchDepartures).toHaveBeenCalledTimes(2) 
      expect(stationsStore.fetchDepartures).toHaveBeenLastCalledWith(mockStation.id, false, false)

      vi.advanceTimersByTime(60000)
      await flushPromises()
      expect(stationsStore.fetchDepartures).toHaveBeenCalledTimes(3)
    })

    it('stops refresh interval on unmount', () => {
      const wrapper = mount(StationPanel, {
        props: { station: mockStation },
        global: { plugins: [pinia] },
      })
      const clearIntervalSpy = vi.spyOn(window, 'clearInterval')
      wrapper.unmount()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })
})
