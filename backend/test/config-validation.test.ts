import { afterEach, describe, expect, it } from 'vitest'
import { loadConfig } from '../src/lib/config.js'

const ENV_KEYS = [
  'NODE_ENV',
  'SESSION_SECRET',
  'ENCRYPTION_KEY',
  'ADMIN_PASSWORD',
  'ADMIN_USERNAME',
] as const

const original: Record<string, string | undefined> = {}
for (const key of ENV_KEYS) original[key] = process.env[key]

function restoreEnv() {
  for (const key of ENV_KEYS) {
    if (original[key] === undefined) delete process.env[key]
    else process.env[key] = original[key]
  }
}

describe('loadConfig em produção', () => {
  afterEach(restoreEnv)

  it('rejeita ENCRYPTION_KEY ausente', () => {
    process.env.NODE_ENV = 'production'
    delete process.env.ENCRYPTION_KEY
    expect(() => loadConfig()).toThrow('Invalid configuration')
  })

  it('rejeita ENCRYPTION_KEY que não é hex de 64 chars', () => {
    process.env.NODE_ENV = 'production'
    process.env.ENCRYPTION_KEY = 'chave-curta-demais'
    expect(() => loadConfig()).toThrow('Invalid configuration')
  })

  it('rejeita a ENCRYPTION_KEY padrão de dev', () => {
    process.env.NODE_ENV = 'production'
    process.env.ENCRYPTION_KEY = '0'.repeat(64)
    expect(() => loadConfig()).toThrow('Invalid configuration')
  })

  it('rejeita SESSION_SECRET ausente ou curto', () => {
    process.env.NODE_ENV = 'production'
    process.env.ENCRYPTION_KEY =
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    process.env.SESSION_SECRET = 'curta'
    expect(() => loadConfig()).toThrow('Invalid configuration')
  })

  it('aceita quando todos os requisitos de produção estão certos', () => {
    process.env.NODE_ENV = 'production'
    process.env.SESSION_SECRET =
      'sessao-forte-com-mais-de-trinta-e-dois-caracteres'
    process.env.ENCRYPTION_KEY =
      'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa'
    process.env.ADMIN_USERNAME = 'owner'
    process.env.ADMIN_PASSWORD = 'senha-forte-de-verdade'
    expect(() => loadConfig()).not.toThrow()
  })
})
