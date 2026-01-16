import { devices } from '@playwright/test';

/** @type {import('@playwright/test').PlaywrightTestConfig} */
export default {
  testDir: './tests/e2e',
  timeout: 60_000,
  expect: { timeout: 5000 },
  fullyParallel: true,
  reporter: 'list',
  use: {
    headless: true,
    viewport: { width: 1280, height: 720 },
    actionTimeout: 10000,
    baseURL: 'http://127.0.0.1:5500',
  },
  webServer: {
    // Serve the repository root (so `/templates/*` resolves) instead of the frontend dir
    command: 'python -m http.server 5500 --directory ..',
    port: 5500,
    timeout: 20_000,
    reuseExistingServer: false,
  },
  projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],
};
