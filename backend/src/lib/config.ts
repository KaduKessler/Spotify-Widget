import 'dotenv/config'

function parseBoolean(value: string | undefined, defaultValue: boolean): boolean {
  if (!value) return defaultValue
  return value.toLowerCase() === 'true' || value === '1'
}

function validateConfig(config: ReturnType<typeof buildConfig>) {
  const errors: string[] = []

  // Validar que pelo menos um método de auth está habilitado
  if (!config.ENABLE_PASSWORD_AUTH && !config.ENABLE_GITHUB_AUTH && !config.ENABLE_NONE_AUTH) {
    errors.push('At least one auth method must be enabled (ENABLE_PASSWORD_AUTH, ENABLE_GITHUB_AUTH, or ENABLE_NONE_AUTH)')
  }

  // Validar password auth requirements
  if (config.ENABLE_PASSWORD_AUTH) {
    if (!config.ADMIN_USERNAME || config.ADMIN_USERNAME === 'admin') {
      errors.push('ADMIN_USERNAME must be set to a secure value when password auth is enabled')
    }
    if (!config.ADMIN_PASSWORD || config.ADMIN_PASSWORD === 'admin' || config.ADMIN_PASSWORD.length < 8) {
      errors.push('ADMIN_PASSWORD must be set to a strong password (min 8 chars) when password auth is enabled')
    }
  }

  // Validar GitHub OAuth requirements
  if (config.ENABLE_GITHUB_AUTH) {
    if (!config.GITHUB_CLIENT_ID || config.GITHUB_CLIENT_ID === 'your_github_client_id') {
      errors.push('GITHUB_CLIENT_ID must be set when GitHub auth is enabled')
    }
    if (!config.GITHUB_CLIENT_SECRET || config.GITHUB_CLIENT_SECRET === 'your_github_client_secret') {
      errors.push('GITHUB_CLIENT_SECRET must be set when GitHub auth is enabled')
    }
  }

  // Validar session secret em produção
  if (config.NODE_ENV === 'production' && (!config.SESSION_SECRET || config.SESSION_SECRET === 'devSessionSecret' || config.SESSION_SECRET.length < 32)) {
    errors.push('SESSION_SECRET must be set to a strong random value (min 32 chars) in production. Generate with: openssl rand -hex 32')
  }

  if (errors.length > 0) {
    console.error('\n❌ Configuration errors:\n')
    for (const error of errors) {
      console.error(`  - ${error}`)
    }
    console.error('\nPlease check your .env file and fix the issues above.\n')
    throw new Error('Invalid configuration')
  }
}

function buildConfig() {
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
      REGISTRATION_POLICY: 'open' as 'open',
      GITHUB_WHITELIST: [],
      ALLOW_PASSWORD_SIGNUP: true,
      ADMIN_USERS: [],
      SESSION_SECRET: process.env.SESSION_SECRET || 'devSessionSecret',
      NODE_ENV: process.env.NODE_ENV || 'development',
      ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
      ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',
      GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
      GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
      APP_URL: process.env.APP_URL || 'http://127.0.0.1:3000',
      ADMIN_URL: process.env.ADMIN_URL || 'http://127.0.0.1:5173',
    }
  }

  return {
    ENABLE_PASSWORD_AUTH,
    ENABLE_GITHUB_AUTH,
    ENABLE_NONE_AUTH,
    REGISTRATION_POLICY: (process.env.REGISTRATION_POLICY || 'open') as
      | 'open'
      | 'github_whitelist'
      | 'invite_only'
      | 'closed',
    GITHUB_WHITELIST:
      process.env.GITHUB_WHITELIST
        ? process.env.GITHUB_WHITELIST.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    ALLOW_PASSWORD_SIGNUP: parseBoolean(process.env.ALLOW_PASSWORD_SIGNUP, true),
    ADMIN_USERS:
      process.env.ADMIN_USERS
        ? process.env.ADMIN_USERS.split(',').map((s) => s.trim()).filter(Boolean)
        : [],
    SESSION_SECRET: process.env.SESSION_SECRET || 'devSessionSecret',
    NODE_ENV: process.env.NODE_ENV || 'development',
    ADMIN_USERNAME: process.env.ADMIN_USERNAME || 'admin',
    ADMIN_PASSWORD: process.env.ADMIN_PASSWORD || 'admin',
    GITHUB_CLIENT_ID: process.env.GITHUB_CLIENT_ID || '',
    GITHUB_CLIENT_SECRET: process.env.GITHUB_CLIENT_SECRET || '',
    APP_URL: process.env.APP_URL || 'http://127.0.0.1:3000',
    ADMIN_URL: process.env.ADMIN_URL || 'http://127.0.0.1:5173',
  }
}

export function loadConfig() {
  const config = buildConfig()

  // Validar apenas em produção ou se NODE_ENV=production
  if (config.NODE_ENV === 'production') {
    validateConfig(config)
  } else {
    // Em dev, apenas avisar sobre configurações fracas
    if (config.ENABLE_PASSWORD_AUTH && config.ADMIN_PASSWORD === 'admin') {
      console.warn('⚠️  Warning: Using default ADMIN_PASSWORD. Change it in production!')
    }
    if (config.SESSION_SECRET === 'devSessionSecret') {
      console.warn('⚠️  Warning: Using default SESSION_SECRET. Change it in production!')
    }
    const validPolicies = ['open', 'github_whitelist', 'invite_only', 'closed']
    if (!validPolicies.includes(config.REGISTRATION_POLICY)) {
      console.warn('⚠️  Warning: Invalid REGISTRATION_POLICY. Using "open" as default.')
      config.REGISTRATION_POLICY = 'open'
    }
    if (
      config.REGISTRATION_POLICY === 'github_whitelist' &&
      Array.isArray(config.GITHUB_WHITELIST) &&
      config.GITHUB_WHITELIST.length === 0
    ) {
      console.warn('⚠️  Warning: REGISTRATION_POLICY=github_whitelist but GITHUB_WHITELIST is empty.')
    }
  }

  return config
}

export type AppConfig = ReturnType<typeof loadConfig>
