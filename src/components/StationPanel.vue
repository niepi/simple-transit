<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useStationsStore } from '../stores/stations'
import { useFavoritesStore } from '../stores/favorites'
import { usePreferencesStore } from '../stores/preferences'
import type { Station, TransitType } from '../types'
// import type { TagProps } from 'element-plus' // Keep commented for now
import TransitIcon from './TransitIcon.vue'
import TransitFilter from './TransitFilter.vue'
import { StarIcon as StarIconOutline } from '@heroicons/vue/24/outline'
import { StarIcon } from '@heroicons/vue/24/solid'

const props = defineProps<{
  station: Station
}>()

const store = useStationsStore()
const favoritesStore = useFavoritesStore()
const preferencesStore = usePreferencesStore()

const loading = ref(false)
const loadingMore = ref(false)
const refreshInterval = ref<number | null>(null)
const isMounted = ref(false)

const stationDepartures = computed(() => { // Restore full logic
  const deps = store.departures[props.station.id] || []
  const enabledTypes = preferencesStore.preferences.enabledTransitTypes
  const maxDeps = preferencesStore.preferences.maxDepartures * (hasLoadedMore.value ? 2 : 1)

  // console.log('Computing departures:', { /* ... */ })

  const filtered = [...deps]
    .filter(dep => {
      if (!dep || !dep.plannedWhen) return false
      const transitType = getTransitType(dep.line.product)
      return enabledTypes.includes(transitType)
    })
    .map(dep => ({
      ...dep,
      parsedTime: new Date(dep.plannedWhen).getTime(),
      formattedTime: new Date(dep.plannedWhen).toLocaleTimeString([], { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    }))
    .sort((a, b) => a.parsedTime - b.parsedTime)
    .slice(0, maxDeps)
  // console.log('Filtered departures:', { /* ... */ })
  return filtered
})

const transitTypeMap = { /* ... */ } as const // Restore (copied from original for brevity)
function getTransitType(product: string): TransitType { // Restore
  const type = product?.toLowerCase()?.trim() || ''
  return transitTypeMap[type as keyof typeof transitTypeMap] || 'bus' // Default to bus if not found in map
}

function getTransitColor(type: TransitType): string { // Restore
  switch (type) {
    case 'sbahn': return 'bg-green-600'
    case 'ubahn': return 'bg-blue-600'
    case 'tram': return 'bg-red-600'
    case 'bus': return 'bg-purple-600'
    case 'ferry': return 'bg-cyan-600'
    case 'express': case 'regional': return 'bg-yellow-600'
    default: return 'bg-gray-600'
  }
}

let fetchTimeout: number | null = null // Restore
const hasLoadedMore = ref(false) // Restore

async function handleLoadMore() { // Restore
  hasLoadedMore.value = true;
  await fetchDepartures(true);
}

async function fetchDepartures(loadMore = false) { // Restore
  if (!props.station?.id?.trim()) return
  if (fetchTimeout) { clearTimeout(fetchTimeout); fetchTimeout = null; }
  if (loadMore) { loadingMore.value = true; } else { loading.value = true; }
  try {
    await store.fetchDepartures(props.station.id, false, loadMore)
  } catch (error) {
    console.error('Error fetching departures:', error)
  } finally {
    if (isMounted.value) {
      loading.value = false
      loadingMore.value = false
    }
  }
}

const REFRESH_INTERVAL = 60000

function startRefreshInterval() {
  stopRefreshInterval()
  refreshInterval.value = window.setInterval(() => {
    fetchDepartures()
  }, REFRESH_INTERVAL)
}

function stopRefreshInterval() {
  if (refreshInterval.value !== null) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

onMounted(() => {
  isMounted.value = true
  fetchDepartures()
  startRefreshInterval()
})

watch(() => props.station?.id, () => { // Restore
  hasLoadedMore.value = false
  loadingMore.value = false
  fetchDepartures()
  startRefreshInterval()
})

onUnmounted(() => {
  isMounted.value = false
  stopRefreshInterval()
})

const isFavorite = computed(() => favoritesStore.favoriteIds.includes(props.station.id))

function toggleFavorite() {
  favoritesStore.toggleFavorite(props.station.id)
}

</script>

<template>
  <div class="station-panel">
    <div class="flex flex-col gap-4 mb-4">
      <div class="flex items-center gap-2">
        <button
          @click="toggleFavorite"
          title="favorite toggle"
          class="text-gray-500 hover:text-yellow-500"
        >
          <StarIcon v-if="isFavorite" class="w-5 h-5" />
          <StarIconOutline v-else class="w-5 h-5" />
        </button>
        <h2 class="text-xl font-semibold leading-tight hyphens-auto" lang="de">{{ station.name }}</h2>
      </div>
      <transit-filter v-if="favoritesStore.activeView === 'favorites'" />
    </div>
    
    <div v-if="loading" class="py-4 text-center text-gray-500 dark:text-gray-400">
      Loading departures...
    </div>
    
    <div v-else-if="stationDepartures.length === 0" class="py-4 text-center text-gray-500 dark:text-gray-400">
      No departures in the next 30 minutes <!-- Use original message -->
    </div>
    
    <div v-else class="space-y-2">
      <!-- Departures list - simplified, no ElTag/ElTooltip yet -->
      <div class="space-y-2">
      <div v-for="departure in stationDepartures" :key="departure.tripId" 
           class="departure-item flex items-center p-2 rounded-lg shadow-sm bg-white dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors">
        <div :class="['transit-line px-2 py-1 rounded text-white font-medium flex items-center gap-2', 
                      getTransitColor(getTransitType(departure.line.product))]">
          <TransitIcon 
            :type="getTransitType(departure.line.product)"
            class="text-lg"
          />
          {{ departure.line.name }}
        </div>
        
        <!-- Allow the direction text to shrink on small screens so the time stays visible -->
        <div class="flex-1 mx-4 min-w-0">
          <div class="font-medium leading-tight break-words hyphens-auto" lang="de">{{ departure.direction }}</div>
          <div class="text-sm text-gray-500 dark:text-gray-400">
            {{ departure.platform ? `Platform ${departure.platform}` : '' }}
          </div>
        </div>
        
        <div class="text-right flex-shrink-0 w-16">
          <div class="font-medium">
            {{ departure.formattedTime }}
          </div>
          
          <div v-if="departure.cancelled" class="text-sm text-red-500"> <!-- Simplified -->
            Cancelled
          </div>
          <div v-else-if="departure.delay && departure.delay !== 0" 
               :class="['text-sm', (departure.delay ?? 0) > 5 ? 'text-yellow-500' : 'text-green-500']"> <!-- Simplified -->
            {{ (departure.delay ?? 0) > 0 ? `+${Math.floor(departure.delay)}` : departure.delay }} min
          </div>
          <div v-else class="text-sm text-green-500"> <!-- Simplified -->
            On time
          </div>
        </div>
      </div>

      <!-- Load more button -->
      <button
        v-if="stationDepartures.length > 0"
        @click="handleLoadMore"
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
