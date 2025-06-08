<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch, computed } from 'vue'
import { useStationsStore } from '../stores/stations'
import { useFavoritesStore } from '../stores/favorites'
import { usePreferencesStore } from '../stores/preferences'
import type { Station, TransitType } from '../types'
// import type { TagProps } from 'element-plus' // Keep commented for now
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
const preferencesStore = usePreferencesStore()

const loading = ref(false) // Restore
const loadingMore = ref(false) // Restore
const refreshInterval = ref<number | null>(null) // Restore

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
  } catch (error) { console.error('Error fetching departures:', error); } 
  finally { loading.value = false; loadingMore.value = false; }
}

const REFRESH_INTERVAL = 60000 // Restore
function startRefreshInterval() {
  stopRefreshInterval()
  refreshInterval.value = window.setInterval(() => {
    fetchDepartures()
  }, REFRESH_INTERVAL)
}

function stopRefreshInterval() {
  if (refreshInterval.value) {
    clearInterval(refreshInterval.value)
    refreshInterval.value = null
  }
}

onMounted(() => { // Restore
  fetchDepartures()
  startRefreshInterval()
})

watch(() => props.station?.id, () => { // Restore
  hasLoadedMore.value = false
  loadingMore.value = false
  fetchDepartures()
  startRefreshInterval()
})

onUnmounted(() => { // Restore
  stopRefreshInterval()
})

</script>

<template>
  <div class="station-panel">
    <div class="flex flex-col gap-4 mb-4">
      <div class="flex items-center gap-2">
        <button
          :title="favoritesStore.isFavorite(station.id) ? 'Remove from favorites' : 'Add to favorites'"
          @click="favoritesStore.toggleFavorite(station.id)"
          class="p-1"
        >
          <StarIconOutline v-if="!favoritesStore.isFavorite(station.id)" />
          <StarIcon v-else />
        </button>
        <h2 class="text-xl font-semibold">{{ station.name }}</h2>
      </div>
      <TransitFilter v-if="favoritesStore.activeView === 'favorites'" />
    </div>
    
    <div v-if="loading" class="py-4 text-center text-gray-500 dark:text-dark-secondary">
      Loading departures...
    </div>
    
    <div v-else-if="stationDepartures.length === 0" class="py-4 text-center text-gray-500 dark:text-dark-secondary">
      No departures in the next 30 minutes <!-- Use original message -->
    </div>
    
    <div v-else class="space-y-2">
      <!-- Departures list - simplified, no ElTag/ElTooltip yet -->
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
