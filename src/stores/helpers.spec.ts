import { describe, it, expect } from 'vitest'
import { isValidCoordinates, isValidStation, normalizeTransitType, normalizeStation } from './helpers'
import type { VBBLocation } from '../types'

describe('helpers', () => {
  describe('isValidCoordinates', () => {
    it('accepts valid latitude and longitude', () => {
      const result = isValidCoordinates({ latitude: 52.5, longitude: 13.4 })
      expect(result).toBe(true)
    })

    it('rejects invalid values', () => {
      const result = isValidCoordinates({ latitude: 100, longitude: NaN })
      expect(result).toBe(false)
    })
  })

  describe('normalizeTransitType', () => {
    const cases = [
      ['suburban', 'sbahn'],
      ['s', 'sbahn'],
      ['subway', 'ubahn'],
      ['u', 'ubahn'],
      ['tram', 'tram'],
      ['bus', 'bus'],
      ['ferry', 'ferry'],
      ['unknown', 'bus']
    ] as const

    cases.forEach(([input, expected]) => {
      it(`maps ${input} to ${expected}`, () => {
        expect(normalizeTransitType(input)).toBe(expected)
      })
    })
  })

  describe('normalizeStation', () => {
    it('strips city suffix and copies fields', () => {
      const station: VBBLocation = {
        type: 'stop',
        id: '1',
        name: 'Alex (Berlin)',
        location: { type: 'location', latitude: 1, longitude: 2 }
      }
      const normalized = normalizeStation(station)
      expect(normalized.name).toBe('Alex')
      expect(normalized.id).toBe('1')
      expect(normalized.location.latitude).toBe(1)
    })
  })

  describe('isValidStation', () => {
    it('detects missing data', () => {
      const bad = { type: 'stop', id: 'x', name: '', location: { type: 'loc', latitude: undefined as any, longitude: 5 } } as unknown as VBBLocation
      expect(isValidStation(bad)).toBe(false)
    })

    it('returns true for valid data', () => {
      const good = { type: 'stop', id: '1', name: 'Foo', location: { type: 'loc', latitude: 1, longitude: 2 } } as VBBLocation
      expect(isValidStation(good)).toBe(true)
    })
  })
})
