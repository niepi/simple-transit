# Transit Map PWA Features Documentation

## Overview
The Transit Map PWA is a real-time public transportation tracking application for Berlin's public transit system. It provides users with a live map view of nearby stations and their departures, built using Vue 3, TypeScript, and Leaflet.

## Core Features

### 1. Interactive Map
- **Technology**: Leaflet.js with CartoDB basemaps
- **Features**:
  - Automatic user location detection
  - Dark/light mode map themes
  - Custom markers for:
    - User location (blue marker)
    - Transit stations (red markers)
    - Search center (green marker)
  - Interactive pan and zoom controls
  - Responsive layout (full height on desktop, 1/3 height on mobile)

### 2. Station Discovery
- **API Integration**: VBB Transport REST API (v6)
- **Features**:
  - Automatically finds nearby stations within 1km radius
  - Shows up to 6 closest stations
  - Updates stations when map is moved
  - Displays station names without "(Berlin)" suffix
  - Handles API errors gracefully

### 3. Real-time Departures
- **Data Display**:
  - Line number and type
  - Destination
  - Platform number (when available)
  - Scheduled departure time
  - Delay information (with color coding)
  - Cancellation status
- **Features**:
  - Auto-refresh capability
  - "Load More" functionality (extends time window by 60 minutes)
  - Sorted by departure time
  - Visual indicators for delays and cancellations

### 4. Transit Line Types
Supports all Berlin transit types with distinct styling:
- Suburban trains (S-Bahn) - Green
- Subway (U-Bahn) - Blue
- Trams - Red
- Buses - Purple
- Ferry services - Cyan
- Express trains - Amber
- Regional trains - Indigo

### 5. User Interface
- **Layout**:
  - Split-screen design (map/list)
  - Responsive layout adapting to screen size
  - Mobile-first approach
- **Components**:
  - Loading indicators
  - Error messages
  - Empty state displays
  - Expandable station panels
  - Scrollable departure lists

### 6. Progressive Web App Features
- Installable as standalone app
- Offline capability
- Auto-updates
- Responsive design
- Theme color support

### 7. Accessibility
- Color contrast compliance
- Screen reader support
- Keyboard navigation
- Clear visual hierarchy
- Responsive text sizing

### 8. Performance Features
- Lazy loading of departure data
- Efficient state management
- Debounced API calls
- Optimized marker rendering
- Smooth animations

## Technical Architecture

### State Management
- **Composables**:
  - `useStations`: Manages station and departure data
  - `useMapMarkers`: Handles map marker management

### API Integration
- **Endpoints**:
  - `/locations/nearby`: Station discovery
  - `/stops/{id}/departures`: Departure information
- **Features**:
  - Error handling
  - Response type validation
  - Automatic retries
  - Rate limiting

### Components
1. **Map.vue**
   - Leaflet map integration
   - Marker management
   - Location handling
   - Theme switching

2. **StationList.vue**
   - Station list display
   - Expandable panels
   - Loading states
   - Error handling

3. **StationTrips.vue**
   - Departure list
   - Real-time updates
   - Sorting
   - Load more functionality

### Styling
- **Framework**: Tailwind CSS
- **Features**:
  - Dark/light mode support
  - Custom scrollbars
  - Responsive design
  - Custom animations
  - Transit line colors
  - Icon system

### Type System
- **Core Types**:
  ```typescript
  interface Station {
    type: string;
    id: string;
    name: string;
    location: {
      type: string;
      latitude: number;
      longitude: number;
    };
  }

  interface Trip {
    tripId: string;
    line: {
      name: string;
      product: string;
    };
    direction: string;
    when: string;
    plannedWhen: string;
    delay?: number;
    cancelled?: boolean;
    platform?: string;
  }
  ```

## Development Guidelines

### Code Organization
- Components in `src/components/`
- Composables in `src/composables/`
- Types in `src/types.ts`
- Utilities in `src/utils/`
- Styles in `src/index.css`

### Best Practices
- TypeScript for type safety
- Vue 3 Composition API
- Reactive state management
- Proper error handling
- Comprehensive logging
- Performance optimization
- Mobile-first design
- Accessibility compliance

### Environment Setup
- Node.js environment
- Vue 3 with TypeScript
- Vite for development
- PWA plugin configuration
- Tailwind CSS setup