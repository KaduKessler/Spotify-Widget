import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loginAsAdmin, makeApp } from './helpers.js'

describe('/api/config', () => {
  let app: FastifyInstance
  let sessionCookie: string

  beforeEach(async () => {
    app = await makeApp()
    sessionCookie = await loginAsAdmin(app)
  })

  afterEach(async () => {
    await app.close()
  })

  it('GET sem sessão retorna 401', async () => {
    const res = await app.inject({ method: 'GET', url: '/api/config' })
    expect(res.statusCode).toBe(401)
  })

  it('GET com sessão retorna config padrão pra usuário novo', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/config',
      headers: { cookie: sessionCookie },
    })
    expect(res.statusCode).toBe(200)
    expect(res.json()).toMatchObject({ mode: 'NOW_PLAYING', theme: 'dark' })
  })

  it('POST com payload válido salva a config', async () => {
    const post = await app.inject({
      method: 'POST',
      url: '/api/config',
      headers: { cookie: sessionCookie },
      payload: { mode: 'FIXED_TRACK', track_id: 'abc123', theme: 'light' },
    })
    expect(post.statusCode).toBe(200)

    const get = await app.inject({
      method: 'GET',
      url: '/api/config',
      headers: { cookie: sessionCookie },
    })
    expect(get.json()).toMatchObject({
      mode: 'FIXED_TRACK',
      trackId: 'abc123',
      theme: 'light',
    })
  })

  it('POST com payload inválido é rejeitado', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/config',
      headers: { cookie: sessionCookie },
      payload: { mode: 'NOT_A_MODE' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('POST sem sessão retorna 401', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/config',
      payload: { mode: 'NOW_PLAYING' },
    })
    expect(res.statusCode).toBe(401)
  })
})
