import Database from 'better-sqlite3'
import type { FastifyInstance } from 'fastify'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { loginAsAdmin, makeApp } from './helpers.js'

describe('Credenciais Spotify criptografadas em repouso', () => {
  let app: FastifyInstance
  let sessionCookie: string

  beforeEach(async () => {
    app = await makeApp()
    sessionCookie = await loginAsAdmin(app)
  })

  afterEach(async () => {
    await app.close()
  })

  it('client secret salvo não aparece em texto puro no banco', async () => {
    const clientSecret = 'segredo-de-verdade-do-spotify-123456'

    const post = await app.inject({
      method: 'POST',
      url: '/api/spotify-config',
      headers: { cookie: sessionCookie },
      payload: { clientId: 'meu-client-id', clientSecret },
    })
    expect(post.statusCode).toBe(200)

    // Lê a coluna direto do arquivo SQLite, sem passar pela extensão do
    // Prisma que descriptografa — prova que o valor em disco é diferente.
    const db = new Database('./data/test.sqlite', { readonly: true })
    const row = db
      .prepare('SELECT spotify_client_secret FROM users WHERE username = ?')
      .get('test-admin') as { spotify_client_secret: string } | undefined
    db.close()

    expect(row?.spotify_client_secret).toBeDefined()
    expect(row?.spotify_client_secret).not.toBe(clientSecret)
    expect(row?.spotify_client_secret?.split(':')).toHaveLength(3)

    // Via API (que passa pela extensão), o GET continua funcionando
    // normalmente — só mostra os últimos 4 chars mascarados.
    const get = await app.inject({
      method: 'GET',
      url: '/api/spotify-config',
      headers: { cookie: sessionCookie },
    })
    expect(get.json()).toMatchObject({
      configured: true,
      clientSecret: `****${clientSecret.slice(-4)}`,
    })
  })
})
