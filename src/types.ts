export interface GeoLocation {
  type: string
  latitude: number
  longitude: number
}

export interface UserLocation {
  latitude: number
  longitude: number
}

export interface Station {
  type: string
  id: string
  name: string
  location: GeoLocation
  distance?: number // Distance from user's location in meters
}

export interface TransitLine {
  name: string
  product: TransitProduct
  color?: string
}

export interface Trip {
  tripId: string
  line: TransitLine
  direction: string
  when: string
  plannedWhen: string
  delay?: number
  cancelled?: boolean
  platform?: string
}

// API response types
export interface VBBLocation extends Station {}

export type TransitProduct = 'suburban' | 'subway' | 'tram' | 'bus' | 'ferry' | 'express' | 'regional'

export type TransitType = 'sbahn' | 'ubahn' | 'tram' | 'bus' | 'ferry' | 'express' | 'regional'

export interface TransitLineDetails {
  name: string
  product: TransitProduct
  mode?: string
  color?: string
}

export interface VBBDeparture {
  tripId?: string
  line: {
    name: string
    product?: TransitProduct
    mode?: string
  }
  direction: string
  when?: string
  plannedWhen?: string
  cancelled?: boolean
  platform?: string
}

// Transit types map for better type safety
export const TransitTypes = {
  SBAHN: 'sbahn',
  UBAHN: 'ubahn',
  TRAM: 'tram',
  BUS: 'bus',
  FERRY: 'ferry',
  EXPRESS: 'express',
  REGIONAL: 'regional'
} as const

export type TransitType = typeof TransitTypes[keyof typeof TransitTypes]
