import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: '*probe.spec.ts',
  workers: 1,
  timeout: 30000,
  expect: { timeout: 10000 },
  projects: [{ name: 'development' }],
})
