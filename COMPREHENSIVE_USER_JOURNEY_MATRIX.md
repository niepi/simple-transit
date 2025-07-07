# Comprehensive User Journey Matrix

## Overview
This document maps EVERY possible user journey for the Berlin Transit Map application, including edge cases, error scenarios, and state transitions.

## User Journey Categories

### 1. INITIAL APP LOAD JOURNEYS

#### 1.1 First-Time User (Cold Start)
- **Journey**: User visits app for first time
- **States**: No localStorage, no geolocation permission
- **Expected Flow**:
  1. App loads → Shows loading state
  2. Requests geolocation permission
  3. User grants permission → Map centers on location
  4. Stations load → Display in sidebar and map
  5. Version shows in header (v0.5.1)

#### 1.2 Returning User (Warm Start)
- **Journey**: User has localStorage data
- **States**: Has favorites, preferences, previous geolocation
- **Expected Flow**:
  1. App loads → Restores previous state
  2. Map shows last known location
  3. Favorites are loaded
  4. Station data refreshes

#### 1.3 Geolocation Denied
- **Journey**: User denies location access
- **States**: No coordinates available
- **Expected Flow**:
  1. App shows geolocation error
  2. "Retry" button appears
  3. Map shows default view
  4. No stations loaded

#### 1.4 Geolocation Unavailable
- **Journey**: Device/browser doesn't support geolocation
- **States**: Geolocation API not available
- **Expected Flow**:
  1. App detects unsupported geolocation
  2. Shows appropriate error message
  3. Fallback behavior activated

### 2. MAP INTERACTION JOURNEYS

#### 2.1 Map Pan and Zoom
- **Journey**: User drags/zooms map
- **States**: Map position changes
- **Expected Flow**:
  1. User drags map → Center indicator appears
  2. User stops dragging → Auto-center disabled
  3. New stations load for new area
  4. Markers update on map

#### 2.2 Station Marker Click
- **Journey**: User clicks station marker on map
- **States**: Station panel should expand
- **Expected Flow**:
  1. User clicks marker → Station panel opens
  2. Departure data loads
  3. Loading state → Departure list
  4. Real-time updates start

#### 2.3 Auto-Center Behavior
- **Journey**: User moves map then returns to center
- **States**: Auto-center toggle behavior
- **Expected Flow**:
  1. Map moved → Auto-center disabled
  2. User location updates → No auto-movement
  3. User manually centers → Auto-center re-enabled

### 3. STATION INTERACTION JOURNEYS

#### 3.1 Station Panel Expansion
- **Journey**: User clicks station to expand
- **States**: Panel closed → Panel open
- **Expected Flow**:
  1. Click station → Panel expands
  2. Departure data loads
  3. Loading spinner → Departure list
  4. Refresh button becomes active

#### 3.2 Station Panel Collapse
- **Journey**: User closes expanded panel
- **States**: Panel open → Panel closed
- **Expected Flow**:
  1. Click station again → Panel collapses
  2. Departure polling stops
  3. UI resets to collapsed state

#### 3.3 Manual Refresh
- **Journey**: User clicks refresh button
- **States**: Data refresh triggered
- **Expected Flow**:
  1. Click refresh → Loading state
  2. API call → New departure data
  3. List updates → Loading stops

### 4. FAVORITES MANAGEMENT JOURNEYS

#### 4.1 Add to Favorites
- **Journey**: User stars a station
- **States**: Non-favorite → Favorite
- **Expected Flow**:
  1. Click empty star → Star fills
  2. Station added to favorites store
  3. Persisted to localStorage
  4. Available in favorites view

#### 4.2 Remove from Favorites
- **Journey**: User unstars a station
- **States**: Favorite → Non-favorite
- **Expected Flow**:
  1. Click filled star → Star empties
  2. Station removed from favorites store
  3. Persisted to localStorage
  4. Removed from favorites view

#### 4.3 Favorites View Navigation
- **Journey**: User switches to favorites view
- **States**: All stations → Favorites only
- **Expected Flow**:
  1. Click favorites tab → View changes
  2. Station list filters to favorites only
  3. Map markers filter to favorites
  4. Empty state if no favorites

### 5. FILTERING JOURNEYS

#### 5.1 Transit Type Filtering
- **Journey**: User filters by transit type
- **States**: All types → Specific types
- **Expected Flow**:
  1. Select transit type → Stations filter
  2. Map markers update
  3. Station list updates
  4. Filter state persists

#### 5.2 Clear Filters
- **Journey**: User clears all filters
- **States**: Filtered → All visible
- **Expected Flow**:
  1. Clear filters → All stations show
  2. Map markers update
  3. Station list updates

### 6. SETTINGS AND PREFERENCES JOURNEYS

#### 6.1 Dark Mode Toggle
- **Journey**: User switches dark/light mode
- **States**: Light → Dark or Dark → Light
- **Expected Flow**:
  1. Click mode toggle → Theme changes
  2. Map tiles update
  3. UI colors update
  4. Preference persisted

#### 6.2 Clear Local Storage
- **Journey**: User clears all app data
- **States**: Data present → Clean slate
- **Expected Flow**:
  1. Click clear button → Confirmation
  2. localStorage cleared
  3. App resets to initial state
  4. All preferences lost

### 7. ERROR HANDLING JOURNEYS

#### 7.1 Network Error
- **Journey**: Network connection fails
- **States**: Online → Offline
- **Expected Flow**:
  1. API call fails → Error message
  2. Retry options available
  3. Previous data remains visible
  4. Auto-retry on reconnection

#### 7.2 API Rate Limiting
- **Journey**: Too many API requests
- **States**: Normal → Rate limited
- **Expected Flow**:
  1. API returns 429 → Error handling
  2. Exponential backoff starts
  3. User informed of delay
  4. Automatic retry after delay

#### 7.3 Invalid API Response
- **Journey**: API returns malformed data
- **States**: Valid data → Invalid data
- **Expected Flow**:
  1. Invalid response → Error caught
  2. Fallback behavior activated
  3. User informed of issue
  4. Previous data preserved

### 8. PWA JOURNEYS

#### 8.1 Install Prompt
- **Journey**: User installs as PWA
- **States**: Browser → Installed app
- **Expected Flow**:
  1. Install prompt appears
  2. User clicks install → App installs
  3. Icon appears on device
  4. Full-screen experience

#### 8.2 Update Available
- **Journey**: New version is available
- **States**: Current version → Update available
- **Expected Flow**:
  1. Service worker detects update
  2. Update notification appears
  3. User clicks update → App refreshes
  4. New version loads

#### 8.3 Offline Usage
- **Journey**: User uses app offline
- **States**: Online → Offline
- **Expected Flow**:
  1. Network lost → Offline mode
  2. Cached data displays
  3. Limited functionality available
  4. Reconnect detection

### 9. PERFORMANCE JOURNEYS

#### 9.1 Slow Network
- **Journey**: User on slow connection
- **States**: Fast → Slow network
- **Expected Flow**:
  1. Requests take longer → Loading indicators
  2. Progressive data loading
  3. Timeout handling
  4. User feedback on delays

#### 9.2 Large Dataset
- **Journey**: Many stations in area
- **States**: Few stations → Many stations
- **Expected Flow**:
  1. Large station list → Virtualization
  2. Map performance maintained
  3. Search/filter performance
  4. Memory management

### 10. EDGE CASE JOURNEYS

#### 10.1 Invalid Coordinates
- **Journey**: GPS returns invalid data
- **States**: Valid → Invalid coordinates
- **Expected Flow**:
  1. Invalid coords detected → Validation
  2. Error handling activated
  3. Fallback location used
  4. User informed

#### 10.2 Browser Compatibility
- **Journey**: User on old browser
- **States**: Modern → Legacy browser
- **Expected Flow**:
  1. Feature detection → Polyfills loaded
  2. Graceful degradation
  3. Core functionality works
  4. Modern features disabled

#### 10.3 Memory Constraints
- **Journey**: User on low-memory device
- **States**: Normal → Low memory
- **Expected Flow**:
  1. Memory pressure → Cleanup
  2. Non-essential data cleared
  3. Core functionality maintained
  4. Performance optimizations

## Test Matrix Priority

### Priority 1 (Critical)
- Initial app load (all variants)
- Geolocation handling
- Station data loading
- Version display
- Basic map interaction

### Priority 2 (Important)
- Favorites management
- Dark mode toggle
- PWA functionality
- Error handling
- Network issues

### Priority 3 (Nice to have)
- Performance edge cases
- Browser compatibility
- Memory constraints
- Advanced filtering

## Success Criteria

Each journey must:
1. **Complete successfully** without errors
2. **Show correct UI state** at each step
3. **Persist state** where expected
4. **Handle errors gracefully** when they occur
5. **Provide user feedback** for all actions
6. **Display correct version** (v0.5.1) at all times

## Test Automation Requirements

1. **Real Browser Testing**: Use Playwright for actual browser automation
2. **Screenshot Evidence**: Capture visual proof at each step
3. **Network Interception**: Mock API responses for error scenarios
4. **Performance Monitoring**: Measure load times and responsiveness
5. **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge
6. **Mobile Testing**: iOS Safari, Android Chrome
7. **Offline Testing**: Service worker and cache behavior

## Evidence Collection

For each failed journey:
1. **Screenshot** of error state
2. **Console logs** with error details
3. **Network logs** showing API calls
4. **Application state** dump
5. **User steps** to reproduce
6. **Expected vs actual** behavior