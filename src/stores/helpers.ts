import type { VBBLocation, Station } from '../types'
import type { TransitType } from '../types/preferences'

export function isValidCoordinates(coords: { latitude?: number; longitude?: number } | null): coords is { latitude: number; longitude: number } {
  return coords !== null &&
    typeof coords.latitude === 'number' &&
    typeof coords.longitude === 'number' &&
    !isNaN(coords.latitude) &&
    !isNaN(coords.longitude) &&
    Math.abs(coords.latitude) <= 90 &&
    Math.abs(coords.longitude) <= 180
}

export function isValidStation(station: VBBLocation): boolean {
  return !!station &&
    typeof station.name === 'string' &&
    !!station.location &&
    typeof station.location.latitude === 'number' &&
    typeof station.location.longitude === 'number'
}

export function normalizeTransitType(type: string | undefined): TransitType {
  const normalizedType = (type || '').toLowerCase()
  if (normalizedType.includes('suburban') || normalizedType === 's') return 'sbahn'
  if (normalizedType.includes('subway') || normalizedType === 'u') return 'ubahn'
  if (normalizedType.includes('tram')) return 'tram'
  if (normalizedType.includes('bus')) return 'bus'
  if (normalizedType.includes('ferry')) return 'ferry'
  return 'bus'
}

export function normalizeStation(station: VBBLocation): Station {
  const { id, name, type, location } = station
  return {
    id,
    name: name.replace(' (Berlin)', '').trim(),
    type,
    location: {
      type: location.type,
      latitude: location.latitude,
      longitude: location.longitude
    },
    distance: undefined
  }
}
