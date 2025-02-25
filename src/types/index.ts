import type { TransitType } from './preferences'

export interface UserLocation {
  latitude: number
  longitude: number
}

export interface Station {
  id: string
  name: string
  latitude: number
  longitude: number
  distance?: number
  products?: string[]
}

export interface Trip {
  tripId: string
  line: {
    name: string
    product: string
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
  products: string[]
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
