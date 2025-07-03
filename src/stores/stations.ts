import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGeolocation } from '@vueuse/core'
import type { Station, Trip, UserLocation, VBBLocation, VBBDeparture, TransitProduct } from '../types'
import type { TransitType } from '../types/preferences'
import { usePreferencesStore } from './preferences'
import { useFavoritesStore } from './favorites'
import { calculateDistance } from '../utils/distance'
import {
  isValidCoordinates,
  isValidStation,
  normalizeTransitType,
  normalizeStation,
} from './helpers'

interface DepartureCache {
  data: Trip[]
  timestamp: number
}

interface StoreState {
  stations: Station[]
  departures: Record<string, Trip[]>
  departuresCache: Record<string, DepartureCache>
  isLoading: boolean
  error: string | null
  userLocation: UserLocation | null
  mapCenter: UserLocation | null
}

export const useStationsStore = defineStore('stations', () => {
  const favoritesStore = useFavoritesStore()
  const CACHE_DURATION = 30000 // 30 seconds
  const departureControllers = new Map<string, AbortController>()

  const state = ref<StoreState>({
    stations: [],
    departures: {},
    departuresCache: {},
    isLoading: false,
    error: null,
    userLocation: null,
    mapCenter: null
  })

  // Computed property for sorted stations
  const { coords } = useGeolocation()

  // Watch for valid geolocation changes
  watch(
    () => coords.value,
    (newCoords) => {
      if (isValidCoordinates(newCoords)) {
        state.value.userLocation = {
          latitude: newCoords.latitude,
          longitude: newCoords.longitude
        }
      }
    },
    { immediate: true }
  )
  

  const sortedStations = computed(() => {
    const { userLocation, mapCenter, stations } = state.value
    const referencePoint = mapCenter || userLocation
    const enabledTypes = preferencesStore.preferences.enabledTransitTypes
    
    // First filter by transit type if in favorites view
    const filteredStations = favoritesStore.activeView === 'favorites'
      ? stations.filter(station => {
          const stationType = normalizeTransitType(station.type)
          return enabledTypes.includes(stationType)
        })
      : stations
    
    if (!referencePoint) return filteredStations

    return [...filteredStations]
      .map(station => ({
        ...station,
        distance: calculateDistance(
          referencePoint.latitude,
          referencePoint.longitude,
          station.location.latitude,
          station.location.longitude
        )
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .slice(0, MAX_STATIONS.value)
  })

  // Function to update map center
  function updateMapCenter(latitude: number, longitude: number) {
    state.value.mapCenter = { latitude, longitude }
  }

  const preferencesStore = usePreferencesStore()
  
  // Use preferences for configuration
  const MAX_STATIONS = computed(() => preferencesStore.preferences.maxDepartures)
  const MAX_DISTANCE = computed(() => preferencesStore.preferences.maxDistance)

  // Keep track of current requests
  let currentStationsController: AbortController | null = null

  async function fetchNearbyStations(latitude: number, longitude: number) {
    if (!isValidCoordinates({ latitude, longitude })) {
      state.value.error = 'Invalid coordinates provided'
      return
    }

    state.value.isLoading = true
    state.value.error = null

    // Cancel any in-flight request
    if (currentStationsController) {
      currentStationsController.abort()
    }
    currentStationsController = new AbortController()

    
    try {
      const url = new URL('https://v6.vbb.transport.rest/locations/nearby')
      url.searchParams.append('latitude', latitude.toString())
      url.searchParams.append('longitude', longitude.toString())
      url.searchParams.append('results', MAX_STATIONS.value.toString())
      url.searchParams.append('distance', MAX_DISTANCE.value.toString())
      url.searchParams.append('stops', 'true')

      const response = await fetch(url.toString(), {
        signal: currentStationsController.signal
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stations: ${response.statusText} (${response.status})`)
      }
      
      const data = await response.json() as VBBLocation[]
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid API response format')
      }

      const validStations = data
        .filter(isValidStation)
        .map(normalizeStation)
        .slice(0, MAX_STATIONS.value)

      state.value.stations = validStations
    } catch (e) {
      // Don't treat aborted requests as errors
      if (e instanceof Error && e.name === 'AbortError') {
        console.log('Station request aborted')
        return
      }
      console.error('Error fetching stations:', e)
      state.value.error = e instanceof Error ? e.message : 'An error occurred fetching stations'
      state.value.stations = []
    } finally {
      state.value.isLoading = false
    }
  }

  const MAX_DEPARTURES = computed(() => preferencesStore.preferences.maxDepartures)
  const DEPARTURE_DURATION = 30 // minutes

  async function fetchDepartures(stationId: string, force: boolean = false, loadMore: boolean = false) {
    console.log('Store fetchDepartures:', {
      stationId,
      force,
      loadMore,
      currentDepartures: state.value.departures[stationId]?.length || 0,
      maxDepartures: MAX_DEPARTURES.value
    });
    if (!stationId?.trim()) {
      console.error('No station ID provided')
      return
    }

    // Check cache
    const cached = state.value.departuresCache[stationId]
    const now = Date.now()
    
    // Only use cache if:
    // 1. Not loading more
    // 2. Not forced refresh
    // 3. Cache exists and is fresh
    if (!loadMore && !force && cached && (now - cached.timestamp) < CACHE_DURATION) {
      state.value.departures = {
        ...state.value.departures,
        [stationId]: cached.data
      }
      return
    }

    // Cancel any in-flight request for this station
    const existingController = departureControllers.get(stationId)
    if (existingController) {
      existingController.abort()
      departureControllers.delete(stationId)
    }
    
    const controller = new AbortController()
    departureControllers.set(stationId, controller)
    
    try {
      const url = new URL(`https://v6.vbb.transport.rest/stops/${encodeURIComponent(stationId)}/departures`)
      url.searchParams.append('duration', DEPARTURE_DURATION.toString())
      
      // When loading more, request more departures
      const results = loadMore ? MAX_DEPARTURES.value * 3 : MAX_DEPARTURES.value
      url.searchParams.append('results', results.toString())
      
      // When loading more, skip existing departures
      if (loadMore && state.value.departures[stationId]) {
        const lastDeparture = state.value.departures[stationId].slice(-1)[0]
        if (lastDeparture?.plannedWhen) {
          url.searchParams.append('when', lastDeparture.plannedWhen)
        }
      }

      const response = await fetch(url.toString(), {
        signal: controller.signal
      })
      
      if (!response.ok) {
        throw new Error(`Failed to fetch departures: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Handle both array and object responses
      const departuresArray = Array.isArray(data) ? data : data.departures || []
      
      const mappedDepartures = (departuresArray as VBBDeparture[])
        .filter(departure => {
          return departure?.line?.name && 
                 departure?.direction && 
                 (departure.when || departure.plannedWhen)
        })
        .map((departure) => {
          const plannedTime = departure.plannedWhen ? new Date(departure.plannedWhen) : new Date()
          const actualTime = departure.when ? new Date(departure.when) : plannedTime
          const delayMinutes = Math.round((actualTime.getTime() - plannedTime.getTime()) / 60000)
          
          return {
            tripId: departure.tripId || `${plannedTime.toISOString()}-${departure.line.name}`,
            line: {
              name: departure.line.name,
              product: normalizeTransitType(departure.line.product || departure.line.mode || 'bus') as unknown as TransitProduct
            },
            direction: departure.direction,
            when: actualTime.toISOString(),
            plannedWhen: plannedTime.toISOString(),
            delay: delayMinutes,
            cancelled: Boolean(departure.cancelled),
            platform: departure.platform ? String(departure.platform) : ''
          }
        })
        .sort((a, b) => new Date(a.when).getTime() - new Date(b.when).getTime())
        .slice(0, MAX_DEPARTURES.value)
      
      // Update departures and cache
      console.log('Processing departures:', {
        total: mappedDepartures.length,
        existing: state.value.departures[stationId]?.length || 0,
        loadMore
      });

      // Create a new array to trigger reactivity
      const newDepartures = [...mappedDepartures];

      // When loading more, append to existing departures
      if (loadMore && state.value.departures[stationId]) {
        const existingDepartures = [...state.value.departures[stationId]]
        
        // Filter out duplicates
        const uniqueDepartures = newDepartures.filter(dep => 
          !existingDepartures.some(existing => existing.tripId === dep.tripId)
        )

        console.log('Merging departures:', {
          existing: existingDepartures.length,
          new: uniqueDepartures.length,
          total: existingDepartures.length + uniqueDepartures.length
        });

        // Create a new merged array and sort
        const allDepartures = [...existingDepartures, ...uniqueDepartures].sort((a, b) => {
          const aTime = new Date(a.plannedWhen || '').getTime()
          const bTime = new Date(b.plannedWhen || '').getTime()
          return aTime - bTime
        });

        // Update state with new array
        state.value.departures = {
          ...state.value.departures,
          [stationId]: allDepartures.slice(0, MAX_DEPARTURES.value * (loadMore ? 2 : 1))
        };

        console.log('Final departures:', {
          count: state.value.departures[stationId].length,
          limit: MAX_DEPARTURES.value * (loadMore ? 2 : 1)
        });
      } else {
        // Update state with new array for initial load
        state.value.departures = {
          ...state.value.departures,
          [stationId]: newDepartures.slice(0, MAX_DEPARTURES.value)
        };
      }
      
      // Only update cache on initial load, not when loading more
      if (!loadMore) {
        state.value.departuresCache[stationId] = {
          data: state.value.departures[stationId],
          timestamp: Date.now()
        }
      }
    } catch (e) {
      // Don't treat aborted requests as errors
      if (e instanceof Error && e.name === 'AbortError') {
        console.log(`Departures request aborted for station ${stationId}`)
        return
      }
      departureControllers.delete(stationId)
      console.error('Error fetching departures:', e)
      state.value.departures[stationId] = []
      state.value.error = e instanceof Error ? e.message : 'An error occurred fetching departures'
    }
  }

  function clearStations() {
    // Abort all pending requests
    departureControllers.forEach(controller => controller.abort())
    departureControllers.clear()

    state.value = {
      stations: [],
      departures: {},
      departuresCache: {},
      isLoading: false,
      error: null,
      userLocation: null,
      mapCenter: null
    }
  }


  return {
    stations: computed(() => state.value.stations),
    departures: computed(() => state.value.departures),
    isLoading: computed(() => state.value.isLoading),
    error: computed(() => state.value.error),
    sortedStations,
    fetchNearbyStations,
    fetchDepartures,
    clearStations,
    updateMapCenter
  }
})
