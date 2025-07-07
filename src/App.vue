<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch, computed } from 'vue'
import { ArrowPathIcon, SunIcon, MoonIcon, TrashIcon } from '@heroicons/vue/24/solid'
import BottomNav from './components/BottomNav.vue'
import { usePreferredDark, useStorage } from '@vueuse/core'
import { useStationsStore } from './stores/stations'
import { useFavoritesStore } from './stores/favorites'
import StationPanel from './components/StationPanel.vue'
import ErrorBoundary from './components/ErrorBoundary.vue'
import PWAUpdateNotification from './components/PWAUpdateNotification.vue'
import { useMap } from './composables/useMap'
import { useGeolocationHandling } from './composables/useGeolocationHandling'
import { usePerformanceMonitoring } from './composables/usePerformanceMonitoring'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Fix Leaflet icon path issues
delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: '/images/marker-icon-2x.png',
  iconUrl: '/images/marker-icon.png',
  shadowUrl: '/images/marker-shadow.png'
})

const { coords, isSupported, geolocationError, handleReload, clearLocalStorage } = useGeolocationHandling()

const store = useStationsStore()
const favoritesStore = useFavoritesStore()
const mapRef = ref<HTMLElement | null>(null)

// Performance monitoring
const { measureCustomMetric } = usePerformanceMonitoring()

// Dark mode handling
const isDark = useStorage('simple-transit-dark-mode', usePreferredDark().value)

const { map, markers, centerMarker, allowAutoCenter, isMapCentered, isMapReady, clearMarkers, updateMarkers, handleResize, initMap } = useMap(mapRef, coords, isDark)

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

// Component initialization
onMounted(() => {
  // Component mounted successfully
})

// Computed property for filtered stations
const filteredStations = computed(() => {
  
  if (favoritesStore.activeView === 'favorites') {
    return store.sortedStations.filter(station => 
      favoritesStore.favoriteIds.includes(station.id)
    )
  }
  return store.sortedStations
})

// App version for display
const appVersion = computed(() => import.meta.env.VITE_APP_VERSION || 'dev')

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
        // Fetch nearby stations with performance monitoring
        await measureCustomMetric('stations-fetch', () => 
          store.fetchNearbyStations(newCoords.latitude, newCoords.longitude)
        )
        measureCustomMetric('map-markers-update', () => updateMarkers())
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
  <div class="h-screen w-full flex md:flex-row flex-col transition-colors">
    <!-- Control buttons -->
    <div class="absolute top-4 right-4 z-[1000] flex gap-2">
      <!-- Dark mode toggle -->
      <button
        @click="isDark = !isDark"
        class="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all dark:hover:bg-gray-700"
        :aria-label="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
        :title="isDark ? 'Switch to light mode' : 'Switch to dark mode'"
      >
        <component
          :is="isDark ? SunIcon : MoonIcon"
          class="w-5 h-5 text-gray-600 dark:text-gray-300"
        />
      </button>
      
      <!-- Clear localStorage -->
      <button
        @click="clearLocalStorage"
        class="p-2 rounded-full bg-white dark:bg-gray-800 shadow-md hover:shadow-lg transition-all dark:hover:bg-gray-700 hover:bg-red-50 dark:hover:bg-red-900/20"
        aria-label="Clear local storage and reset app"
        title="Clear local storage and reset app"
      >
        <TrashIcon class="w-5 h-5 text-red-500" />
      </button>
    </div>
    <!-- Map Section -->
    <main role="main"
     class="w-full md:w-2/3 h-[40vh] md:h-screen relative" aria-label="Interactive map showing nearby transit stations">

      <!-- Map Container -->
      <div ref="mapRef" class="absolute inset-0 z-0" role="application" aria-label="Transit map">
        <!-- Map will be mounted here -->
      </div>
      <!-- Center Indicator -->
      <div v-if="!isMapCentered" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-[9999]">
        <div class="relative">
          <div class="w-6 h-6 rounded-full bg-white/90 dark:bg-gray-800/90 shadow-lg flex items-center justify-center">
            <div class="w-4 h-4 rounded-full bg-emerald-500 animate-pulse"></div>
          </div>
        </div>
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
    </main>

    <!-- Stations Panel -->
    <aside class="w-full md:w-1/3 h-[60vh] md:h-screen bg-gray-50 dark:bg-gray-900 transition-all duration-300 ease-in-out border-t md:border-l border-gray-200 dark:border-gray-700 flex flex-col" aria-label="Station information panel">
      <!-- Main Content -->
      <div class="flex-1 overflow-y-auto p-4">
        <div class="flex justify-between items-center mb-4">
          <div class="flex items-baseline gap-2">
            <h1 id="stations-heading" class="text-2xl font-bold text-gray-900 dark:text-white">Nearby Stations</h1>
            <span class="text-xs text-gray-500 dark:text-gray-400 font-mono">v{{ appVersion }}</span>
          </div>
          <button 
            v-if="coords.latitude && coords.longitude"
            @click="store.fetchNearbyStations(coords.latitude, coords.longitude)"
            :disabled="store.isLoading"
            class="p-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white rounded-lg transition-colors disabled:opacity-50"
            aria-label="Refresh stations list"
            title="Refresh stations"
          >
            <ArrowPathIcon :class="{'animate-spin': store.isLoading}" class="w-5 h-5" />
          </button>
        </div>
      
        <!-- Station List -->
        <section aria-labelledby="stations-heading" class="space-y-4">
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
            <ErrorBoundary v-for="station in filteredStations" :key="station.id">
              <StationPanel :station="station" />
            </ErrorBoundary>
          </template>
          
          <div v-else-if="favoritesStore.activeView === 'favorites' && filteredStations.length === 0" class="text-center py-8 text-gray-500">
            No favorite stations yet
          </div>
          <div v-else class="text-center py-8 text-gray-500">
            No stations found nearby
          </div>
        </section>
      </div>
      <!-- Bottom Navigation -->
      <BottomNav />
    </aside>
  </div>

  <!-- PWA Update Notifications -->
  <PWAUpdateNotification />
</template>