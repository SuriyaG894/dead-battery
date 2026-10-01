import { defineConfig, devices } from '@playwright/test';

// Uses the locally installed Edge (Windows) or Chrome, so no browser download is needed.
const channel = process.env.PW_CHANNEL ?? (process.platform === 'win32' ? 'msedge' : 'chrome');
// BASE_URL=https://dead-battery.vercel.app npm run test:e2e  → test a deployment instead of a local build.
const remote = process.env.BASE_URL;

export default defineConfig({
  testDir: 'tests/e2e',
  testMatch: '*.e2e.ts',
  timeout: 120_000,
  fullyParallel: true,
  reporter: 'list',
  use: { baseURL: remote ?? 'http://localhost:4173', channel },
  webServer: remote
    ? undefined
    : {
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
