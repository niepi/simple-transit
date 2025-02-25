export type TransitType = 'sbahn' | 'ubahn' | 'tram' | 'bus' | 'ferry'

export interface UserPreferences {
  allowAutoCenter: boolean
  darkMode: boolean
  refreshInterval: number
  maxDepartures: number
  maxDistance: number
  lastView: 'all' | 'favorites'
  enabledTransitTypes: TransitType[]
}

export const DEFAULT_PREFERENCES: UserPreferences = {
  allowAutoCenter: true,
  darkMode: false,
  refreshInterval: 60000, // 1 minute
  maxDepartures: 6,
  maxDistance: 1000, // meters
  lastView: 'all',
  enabledTransitTypes: ['sbahn', 'ubahn', 'tram', 'bus', 'ferry']
}
