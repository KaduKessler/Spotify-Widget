import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: false,
    globalSetup: ['./test/global-setup.ts'],
    setupFiles: ['./test/setup.ts'],
    testTimeout: 15000,
    hookTimeout: 30000,
    fileParallelism: false,
    env: {
      NODE_ENV: 'test',
      DATABASE_URL: 'file:./data/test.sqlite',
      SESSION_SECRET: 'test-session-secret-not-for-production-use',
      ENCRYPTION_KEY:
        'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
      ENABLE_PASSWORD_AUTH: 'true',
      ENABLE_GITHUB_AUTH: 'true',
      ENABLE_NONE_AUTH: 'false',
      ENABLE_HELMET: 'false',
      ADMIN_USERNAME: 'test-admin',
      ADMIN_PASSWORD: 'test-admin-password',
      GITHUB_CLIENT_ID: 'test-github-client-id',
      GITHUB_CLIENT_SECRET: 'test-github-client-secret',
      APP_URL: 'http://127.0.0.1:3000',
      ADMIN_URL: 'http://127.0.0.1:5173',
      REGISTRATION_POLICY: 'open',
    },
  },
})
