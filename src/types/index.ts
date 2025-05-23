import type { TransitType } from './preferences'

export interface UserLocation {
  latitude: number
  longitude: number
}

export interface Station {
  id: string
  name: string
  type: string
  location: {
    type: string
    latitude: number
    longitude: number
  }
  distance?: number
}

export type TransitProduct = 'suburban' | 'subway' | 'tram' | 'bus' | 'ferry'

export interface Trip {
  tripId: string
  line: {
    name: string
    product: TransitProduct
  }
  direction: string
  platform?: string
  plannedWhen: string
  delay?: number
  cancelled?: boolean
}

export interface VBBLocation {
  type: string
  id: string
  name: string
  location: {
    type: string
    latitude: number
    longitude: number
  }
}

export interface VBBDeparture {
  tripId: string
  direction: string
  line: {
    name: string
    product: string
  }
  when: string
  plannedWhen: string
  delay: number
  platform: string
  cancelled: boolean
}
