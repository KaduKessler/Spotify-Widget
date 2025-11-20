import 'dotenv/config'

type AuthProvider = 'none' | 'password' | 'github'

export function loadConfig() {
  const AUTH_PROVIDER = (process.env.AUTH_PROVIDER || 'none') as AuthProvider

  const SESSION_SECRET = process.env.SESSION_SECRET || 'devSessionSecret'

  return {
    AUTH_PROVIDER,
    SESSION_SECRET,
    NODE_ENV: process.env.NODE_ENV || 'development',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
  }
}

export type AppConfig = ReturnType<typeof loadConfig>
