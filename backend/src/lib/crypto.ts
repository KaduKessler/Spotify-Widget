import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'
import { loadConfig } from './config.js'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12

// loadConfig() já é chamada uma vez por chamada (não memoizada) e imprime
// warnings de dev — cacheia a chave aqui pra não repetir isso a cada
// encrypt/decrypt (podem ser centenas, no polling do now-playing).
let cachedKey: Buffer | undefined

function getKey(): Buffer {
  if (cachedKey) return cachedKey

  const hex = loadConfig().ENCRYPTION_KEY
  if (!/^[0-9a-fA-F]{64}$/.test(hex)) {
    throw new Error(
      'ENCRYPTION_KEY ausente ou inválida (precisa de 64 caracteres hex, gere com: openssl rand -hex 32)',
    )
  }
  cachedKey = Buffer.from(hex, 'hex')
  return cachedKey
}

export function encrypt(plain: string): string {
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, getKey(), iv)
  const ciphertext = Buffer.concat([
    cipher.update(plain, 'utf8'),
    cipher.final(),
  ])
  const authTag = cipher.getAuthTag()
  return `${iv.toString('hex')}:${authTag.toString('hex')}:${ciphertext.toString('hex')}`
}

/**
 * Formato legado (pré-criptografia): texto puro, sem os dois `:`
 * separadores. Devolve como está em vez de tentar descriptografar —
 * autoconverge na próxima escrita natural do campo.
 */
export function decrypt(value: string): string {
  const parts = value.split(':')
  if (parts.length !== 3) return value

  const [ivHex, authTagHex, cipherHex] = parts as [string, string, string]
  try {
    const decipher = createDecipheriv(
      ALGORITHM,
      getKey(),
      Buffer.from(ivHex, 'hex'),
    )
    decipher.setAuthTag(Buffer.from(authTagHex, 'hex'))
    const plain = Buffer.concat([
      decipher.update(Buffer.from(cipherHex, 'hex')),
      decipher.final(),
    ])
    return plain.toString('utf8')
  } catch {
    // Não bateu o formato/chave: trata como texto puro legado.
    return value
  }
}
