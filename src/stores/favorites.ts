import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Station } from '../types'
import { useLocalStorage } from '@vueuse/core'

export const useFavoritesStore = defineStore('favorites', () => {
  // Store favorites in localStorage to persist them
  const favoriteIds = useLocalStorage<string[]>('favorite-stations', [])
  const activeView = ref<'all' | 'favorites'>('all')
  console.log('Initializing favorites store with activeView:', activeView.value)

  function setActiveView(view: 'all' | 'favorites') {
    console.log('Setting active view to:', view)
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
