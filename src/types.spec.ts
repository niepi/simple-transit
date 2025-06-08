import { describe, it, expect } from 'vitest'
import { TransitTypes } from './types'

describe('TransitTypes constant', () => {
  it('includes sbahn entry', () => {
    expect(TransitTypes.SBAHN).toBe('sbahn')
  })
})
