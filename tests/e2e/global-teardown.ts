import { FullConfig } from '@playwright/test';

async function globalTeardown(config: FullConfig) {
  console.log('🧹 Starting global test teardown...');
  
  // Clean up any test artifacts
  console.log('✅ Global teardown completed');
}

export default globalTeardown;