import { defineStore } from 'pinia'
import { ref, computed, watch } from 'vue'
import { useGeolocation } from '@vueuse/core'
import type { Station, Trip, UserLocation, VBBLocation, VBBDeparture } from '../types'

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI/180;
  const φ2 = lat2 * Math.PI/180;
  const Δφ = (lat2-lat1) * Math.PI/180;
  const Δλ = (lon2-lon1) * Math.PI/180;

  const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
          Math.cos(φ1) * Math.cos(φ2) *
          Math.sin(Δλ/2) * Math.sin(Δλ/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

  return R * c; // Distance in meters
}

export const useStationsStore = defineStore('stations', () => {
  const stations = ref<Station[]>([])
  const departures = ref<Record<string, Trip[]>>({})
  const loading = ref(false)
  const error = ref<string | null>(null)
  const userLocation = ref<UserLocation | null>(null)

  // Initialize stations as an empty array
  if (!stations.value) stations.value = []

  // Computed property for sorted stations
  const { coords } = useGeolocation()

  // Watch for geolocation changes
  watch([coords], ([{ latitude, longitude }]) => {
    if (latitude && longitude) {
      userLocation.value = { latitude, longitude }
      fetchNearbyStations(latitude, longitude)
    }
  })

  const sortedStations = computed(() => {
    const location = userLocation.value
    if (!location) return stations.value;

    return [...stations.value]
      .map(station => ({
        ...station,
        distance: calculateDistance(
          location.latitude,
          location.longitude,
          station.location.latitude,
          station.location.longitude
        )
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity))
      .slice(0, MAX_STATIONS); // Use constant for consistency
  })

  const MAX_STATIONS = 6
  const MAX_DISTANCE = 1000 // meters

  async function fetchNearbyStations(latitude: number, longitude: number) {
    if (!latitude || !longitude || isNaN(latitude) || isNaN(longitude)) {
      error.value = 'Invalid coordinates provided'
      return
    }

    loading.value = true
    error.value = null
    userLocation.value = { latitude, longitude }
    
    try {
      const url = new URL('https://v6.vbb.transport.rest/locations/nearby')
      url.searchParams.append('latitude', latitude.toString())
      url.searchParams.append('longitude', longitude.toString())
      url.searchParams.append('results', MAX_STATIONS.toString())
      url.searchParams.append('distance', MAX_DISTANCE.toString())
      url.searchParams.append('stops', 'true')

      const response = await fetch(url.toString())
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stations: ${response.statusText} (${response.status})`)
      }
      
      const data = await response.json() as VBBLocation[]
      
      if (!Array.isArray(data)) {
        throw new Error('Invalid API response format')
      }

      stations.value = data
        .filter(station => 
          station && 
          typeof station.name === 'string' && 
          station.location && 
          typeof station.location.latitude === 'number' && 
          typeof station.location.longitude === 'number'
        )
        .map((station) => ({
          ...station,
          name: station.name.replace(' (Berlin)', '').trim(),
          // Distance will be calculated by sortedStations computed property
          distance: undefined
        }))
        .slice(0, MAX_STATIONS)
    } catch (e) {
      console.error('Error fetching stations:', e)
      error.value = e instanceof Error ? e.message : 'An error occurred fetching stations'
      stations.value = []
    } finally {
      loading.value = false
    }
  }

  const MAX_DEPARTURES = 6
  const DEPARTURE_DURATION = 30 // minutes

  async function fetchDepartures(stationId: string) {
    if (!stationId?.trim()) {
      console.error('No station ID provided')
      return
    }
    
    try {
      const url = new URL(`https://v6.vbb.transport.rest/stops/${encodeURIComponent(stationId)}/departures`)
      url.searchParams.append('duration', DEPARTURE_DURATION.toString())
      url.searchParams.append('results', MAX_DEPARTURES.toString())

      const response = await fetch(url.toString()
      )
      
      if (!response.ok) {
        throw new Error(`Failed to fetch departures: ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Handle both array and object responses
      const departuresArray = Array.isArray(data) ? data : data.departures || []
      
      const mappedDepartures = (departuresArray as VBBDeparture[])
        .filter(departure => {
          return departure?.line?.name && departure?.direction
        })
        .map((departure) => {
          const now = new Date()
          const plannedWhen = departure.plannedWhen ? new Date(departure.plannedWhen) : now
          const actualWhen = departure.when ? new Date(departure.when) : plannedWhen
          const delayInMinutes = Math.round((actualWhen.getTime() - plannedWhen.getTime()) / 60000)
          
          const product = departure.line.product || departure.line.mode || 'bus'
          
          return {
            tripId: departure.tripId || `${plannedWhen.toISOString()}-${departure.line.name}`,
            line: {
              name: departure.line.name,
              product: product.toLowerCase()
            },
            direction: departure.direction,
            when: actualWhen.toISOString(),
            plannedWhen: plannedWhen.toISOString(),
            delay: delayInMinutes,
            cancelled: Boolean(departure.cancelled),
            platform: departure.platform ? String(departure.platform) : ''
          }
        })
        .slice(0, 4)
      
      // Update departures
      departures.value[stationId] = mappedDepartures
    } catch (e) {
      console.error('Error fetching departures:', e)
      departures.value[stationId] = []
    }
  }

  function clearStations() {
    stations.value = []
    departures.value = {}
    error.value = null
    userLocation.value = null
  }

  return {
    stations,
    departures,
    loading,
    error,
    sortedStations,
    fetchNearbyStations,
    fetchDepartures,
    clearStations
  }
})
