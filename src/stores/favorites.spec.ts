import { setActivePinia, createPinia } from 'pinia'
import { useFavoritesStore } from './favorites'
import { usePreferencesStore } from './preferences'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue' // Import ref

// Mock @vueuse/core to control localStorage
vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core')
  return {
    ...actual,
    useLocalStorage: vi.fn((key, initialValue) => {
      // Use ref to simulate Vue's reactivity
      return ref(initialValue)
    }),
  }
})

describe('Favorites Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Initialize preferences store as it's a dependency
    const preferencesStore = usePreferencesStore()
    // Resetting preferences to a known state before each test
    preferencesStore.$patch({
      preferences: {
        theme: 'light',
        language: 'en',
        lastView: 'all',
      }
    })
  })

  it('initial state is empty for favoriteIds', () => {
    const store = useFavoritesStore()
    // favoriteIds is a ref, so access its value
    expect(store.favoriteIds.length).toBe(0)
  })

  describe('toggleFavorite', () => {
    it('adds a new favorite if not present', () => {
      const store = useFavoritesStore()
      store.toggleFavorite('station1')
      expect(store.favoriteIds).toContain('station1')
    })

    it('removes an existing favorite if present', () => {
      const store = useFavoritesStore()
      store.toggleFavorite('station1') // Add
      store.toggleFavorite('station1') // Remove
      expect(store.favoriteIds).not.toContain('station1')
    })

    it('correctly toggles multiple favorites', () => {
      const store = useFavoritesStore()
      store.toggleFavorite('station1')
      store.toggleFavorite('station2')
      // favoriteIds is a ref, compare its value
      expect(store.favoriteIds).toEqual(['station1', 'station2'])
      store.toggleFavorite('station1')
      expect(store.favoriteIds).toEqual(['station2'])
    })
  })

  describe('isFavorite', () => {
    it('correctly identifies if a station is a favorite', () => {
      const store = useFavoritesStore()
      store.toggleFavorite('station1')
      expect(store.isFavorite('station1')).toBe(true)
      expect(store.isFavorite('station2')).toBe(false)
    })
  })

  describe('setActiveView', () => {
    it('updates the activeView in preferences store', () => {
      const store = useFavoritesStore()
      const preferencesStore = usePreferencesStore()
      
      store.setActiveView('favorites')
      expect(preferencesStore.preferences.lastView).toBe('favorites')
      
      store.setActiveView('all')
      expect(preferencesStore.preferences.lastView).toBe('all')
    })

    it('activeView getter reflects the value from preferences store', () => {
      const store = useFavoritesStore()
      const preferencesStore = usePreferencesStore()
      
      preferencesStore.updatePreference('lastView', 'favorites')
      // The activeView is a computed property, access its value
      expect(store.activeView).toBe('favorites')

      preferencesStore.updatePreference('lastView', 'all')
      expect(store.activeView).toBe('all')
    })
  })
})
