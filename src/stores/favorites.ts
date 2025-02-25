import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { usePreferencesStore } from './preferences'

export const useFavoritesStore = defineStore('favorites', () => {
  const preferencesStore = usePreferencesStore()
  
  // Store favorites in localStorage
  const favoriteIds = useLocalStorage<string[]>('favorite-stations', [])
  
  // Use preferences store for active view
  const activeView = computed({
    get: () => preferencesStore.preferences.lastView,
    set: (value: 'all' | 'favorites') => {
      preferencesStore.updatePreference('lastView', value)
    }
  })

  function setActiveView(view: 'all' | 'favorites') {
    activeView.value = view
  }

  function toggleFavorite(stationId: string) {
    const index = favoriteIds.value.indexOf(stationId)
    if (index === -1) {
      favoriteIds.value.push(stationId)
    } else {
      favoriteIds.value.splice(index, 1)
    }
  }

  function isFavorite(stationId: string): boolean {
    return favoriteIds.value.includes(stationId)
  }

  return {
    favoriteIds,
    activeView,
    toggleFavorite,
    isFavorite,
    setActiveView
  }
})
