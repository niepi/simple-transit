import { describe, it, expect } from 'vitest'
import { DEFAULT_PREFERENCES } from './preferences'

describe('DEFAULT_PREFERENCES', () => {
  it('contains expected default values', () => {
    expect(DEFAULT_PREFERENCES).toEqual({
      allowAutoCenter: true,
      darkMode: false,
      refreshInterval: 60000,
      maxDepartures: 6,
      maxDistance: 1000,
      lastView: 'all',
      enabledTransitTypes: ['sbahn', 'ubahn', 'tram', 'bus', 'ferry'],
    })
  })
})
