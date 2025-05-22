import { setActivePinia, createPinia } from 'pinia'
import { usePreferencesStore } from './preferences'
import { DEFAULT_PREFERENCES } from '../types/preferences' // Import default preferences
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ref } from 'vue'

// Mock @vueuse/core to control localStorage
vi.mock('@vueuse/core', async () => {
  const actual = await vi.importActual('@vueuse/core')
  return {
    ...actual,
    useLocalStorage: vi.fn((key, initialValue) => {
      // Create a new ref for each call to useLocalStorage
      // This ensures that preferences store has its own ref
      const internalRef = ref(JSON.parse(JSON.stringify(initialValue))); // Deep copy
      return internalRef;
    }),
  }
})

describe('Preferences Store', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    // Reset the store to its default state before each test
    const store = usePreferencesStore()
    // Manually reset the ref's value to a deep copy of DEFAULT_PREFERENCES
    // as useLocalStorage is mocked and store.resetPreferences() would rely on the mock's behavior
    store.preferences = JSON.parse(JSON.stringify(DEFAULT_PREFERENCES))
  })

  it('initial state is correct', () => {
    const store = usePreferencesStore()
    expect(store.preferences).toEqual(DEFAULT_PREFERENCES)
  })

  describe('updatePreference', () => {
    it('updates a specific preference', () => {
      const store = usePreferencesStore()
      store.updatePreference('theme', 'dark')
      expect(store.preferences.theme).toBe('dark')
      
      store.updatePreference('language', 'de')
      expect(store.preferences.language).toBe('de')
      
      store.updatePreference('lastView', 'favorites')
      expect(store.preferences.lastView).toBe('favorites')

      store.updatePreference('notifications', false)
      expect(store.preferences.notifications).toBe(false)

      const newShowLines = { 'U1': true, 'S2': false }
      store.updatePreference('showLines', newShowLines)
      expect(store.preferences.showLines).toEqual(newShowLines)
    })

    it('only updates the specified preference, leaving others unchanged', () => {
      const store = usePreferencesStore()
      const initialPreferences = JSON.parse(JSON.stringify(store.preferences))
      
      store.updatePreference('theme', 'dark')
      expect(store.preferences.theme).toBe('dark')
      expect(store.preferences.language).toBe(initialPreferences.language)
      expect(store.preferences.lastView).toBe(initialPreferences.lastView)
      expect(store.preferences.notifications).toBe(initialPreferences.notifications)
      expect(store.preferences.showLines).toEqual(initialPreferences.showLines)
    })
  })

  describe('resetPreferences', () => {
    it('resets preferences to their default values', () => {
      const store = usePreferencesStore()
      // Modify some preferences
      store.updatePreference('theme', 'dark')
      store.updatePreference('language', 'de')
      store.updatePreference('showLines', { 'U1': true })
      
      // Reset preferences
      store.resetPreferences()
      
      // Check if they are back to default
      expect(store.preferences).toEqual(DEFAULT_PREFERENCES)
    })
  })
})
