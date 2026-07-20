import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makeApp } from './helpers.js'

describe('GET /api/whitelist/:username', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await makeApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('é público, não exige sessão', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/whitelist/someuser',
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toEqual({ whitelisted: false })
  })
})

describe('GET /api/admin/whitelist', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await makeApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('exige sessão (não é público)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/admin/whitelist',
    })
    expect(res.statusCode).toBe(401)
  })
})
