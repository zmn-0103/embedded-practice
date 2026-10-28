import { defineConfig } from '@playwright/test'

export default defineConfig({
  testDir: '.',
  testMatch: 'review.spec.ts',
  workers: 1,
  timeout: 30_000,
  expect: { timeout: 5_000 },
  projects: [{ name: 'packaged' }],
})
