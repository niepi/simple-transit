import { test, expect } from '@playwright/test';

test('Debug Version Display Issue', async ({ page }) => {
  console.log('🔍 Starting version debug test...');
  
  // Navigate to app
  await page.goto('http://localhost:5173');
  
  // Wait for app to load
  await page.waitForSelector('#app', { timeout: 10000 });
  console.log('✅ App container found');
  
  // Take screenshot for evidence
  await page.screenshot({ path: 'test-results/01-app-loaded.png', fullPage: true });
  
  // Wait for main content
  await page.waitForSelector('h1', { timeout: 10000 });
  console.log('✅ Main heading found');
  
  // Look for version display
  const versionElements = await page.locator('*').filter({ hasText: /v\d/ }).all();
  console.log(`🔍 Found ${versionElements.length} elements containing version patterns`);
  
  for (let i = 0; i < versionElements.length; i++) {
    const text = await versionElements[i].textContent();
    console.log(`Version element ${i + 1}: "${text}"`);
  }
  
  // Take screenshot of current state
  await page.screenshot({ path: 'test-results/02-version-search.png', fullPage: true });
  
  // Check if version is in the sidebar header area
  const sidebarHeader = page.locator('h1').first();
  const headerText = await sidebarHeader.textContent();
  console.log(`Header text: "${headerText}"`);
  
  // Look for any element with 'v' followed by numbers
  const versionPattern = page.locator('text=/v\\d+\\.\\d+\\.\\d+/');
  const versionCount = await versionPattern.count();
  console.log(`Found ${versionCount} elements matching version pattern`);
  
  if (versionCount > 0) {
    const versionText = await versionPattern.first().textContent();
    console.log(`✅ Version found: ${versionText}`);
    await page.screenshot({ path: 'test-results/03-version-found.png', fullPage: true });
  } else {
    console.log('❌ No version found in UI');
    
    // Check if version is in environment but not displayed
    const envCheck = await page.evaluate(() => {
      return {
        viteEnv: (window as any).import?.meta?.env?.VITE_APP_VERSION || 'not found',
        hasImportMeta: typeof (window as any).import !== 'undefined'
      };
    });
    
    console.log('Environment check:', envCheck);
    await page.screenshot({ path: 'test-results/04-version-missing.png', fullPage: true });
  }
  
  // Check the actual DOM for version display location
  const nearbyStationsHeader = page.locator('text=Nearby Stations');
  if (await nearbyStationsHeader.count() > 0) {
    const parentElement = nearbyStationsHeader.locator('..');
    const siblingText = await parentElement.textContent();
    console.log(`Nearby Stations parent text: "${siblingText}"`);
    
    await page.screenshot({ path: 'test-results/05-header-area.png' });
  }
});