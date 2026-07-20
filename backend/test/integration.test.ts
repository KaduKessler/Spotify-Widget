import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loginAsAdmin, makeApp } from './helpers.js'

async function createPasswordUser(
  app: FastifyInstance,
  adminCookie: string,
  username: string,
  password: string,
) {
  const res = await app.inject({
    method: 'POST',
    url: '/api/admin/users',
    headers: { cookie: adminCookie },
    payload: { username, password, role: 'user' },
  })
  expect(res.statusCode).toBe(200)
}

async function loginAs(
  app: FastifyInstance,
  username: string,
  password: string,
) {
  const res = await app.inject({
    method: 'POST',
    url: '/auth/login',
    payload: { username, password },
  })
  expect(res.statusCode).toBe(200)
  const cookie = res.cookies.find((c) => c.name === 'session')
  if (!cookie) throw new Error('login falhou')
  return `${cookie.name}=${cookie.value}`
}

describe('Fluxo completo: criar user -> login -> salvar config -> preview', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await makeApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('config salva pelo painel aparece no /widget', async () => {
    const adminCookie = await loginAsAdmin(app)
    await createPasswordUser(app, adminCookie, 'flowuser', 'senha12345')
    const userCookie = await loginAs(app, 'flowuser', 'senha12345')

    const save = await app.inject({
      method: 'POST',
      url: '/api/config',
      headers: { cookie: userCookie },
      payload: { mode: 'NOW_PLAYING', theme: 'light' },
    })
    expect(save.statusCode).toBe(200)

    const widget = await app.inject({
      method: 'GET',
      url: '/widget?user=flowuser',
    })
    expect(widget.statusCode).toBe(200)
    expect(widget.headers['content-type']).toContain('image/svg+xml')
    // Fundo claro (#ffffff) só aparece quando o tema light salvo é respeitado
    expect(widget.body).toContain('#ffffff')
  })
})

describe('Isolamento entre usuários', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await makeApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('config de um usuário não vaza pro outro', async () => {
    const adminCookie = await loginAsAdmin(app)
    await createPasswordUser(app, adminCookie, 'alice', 'senha-alice-123')
    await createPasswordUser(app, adminCookie, 'bob', 'senha-bob-12345')

    const aliceCookie = await loginAs(app, 'alice', 'senha-alice-123')
    const bobCookie = await loginAs(app, 'bob', 'senha-bob-12345')

    await app.inject({
      method: 'POST',
      url: '/api/config',
      headers: { cookie: aliceCookie },
      payload: { mode: 'FIXED_TRACK', track_id: 'alice-track', theme: 'dark' },
    })
    await app.inject({
      method: 'POST',
      url: '/api/config',
      headers: { cookie: bobCookie },
      payload: { mode: 'NOW_PLAYING', theme: 'light' },
    })

    const aliceConfig = await app.inject({
      method: 'GET',
      url: '/api/config',
      headers: { cookie: aliceCookie },
    })
    const bobConfig = await app.inject({
      method: 'GET',
      url: '/api/config',
      headers: { cookie: bobCookie },
    })

    expect(aliceConfig.json()).toMatchObject({
      mode: 'FIXED_TRACK',
      trackId: 'alice-track',
    })
    expect(bobConfig.json()).toMatchObject({ mode: 'NOW_PLAYING' })
  })
})
