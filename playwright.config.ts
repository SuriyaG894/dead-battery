import { defineConfig, devices } from '@playwright/test';

// Uses the locally installed Edge (Windows) or Chrome, so no browser download is needed.
const channel = process.env.PW_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : 'chrome');

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '*.e2e.ts',
  timeout: 120_000,
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: 'http://localhost:4173', channel },
  webServer: {
    command: 'npm run build && npx vite preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    // Never reuse: a leftover server would silently test a stale build.
    reuseExistingServer: false,
    timeout: 120_000,
  },
  projects: [
    { name: 'desktop', use: { viewport: { width: 1280, height: 900 } } },
    { name: 'mobile', use: { ...devices['Pixel 7'], channel } },
  ],
});
