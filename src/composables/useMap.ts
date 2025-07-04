import { ref, nextTick, watch } from 'vue'
import { useStationsStore } from '../stores/stations'
import type { Ref } from 'vue'
import L from 'leaflet'

export function useMap(
  mapRef: Ref<HTMLElement | null>,
  coords: Ref<{ latitude: number | null; longitude: number | null }>,
  isDark: Ref<boolean>
) {
  const map = ref<L.Map | null>(null)
  const markers = ref<L.Marker[]>([])
  const centerMarker = ref<L.Marker | null>(null)
  const allowAutoCenter = ref(true)
  const isMapCentered = ref(true)
  const isMapReady = ref(false)

  const store = useStationsStore()

  function clearMarkers() {
    markers.value.forEach(marker => marker.remove())
    markers.value = []
    
    if (centerMarker.value) {
      centerMarker.value.remove()
      centerMarker.value = null
    }
  }

  function updateMarkers() {
    if (!map.value) return
    
    clearMarkers()
    
    // Add markers for each station
    store.stations.forEach(station => {
      const marker = L.marker([station.location.latitude, station.location.longitude], {
        icon: L.divIcon({
          html: `
            <div class="relative z-[500]">
              <div class="w-6 h-6 rounded-full bg-white shadow-lg flex items-center justify-center">
                <div class="w-4 h-4 rounded-full bg-red-500"></div>
              </div>
              <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md text-xs whitespace-nowrap z-[1000] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                ${station.name}
              </div>
            </div>
          `,
          className: 'station-marker !z-[500]',
          iconSize: [24, 24],
          iconAnchor: [12, 24],
          popupAnchor: [0, -36]
        })
      })
      
      marker.addTo(map.value!)
      marker.bindPopup(`
        <div class="p-2">
          <div class="font-bold mb-1">${station.name}</div>
          <div class="text-sm text-gray-600">${Math.round(station.distance ?? 0)} meters away</div>
        </div>
      `, {
        offset: [0, -12]
      })
      markers.value.push(marker)
    })
    
    // Add user location marker if available
    if (coords.value.latitude && coords.value.longitude) {
      const userMarker = L.marker([coords.value.latitude, coords.value.longitude], {
        icon: L.divIcon({
          html: `
            <div class="relative z-[600]">
              <div class="w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center">
                <div class="w-6 h-6 rounded-full bg-blue-500 animate-pulse"></div>
              </div>
              <div class="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-md text-xs font-semibold whitespace-nowrap z-[1000] text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700">
                You are here
              </div>
            </div>
          `,
          className: 'user-marker !z-[600]',
          iconSize: [32, 32],
          iconAnchor: [16, 28],
          popupAnchor: [0, -44]
        })
      })
      
      userMarker.addTo(map.value!)
      userMarker.bindPopup('<div class="p-2 font-semibold dark:bg-gray-800 dark:text-white">Your Location</div>', {
        offset: [0, -16]
      })
      markers.value.push(userMarker)
    }
  }

  const handleResize = () => {
    if (map.value) {
      nextTick(() => {
        map.value!.invalidateSize()
        if (coords.value.latitude && coords.value.longitude) {
          map.value!.setView([coords.value.latitude, coords.value.longitude], map.value!.getZoom())
        }
      })
    }
  }

  async function initMap() {
    if (!mapRef.value || map.value) return

    try {      
      map.value = L.map(mapRef.value, {
        zoomControl: false,
        attributionControl: false,
        minZoom: 10,
        maxZoom: 18,
        maxBounds: [
          [52.3, 13.1], // Southwest
          [52.7, 13.8]  // Northeast
        ]
      }).setView([52.52, 13.405], 13)

      L.control.zoom({ position: 'bottomright' }).addTo(map.value)
      L.control.attribution({ position: 'bottomleft' }).addTo(map.value)
      
      // Map initialized successfully
      
      const lightTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        detectRetina: true,
        className: 'map-tiles'
      })

      const darkTileLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
        subdomains: 'abcd',
        maxZoom: 19,
        detectRetina: true,
        className: 'map-tiles'
      })

      ;(isDark.value ? darkTileLayer : lightTileLayer).addTo(map.value)

      watch(isDark, (dark) => {
        if (dark) {
          map.value!.removeLayer(lightTileLayer)
          darkTileLayer.addTo(map.value!)
        } else {
          map.value!.removeLayer(darkTileLayer)
          lightTileLayer.addTo(map.value!)
        }
      })
      
      map.value.on('movestart', () => {
        allowAutoCenter.value = false
        isMapCentered.value = false
      })
      
      map.value.on('move', () => {
        const center = map.value!.getCenter()
        store.updateMapCenter(center.lat, center.lng)
      })
      
      map.value.on('moveend', async () => {
        if (coords.value.latitude && coords.value.longitude) {
          const center = map.value!.getCenter()
          const userLatLng = L.latLng(coords.value.latitude, coords.value.longitude)
          const centerLatLng = L.latLng(center.lat, center.lng)
          isMapCentered.value = userLatLng.distanceTo(centerLatLng) < 10
          
          if (centerMarker.value) {
            store.updateMapCenter(center.lat, center.lng)
          }
          
          await store.fetchNearbyStations(center.lat, center.lng)
          updateMarkers()
        }
      })

      isMapReady.value = true
    } catch (error) {
      console.error('Error initializing map:', error)
    }
  }

  return {
    map,
    markers,
    centerMarker,
    allowAutoCenter,
    isMapCentered,
    isMapReady,
    clearMarkers,
    updateMarkers,
    handleResize,
    initMap
  }
}