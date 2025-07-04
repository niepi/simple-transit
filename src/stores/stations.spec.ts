import { setActivePinia, createPinia } from 'pinia'
import { useStationsStore } from './stations'
import { usePreferencesStore } from './preferences'
import { useFavoritesStore } from './favorites'
import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { ref, nextTick } from 'vue'
import { useGeolocation } from '@vueuse/core' 
import type { Station, Trip, UserLocation, VBBLocation, TransitProduct, TransitType } from '../types'
import { DEFAULT_PREFERENCES } from '../types/preferences'


// --- Mocks ---
global.fetch = vi.fn()

vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core')
  return {
    ...actual,
    useGeolocation: vi.fn(() => ({ // Default mock
      coords: ref({ latitude: null, longitude: null, accuracy: null, altitude: null, altitudeAccuracy: null, heading: null, speed: null }),
      locatedAt: ref(null),
      error: ref(null),
      resume: vi.fn(),
      pause: vi.fn(),
    })),
    useLocalStorage: vi.fn((key, initialValue) => ref(JSON.parse(JSON.stringify(initialValue)))),
  }
})

function createFetchResponse(data: unknown, ok = true, status = 200, statusText = 'OK') {
  return Promise.resolve({
    ok,
    status,
    statusText,
    json: () => Promise.resolve(data),
    text: () => Promise.resolve(JSON.stringify(data)),
  })
}

const mockAPIBahnStation: VBBLocation = {
  type: 'stop',
  id: '900000100001',
  name: 'S Charlottenburg (Berlin)',
  location: { type: 'location', latitude: 52.504811, longitude: 13.303848 },
  products: { suburban: true, subway: false, tram: false, bus: true, ferry: false, express: false, regional: true },
}

const mockAPIBusStation: VBBLocation = {
  type: 'stop',
  id: '900000023201',
  name: 'U Adenauerplatz (Berlin)',
  location: { type: 'location', latitude: 52.500962, longitude: 13.300102 },
  products: { suburban: false, subway: true, tram: false, bus: true, ferry: false, express: false, regional: false },
}

const normalizedStationA: Station = {
  id: '900000100001',
  name: 'S Charlottenburg',
  type: 'stop', 
  location: { type: 'location', latitude: 52.504811, longitude: 13.303848 },
  distance: undefined,
}

const normalizedStationB: Station = {
  id: '900000023201',
  name: 'U Adenauerplatz',
  type: 'stop',
  location: { type: 'location', latitude: 52.500962, longitude: 13.300102 },
  distance: undefined,
}


const mockDeparture: Trip = {
  tripId: 'trip1',
  line: { name: 'U2', product: 'subway' as TransitProduct },
  direction: 'Pankow',
  when: new Date().toISOString(),
  plannedWhen: new Date().toISOString(),
  delay: 0,
  cancelled: false,
  platform: '1',
}

describe('Stations Store', () => {
  let defaultStore: ReturnType<typeof useStationsStore> 
  let preferencesStore: ReturnType<typeof usePreferencesStore>
  let favoritesStore: ReturnType<typeof useFavoritesStore>


  beforeEach(() => {
    setActivePinia(createPinia())
    
    vi.mocked(useGeolocation).mockReturnValue({
        coords: ref({ latitude: null, longitude: null, accuracy: null, altitude: null, altitudeAccuracy: null, heading: null, speed: null }),
        locatedAt: ref(null),
        error: ref(null),
        resume: vi.fn(),
        pause: vi.fn(),
    });

    defaultStore = useStationsStore()
    preferencesStore = usePreferencesStore()
    favoritesStore = useFavoritesStore()

    defaultStore.clearStations() 
    favoritesStore.favoriteIds = [] 
    preferencesStore.resetPreferences() 

    preferencesStore.preferences.maxDepartures = 10;
    preferencesStore.preferences.maxDistance = 1000;
    preferencesStore.preferences.enabledTransitTypes = ['sbahn', 'ubahn', 'tram', 'bus', 'ferry', 'regional', 'express']
  })

  afterEach(() => {
    vi.mocked(fetch).mockReset(); 
    vi.clearAllMocks() 
  })

  it('initial state is correct', () => {
    expect(defaultStore.stations).toEqual([])
    expect(defaultStore.departures).toEqual({})
    expect(defaultStore.isLoading).toBe(false)
    expect(defaultStore.error).toBeNull()
  })

  describe('updateMapCenter', () => {
    it('updates mapCenter which then affects sortedStations', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(createFetchResponse([mockAPIBahnStation, mockAPIBusStation]))
      await defaultStore.fetchNearbyStations(52.52, 13.38) 

      defaultStore.updateMapCenter(52.500000, 13.300000) 
      await nextTick() 

      const sorted = defaultStore.sortedStations
      expect(sorted.length).toBe(2)
      expect(sorted[0].id).toBe(normalizedStationB.id) 
      expect(sorted[1].id).toBe(normalizedStationA.id) 
    })
  })

  describe('clearStations', () => {
    it('resets the store state to initial values', async () => {
      vi.mocked(fetch).mockResolvedValueOnce(createFetchResponse([mockAPIBahnStation]))
      await defaultStore.fetchNearbyStations(52.5, 13.3)
      defaultStore.updateMapCenter(52.5, 13.4)

      defaultStore.clearStations()

      expect(defaultStore.stations).toEqual([])
      expect(defaultStore.departures).toEqual({})
      expect(defaultStore.isLoading).toBe(false)
      expect(defaultStore.error).toBeNull()
      const sorted = defaultStore.sortedStations 
      expect(sorted).toEqual([])
    })
  })

  describe('fetchNearbyStations', () => {
    it('fetches and normalizes stations on success', async () => {
      vi.mocked(fetch).mockResolvedValue(createFetchResponse([mockAPIBahnStation, mockAPIBusStation]))
      await defaultStore.fetchNearbyStations(52.52, 13.38)
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(defaultStore.stations).toEqual([normalizedStationA, normalizedStationB])
      expect(defaultStore.isLoading).toBe(false) 
      expect(defaultStore.error).toBeNull() 
    })

    it('sets error state on fetch failure', async () => {
      vi.mocked(fetch).mockResolvedValue(createFetchResponse({}, false, 500, 'Internal Server Error'))
      await defaultStore.fetchNearbyStations(52.52, 13.38)
      expect(defaultStore.stations).toEqual([])
      expect(defaultStore.isLoading).toBe(false)
      expect(defaultStore.error).toBe('Failed to fetch stations: Internal Server Error (500)')
    })

    it('sets error state on invalid coordinates', async () => {
        await defaultStore.fetchNearbyStations(NaN, 13.38)
        expect(defaultStore.error).toBe('Invalid coordinates provided')
        expect(fetch).not.toHaveBeenCalled()
    })

    it('handles AbortError gracefully', async () => {
      const abortError = new Error('Station request aborted');
      abortError.name = 'AbortError';
      vi.mocked(fetch).mockRejectedValue(abortError);
      await defaultStore.fetchNearbyStations(52.52, 13.38);
      expect(defaultStore.isLoading).toBe(false);
      expect(defaultStore.stations).toEqual([]);
      expect(defaultStore.error).toBeNull(); 
    });
  })

  describe('fetchDepartures', () => {
    const stationId = '900000100001' 

    it('fetches and processes departures on success', async () => {
      const apiResponse = [{ ...mockDeparture, line: { name: 'U2', product: 'subway' } }]
      vi.mocked(fetch).mockResolvedValue(createFetchResponse({ departures: apiResponse }))
      await defaultStore.fetchDepartures(stationId)
      expect(fetch).toHaveBeenCalledTimes(1)
      expect(defaultStore.departures[stationId]).toHaveLength(1)
      expect(defaultStore.departures[stationId][0].line.product).toBe('ubahn')
      expect(defaultStore.error).toBeNull()
      
      vi.mocked(fetch).mockClear() 
      await defaultStore.fetchDepartures(stationId) 
      expect(fetch).not.toHaveBeenCalled()
    })

    it('uses cache if data is fresh and not forced', async () => {
      const cachedTrip = { ...mockDeparture, tripId: 'cachedTrip' }
      vi.mocked(fetch).mockResolvedValueOnce(createFetchResponse({ departures: [cachedTrip] }))
      await defaultStore.fetchDepartures(stationId) 
      expect(defaultStore.departures[stationId][0].tripId).toBe('cachedTrip')
      
      vi.mocked(fetch).mockClear()
      vi.mocked(fetch).mockResolvedValueOnce(createFetchResponse({ departures: [{...mockDeparture, tripId: 'newTrip'}] }))
      await defaultStore.fetchDepartures(stationId, false) 
      expect(fetch).not.toHaveBeenCalled() 
      expect(defaultStore.departures[stationId][0].tripId).toBe('cachedTrip')
    })
    
    it('fetches new data if forced, even if cache is fresh', async () => {
      const cachedData = [{ ...mockDeparture, tripId: 'cachedTripForForceTest' }];
      const freshApiResponse = [{ ...mockDeparture, tripId: 'freshTripAfterForce', line: { name: 'S1', product: 'sbahn' as TransitProduct } }];

      vi.mocked(fetch).mockResolvedValueOnce(createFetchResponse({ departures: cachedData }));
      await defaultStore.fetchDepartures(stationId, false); 
      expect(defaultStore.departures[stationId][0].tripId).toBe('cachedTripForForceTest');

      vi.mocked(fetch).mockClear();
      vi.mocked(fetch).mockResolvedValueOnce(createFetchResponse({ departures: freshApiResponse }));
      await defaultStore.fetchDepartures(stationId, true); 

      expect(fetch).toHaveBeenCalledTimes(1); 
      expect(defaultStore.departures[stationId][0].tripId).toBe('freshTripAfterForce');
    })

    it('appends departures when loadMore is true', async () => {
      const first = [
        { ...mockDeparture, tripId: 't1', plannedWhen: '2024-01-01T10:00:00Z', when: '2024-01-01T10:00:00Z' },
        { ...mockDeparture, tripId: 't2', plannedWhen: '2024-01-01T10:05:00Z', when: '2024-01-01T10:05:00Z' }
      ]
      vi.mocked(fetch).mockResolvedValueOnce(createFetchResponse({ departures: first }))
      await defaultStore.fetchDepartures(stationId)
      expect(defaultStore.departures[stationId]).toHaveLength(2)

      const more = [
        { ...mockDeparture, tripId: 't2', plannedWhen: '2024-01-01T10:05:00Z', when: '2024-01-01T10:05:00Z' },
        { ...mockDeparture, tripId: 't3', plannedWhen: '2024-01-01T10:10:00Z', when: '2024-01-01T10:10:00Z' },
        { ...mockDeparture, tripId: 't4', plannedWhen: '2024-01-01T10:15:00Z', when: '2024-01-01T10:15:00Z' }
      ]
      vi.mocked(fetch).mockResolvedValueOnce(createFetchResponse({ departures: more }))
      await defaultStore.fetchDepartures(stationId, false, true)

      const ids = defaultStore.departures[stationId].map(d => d.tripId)
      expect(ids).toEqual(['t1', 't2', 't3', 't4'])
    })

    it('sets error state on departure fetch failure', async () => {
      defaultStore.clearStations();
      vi.mocked(fetch).mockResolvedValue(createFetchResponse({}, false, 500, 'Server Down'))
      await defaultStore.fetchDepartures(stationId)
      expect(defaultStore.departures[stationId]).toEqual([])
      expect(defaultStore.error).toBe('Failed to fetch departures: Server Down')
    })

    it('handles AbortError gracefully', async () => {
      const abortError = new Error('abort')
      abortError.name = 'AbortError'
      vi.mocked(fetch).mockRejectedValueOnce(abortError)
      await defaultStore.fetchDepartures(stationId)
      expect(defaultStore.departures[stationId]).toBeUndefined()
      expect(defaultStore.error).toBeNull()
    })
  })

  describe('sortedStations getter', () => {
    // Skipping this test due to persistent issues with reliably mocking/triggering
    // the useGeolocation watcher for immediate:true in the store's setup.
    // The failure indicates userLocation is not being updated as expected in the test,
    // leading to incorrect sort order (stations remain unsorted by distance).
    it('returns stations sorted by distance if userLocation is available', async () => {
      const mockCoords = ref({ 
        latitude: 52.500000, 
        longitude: 13.300000, 
        accuracy: 10, 
        altitude: null, altitudeAccuracy: null, heading: null, speed: null 
      });
      vi.mocked(useGeolocation).mockReturnValueOnce({
        coords: mockCoords,
        locatedAt: ref(Date.now()), 
        error: ref(null),
        resume: vi.fn(),
        pause: vi.fn(),
      });

      const currentTestStore = useStationsStore();
      await nextTick(); 
      
      vi.mocked(fetch).mockResolvedValueOnce(createFetchResponse([mockAPIBahnStation, mockAPIBusStation]));
      await currentTestStore.fetchNearbyStations(52.52, 13.38); 
      await nextTick();

      const sorted = currentTestStore.sortedStations;
      expect(sorted.length).toBe(2);
      expect(sorted[0].id).toBe(normalizedStationB.id); // B should be closer
      expect(sorted[1].id).toBe(normalizedStationA.id); // A should be further
    })

    it('filters stations by enabledTransitTypes when activeView is "favorites"', async () => {
      preferencesStore.preferences.enabledTransitTypes = ['sbahn'] 
      preferencesStore.updatePreference('lastView', 'favorites'); 
      await nextTick();

      vi.mocked(fetch).mockResolvedValueOnce(createFetchResponse([mockAPIBahnStation, mockAPIBusStation]))
      await defaultStore.fetchNearbyStations(52.52, 13.38)
      await nextTick()

      const sorted = defaultStore.sortedStations
      expect(sorted.length).toBe(0) 
    })
  })
})
