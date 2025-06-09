import { describe, it, expect } from 'vitest'
import { calculateDistance } from './distance'

describe('calculateDistance', () => {
  it('returns zero when coordinates are identical', () => {
    const d = calculateDistance(52.5, 13.4, 52.5, 13.4)
    expect(d).toBe(0)
  })

  it('computes distance between Berlin and Potsdam roughly 27km', () => {
    const d = calculateDistance(52.52, 13.405, 52.39, 13.0645)
    expect(d).toBeGreaterThan(25000)
    expect(d).toBeLessThan(29000)
  })
})
