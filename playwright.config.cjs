const { defineConfig } = require('@playwright/test')
module.exports = defineConfig({
  testDir: './tests/e2e',
  workers: 1,
  timeout: 60000,
  use: { baseURL: process.env.PLAYWRIGHT_BASE_URL || 'http://127.0.0.1:3100', browserName: 'chromium', channel: 'chrome', headless: true, screenshot: 'only-on-failure' },
  reporter: [['list'], ['html', { open: 'never' }]],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : { command: 'npm run start -- --hostname 127.0.0.1 --port 3100', url: 'http://127.0.0.1:3100/login', reuseExistingServer: false, timeout: 60000 },
})
