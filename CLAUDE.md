# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Simple Transit is a Vue 3 + TypeScript progressive web application that displays real-time Berlin public transit information on an interactive map. The app uses Leaflet.js for mapping, Pinia for state management, and integrates with the VBB Transport REST API for live transit data.

## Development Commands

### Setup and Development
```bash
npm install          # Install dependencies
npm run dev          # Start development server (localhost:5173)
npm run build        # Build for production
npm run preview      # Preview production build
```

### Testing
```bash
npm run test         # Run tests with Vitest
npm run coverage     # Generate test coverage report
npx vitest run       # Run tests once (CI mode)

# UI Rendering Tests (for dependency validation)
npm run test -- --run src/ui-rendering.spec.ts
npm run test -- --run src/dependency-validation.spec.ts
```

### Type Checking
```bash
npm run type-check   # Run Vue TypeScript compiler
```

### Docker Development
```bash
docker build -t simple-transit .
docker run -p 8080:80 simple-transit
```

## Architecture

### State Management
- **Pinia stores** located in `src/stores/`:
  - `stations.ts`: Manages transit stations, departures, and API calls
  - `preferences.ts`: User preferences and settings
  - `favorites.ts`: User's favorite stations

### Core Components
- **App.vue**: Main application component with map and station panel
- **StationPanel.vue**: Individual station display with departure times
- **BottomNav.vue**: Navigation between all stations and favorites
- **TransitFilter.vue**: Filter stations by transit type
- **TransitIcon.vue**: Display transit line icons with proper styling

### API Integration
- Uses **VBB Transport REST API v6** (`https://v6.vbb.transport.rest/`)
- Two main endpoints:
  - `/locations/nearby`: Find stations within radius
  - `/stops/{id}/departures`: Get departure times for a station
- All API calls include proper error handling and loading states

### Map Integration
- **Leaflet.js** with CartoDB tiles (light/dark themes)
- Custom markers for user location and transit stations
- Map bounds restricted to Berlin area
- Responsive design: 40% height on mobile, full height on desktop

### Transit Types
The app supports all Berlin transit types with distinct colors:
- S-Bahn (suburban): Green (#008C4C)
- U-Bahn (subway): Blue (#0067B3)
- Tram: Red (#DC0000)
- Bus: Purple (#7A28A3)
- Ferry: Cyan (#00B7E5)
- Express: Amber (#FFC107)
- Regional: Indigo (#3F51B5)

### State Flow
1. User location detected via `useGeolocation`
2. `fetchNearbyStations()` called with coordinates
3. Stations displayed on map as markers and in sidebar list
4. `fetchDepartures()` called when station panel expanded
5. Real-time departure data displayed with delays and cancellations

## Key Implementation Details

### Geolocation Handling
- Uses `@vueuse/core` for reactive geolocation
- Graceful fallback if geolocation is unavailable
- Map auto-centers on user location initially

### Caching Strategy
- 30-second cache for departure data to reduce API calls
- Separate caching for station data and departures
- Cache invalidation on manual refresh

### Error Handling
- Network errors display user-friendly messages
- Loading states prevent UI confusion
- API response validation ensures data integrity

### Performance
- Lazy loading of departure data (only when station expanded)
- Debounced API calls on map movement
- Efficient marker management with cleanup
- Code splitting in Vite configuration

### PWA Features
- Installable as standalone app
- Auto-updates via `vite-plugin-pwa`
- Offline capability
- Custom icons and theme colors

## File Structure Conventions

```
src/
├── components/          # Vue components
├── stores/             # Pinia stores
├── types/              # TypeScript type definitions
├── utils/              # Utility functions
├── App.vue             # Main app component
├── main.ts             # App entry point
└── style.css           # Global styles
```

## Testing
- Uses **Vitest** with jsdom environment
- Component tests use `@vue/test-utils`
- Test files follow `.spec.ts` naming convention
- Coverage reports generated in `coverage/` directory

### UI Rendering Tests
Critical tests that verify UI renders correctly after dependency updates:
- `src/ui-rendering.spec.ts` - Tests component rendering and CSS framework integration
- `src/dependency-validation.spec.ts` - Validates framework compatibility after updates
- These tests catch breaking changes in Tailwind CSS, Vue, Vite, and other dependencies

## Styling
- **Tailwind CSS** for utility-first styling
- Dark mode support via class-based switching
- Custom color palette for transit types
- Responsive design with mobile-first approach

## Development Notes
- TypeScript strict mode enabled
- Vue 3 Composition API used throughout
- ESM modules configuration
- Vite for fast development and building
- Element Plus components for UI elements