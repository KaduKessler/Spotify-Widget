import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { makeApp } from './helpers.js'

describe('POST /auth/login', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await makeApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('loga com sucesso usando ADMIN_USERNAME/ADMIN_PASSWORD do env', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: {
        username: process.env.ADMIN_USERNAME,
        password: process.env.ADMIN_PASSWORD,
      },
    })
    expect(res.statusCode).toBe(200)
    expect(res.cookies.some((c) => c.name === 'session')).toBe(true)
  })

  it('rejeita senha errada', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { username: process.env.ADMIN_USERNAME, password: 'wrong' },
    })
    expect(res.statusCode).toBe(401)
  })

  it('bloqueia após 5 tentativas falhas (lockout)', async () => {
    const username = 'lockout-target'
    for (let i = 0; i < 5; i++) {
      const res = await app.inject({
        method: 'POST',
        url: '/auth/login',
        payload: { username, password: 'wrong' },
      })
      expect(res.statusCode).toBe(401)
    }

    const locked = await app.inject({
      method: 'POST',
      url: '/auth/login',
      payload: { username, password: 'wrong' },
    })
    expect(locked.statusCode).toBe(429)
    expect(locked.json()).toHaveProperty('retryAfter')
  })
})

describe('POST /auth/logout', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await makeApp()
  })

  afterEach(async () => {
    await app.close()
  })

  it('limpa o cookie de sessão', async () => {
    const res = await app.inject({ method: 'POST', url: '/auth/logout' })
    expect(res.statusCode).toBe(200)
    const cookie = res.cookies.find((c) => c.name === 'session')
    expect(cookie?.value).toBe('')
  })
})

describe('GET /auth/github/callback (CSRF state)', () => {
  let app: FastifyInstance

  beforeEach(async () => {
    app = await makeApp()
  })

  afterEach(async () => {
    await app.close()
    vi.unstubAllGlobals()
  })

  it('rejeita callback sem state', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/auth/github/callback?code=abc',
    })
    expect(res.statusCode).toBe(400)
  })

  it('rejeita callback com state que não bate com o cookie', async () => {
    const start = await app.inject({ method: 'GET', url: '/auth/github' })
    const stateCookie = start.cookies.find((c) => c.name === 'oauth_state')
    expect(stateCookie).toBeDefined()

    const res = await app.inject({
      method: 'GET',
      url: '/auth/github/callback?code=abc&state=wrong-state',
      cookies: { oauth_state: stateCookie?.value ?? '' },
    })
    expect(res.statusCode).toBe(400)
  })

  it('aceita state válido e segue o fluxo', async () => {
    const start = await app.inject({ method: 'GET', url: '/auth/github' })
    const location = start.headers.location as string
    const state = new URL(location).searchParams.get('state')
    const stateCookie = start.cookies.find((c) => c.name === 'oauth_state')
    expect(state).toBeTruthy()

    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const u = url.toString()
        if (u.includes('github.com/login/oauth/access_token')) {
          return new Response(JSON.stringify({ access_token: 'fake-token' }), {
            status: 200,
          })
        }
        if (u.includes('api.github.com/user')) {
          return new Response(
            JSON.stringify({ id: 1, login: 'octocat', avatar_url: null }),
            { status: 200 },
          )
        }
        throw new Error(`unexpected fetch: ${u}`)
      }),
    )

    const res = await app.inject({
      method: 'GET',
      url: `/auth/github/callback?code=abc&state=${state}`,
      cookies: { oauth_state: stateCookie?.value ?? '' },
    })
    expect(res.statusCode).toBe(302)
    expect(res.cookies.some((c) => c.name === 'session')).toBe(true)
  })
})

describe('Registration policies (GitHub)', () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    delete process.env.REGISTRATION_POLICY
  })

  function stubGithubUser(login: string) {
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string | URL) => {
        const u = url.toString()
        if (u.includes('github.com/login/oauth/access_token')) {
          return new Response(JSON.stringify({ access_token: 'fake-token' }), {
            status: 200,
          })
        }
        if (u.includes('api.github.com/user')) {
          return new Response(
            JSON.stringify({ id: 1, login, avatar_url: null }),
            { status: 200 },
          )
        }
        throw new Error(`unexpected fetch: ${u}`)
      }),
    )
  }

  async function githubCallback(app: FastifyInstance) {
    const start = await app.inject({ method: 'GET', url: '/auth/github' })
    const location = start.headers.location as string
    const state = new URL(location).searchParams.get('state')
    const stateCookie = start.cookies.find((c) => c.name === 'oauth_state')
    return app.inject({
      method: 'GET',
      url: `/auth/github/callback?code=abc&state=${state}`,
      cookies: { oauth_state: stateCookie?.value ?? '' },
    })
  }

  it('closed bloqueia signup novo', async () => {
    process.env.REGISTRATION_POLICY = 'closed'
    const app = await makeApp()
    stubGithubUser('newperson')

    const res = await githubCallback(app)
    expect(res.statusCode).toBe(403)
    await app.close()
  })

  it('closed permite login de usuário já existente', async () => {
    process.env.REGISTRATION_POLICY = 'open'
    const bootstrapApp = await makeApp()
    stubGithubUser('veteran')
    const first = await githubCallback(bootstrapApp)
    expect(first.statusCode).toBe(302)
    await bootstrapApp.close()

    process.env.REGISTRATION_POLICY = 'closed'
    const app = await makeApp()
    stubGithubUser('veteran')
    const res = await githubCallback(app)
    expect(res.statusCode).toBe(302)
    await app.close()
  })

  it('github_whitelist bloqueia quem não tá na lista', async () => {
    process.env.REGISTRATION_POLICY = 'github_whitelist'
    const app = await makeApp()
    stubGithubUser('not-whitelisted')

    const res = await githubCallback(app)
    expect(res.statusCode).toBe(403)
    await app.close()
  })
})
