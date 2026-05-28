import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  testDir: './tests',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: undefined,
  reporter: process.env.CI
    ? [
      ['dot'],
      ['junit', { outputFile: 'junit-result/results.xml' }],
    ]
    : [
      ['list'],
      ['html', { open: 'never' }]
    ],
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: 'http://127.0.0.1:4321',

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    screenshot: 'on',
    video: 'retain-on-failure',
  },

  /* Global setup and teardown */
  globalSetup: path.join(__dirname, 'tests/global-setup.ts'),
  globalTeardown: path.join(__dirname, 'tests/global-teardown.ts'),

  /* Configure projects for major browsers */
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },

    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },

    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },

    /* Test against mobile viewports. */
    // {
    //   name: 'Mobile Chrome',
    //   use: { ...devices['Pixel 5'] },
    // },
    // {
    //   name: 'Mobile Safari',
    //   use: { ...devices['iPhone 12'] },
    // },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: 'bun run dev -- --host 127.0.0.1',
    url: 'http://127.0.0.1:4321',
    reuseExistingServer: false,
    timeout: 120000,
    env: {
      FIRESTORE_EMULATOR_HOST: '127.0.0.1:8180',
      FIREBASE_AUTH_EMULATOR_HOST: '127.0.0.1:9199',
      PUBLIC_FIRESTORE_EMULATOR_HOST: '127.0.0.1',
      PUBLIC_FIRESTORE_EMULATOR_PORT: '8180',
      PUBLIC_AUTH_EMULATOR_URL: 'http://127.0.0.1:9199',
      PUBLIC_APP_ENV: 'development',
      PUBLIC_FIREBASE_PROJECT_ID: 'sansistore',
      PUBLIC_FIREBASE_AUTH_DOMAIN: 'localhost',
      PUBLIC_FIREBASE_STORAGE_BUCKET: 'localhost.appspot.com',
      PUBLIC_FIREBASE_MESSAGING_SENDER_ID: '123456789',
      PUBLIC_FIREBASE_APP_ID: '1:123456789:web:local',
      PUBLIC_FIREBASE_MEASUREMENT_ID: 'G-LOCAL',
    },
  },
});
