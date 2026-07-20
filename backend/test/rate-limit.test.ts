import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { makeApp } from './helpers.js'

describe('Rate limit em /auth', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await makeApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('retorna 429 após 10 requisições em 5 minutos', async () => {
    const statuses: number[] = []
    for (let i = 0; i < 11; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { username: `probe-${i}`, password: 'wrong' },
      })
      statuses.push(res.statusCode)
    }

    expect(statuses.slice(0, 10)).toEqual(Array(10).fill(401))
    expect(statuses[10]).toBe(429)
  })
})
