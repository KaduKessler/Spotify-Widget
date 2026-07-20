import { describe, expect, it } from 'vitest'
import { decrypt, encrypt } from '../src/lib/crypto.js'

describe('crypto', () => {
  it('roundtrip: encrypt seguido de decrypt devolve o valor original', () => {
    const plain = 'meu-client-secret-super-secreto'
    const encrypted = encrypt(plain)
    expect(encrypted).not.toBe(plain)
    expect(decrypt(encrypted)).toBe(plain)
  })

  it('cada encrypt gera um IV diferente (nunca repete o ciphertext)', () => {
    const plain = 'mesmo-valor'
    expect(encrypt(plain)).not.toBe(encrypt(plain))
  })

  it('valor legado em texto puro é devolvido como está, não quebra', () => {
    const legacy = 'token-antigo-sem-criptografia'
    expect(decrypt(legacy)).toBe(legacy)
  })

  it('formato criptografado tem 3 partes hex separadas por :', () => {
    const encrypted = encrypt('valor')
    const parts = encrypted.split(':')
    expect(parts).toHaveLength(3)
    for (const part of parts) {
      expect(part).toMatch(/^[0-9a-f]+$/)
    }
  })
})
