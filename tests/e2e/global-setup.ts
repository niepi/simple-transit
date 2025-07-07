import { chromium, FullConfig } from '@playwright/test';

async function globalSetup(config: FullConfig) {
  console.log('🚀 Starting global test setup...');
  
  // Verify dev server is running
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  try {
    await page.goto('http://localhost:5173');
    await page.waitForSelector('h1', { timeout: 10000 });
    console.log('✅ Dev server is responding');
  } catch (error) {
    console.error('❌ Dev server not responding:', error);
    throw new Error('Dev server must be running before tests can start');
  } finally {
    await browser.close();
  }
  
  console.log('✅ Global setup completed');
}

export default globalSetup;