import 'dotenv/config'

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue
  return value.toLowerCase() === 'true' || value === '1'
}

export function loadConfig() {
  // Multi-provider support: permite habilitar múltiplos métodos de auth
  const ENABLE_PASSWORD_AUTH = parseBoolean(process.env.ENABLE_PASSWORD_AUTH, false)
  const ENABLE_GITHUB_AUTH = parseBoolean(process.env.ENABLE_GITHUB_AUTH, false)
  const ENABLE_NONE_AUTH = parseBoolean(process.env.ENABLE_NONE_AUTH, false)

  // Backward compatibility: AUTH_PROVIDER ainda funciona (legacy)
  const legacyProvider = process.env.AUTH_PROVIDER
  if (legacyProvider && !ENABLE_PASSWORD_AUTH && !ENABLE_GITHUB_AUTH && !ENABLE_NONE_AUTH) {
    // Se AUTH_PROVIDER está setado mas nenhum ENABLE_* está, usa o legacy
    console.warn('[Config] AUTH_PROVIDER is deprecated. Use ENABLE_PASSWORD_AUTH, ENABLE_GITHUB_AUTH instead.')

    return {
      ENABLE_PASSWORD_AUTH: legacyProvider === 'password',
      ENABLE_GITHUB_AUTH: legacyProvider === 'github',
      ENABLE_NONE_AUTH: legacyProvider === 'none',
      SESSION_SECRET: process.env.SESSION_SECRET || 'devSessionSecret',
      NODE_ENV: process.env.NODE_ENV || 'development',
      ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
      APP_URL: process.env.APP_URL || 'http://localhost:3000',
      ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:5173',
    }
  }

  return {
    ENABLE_PASSWORD_AUTH,
    ENABLE_GITHUB_AUTH,
    ENABLE_NONE_AUTH,
    SESSION_SECRET: process.env.SESSION_SECRET || 'devSessionSecret',
    NODE_ENV: process.env.NODE_ENV || 'development',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
    APP_URL: process.env.APP_URL || 'http://localhost:3000',
    ADMIN_URL: process.env.ADMIN_URL || 'http://localhost:5173',
  }
}

export type AppConfig = ReturnType<typeof loadConfig>
