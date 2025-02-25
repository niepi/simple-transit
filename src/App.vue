<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { ArrowPathIcon, StarIcon } from '@heroicons/vue/24/solid'
import { useGeolocation } from '@vueuse/core'
import { useStationsStore } from './stores/stations'
import { useFavoritesStore } from './stores/favorites'
import StationPanel from './components/StationPanel.vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png'
})

const { coords, isSupported } = useGeolocation()
const geolocationError = ref<string | null>(null)

// Handle geolocation support
if (!isSupported) {
  geolocationError.value = 'Geolocation is not supported in your browser'
}

// Handle page reload
function handleReload(): void {
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}
const store = useStationsStore()
const favoritesStore = useFavoritesStore()
const mapRef = ref<HTMLElement | null>(null)
const map = ref<any>(null)
const markers = ref<any[]>([])
const centerMarker = ref<any>(null)

function clearMarkers() {
  markers.value.forEach(marker => marker.remove())
  markers.value = []
  
  if (centerMarker.value) {
    centerMarker.value.remove()
    centerMarker.value = null
  }
}

function updateMarkers() {
  if (!map.value) return
  
  clearMarkers()
  
  // Add markers for each station
  store.stations.forEach(station => {
    const marker = L.marker([station.location.latitude, station.location.longitude], {
      icon: L.divIcon({
        html: `
          <div class="relative z-[500]">
            <div class="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center">
              <div class="w-4 h-4 rounded-full bg-red-500"></div>
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs whitespace-nowrap z-[1000]">
              ${station.name}
            </div>
          </div>
        `,
        className: 'station-marker !z-[500]',
        iconSize: [24, 24],
        iconAnchor: [12, 24],  // Adjusted to account for label
        popupAnchor: [0, -36]  // Adjusted to show above label
      })
    })
    
    marker.addTo(map.value)
    marker.bindPopup(`
      <div class="p-2">
        <div class="font-bold mb-1">${station.name}</div>
        <div class="text-sm text-gray-600">${Math.round(station.distance ?? 0)} meters away</div>
      </div>
    `, {
      offset: [0, -12]  // Adjust popup offset
    })
    markers.value.push(marker)
  })
  
  // Add user location marker if available
  if (coords.value.latitude && coords.value.longitude) {
    const userMarker = L.marker([coords.value.latitude, coords.value.longitude], {
      icon: L.divIcon({
        html: `
          <div class="relative z-[600]">
            <div class="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
              <div class="w-6 h-6 rounded-full bg-blue-500 animate-pulse"></div>
            </div>
            <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs font-semibold whitespace-nowrap z-[1000]">
              You are here
            </div>
          </div>
        `,
        className: 'user-marker !z-[600]',
        iconSize: [32, 32],
        iconAnchor: [16, 28],  // Adjusted to account for label
        popupAnchor: [0, -44]  // Adjusted to show above label
      })
    })
    
    userMarker.addTo(map.value)
    userMarker.bindPopup('<div class="p-2 font-semibold">Your Location</div>', {
      offset: [0, -16]  // Adjust popup offset
    })
    markers.value.push(userMarker)
  }
}

// Watch for window resize to handle map resizing
const handleResize = () => {
  if (map.value) {
    nextTick(() => {
      map.value.invalidateSize()
      // Re-center map if we have coordinates
      if (coords.value.latitude && coords.value.longitude) {
        map.value.setView([coords.value.latitude, coords.value.longitude], map.value.getZoom())
      }
    })
  }
}

// Initialize map after container is ready
function initMap() {
  if (!mapRef.value || map.value) return

  try {      
    // Create map instance with default view of Berlin
    // Create map instance with default view of Berlin
    map.value = L.map(mapRef.value, {
      zoomControl: false, // We'll add controls separately
      attributionControl: false,
      minZoom: 10,
      maxZoom: 18,
      maxBounds: [
        [52.3, 13.1], // Southwest
        [52.7, 13.8]  // Northeast
      ]
    }).setView([52.52, 13.405], 13)

    // Add zoom control to bottom right
    L.control.zoom({ position: 'bottomright' }).addTo(map.value)
    
    // Add attribution control to bottom left
    L.control.attribution({ position: 'bottomleft' }).addTo(map.value)
    
    // Add tile layer with retina support
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      detectRetina: true,
      className: 'map-tiles'
    }).addTo(map.value)
    
    // Only update stations when map is moved after we have user location
    map.value.on('movestart', () => {
      allowAutoCenter.value = false
    })
    
    map.value.on('moveend', async () => {
      if (coords.value.latitude && coords.value.longitude) {
        const center = map.value.getCenter()
        
        // Update center marker
        if (centerMarker.value) {
          centerMarker.value.remove()
        }
        centerMarker.value = L.marker([center.lat, center.lng], {
          icon: L.divIcon({
            html: `
              <div class="relative z-[550]">
                <div class="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center">
                  <div class="w-4 h-4 rounded-full bg-yellow-500 animate-pulse"></div>
                </div>
                <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white px-2 py-1 rounded shadow-md text-xs font-semibold whitespace-nowrap z-[1000]">
                  Search Center
                </div>
              </div>
            `,
            className: 'center-marker !z-[550]',
            iconSize: [24, 24],
            iconAnchor: [12, 24],
            popupAnchor: [0, -36]
          })
        })
        centerMarker.value.addTo(map.value)
        
        await store.fetchNearbyStations(center.lat, center.lng)
        updateMarkers()
      }
    })

    // Force a resize after initialization
    nextTick(() => {
      map.value.invalidateSize()
    })
  } catch (error) {
    console.error('Error initializing map:', error)
  }
}

// Wait for container to be ready
const isMapReady = ref(false)

// Computed property for filtered stations
const filteredStations = computed(() => {
  if (favoritesStore.activeView === 'favorites') {
    return store.sortedStations.filter(station => favoritesStore.isFavorite(station.id))
  }
  return store.sortedStations
})

// Watch for map initialization
const isInitialized = ref(false)
const allowAutoCenter = ref(true)

// Initialize map and set up watchers
onMounted(() => {
  // Add resize listener
  window.addEventListener('resize', handleResize)

  // Initialize map after container is ready
  const initInterval = setInterval(() => {
    if (mapRef.value && !map.value) {
      clearInterval(initInterval)
      nextTick(() => {
        initMap()
        isMapReady.value = true
        isInitialized.value = true
      })
    }
  }, 100)

  // Cleanup interval if component unmounts
  onUnmounted(() => {
    clearInterval(initInterval)
  })
})

// Watch for both map initialization and geolocation
watch([isInitialized, () => coords.value.latitude, () => coords.value.longitude], async ([initialized, lat, lng]) => {
  if (!initialized || !map.value) return
  
  if (lat && lng) {
    // Clear existing stations and markers
    store.clearStations()
    clearMarkers()
    
    // Only auto-center if allowed
    if (allowAutoCenter.value) {
      map.value.setView([lat, lng], 15)
    }
    
    await store.fetchNearbyStations(lat, lng)
    updateMarkers()
  }
}, { immediate: true })

// Watch for stations changes
watch(() => store.stations, () => {
  updateMarkers()
}, { deep: true })

// Cleanup
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (map.value) {
    map.value.remove()
    map.value = null
  }
  clearMarkers()
})
</script>

<template>
  <div class="h-screen w-full flex md:flex-row flex-col overflow-hidden">
    <!-- Map Section -->
    <div class="w-full md:w-2/3 h-[33vh] md:h-screen relative">
      <!-- Map Container -->
      <div ref="mapRef" class="absolute inset-0 z-0">
        <!-- Map will be mounted here -->
      </div>
      
      <!-- Map Loading State -->
      <div v-if="!isMapReady" 
           class="absolute inset-0 bg-gray-900/30 backdrop-blur-sm flex items-center justify-center z-[500]">
        <div class="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent"></div>
      </div>
      
      <!-- Geolocation States -->
      <div v-if="geolocationError || !coords.latitude || !coords.longitude"
           class="absolute inset-0 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center z-[1000] text-white">
        <div class="text-center p-4 rounded-lg bg-gray-900/80 max-w-md mx-auto">
          <template v-if="geolocationError">
            <div class="text-xl font-semibold mb-2 text-red-400">Location Error</div>
            <div class="text-sm">{{ geolocationError }}</div>
            <button 
              type="button"
              @click="handleReload" 
              class="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 rounded-lg transition-colors"
            >
              Retry
            </button>
          </template>
          <template v-else>
            <div class="text-xl font-semibold mb-2">Waiting for Location</div>
            <div class="text-sm">Please allow location access to find nearby stations</div>
            <div class="mt-4">
              <div class="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mx-auto"></div>
            </div>
          </template>
        </div>
      </div>
    </div>
    <!-- Stations Panel -->
    <div class="w-full md:w-1/3 h-[67vh] md:h-screen flex flex-col bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out border-t md:border-l border-gray-200 dark:border-gray-700">
      <!-- Main Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Nearby Stations</h1>
          <button 
            v-if="coords.latitude && coords.longitude"
            @click="store.fetchNearbyStations(coords.latitude, coords.longitude)"
            :disabled="store.loading"
            class="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg transition-colors disabled:opacity-50"
            title="Refresh stations"
          >
            <ArrowPathIcon :class="{'animate-spin': store.loading}" class="w-5 h-5" />
          </button>
        </div>
      
        <!-- Station List -->
        <div class="space-y-4">
          <div v-if="!coords.latitude || !coords.longitude" class="text-center py-8 text-gray-500">
            Waiting for location access...
          </div>
          
          <div v-else-if="store.loading" class="text-center py-8 text-gray-500">
            Loading nearby stations...
          </div>
          
          <div v-else-if="store.error" class="text-center py-8 text-red-500">
            {{ store.error }}
          </div>
          
          <template v-else-if="store.sortedStations.length > 0">
            <StationPanel
              v-for="station in filteredStations"
              :key="station.id"
              :station="station"
            />
          </template>
          
          <div v-else-if="favoritesStore.activeView === 'favorites' && filteredStations.length === 0" class="text-center py-8 text-gray-500">
            No favorite stations yet
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            No stations found nearby
          </div>
        </div>
      </div>

      <!-- Bottom Navigation -->
      <div class="flex justify-center items-center p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="inline-flex rounded-lg overflow-hidden">
          <button
            @click="favoritesStore.activeView = 'all'"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors',
              favoritesStore.activeView === 'all'
                ? 'bg-gray-900 text-white dark:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            All Stations
          </button>
          <button
            @click="favoritesStore.activeView = 'favorites'"
            :class="[
              'px-4 py-2 text-sm font-medium transition-colors',
              favoritesStore.activeView === 'favorites'
                ? 'bg-gray-900 text-white dark:bg-gray-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
            ]"
          >
            <div class="flex items-center gap-1">
              <StarIcon class="w-5 h-5" />
              Favorites
            </div>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
