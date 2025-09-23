import { test, expect } from '@playwright/test';
import { EvidenceCollector } from '../utils/evidence-collector';

test.describe('Critical State Management - Deepest Layer Issues', () => {
  let evidence: EvidenceCollector;

  test.beforeEach(async ({ page }, testInfo) => {
    evidence = new EvidenceCollector(page, testInfo);
    await evidence.setupErrorTracking();
    await evidence.setupNetworkTracking();
  });

  test.afterEach(async () => {
    await evidence.generateReport();
  });

  test('Priority 1: Version Display State Management', async ({ page }) => {
    await evidence.captureStep('app-load', 'Initial app load to check version display');
    
    // Navigate to app
    await page.goto('/');
    await evidence.waitForAppReady();
    
    await evidence.captureStep('app-ready', 'App fully loaded and ready');
    
    // Check if version is displayed in the UI
    const versionElement = page.locator('span:has-text("v")');
    
    if (await versionElement.count() > 0) {
      const versionText = await versionElement.first().textContent();
      await evidence.captureStep('version-found', `Version found in UI: ${versionText}`);
      
      // Verify it's the correct version
      expect(versionText).toMatch(/v\d+\.\d+\.\d+/);
      expect(versionText).not.toBe('vdev-unknown');
      expect(versionText).toBe('v0.5.1');
      
    } else {
      await evidence.captureStep('version-missing', 'Version not found in UI - CRITICAL ISSUE');
      
      // Check if version is in the app state but not displayed
      const appState = await page.evaluate(() => {
        // Check import.meta.env
        return {
          viteEnv: (window as any).__VITE_ENV__ || 'not available',
          metaEnv: typeof (window as any).import?.meta?.env === 'object' ? 
            (window as any).import.meta.env : 'not available'
        };
      });
      
      console.log('App state investigation:', appState);
      
      // Fail the test if version is not displayed
      throw new Error('CRITICAL: Version not displayed in UI');
    }
  });

  test('Priority 1: Geolocation State Management', async ({ page }) => {
    await evidence.captureStep('geolocation-start', 'Testing geolocation state management');
    
    await page.goto('/');
    await evidence.waitForAppReady();
    
    // Check geolocation permission state
    const geolocationState = await page.evaluate(async () => {
      if (!('geolocation' in navigator)) {
        return { supported: false, error: 'Geolocation not supported' };
      }
      
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        return {
          supported: true,
          permission: permission.state,
          hasCoords: !!(navigator.geolocation)
        };
      } catch (error) {
        return {
          supported: true,
          permission: 'unknown',
          error: error instanceof Error ? error.message : String(error)
        };
      }
    });
    
    await evidence.captureStep('geolocation-checked', 
      `Geolocation state: ${JSON.stringify(geolocationState)}`);
    
    // Wait for either coordinates or error state
    try {
      await page.waitForSelector('[aria-label="Refresh stations list"]', { timeout: 15000 });
      await evidence.captureStep('coordinates-success', 'Coordinates obtained, refresh button available');
    } catch {
      // Check for error state
      const errorElement = await page.locator('text=Location Error').count();
      if (errorElement > 0) {
        await evidence.captureStep('geolocation-error', 'Geolocation error displayed');
      } else {
        await evidence.captureStep('geolocation-timeout', 'Geolocation timeout - no error or success');
      }
    }
  });

  test('Priority 1: Store State Initialization', async ({ page }) => {
    await evidence.captureStep('store-init-start', 'Testing Pinia store initialization');
    
    await page.goto('/');
    await evidence.waitForAppReady();
    
    // Get store states
    const storeStates = await page.evaluate(() => {
      try {
        // Try to access Pinia stores
        const app = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps?.[0];
        if (!app) {
          return { error: 'Vue app not found in devtools hook' };
        }
        
        const pinia = app.config?.globalProperties?.$pinia;
        if (!pinia) {
          return { error: 'Pinia not found in app' };
        }
        
        const stores: any = {};
        if (pinia._s) {
          for (const [storeId, store] of pinia._s) {
            stores[storeId] = {
              state: store.$state,
              id: store.$id
            };
          }
        }
        
        return { stores, success: true };
      } catch (error) {
        return { 
          error: error instanceof Error ? error.message : String(error),
          success: false 
        };
      }
    });
    
    await evidence.captureStep('store-states-captured', 
      `Store states: ${JSON.stringify(storeStates, null, 2)}`);
    
    // Verify essential stores exist
    if (storeStates.success) {
      expect(storeStates.stores).toHaveProperty('stations');
      expect(storeStates.stores).toHaveProperty('favorites');
      expect(storeStates.stores).toHaveProperty('preferences');
      
      await evidence.captureStep('stores-verified', 'All essential stores found and initialized');
    } else {
      await evidence.captureStep('stores-missing', `Store initialization failed: ${storeStates.error}`);
      throw new Error(`Store initialization failed: ${storeStates.error}`);
    }
  });

  test('Priority 1: Environment Variables State', async ({ page }) => {
    await evidence.captureStep('env-check-start', 'Checking environment variables state');
    
    await page.goto('/');
    await evidence.waitForAppReady();
    
    // Check environment variables
    const envState = await page.evaluate(() => {
      return {
        // Check if Vite injects environment variables
        hasImportMeta: typeof import.meta !== 'undefined',
        // Check for version specifically
        viteAppVersion: typeof import.meta !== 'undefined' &&
          import.meta?.env?.VITE_APP_VERSION,
        // Check for other env vars
        viteAppName: typeof import.meta !== 'undefined' &&
          import.meta?.env?.VITE_APP_NAME,
        // Check global objects
        globalEnv: (window as any).__ENV__ || 'not found',
        nodeEnv: typeof process !== 'undefined' ? process.env : 'process not available'
      };
    });
    
    await evidence.captureStep('env-state-captured', 
      `Environment state: ${JSON.stringify(envState, null, 2)}`);
    
    // Verify version environment variable
    if (envState.viteAppVersion) {
      expect(envState.viteAppVersion).toBe('0.5.1');
      await evidence.captureStep('env-version-correct', 
        `Version env var correct: ${envState.viteAppVersion}`);
    } else {
      await evidence.captureStep('env-version-missing', 
        'CRITICAL: VITE_APP_VERSION not available in browser');
      throw new Error('VITE_APP_VERSION not injected into browser environment');
    }
  });

  test('Priority 1: Vue App Mount State', async ({ page }) => {
    await evidence.captureStep('vue-mount-start', 'Testing Vue app mounting state');
    
    await page.goto('/');
    
    // Check immediate mount state
    const mountState = await page.evaluate(() => {
      return {
        hasApp: !!document.getElementById('app'),
        hasVueDevtools: !!(window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__,
        vueApps: (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps?.length || 0,
        documentReady: document.readyState,
        timestamp: Date.now()
      };
    });
    
    await evidence.captureStep('initial-mount-state', 
      `Initial mount state: ${JSON.stringify(mountState)}`);
    
    // Wait for Vue app to fully mount
    await page.waitForSelector('#app > *', { timeout: 10000 });
    
    const finalMountState = await page.evaluate(() => {
      const app = document.getElementById('app');
      return {
        hasChildren: app ? app.children.length > 0 : false,
        childrenCount: app ? app.children.length : 0,
        firstChildTag: app?.children[0]?.tagName,
        vueApps: (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps?.length || 0,
        documentReady: document.readyState,
        timestamp: Date.now()
      };
    });
    
    await evidence.captureStep('final-mount-state', 
      `Final mount state: ${JSON.stringify(finalMountState)}`);
    
    // Verify successful mount
    expect(finalMountState.hasChildren).toBe(true);
    expect(finalMountState.vueApps).toBeGreaterThan(0);
    
    await evidence.captureStep('vue-mount-success', 'Vue app successfully mounted');
  });
});