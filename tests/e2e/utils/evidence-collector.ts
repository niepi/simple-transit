import { Page, TestInfo } from '@playwright/test';
import { promises as fs } from 'fs';
import path from 'path';

export class EvidenceCollector {
  private page: Page;
  private testInfo: TestInfo;
  private stepCounter: number = 0;

  constructor(page: Page, testInfo: TestInfo) {
    this.page = page;
    this.testInfo = testInfo;
  }

  /**
   * Capture evidence at each critical step
   */
  async captureStep(stepName: string, description?: string): Promise<void> {
    this.stepCounter++;
    const stepId = `step-${this.stepCounter.toString().padStart(2, '0')}`;
    
    console.log(`📸 Capturing evidence: ${stepId} - ${stepName}`);
    
    // Create step directory
    const evidenceDir = path.join(this.testInfo.outputDir, 'evidence', stepId);
    await fs.mkdir(evidenceDir, { recursive: true });
    
    // Capture screenshot
    await this.page.screenshot({
      path: path.join(evidenceDir, `${stepId}-screenshot.png`),
      fullPage: true
    });
    
    // Capture console logs
    const logs = await this.page.evaluate(() => {
      // Get console logs from the page
      return (window as any).__consoleLogs || [];
    });
    
    // Capture network requests
    const networkLogs = await this.page.evaluate(() => {
      // Get network activity if available
      return (window as any).__networkLogs || [];
    });
    
    // Capture application state
    const appState = await this.captureAppState();
    
    // Capture DOM snapshot
    const domSnapshot = await this.page.content();
    
    // Save evidence to files
    const evidence = {
      stepName,
      description,
      timestamp: new Date().toISOString(),
      url: this.page.url(),
      viewport: await this.page.viewportSize(),
      consoleLogs: logs,
      networkLogs: networkLogs,
      appState,
      errors: await this.getPageErrors()
    };
    
    await fs.writeFile(
      path.join(evidenceDir, `${stepId}-evidence.json`),
      JSON.stringify(evidence, null, 2)
    );
    
    await fs.writeFile(
      path.join(evidenceDir, `${stepId}-dom.html`),
      domSnapshot
    );
    
    // Create step summary
    const summary = `# Step ${this.stepCounter}: ${stepName}\n\n` +
      `**Description:** ${description || 'No description'}\n` +
      `**Timestamp:** ${evidence.timestamp}\n` +
      `**URL:** ${evidence.url}\n` +
      `**Viewport:** ${evidence.viewport?.width}x${evidence.viewport?.height}\n\n` +
      `## Files:\n` +
      `- Screenshot: ${stepId}-screenshot.png\n` +
      `- Evidence: ${stepId}-evidence.json\n` +
      `- DOM: ${stepId}-dom.html\n\n` +
      `## App State:\n\`\`\`json\n${JSON.stringify(appState, null, 2)}\n\`\`\`\n\n` +
      `## Console Logs:\n\`\`\`\n${logs.join('\n')}\n\`\`\`\n`;
    
    await fs.writeFile(
      path.join(evidenceDir, `${stepId}-summary.md`),
      summary
    );
  }

  /**
   * Capture application state from stores
   */
  private async captureAppState(): Promise<any> {
    return await this.page.evaluate(() => {
      try {
        // Get Pinia store states
        const storeStates: any = {};
        
        // Access the global Vue app instance to get stores
        const app = (window as any).__VUE_DEVTOOLS_GLOBAL_HOOK__?.apps?.[0];
        if (app?.config?.globalProperties?.$pinia) {
          const pinia = app.config.globalProperties.$pinia;
          
          // Get all store states
          if (pinia._s) {
            for (const [storeId, store] of pinia._s) {
              storeStates[storeId] = {
                state: store.$state,
                getters: Object.keys(store).filter(key => 
                  typeof store[key] === 'function' && key.startsWith('get')
                )
              };
            }
          }
        }
        
        return {
          stores: storeStates,
          localStorage: { ...localStorage },
          sessionStorage: { ...sessionStorage },
          geolocation: {
            supported: 'geolocation' in navigator,
            permissions: navigator.permissions ? 'available' : 'not available'
          },
          viewport: {
            width: window.innerWidth,
            height: window.innerHeight,
            devicePixelRatio: window.devicePixelRatio
          },
          userAgent: navigator.userAgent,
          url: window.location.href,
          timestamp: new Date().toISOString()
        };
      } catch (error) {
        return {
          error: 'Failed to capture app state',
          details: error instanceof Error ? error.message : String(error)
        };
      }
    });
  }

  /**
   * Get page errors
   */
  private async getPageErrors(): Promise<string[]> {
    return await this.page.evaluate(() => {
      return (window as any).__pageErrors || [];
    });
  }

  /**
   * Set up error tracking on the page
   */
  async setupErrorTracking(): Promise<void> {
    await this.page.addInitScript(() => {
      (window as any).__pageErrors = [];
      (window as any).__consoleLogs = [];
      (window as any).__networkLogs = [];

      // Capture console logs
      const originalConsoleLog = console.log;
      const originalConsoleError = console.error;
      const originalConsoleWarn = console.warn;

      console.log = (...args) => {
        (window as any).__consoleLogs.push(`LOG: ${args.join(' ')}`);
        originalConsoleLog.apply(console, args);
      };

      console.error = (...args) => {
        (window as any).__consoleLogs.push(`ERROR: ${args.join(' ')}`);
        (window as any).__pageErrors.push(`Console Error: ${args.join(' ')}`);
        originalConsoleError.apply(console, args);
      };

      console.warn = (...args) => {
        (window as any).__consoleLogs.push(`WARN: ${args.join(' ')}`);
        originalConsoleWarn.apply(console, args);
      };

      // Capture unhandled errors
      window.addEventListener('error', (event) => {
        (window as any).__pageErrors.push(`Unhandled Error: ${event.error?.message || event.message}`);
      });

      // Capture unhandled promise rejections
      window.addEventListener('unhandledrejection', (event) => {
        (window as any).__pageErrors.push(`Unhandled Promise Rejection: ${event.reason}`);
      });
    });
  }

  /**
   * Capture network activity
   */
  async setupNetworkTracking(): Promise<void> {
    this.page.on('request', request => {
      console.log(`🌐 Request: ${request.method()} ${request.url()}`);
    });

    this.page.on('response', response => {
      const status = response.status();
      const url = response.url();
      console.log(`📡 Response: ${status} ${url}`);
      
      if (status >= 400) {
        console.error(`❌ Failed request: ${status} ${url}`);
      }
    });

    this.page.on('requestfailed', request => {
      console.error(`💥 Request failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
  }

  /**
   * Wait for app to be ready
   */
  async waitForAppReady(): Promise<void> {
    // Wait for Vue app to mount
    await this.page.waitForSelector('[id="app"]', { timeout: 30000 });
    
    // Wait for main components to load
    await this.page.waitForSelector('h1', { timeout: 10000 });
    
    // Wait for any initial API calls to complete
    await this.page.waitForLoadState('networkidle', { timeout: 30000 });
    
    console.log('✅ App is ready for testing');
  }

  /**
   * Generate final test report
   */
  async generateReport(): Promise<void> {
    const reportPath = path.join(this.testInfo.outputDir, 'evidence', 'test-report.md');
    
    const report = `# Test Evidence Report\n\n` +
      `**Test:** ${this.testInfo.title}\n` +
      `**File:** ${this.testInfo.file}\n` +
      `**Duration:** ${this.testInfo.duration}ms\n` +
      `**Status:** ${this.testInfo.status}\n` +
      `**Steps Captured:** ${this.stepCounter}\n\n` +
      `## Evidence Directory Structure\n` +
      `\`\`\`\n` +
      `evidence/\n` +
      Array.from({ length: this.stepCounter }, (_, i) => {
        const stepId = `step-${(i + 1).toString().padStart(2, '0')}`;
        return `├── ${stepId}/\n` +
               `│   ├── ${stepId}-screenshot.png\n` +
               `│   ├── ${stepId}-evidence.json\n` +
               `│   ├── ${stepId}-dom.html\n` +
               `│   └── ${stepId}-summary.md\n`;
      }).join('') +
      `└── test-report.md\n` +
      `\`\`\`\n`;
    
    await fs.writeFile(reportPath, report);
    console.log(`📋 Test report generated: ${reportPath}`);
  }
}