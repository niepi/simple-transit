<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { ArrowPathIcon, SunIcon, MoonIcon, TrashIcon } from '@heroicons/vue/24/solid'
import BottomNav from './components/BottomNav.vue'
import { useGeolocation, usePreferredDark, useStorage } from '@vueuse/core'
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

// Clear localStorage and reload
function clearLocalStorage(): void {
  if (typeof window !== 'undefined') {
    window.localStorage.clear()
    window.location.reload()
  }
}

const store = useStationsStore()
const favoritesStore = useFavoritesStore()
const mapRef = ref<HTMLElement | null>(null)
const map = ref<any>(null)
const markers = ref<any[]>([])
const centerMarker = ref<any>(null)
const allowAutoCenter = ref(true)

// Dark mode handling
const isDark = useStorage('simple-transit-dark-mode', usePreferredDark().value)

// Watch dark mode changes
watch(isDark, (dark) => {
  if (dark) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
})

// Initialize dark mode
onMounted(() => {
  if (isDark.value) {
    document.documentElement.classList.add('dark')
  }
})

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
    
    // Add center indicator
    const center = map.value.getCenter()
    centerMarker.value = L.marker([center.lat, center.lng], {
      icon: L.divIcon({
        html: `
          <div class="relative z-[9999] -translate-x-1/2 -translate-y-1/2">
            <div class="w-16 h-16 rounded-full bg-white/90 dark:bg-dark-card/90 shadow-lg flex items-center justify-center border-2 border-blue-500/30">
              <div class="w-8 h-8 rounded-full bg-blue-500 animate-pulse shadow-lg"></div>
              <div class="absolute w-24 h-24 -inset-4 rounded-full border-4 border-blue-500/70 animate-ping"></div>
            </div>
            <div class="absolute -bottom-10 left-1/2 -translate-x-1/2 bg-white/90 dark:bg-dark-card/90 px-3 py-1.5 rounded-full shadow-lg text-sm font-bold whitespace-nowrap z-[9999] text-blue-600 dark:text-blue-400 border border-blue-500/30">
              Map Center
            </div>
          </div>
        `,
        className: 'center-marker !z-[9999]',
        iconSize: [1, 1],
        iconAnchor: [0, 0],
        popupAnchor: [0, 0]
      })
    })
    centerMarker.value.addTo(map.value)
    
    // Create light and dark tile layers
    const lightTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      detectRetina: true,
      className: 'map-tiles'
    })

    const darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
      subdomains: 'abcd',
      maxZoom: 19,
      detectRetina: true,
      className: 'map-tiles'
    })

    // Add initial tile layer based on dark mode
    ;(isDark.value ? darkTileLayer : lightTileLayer).addTo(map.value)

    // Watch dark mode changes to update map theme
    watch(isDark, (dark) => {
      if (dark) {
        map.value.removeLayer(lightTileLayer)
        darkTileLayer.addTo(map.value)
      } else {
        map.value.removeLayer(darkTileLayer)
        lightTileLayer.addTo(map.value)
      }
    })
    
    // Only update stations when map is moved after we have user location
    map.value.on('movestart', () => {
      allowAutoCenter.value = false
      // Enhance center marker visibility during movement
      if (centerMarker.value) {
        const icon = centerMarker.value.getIcon()
        icon.options.html = icon.options.html
          .replace('animate-pulse', 'animate-pulse opacity-100')
          .replace('border-blue-500/70', 'border-blue-500/90')
          .replace('w-6 h-6', 'w-8 h-8')
          .replace('w-12 h-12', 'w-14 h-14')
          .replace('w-16 h-16', 'w-20 h-20')
        centerMarker.value.setIcon(icon)
      }
    })
    
    map.value.on('move', () => {
      // Update center marker position and store's map center during movement
      if (centerMarker.value) {
        const center = map.value.getCenter()
        centerMarker.value.setLatLng([center.lat, center.lng])
        store.updateMapCenter(center.lat, center.lng)
      }
    })
    
    map.value.on('moveend', async () => {
      if (coords.value.latitude && coords.value.longitude) {
        const center = map.value.getCenter()
        
        // Update center marker position and store's map center
        if (centerMarker.value) {
          // Reset marker to normal size
          const icon = centerMarker.value.getIcon()
          icon.options.html = icon.options.html
            .replace('opacity-100', '')
            .replace('border-blue-500/90', 'border-blue-500/70')
            .replace('w-8 h-8', 'w-6 h-6')
            .replace('w-14 h-14', 'w-12 h-12')
            .replace('w-20 h-20', 'w-16 h-16')
          centerMarker.value.setIcon(icon)
          centerMarker.value.setLatLng([center.lat, center.lng])
          store.updateMapCenter(center.lat, center.lng)
        }
        
        await store.fetchNearbyStations(center.lat, center.lng)
        updateMarkers()
      }
    })

    isMapReady.value = true
  } catch (error) {
    console.error('Error initializing map:', error)
  }
}

// Wait for container to be ready
const isMapReady = ref(false)

// Debug logging
onMounted(() => {
  console.log('[App] Component mounted')
  console.log('[App] BottomNav exists:', !!document.querySelector('nav.fixed'))
  console.log('[App] DOM structure:', document.body.innerHTML)
})

// Computed property for filtered stations
const filteredStations = computed(() => {
  console.log('[App] Computing filtered stations')
  console.log('[App] Active view:', favoritesStore.activeView)
  console.log('[App] Sorted stations:', store.sortedStations)
  console.log('Active view:', favoritesStore.activeView)
  console.log('Sorted stations:', store.sortedStations)
  console.log('Favorite IDs:', favoritesStore.favoriteIds)
  
  if (favoritesStore.activeView === 'favorites') {
    return store.sortedStations.filter(station => 
      favoritesStore.favoriteIds.includes(station.id)
    )
  }
  return store.sortedStations
})

// Watch for changes in coordinates
watch(
  () => coords.value,
  async (newCoords) => {
    // Validate coordinates
    if (newCoords?.latitude && newCoords?.longitude && 
        !isNaN(newCoords.latitude) && !isNaN(newCoords.longitude) &&
        Math.abs(newCoords.latitude) <= 90 && Math.abs(newCoords.longitude) <= 180) {
      // Clear any previous error
      geolocationError.value = null
      
      // Initialize map if not already done
      if (!map.value) {
        await nextTick()
        initMap()
      }
      
      // Center map on user location if allowed
      if (allowAutoCenter.value && map.value) {
        map.value.setView([newCoords.latitude, newCoords.longitude], 15)
      }
      
      try {
        // Fetch nearby stations
        await store.fetchNearbyStations(newCoords.latitude, newCoords.longitude)
        updateMarkers()
      } catch (error) {
        console.error('Error loading stations:', error)
      }
    }
  },
  { immediate: true }
)

// Set up window resize handler
onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="h-screen w-full flex md:flex-row flex-col dark:bg-dark transition-colors">
    <!-- Control buttons -->
    <div class="absolute top-4 right-4 z-[1000] flex gap-2">
      <!-- Dark mode toggle -->
      <button
        @click="isDark = !isDark"
        class="p-2 rounded-full bg-white dark:bg-dark-card shadow-md hover:shadow-lg transition-all dark:hover:bg-dark-hover"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <component
          :is="isDark ? SunIcon : MoonIcon"
          class="w-5 h-5 text-gray-600 dark:text-dark"
        />
      </button>
      
      <!-- Clear localStorage -->
      <button
        @click="clearLocalStorage"
        class="p-2 rounded-full bg-white dark:bg-dark-card shadow-md hover:shadow-lg transition-all dark:hover:bg-dark-hover hover:bg-red-50 dark:hover:bg-red-900/20"
        title="Clear local storage and reset app"
      >
        <TrashIcon class="w-5 h-5 text-red-500" />
      </button>
    </div>
    <!-- Map Section -->
    <div class="w-full md:w-2/3 h-[40vh] md:h-screen relative">

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
    <div class="w-full md:w-1/3 h-[60vh] md:h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out border-t md:border-l border-gray-200 dark:border-gray-700 flex flex-col">
      <!-- Main Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="flex justify-between items-center mb-4">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Nearby Stations</h1>
          <button 
            v-if="coords.latitude && coords.longitude"
            @click="store.fetchNearbyStations(coords.latitude, coords.longitude)"
            :disabled="store.isLoading"
            class="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg transition-colors disabled:opacity-50"
            title="Refresh stations"
          >
            <ArrowPathIcon :class="{'animate-spin': store.isLoading}" class="w-5 h-5" />
          </button>
        </div>
      
        <!-- Station List -->
        <div class="space-y-4">
          <div v-if="!coords.latitude || !coords.longitude" class="text-center py-8 text-gray-500">
            Waiting for location access...
          </div>
          
          <div v-else-if="store.isLoading" class="text-center py-8 text-gray-500">
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
      <BottomNav />
    </div>
  </div>
</template>
