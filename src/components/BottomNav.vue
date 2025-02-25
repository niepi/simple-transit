<!-- Bottom Navigation Component -->
<script setup lang="ts">
import { StarIcon } from '@heroicons/vue/24/solid'
import { useFavoritesStore } from '../stores/favorites'

const favoritesStore = useFavoritesStore()

console.log('[BottomNav] Component initialized')
console.log('[BottomNav] Active view:', favoritesStore.activeView)
console.log('[BottomNav] Store:', favoritesStore)
console.log('[BottomNav] Template structure:', document.querySelector('nav.fixed'))
</script>

<template>
  <div class="bg-white dark:bg-dark-card border-t border-gray-200 dark:border-dark-hover p-2 md:p-4 transition-colors">
    <nav class="w-full max-w-sm mx-auto bg-blue-500 dark:bg-blue-600 rounded-lg shadow-lg overflow-hidden transition-colors">
      <div class="flex">
        <button
          @click="favoritesStore.setActiveView('all')"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            favoritesStore.activeView === 'all'
              ? 'bg-blue-700 dark:bg-blue-800 text-white'
              : 'bg-blue-400 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
          ]"
        >
          All Stations
        </button>
        <button
          @click="favoritesStore.setActiveView('favorites')"
          :class="[
            'flex-1 px-4 py-3 text-sm font-medium transition-colors',
            favoritesStore.activeView === 'favorites'
              ? 'bg-blue-700 dark:bg-blue-800 text-white'
              : 'bg-blue-400 dark:bg-blue-600 text-white hover:bg-blue-600 dark:hover:bg-blue-700'
          ]"
        >
          <div class="flex items-center justify-center gap-2">
            <StarIcon class="w-5 h-5" />
            <span>Favorites</span>
          </div>
        </button>
      </div>
    </nav>
  </div>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

.debug-outline {
  outline: 1px solid red;
  outline-offset: -1px;
}
</style>
