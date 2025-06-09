import { describe, it, expect } from 'vitest'
import { TransitTypes } from './types'

describe('TransitTypes constant', () => {
  it('contains all expected transit types', () => {
    const expected = ['sbahn', 'ubahn', 'tram', 'bus', 'ferry', 'express', 'regional'] as const
    expect(Object.values(TransitTypes)).toEqual(expected)
  })
})
