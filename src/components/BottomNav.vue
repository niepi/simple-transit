<!-- Bottom Navigation Component -->
<script setup lang="ts">
import { StarIcon } from '@heroicons/vue/24/solid'
import { useFavoritesStore } from '../stores/favorites'

const favoritesStore = useFavoritesStore()

console.log('[BottomNav] Mounted')
console.log('[BottomNav] Active view:', favoritesStore.activeView)
console.log('[BottomNav] Store:', favoritesStore)
</script>

<template>
  <div class="fixed bottom-0 left-0 right-0 p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 shadow-lg z-[100]" style="z-index: 9999;">
    <div class="w-full max-w-sm mx-auto">
      <div class="flex rounded-lg overflow-hidden shadow-sm">
        <button
          @click="favoritesStore.setActiveView('all')"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            favoritesStore.activeView === 'all'
              ? 'bg-gray-900 text-white dark:bg-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
          ]"
        >
          All Stations
        </button>
        <button
          @click="favoritesStore.setActiveView('favorites')"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            favoritesStore.activeView === 'favorites'
              ? 'bg-gray-900 text-white dark:bg-gray-700'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-900 dark:text-gray-300 dark:hover:bg-gray-700'
          ]"
        >
          <div class="flex items-center justify-center gap-1">
            <StarIcon class="w-5 h-5" />
            <span>Favorites</span>
          </div>
        </button>
      </div>
    </div>
  </div>
</template>
