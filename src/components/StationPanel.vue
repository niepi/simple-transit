<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useStationsStore } from '../stores/stations'
import { useFavoritesStore } from '../stores/favorites'
import { usePreferencesStore } from '../stores/preferences'
import type { Station, TransitType } from '../types'
import type { TagProps } from 'element-plus'
import TransitIcon from './TransitIcon.vue'
import TransitFilter from './TransitFilter.vue'
import { ElTag, ElTooltip } from 'element-plus'
import { StarIcon as StarIconOutline } from '@heroicons/vue/24/outline'
import { StarIcon, ClockIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  station: Station
}>()

const store = useStationsStore()
const favoritesStore = useFavoritesStore()
const loading = ref(false)
const loadingMore = ref(false)
const refreshInterval = ref<number | null>(null)

// Import preferences store
const preferencesStore = usePreferencesStore()

// Watch store departures for changes with memoization
const stationDepartures = computed(() => {
  const deps = store.departures[props.station.id] || []
  const enabledTypes = preferencesStore.preferences.enabledTransitTypes

  return [...deps]
    .filter(dep => {
      // Filter out invalid departures
      if (!dep || !dep.plannedWhen) return false
      
      // Filter by transit type
      const transitType = getTransitType(dep.line.product)
      return enabledTypes.includes(transitType)
    })
    .map(dep => ({
      ...dep,
      // Pre-calculate times to avoid repeated Date parsing
      parsedTime: new Date(dep.plannedWhen).getTime(),
      formattedTime: new Date(dep.plannedWhen).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }))
    .sort((a, b) => a.parsedTime - b.parsedTime)
})

// Average walking speed in meters per minute
const WALKING_SPEED = 80

interface TimeDistance {
  time: string
  distance: string
  minutes: number
}

function formatTimeAndDistance(meters: number): TimeDistance {
  const minutes = Math.ceil(meters / WALKING_SPEED)
  const timeStr = minutes < 60 
    ? `${minutes} min` 
    : `${Math.floor(minutes / 60)}h ${minutes % 60}min`

  const distanceStr = meters < 1000
    ? `${Math.round(meters)}m`
    : `${(meters / 1000).toFixed(1)}km`

  return { time: timeStr, distance: distanceStr, minutes }
}

function getTimeTagType(meters: number): TagProps['type'] {
  const { minutes } = formatTimeAndDistance(meters)
  if (minutes <= 5) return 'success'
  if (minutes <= 10) return 'warning'
  return 'danger'
}

// Transit type mapping with better type safety
const transitTypeMap = {
  suburban: 'sbahn',
  s: 'sbahn',
  subway: 'ubahn',
  u: 'ubahn',
  tram: 'tram',
  bus: 'bus',
  ferry: 'ferry',
  express: 'express',
  regional: 'regional'
} as const

function getTransitType(product: string): TransitType {
  const type = product?.toLowerCase()?.trim() || ''
  return transitTypeMap[type as keyof typeof transitTypeMap] || 'tram'
}

function getTransitColor(type: TransitType): string {
  switch (type) {
    case 'sbahn':
      return 'bg-green-600'
    case 'ubahn':
      return 'bg-blue-600'
    case 'tram':
      return 'bg-red-600'
    case 'bus':
      return 'bg-purple-600'
    case 'ferry':
      return 'bg-cyan-600'
    case 'express':
    case 'regional':
      return 'bg-yellow-600'
    default:
      return 'bg-gray-600'
  }
}

// Debounced departure fetching
let fetchTimeout: number | null = null

async function fetchDepartures(loadMore = false) {
  if (!props.station?.id?.trim()) return
  
  // Clear any pending fetch
  if (fetchTimeout) {
    clearTimeout(fetchTimeout)
  }

  // Debounce fetch requests
  fetchTimeout = window.setTimeout(async () => {
    if (loadMore) {
      loadingMore.value = true
    } else {
      loading.value = true
    }

    try {
      await store.fetchDepartures(props.station.id, false, loadMore)
    } catch (error) {
      console.error('Error fetching departures:', error)
    } finally {
      loading.value = false
      loadingMore.value = false
      fetchTimeout = null
    }
  }, 300)
}

const REFRESH_INTERVAL = 60000 // 1 minute

function startRefreshInterval() {
  stopRefreshInterval() // Ensure no duplicate intervals
  refreshInterval.value = window.setInterval(fetchDepartures, REFRESH_INTERVAL)
}

function stopRefreshInterval() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

onMounted(() => {
  fetchDepartures()
  startRefreshInterval()
})

watch(() => props.station, (newStation) => {
  console.log('Station changed:', newStation)
  fetchDepartures()
})

// Clean up interval when component is unmounted
onUnmounted(() => {
  stopRefreshInterval()
})
</script>

<template>
  <div class="station-panel">
    <!-- Station header and filters -->
    <div class="flex flex-col gap-4 mb-4">
      <div class="flex items-center gap-2">
        <button
          class="opacity-60 hover:opacity-100 transition-opacity"
          @click="favoritesStore.toggleFavorite(station.id)"
          :title="favoritesStore.isFavorite(station.id) ? 'Remove from favorites' : 'Add to favorites'"
        >
          <component
            :is="favoritesStore.isFavorite(station.id) ? StarIcon : StarIconOutline"
            class="w-6 h-6 text-yellow-500"
          />
        </button>
        <h2 class="text-xl font-semibold">{{ station.name }}</h2>
      </div>
      
      <!-- Transit type filter (only shown in favorites view) -->
      <transition
        enter-active-class="transition-all duration-300 ease-out"
        enter-from-class="opacity-0 -translate-y-4"
        enter-to-class="opacity-100 translate-y-0"
        leave-active-class="transition-all duration-200 ease-in"
        leave-from-class="opacity-100 translate-y-0"
        leave-to-class="opacity-0 -translate-y-4"
      >
        <transit-filter v-if="favoritesStore.activeView === 'favorites'" />
      </transition>
    </div>
    
    <div v-if="loading" class="py-4 text-center text-gray-500 dark:text-dark-secondary">
      Loading departures...
    </div>
    
    <div v-else-if="stationDepartures.length === 0" class="py-4 text-center text-gray-500 dark:text-dark-secondary">
      No departures in the next 30 minutes
    </div>
    
    <div v-else class="space-y-2">
      <!-- Departures list -->
      <div class="space-y-2">
      <div v-for="departure in stationDepartures" :key="departure.tripId" 
           class="departure-item flex items-center p-2 rounded-lg shadow-sm bg-white dark:bg-dark-card dark:hover:bg-dark-hover transition-colors">
        <div :class="['transit-line px-2 py-1 rounded text-white font-medium flex items-center gap-2', 
                      getTransitColor(getTransitType(departure.line.product))]">
          <TransitIcon 
            :type="getTransitType(departure.line.product)"
            class="text-lg"
          />
          {{ departure.line.name }}
        </div>
        
        <div class="flex-1 mx-4">
          <div class="font-medium truncate">{{ departure.direction }}</div>
          <div class="text-sm text-gray-500 dark:text-dark-secondary">
            {{ departure.platform ? `Platform ${departure.platform}` : '' }}
          </div>
        </div>
        
        <div class="text-right">
          <div class="font-medium">
            {{ departure.formattedTime }}
          </div>
          
          <div v-if="departure.cancelled" class="text-sm px-2 py-0.5 bg-red-100 text-red-800 rounded">
            Cancelled
          </div>
          <div v-else-if="departure.delay && departure.delay !== 0" 
               :class="['text-sm px-2 py-0.5 rounded', 
                        (departure.delay ?? 0) > 5 ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800']">
            {{ (departure.delay ?? 0) > 0 ? `+${Math.floor(departure.delay)}` : departure.delay }} min
          </div>
          <div v-else class="text-sm px-2 py-0.5 bg-green-100 text-green-800 rounded">
            On time
          </div>
        </div>
      </div>

      <!-- Load more button -->
      <button
        v-if="stationDepartures.length > 0"
        @click="fetchDepartures(true)"
        :disabled="loadingMore"
        class="mt-4 w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white rounded-lg shadow transition-colors flex items-center justify-center gap-2"
      >
        <div v-if="loadingMore" class="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
        {{ loadingMore ? 'Loading...' : 'Load More Departures' }}
      </button>
      </div>
    </div>
  </div>
</template>
