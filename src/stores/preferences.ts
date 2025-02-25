import { defineStore } from 'pinia'
import { useLocalStorage } from '@vueuse/core'
import type { UserPreferences } from '../types/preferences'
import { DEFAULT_PREFERENCES } from '../types/preferences'

export const usePreferencesStore = defineStore('preferences', () => {
  const preferences = useLocalStorage<UserPreferences>(
    'user-preferences',
    DEFAULT_PREFERENCES,
    {
      mergeDefaults: true // This will merge any new preferences we add with existing stored ones
    }
  )

  function updatePreference<K extends keyof UserPreferences>(
    key: K,
    value: UserPreferences[K]
  ) {
    preferences.value = {
      ...preferences.value,
      [key]: value
    }
  }

  function resetPreferences() {
    preferences.value = { ...DEFAULT_PREFERENCES }
  }

  return {
    preferences,
    updatePreference,
    resetPreferences
  }
})
